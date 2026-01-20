import type { Context } from 'hono';
import { getGitHubToken, getCurrentUser, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';
import { renderPage } from '#src/utils/legacyLayout';

export const repo = async (c: Context) => {
    const pathParts = c.req.path.split('/').filter(Boolean);
    
    if (pathParts.length < 1) {
        return c.html(renderError('Invalid path. Use: /owner or /owner/repo'), 400);
    }

    const owner = pathParts[0];
    
    // If only owner is provided, show user/org profile
    if (pathParts.length === 1) {
        return handleUserOrOrg(c, owner);
    }

    const repoName = pathParts[1];
    const filePath = pathParts.slice(4).join('/') || '';

    try {
        // Get repo info
        const repoInfo = await fetchGitHub(`https://api.github.com/repos/${owner}/${repoName}`);
        
        if (repoInfo.message === 'Not Found') {
            return c.html(renderError(`Repository ${owner}/${repoName} not found`), 404);
        }

        const defaultBranch = repoInfo.default_branch || 'main';
        const actualBranch = pathParts[3] || defaultBranch;

        // Get contents
        const contentsUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${actualBranch}`;
        const contents = await fetchGitHub(contentsUrl);

        if (contents.message) {
            return c.html(renderError(contents.message), 404);
        }

        // If it's a file, show the file
        if (!Array.isArray(contents)) {
            const fileContent = contents.encoding === 'base64' 
                ? Buffer.from(contents.content, 'base64').toString('utf-8')
                : contents.content;
            
            return c.html(renderFile(owner, repoName, actualBranch, filePath, fileContent, repoInfo));
        }

        // It's a directory - fetch README if at root
        let readme = null;
        let latestCommit = null;
        if (!filePath) {
            [readme, latestCommit] = await Promise.all([
                fetchReadme(owner, repoName, actualBranch, contents),
                fetchLatestCommit(owner, repoName, actualBranch)
            ]);
        }

        return c.html(renderDirectory(owner, repoName, actualBranch, filePath, contents, repoInfo, readme, latestCommit));

    } catch (error) {
        return c.html(renderError(`Error: ${error.message}`), 500);
    }
};

async function handleUserOrOrg(c: Context, username: string) {
    try {
        const user = await fetchGitHub(`https://api.github.com/users/${username}`);
        
        if (user.message === 'Not Found') {
            return c.html(renderError(`User or organization "${username}" not found`), 404);
        }

        const isOrg = user.type === 'Organization';
        
        // For orgs, use /orgs/:org/repos which returns private repos if user has access
        // For users, use /users/:user/repos
        const reposUrl = isOrg 
            ? `https://api.github.com/orgs/${username}/repos?sort=updated&per_page=100&type=all`
            : `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
        
        const repos = await fetchGitHub(reposUrl);

        return c.html(renderUserProfile(user, repos));
    } catch (error) {
        return c.html(renderError(`Error: ${error.message}`), 500);
    }
}

async function fetchReadme(owner: string, repo: string, branch: string, contents: any[]): Promise<string | null> {
    const readmeFile = contents.find(f => 
        f.name.toLowerCase() === 'readme.md' || 
        f.name.toLowerCase() === 'readme.txt' ||
        f.name.toLowerCase() === 'readme'
    );
    
    if (!readmeFile) return null;
    
    try {
        const readmeData = await fetchGitHub(readmeFile.url);
        if (readmeData.content && readmeData.encoding === 'base64') {
            const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            return renderMarkdown(content);
        }
    } catch {
        return null;
    }
    return null;
}

async function fetchLatestCommit(owner: string, repo: string, branch: string): Promise<any | null> {
    try {
        const commits = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=1`);
        if (Array.isArray(commits) && commits.length > 0) {
            return commits[0];
        }
    } catch {
        return null;
    }
    return null;
}

function renderMarkdown(md: string): string {
    let html = md;
    
    // Preserve code blocks first (replace with placeholders)
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        codeBlocks.push(`<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`);
        return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
    });
    
    // Preserve inline code
    const inlineCode: string[] = [];
    html = html.replace(/`([^`]+)`/g, (_, code) => {
        inlineCode.push(`<code>${escapeHtml(code)}</code>`);
        return `%%INLINECODE${inlineCode.length - 1}%%`;
    });
    
    // Remove HTML comments (but keep other HTML)
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Collect reference definitions: [ref]: url "title"
    const refs: Record<string, { url: string; title?: string }> = {};
    html = html.replace(/^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]*)")?$/gm, (_, ref, url, title) => {
        refs[ref.toLowerCase()] = { url: url.trim(), title };
        return '';
    });
    
    // Handle images: ![alt](url "title") - must come before links
    html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${url}" alt="${escapeHtml(alt)}"${titleAttr} style="max-width:100%;">`;
    });
    
    // Reference-style images: ![alt][ref] or ![alt][]
    html = html.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (_, alt, ref) => {
        const key = (ref || alt).toLowerCase();
        const r = refs[key];
        if (r) {
            const titleAttr = r.title ? ` title="${escapeHtml(r.title)}"` : '';
            return `<img src="${r.url}" alt="${escapeHtml(alt)}"${titleAttr} style="max-width:100%;">`;
        }
        return `![${alt}]`;
    });
    
    // Tables: detect by |---|---| pattern
    html = html.replace(/^(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, sep, body) => {
        const alignments: string[] = [];
        sep.split('|').filter(Boolean).forEach((cell: string) => {
            const c = cell.trim();
            if (c.startsWith(':') && c.endsWith(':')) alignments.push('center');
            else if (c.endsWith(':')) alignments.push('right');
            else alignments.push('left');
        });
        
        const parseRow = (row: string, tag: string) => {
            const cells = row.split('|').filter(Boolean);
            return `<tr>${cells.map((c: string, i: number) => 
                `<${tag} style="text-align:${alignments[i] || 'left'}">${c.trim()}</${tag}>`
            ).join('')}</tr>`;
        };
        
        const headerRow = parseRow(header, 'th');
        const bodyRows = body.trim().split('\n').map((r: string) => parseRow(r, 'td')).join('');
        return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
    });
    
    // Headers (process inline markdown after)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Horizontal rules
    html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr>');
    
    // Blockquotes (handle multiple consecutive lines)
    html = html.replace(/^>\s*(.*)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
    
    // Bold and italic (must handle ** before *)
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Links: [text](url "title")
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, text, url, title) => {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${url}"${titleAttr} rel="noopener">${text}</a>`;
    });
    
    // Reference-style links: [text][ref] or [text][]
    html = html.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (_, text, ref) => {
        const key = (ref || text).toLowerCase();
        const r = refs[key];
        if (r) {
            const titleAttr = r.title ? ` title="${escapeHtml(r.title)}"` : '';
            return `<a href="${r.url}"${titleAttr} rel="noopener">${text}</a>`;
        }
        return `[${text}]`;
    });
    
    // Task lists: - [ ] or - [x]
    html = html.replace(/^(\s*)[-*+]\s+\[( |x)\]\s+(.+)$/gm, (_, indent, checked, text) => {
        const isChecked = checked === 'x' ? ' checked disabled' : ' disabled';
        return `${indent}<li class="task-list-item"><input type="checkbox"${isChecked}> ${text}</li>`;
    });
    
    // Unordered lists
    html = html.replace(/^(\s*)[-*+]\s+(.+)$/gm, '$1<li>$2</li>');
    
    // Ordered lists
    html = html.replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li>$2</li>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li[\s>][\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Paragraphs
    html = html.replace(/\n\n+/g, '</p>\n<p>');
    html = '<p>' + html + '</p>';
    
    // Clean up: remove <p> wrapping block elements
    const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'ul', 'ol', 'blockquote', 'hr', 'table', 'div'];
    blockTags.forEach(tag => {
        html = html.replace(new RegExp(`<p>\\s*(<${tag}[\\s>])`, 'g'), '$1');
        html = html.replace(new RegExp(`(</${tag}>)\\s*</p>`, 'g'), '$1');
    });
    html = html.replace(/<p>\s*(<img\s)/g, '$1');
    html = html.replace(/<p>\s*(<a\s[^>]*id=)/g, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    // Restore code blocks and inline code
    codeBlocks.forEach((block, i) => {
        html = html.replace(`%%CODEBLOCK${i}%%`, block);
    });
    inlineCode.forEach((code, i) => {
        html = html.replace(`%%INLINECODE${i}%%`, code);
    });
    
    return html;
}

async function fetchGitHub(url: string) {
    const token = getGitHubToken();
    return fetchGitHubWithAuth(url, token);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

const pageSpecificCss = `
header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 16px;
    margin-bottom: 16px;
}
h1 { margin: 0 0 8px 0; font-size: 20px; font-weight: 600; }
h1 a { color: var(--color-link); }
.repo-icon { margin-right: 8px; color: var(--color-text-secondary); }
.breadcrumb { color: var(--color-text-secondary); font-size: 14px; margin-top: 8px; }
.description { color: var(--color-text-secondary); margin: 8px 0 12px 0; font-size: 14px; }
.stats { display: flex; gap: 16px; font-size: 13px; color: var(--color-text-secondary); margin-top: 8px; flex-wrap: wrap; }
.stat { display: flex; align-items: center; gap: 4px; }
.topics { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.topic {
    background: rgba(56,139,253,0.15);
    color: var(--color-link);
    padding: 2px 10px;
    border-radius: 24px;
    font-size: 12px;
}
.clone-section {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    margin: 16px 0;
    font-size: 13px;
}
.clone-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}
.clone-summary {
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    list-style: none;
}
.clone-summary::-webkit-details-marker { display: none; }
.clone-summary::before {
    content: '▶';
    font-size: 10px;
    color: var(--color-text-secondary);
    transition: transform 0.15s;
}
.clone-section[open] .clone-summary::before { transform: rotate(90deg); }
.clone-preview {
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
    background: none;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.clone-details {
    padding: 0 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.clone-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 8px 12px;
}
.clone-label {
    font-size: 11px;
    color: var(--color-text-secondary);
    width: 40px;
    flex-shrink: 0;
}
.clone-row code {
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 12px;
    color: var(--color-text);
    background: none;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.clone-links {
    display: flex;
    gap: 16px;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
}
.clone-links a { color: var(--color-link); }
.file-list {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    overflow: hidden;
}
.file-header {
    background: var(--color-bg-secondary);
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 14px;
    color: var(--color-text-secondary);
}
.file-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--color-bg-tertiary);
}
.file-item:last-child { border-bottom: none; }
.file-item:hover { background: var(--color-bg-secondary); }
.file-icon { margin-right: 10px; width: 16px; text-align: center; color: var(--color-text-secondary); }
.file-name { flex: 1; color: var(--color-text); }
.file-name:hover { color: var(--color-link); text-decoration: underline; }
pre {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text);
}
code { 
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background: rgba(110,118,129,0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
}
pre code { background: none; padding: 0; }
.error { color: var(--color-danger); }
.readme {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    margin-top: 16px;
    overflow: hidden;
}
.readme-header {
    background: var(--color-bg-secondary);
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}
.readme-content {
    padding: 24px 32px;
    font-size: 14px;
}
.readme-content h1 { font-size: 2em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; margin-top: 24px; }
.readme-content h2 { font-size: 1.5em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; margin-top: 24px; }
.readme-content h3 { font-size: 1.25em; margin-top: 24px; }
.readme-content h4 { font-size: 1em; margin-top: 24px; }
.readme-content h5 { font-size: 0.875em; margin-top: 24px; }
.readme-content h6 { font-size: 0.85em; margin-top: 24px; color: var(--color-text-secondary); }
.readme-content ul, .readme-content ol { padding-left: 2em; }
.readme-content li { margin: 4px 0; }
.readme-content p { margin: 16px 0; }
.readme-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    overflow-x: auto;
    display: block;
}
.readme-content th, .readme-content td {
    border: 1px solid var(--color-border);
    padding: 8px 12px;
    text-align: left;
}
.readme-content th {
    background: var(--color-bg-secondary);
    font-weight: 600;
}
.readme-content tr:nth-child(even) {
    background: var(--color-bg-secondary);
}
.readme-content img {
    max-width: 100%;
    height: auto;
}
.readme-content blockquote {
    border-left: 4px solid var(--color-border);
    padding-left: 16px;
    margin: 16px 0;
    color: var(--color-text-secondary);
}
.readme-content hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 24px 0;
}
.readme-content pre {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
}
.readme-content code {
    background: rgba(175,184,193,0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
}
.readme-content pre code {
    background: none;
    padding: 0;
    font-size: 0.85em;
}
.readme-content .task-list-item {
    list-style: none;
    margin-left: -1.5em;
}
.readme-content .task-list-item input {
    margin-right: 8px;
}
.readme-content del {
    color: var(--color-text-secondary);
}
.profile-header {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 24px;
}
@media (max-width: 600px) {
    .profile-header { flex-direction: column; align-items: center; text-align: center; }
    .avatar { width: 150px; height: 150px; }
}
.avatar {
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
}
.profile-info h1 { font-size: 24px; margin-bottom: 4px; color: var(--color-text); }
.profile-info .username { font-size: 20px; color: var(--color-text-secondary); font-weight: 300; }
.profile-info .bio { margin-top: 16px; color: var(--color-text); }
.profile-stats { display: flex; gap: 8px; margin-top: 16px; font-size: 14px; color: var(--color-text-secondary); }
.profile-stats a { color: var(--color-text-secondary); }
.profile-stats strong { color: var(--color-text); }
.profile-details { margin-top: 16px; font-size: 14px; color: var(--color-text-secondary); }
.profile-details div { margin: 4px 0; display: flex; align-items: center; gap: 8px; }
.repo-list { margin-top: 24px; }
.repo-card {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
}
.repo-card:hover { border-color: var(--color-text-secondary); }
.repo-card h3 { margin: 0 0 8px 0; font-size: 16px; }
.repo-card h3 a { color: var(--color-link); }
.repo-card .desc { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 12px; }
.repo-card .meta { display: flex; gap: 16px; font-size: 12px; color: var(--color-text-secondary); flex-wrap: wrap; }
.repo-card .meta span { display: flex; align-items: center; gap: 4px; }
.lang-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
}
`;

function renderLayout(title: string, content: string): string {
    return renderPage(title, `<div class="container">${content}</div>`, pageSpecificCss);
}

function renderError(message: string): string {
    const user = getCurrentUser();
    const isRateLimit = message.toLowerCase().includes('rate limit');
    // Clean up GitHub's verbose error message
    const cleanMessage = message.split('(But here')[0]?.trim() || message;
    const signInPrompt = !user && isRateLimit ? `
        <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:6px;padding:16px;margin-top:16px;">
            <p style="margin:0 0 12px 0;color:var(--color-text);"><strong>Want 5,000 requests/hour instead of 60?</strong></p>
            <p style="margin:0 0 12px 0;color:var(--color-text-secondary);font-size:13px;">Sign in for free to use your own GitHub API quota.</p>
            <a href="/github" style="display:inline-block;background:#238636;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Sign in with GitHub</a>
        </div>
    ` : '';
    
    return renderLayout('Oops', `
        <header>
            <h1 class="error">Well, that didn't work</h1>
        </header>
        <p style="color:var(--color-text-secondary);">${escapeHtml(cleanMessage)}</p>
        ${signInPrompt}
        <p style="font-size:13px;color:var(--color-text-muted);margin-top:24px;">If you keep seeing this, <a href="https://github.com/EqualifyEverything/equalifyuic-opensource-tool/issues">open an issue</a></p>
        <p><a href="/">← Back home</a></p>
    `);
}

function renderCloneSection(owner: string, repo: string, sshUrl: string, httpsUrl: string): string {
    return `
        <details class="clone-section">
            <summary class="clone-summary">
                <span>📥 Clone</span>
                <code class="clone-preview">${httpsUrl}</code>
            </summary>
            <div class="clone-details">
                <div class="clone-row">
                    <span class="clone-label">HTTPS</span>
                    <code>git clone ${httpsUrl}</code>
                </div>
                <div class="clone-row">
                    <span class="clone-label">SSH</span>
                    <code>git clone ${sshUrl}</code>
                </div>
                <div class="clone-row">
                    <span class="clone-label">CLI</span>
                    <code>gh repo clone ${owner}/${repo}</code>
                </div>
                <div class="clone-links">
                    <a href="https://github.com/${owner}/${repo}/archive/refs/heads/main.zip">ZIP</a>
                    <a href="x-github-client://openRepo/https://github.com/${owner}/${repo}">Desktop</a>
                    <a href="vscode://vscode.git/clone?url=${encodeURIComponent(httpsUrl)}">VS Code</a>
                </div>
            </div>
        </details>
    `;
}

function renderUserProfile(user: any, repos: any[]): string {
    const isOrg = user.type === 'Organization';
    const currentUser = getCurrentUser();
    
    const repoCards = repos
        .filter(r => !r.fork)
        .slice(0, 30)
        .map(r => `
            <div class="repo-card">
                <h3>
                    <a href="/${r.full_name}">${escapeHtml(r.name)}</a>
                    ${r.private ? `<span style="font-size:12px;font-weight:400;background:var(--color-border);color:var(--color-text-secondary);padding:2px 8px;border-radius:24px;margin-left:8px;">Private</span>` : ''}
                </h3>
                ${r.description ? `<div class="desc">${escapeHtml(r.description)}</div>` : ''}
                <div class="meta">
                    ${r.language ? `<span><span class="lang-dot" style="background:${getLanguageColor(r.language)}"></span> ${escapeHtml(r.language)}</span>` : ''}
                    ${r.stargazers_count > 0 ? `<span>★ ${formatNumber(r.stargazers_count)}</span>` : ''}
                    ${r.forks_count > 0 ? `<span>⑂ ${formatNumber(r.forks_count)}</span>` : ''}
                    <span>Updated ${formatDate(r.updated_at)}</span>
                </div>
            </div>
        `).join('');

    // Link to manage org access on GitHub
    const orgAccessLink = currentUser?.isPro && isOrg 
        ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border);">
               <a href="https://github.com/settings/connections/applications/${process.env.GITHUB_CLIENT_ID || ''}" target="_blank" rel="noopener" style="font-size:13px;color:var(--color-text-secondary);">
                   ⚙️ Manage organization access on GitHub
               </a>
           </div>`
        : '';

    return renderLayout(user.login, `
        <div class="profile-header">
            <img class="avatar" src="${user.avatar_url}" alt="${escapeHtml(user.login)}">
            <div class="profile-info">
                ${user.name ? `<h1>${escapeHtml(user.name)}</h1>` : ''}
                <div class="username">${escapeHtml(user.login)}</div>
                ${user.bio ? `<div class="bio">${escapeHtml(user.bio)}</div>` : ''}
                <div class="profile-stats">
                    ${!isOrg ? `
                        <a href="/${user.login}?tab=followers"><strong>${formatNumber(user.followers)}</strong> followers</a>
                        · <a href="/${user.login}?tab=following"><strong>${formatNumber(user.following)}</strong> following</a>
                    ` : ''}
                </div>
                <div class="profile-details">
                    ${user.company ? `<div>🏢 ${escapeHtml(user.company)}</div>` : ''}
                    ${user.location ? `<div>📍 ${escapeHtml(user.location)}</div>` : ''}
                    ${user.blog ? `<div>🔗 <a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" rel="noopener">${escapeHtml(user.blog)}</a></div>` : ''}
                    ${user.twitter_username ? `<div>𝕏 <a href="https://twitter.com/${user.twitter_username}" rel="noopener">@${escapeHtml(user.twitter_username)}</a></div>` : ''}
                </div>
                ${orgAccessLink}
            </div>
        </div>
        
        <div class="repo-list">
            <div class="section-title">${isOrg ? 'Repositories' : 'Popular repositories'}</div>
            ${repoCards}
        </div>
    `);
}

function renderDirectory(owner: string, repo: string, branch: string, path: string, contents: any[], repoInfo: any, readme: string | null, latestCommit: any | null): string {
    const breadcrumb = buildBreadcrumb(owner, repo, branch, path);
    const isRoot = !path;
    
    const sorted = contents.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    const items = sorted.map(item => {
        const icon = item.type === 'dir' ? '📁' : '📄';
        const itemPath = path ? `${path}/${item.name}` : item.name;
        const href = item.type === 'dir' 
            ? `/${owner}/${repo}/tree/${branch}/${itemPath}`
            : `/${owner}/${repo}/blob/${branch}/${itemPath}`;
        
        return `<div class="file-item">
            <span class="file-icon">${icon}</span>
            <a class="file-name" href="${href}">${escapeHtml(item.name)}</a>
        </div>`;
    }).join('');

    let parentLink = '';
    if (path) {
        const parentPath = path.split('/').slice(0, -1).join('/');
        const parentHref = parentPath 
            ? `/${owner}/${repo}/tree/${branch}/${parentPath}`
            : `/${owner}/${repo}`;
        parentLink = `<div class="file-item">
            <span class="file-icon">📁</span>
            <a class="file-name" href="${parentHref}">..</a>
        </div>`;
    }

    const topics = repoInfo.topics?.length ? `
        <div class="topics">
            ${repoInfo.topics.map(t => `<span class="topic">${escapeHtml(t)}</span>`).join('')}
        </div>
    ` : '';

    const cloneSection = isRoot ? renderCloneSection(
        owner, 
        repo, 
        repoInfo.ssh_url || `git@github.com:${owner}/${repo}.git`,
        repoInfo.clone_url || `https://github.com/${owner}/${repo}.git`
    ) : '';

    const readmeSection = readme ? `
        <div class="readme">
            <div class="readme-header">
                <span>📄</span> README.md
            </div>
            <div class="readme-content">${readme}</div>
        </div>
    ` : '';

    // Latest commit info for file header
    let commitInfo = '';
    if (latestCommit && isRoot) {
        const commitMsg = latestCommit.commit.message.split('\n')[0];
        const authorName = latestCommit.commit.author.name;
        const authorLogin = latestCommit.author?.login;
        const avatarUrl = latestCommit.author?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        commitInfo = `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--color-bg-secondary);border-bottom:1px solid var(--color-border);font-size:13px;">
                <img src="${avatarUrl}" alt="${escapeHtml(authorName)}" style="width:20px;height:20px;border-radius:50%;">
                <span style="color:var(--color-text-secondary);">${authorLogin ? `<a href="/${authorLogin}" style="color:var(--color-text);">${escapeHtml(authorName)}</a>` : escapeHtml(authorName)}</span>
                <a href="/${owner}/${repo}/commit/${latestCommit.sha}" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(commitMsg)}</a>
                <a href="/${owner}/${repo}/commit/${latestCommit.sha}" style="font-family:monospace;color:var(--color-text-secondary);">${latestCommit.sha.substring(0, 7)}</a>
                <span style="color:var(--color-text-secondary);">${timeAgo(latestCommit.commit.author.date)}</span>
                <a href="/${owner}/${repo}/commits" style="color:var(--color-text-secondary);display:flex;align-items:center;gap:4px;">
                    <span>📝</span> History
                </a>
            </div>
        `;
    }

    return renderLayout(`${owner}/${repo}`, `
        <header>
            <h1>
                <span class="repo-icon">📦</span>
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a>
                ${repoInfo.private ? '<span style="font-size:12px;background:var(--color-border);padding:2px 8px;border-radius:24px;margin-left:8px;">Private</span>' : ''}
            </h1>
            ${repoInfo.description ? `<p class="description">${escapeHtml(repoInfo.description)}</p>` : ''}
            ${isRoot ? `
                <div class="stats">
                    <span class="stat">★ <strong>${formatNumber(repoInfo.stargazers_count)}</strong> stars</span>
                    <span class="stat">⑂ <strong>${formatNumber(repoInfo.forks_count)}</strong> forks</span>
                    <span class="stat">👁 <strong>${formatNumber(repoInfo.watchers_count)}</strong> watching</span>
                    ${repoInfo.license?.name ? `<span class="stat">⚖️ ${escapeHtml(repoInfo.license.name)}</span>` : ''}
                </div>
                ${topics}
            ` : ''}
            <div class="breadcrumb">${breadcrumb}</div>
        </header>
        ${cloneSection}
        <div class="file-list">
            ${commitInfo}
            <div class="file-header" style="display:flex;justify-content:space-between;align-items:center;">
                <span>📂 ${branch}</span>
                ${isRoot ? `<a href="/${owner}/${repo}/commits" style="font-size:12px;color:var(--color-text-secondary);">View all commits →</a>` : ''}
            </div>
            ${parentLink}
            ${items}
        </div>
        ${readmeSection}
    `);
}

function renderFile(owner: string, repo: string, branch: string, path: string, content: string, repoInfo: any): string {
    const breadcrumb = buildBreadcrumb(owner, repo, branch, path);
    const fileName = path.split('/').pop() || path;
    const lines = content.split('\n');
    const lineNumbers = lines.map((_, i) => i + 1).join('\n');
    
    return renderLayout(`${fileName} - ${owner}/${repo}`, `
        <header>
            <h1>
                <span class="repo-icon">📦</span>
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a>
            </h1>
            <div class="breadcrumb">${breadcrumb}</div>
        </header>
        <div class="file-list">
            <div class="file-header">
                📄 ${escapeHtml(fileName)} · ${lines.length} lines
            </div>
        </div>
        <pre style="display:flex;margin-top:-1px;border-top-left-radius:0;border-top-right-radius:0;"><code style="color:var(--color-text-secondary);text-align:right;padding-right:16px;border-right:1px solid var(--color-border);user-select:none;">${lineNumbers}</code><code style="flex:1;padding-left:16px;">${escapeHtml(content)}</code></pre>
    `);
}

function buildBreadcrumb(owner: string, repo: string, branch: string, path: string): string {
    const parts = [`<a href="/${owner}/${repo}">${escapeHtml(repo)}</a>`];
    
    if (path) {
        const pathParts = path.split('/');
        let currentPath = '';
        pathParts.forEach((part, i) => {
            currentPath += (currentPath ? '/' : '') + part;
            const isLast = i === pathParts.length - 1;
            const href = `/${owner}/${repo}/tree/${branch}/${currentPath}`;
            parts.push(isLast ? `<strong>${escapeHtml(part)}</strong>` : `<a href="${href}">${escapeHtml(part)}</a>`);
        });
    }
    
    return parts.join(' / ');
}

function getLanguageColor(lang: string): string {
    const colors: Record<string, string> = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C': '#555555',
        'C#': '#178600',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Swift': '#F05138',
        'Kotlin': '#A97BFF',
        'Dart': '#00B4AB',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Shell': '#89e051',
        'Vue': '#41b883',
        'Svelte': '#ff3e00',
    };
    return colors[lang] || '#8b949e';
}
