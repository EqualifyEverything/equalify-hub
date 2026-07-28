import type { Context } from 'hono';
import { getGitHubToken, getCurrentUser, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';
import { renderPage } from '#src/utils/legacyLayout';

export const commits = async (c: Context) => {
    // Path: /:owner/:repo/commits or /:owner/:repo/commits/:sha
    const pathParts = c.req.path.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
        return c.html(renderError('Invalid path'), 400);
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    const sha = pathParts[3] || null; // If viewing a specific commit

    try {
        // Get repo info
        const repoInfo = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
        
        if (repoInfo.message === 'Not Found') {
            return c.html(renderError(`Repository ${owner}/${repo} not found`), 404);
        }

        if (repoInfo.archived) {
            return c.html(renderError(`Repository ${owner}/${repo} is archived and not available on this hub`), 404);
        }

        // If viewing a specific commit
        if (sha && sha !== 'commits') {
            const commit = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`);
            
            if (commit.message) {
                return c.html(renderError(commit.message), 404);
            }

            return c.html(renderCommitDetail(owner, repo, commit, repoInfo));
        }

        // Get commits list
        const branch = c.req.query('branch') || repoInfo.default_branch || 'main';
        const page = parseInt(c.req.query('page') || '1');
        const commits = await fetchGitHub(
            `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=30&page=${page}`
        );

        if (commits.message) {
            return c.html(renderError(commits.message), 404);
        }

        return c.html(renderCommitsList(owner, repo, branch, commits, page, repoInfo));

    } catch (error) {
        return c.html(renderError(`Error: ${error.message}`), 500);
    }
};

async function fetchGitHub(url: string) {
    const token = getGitHubToken();
    return fetchGitHubWithAuth(url, token);
}

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
            margin-bottom: 16px;
        }
        h1 { margin: 0 0 8px 0; font-size: 20px; font-weight: 600; }
        h1 a { color: var(--color-link); }
        .breadcrumb { color: var(--color-text-secondary); font-size: 14px; margin-top: 8px; }
        .commits-list {
            border: 1px solid var(--color-border);
            border-radius: 6px;
            overflow: hidden;
        }
        .commits-header {
            background: var(--color-bg-secondary);
            padding: 12px 16px;
            border-bottom: 1px solid var(--color-border);
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .commit-group-header {
            background: var(--color-bg-secondary);
            padding: 8px 16px;
            font-size: 13px;
            color: var(--color-text-secondary);
            border-bottom: 1px solid var(--color-border);
        }
        .commit-item {
            display: flex;
            align-items: flex-start;
            padding: 12px 16px;
            border-bottom: 1px solid var(--color-bg-tertiary);
            gap: 12px;
        }
        .commit-item:last-child { border-bottom: none; }
        .commit-item:hover { background: var(--color-bg-secondary); }
        .commit-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .commit-info { flex: 1; min-width: 0; }
        .commit-message {
            font-weight: 600;
            font-size: 14px;
            color: var(--color-text);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .commit-message a { color: var(--color-text); }
        .commit-message a:hover { color: var(--color-link); }
        .commit-meta {
            font-size: 12px;
            color: var(--color-text-secondary);
        }
        .commit-meta a { color: var(--color-text-secondary); }
        .commit-sha {
            font-family: "SFMono-Regular", Consolas, monospace;
            font-size: 12px;
            color: var(--color-link);
            background: rgba(56,139,253,0.1);
            padding: 4px 8px;
            border-radius: 6px;
            flex-shrink: 0;
        }
        .commit-sha:hover { background: rgba(56,139,253,0.2); text-decoration: none; }
        .pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
        }
        .pagination a {
            padding: 8px 16px;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            color: var(--color-text);
            font-size: 14px;
        }
        .pagination a:hover { background: var(--color-border); text-decoration: none; }
        .pagination a.disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        .commit-detail {
            border: 1px solid var(--color-border);
            border-radius: 6px;
            overflow: hidden;
        }
        .commit-detail-header {
            background: var(--color-bg-secondary);
            padding: 16px;
            border-bottom: 1px solid var(--color-border);
        }
        .commit-detail-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        .commit-detail-body {
            font-size: 14px;
            color: var(--color-text-secondary);
            white-space: pre-wrap;
            margin-bottom: 12px;
        }
        .commit-detail-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
        }
        .commit-detail-meta img {
            width: 24px;
            height: 24px;
            border-radius: 50%;
        }
        .commit-stats {
            padding: 16px;
            display: flex;
            gap: 16px;
            font-size: 14px;
        }
        .stat-add { color: var(--color-success); }
        .stat-del { color: var(--color-danger); }
        .file-changes {
            border-top: 1px solid var(--color-border);
        }
        .file-change {
            padding: 8px 16px;
            border-bottom: 1px solid var(--color-bg-tertiary);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
        }
        .file-change:last-child { border-bottom: none; }
        .file-change:hover { background: var(--color-bg-secondary); }
        .file-status {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .file-status.added { background: #238636; color: #fff; }
        .file-status.modified { background: #9e6a03; color: #fff; }
        .file-status.removed { background: #da3633; color: #fff; }
        .file-status.renamed { background: var(--color-text-secondary); color: #fff; }
        .file-name {
            flex: 1;
            font-family: "SFMono-Regular", Consolas, monospace;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .file-stats {
            font-size: 12px;
            color: var(--color-text-secondary);
        }
        .file-stats .add { color: var(--color-success); }
        .file-stats .del { color: var(--color-danger); }
        .error { color: var(--color-danger); }
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

function renderCommitsList(owner: string, repo: string, branch: string, commits: any[], page: number, repoInfo: any): string {
    // Group commits by date
    const grouped: Record<string, any[]> = {};
    for (const commit of commits) {
        const date = new Date(commit.commit.author.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(commit);
    }

    let commitsHtml = '';
    for (const [date, dateCommits] of Object.entries(grouped)) {
        commitsHtml += `<div class="commit-group-header">Commits on ${date}</div>`;
        for (const commit of dateCommits) {
            const message = commit.commit.message.split('\n')[0];
            const author = commit.author || commit.commit.author;
            const avatarUrl = commit.author?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
            const authorName = commit.commit.author.name;
            const authorLogin = commit.author?.login;
            
            commitsHtml += `
                <div class="commit-item">
                    <img class="commit-avatar" src="${avatarUrl}" alt="${escapeHtml(authorName)}">
                    <div class="commit-info">
                        <div class="commit-message">
                            <a href="/${owner}/${repo}/commit/${commit.sha}">${escapeHtml(message)}</a>
                        </div>
                        <div class="commit-meta">
                            ${authorLogin ? `<a href="/${authorLogin}">${escapeHtml(authorName)}</a>` : escapeHtml(authorName)}
                            committed ${timeAgo(commit.commit.author.date)}
                        </div>
                    </div>
                    <a href="/${owner}/${repo}/commit/${commit.sha}" class="commit-sha">${commit.sha.substring(0, 7)}</a>
                </div>
            `;
        }
    }

    const prevDisabled = page <= 1 ? 'disabled' : '';
    const nextDisabled = commits.length < 30 ? 'disabled' : '';

    return renderLayout(`Commits · ${owner}/${repo}`, `
        <header>
            <h1>
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a>
            </h1>
            <div class="breadcrumb">
                <a href="/${owner}/${repo}">Code</a> / Commits
            </div>
        </header>
        <div class="commits-list">
            <div class="commits-header">
                <span>📝</span> Commits on ${branch}
            </div>
            ${commitsHtml}
        </div>
        <div class="pagination">
            <a href="/${owner}/${repo}/commits?branch=${branch}&page=${page - 1}" class="${prevDisabled}">← Newer</a>
            <a href="/${owner}/${repo}/commits?branch=${branch}&page=${page + 1}" class="${nextDisabled}">Older →</a>
        </div>
    `);
}

function renderCommitDetail(owner: string, repo: string, commit: any, repoInfo: any): string {
    const title = commit.commit.message.split('\n')[0];
    const body = commit.commit.message.split('\n').slice(1).join('\n').trim();
    const author = commit.commit.author;
    const avatarUrl = commit.author?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
    const authorLogin = commit.author?.login;
    
    const stats = commit.stats || { additions: 0, deletions: 0 };
    const files = commit.files || [];

    let filesHtml = '';
    for (const file of files) {
        let statusClass = 'modified';
        let statusLetter = 'M';
        if (file.status === 'added') { statusClass = 'added'; statusLetter = 'A'; }
        else if (file.status === 'removed') { statusClass = 'removed'; statusLetter = 'D'; }
        else if (file.status === 'renamed') { statusClass = 'renamed'; statusLetter = 'R'; }
        
        filesHtml += `
            <div class="file-change">
                <span class="file-status ${statusClass}">${statusLetter}</span>
                <a href="/${owner}/${repo}/blob/${commit.sha}/${file.filename}" class="file-name">${escapeHtml(file.filename)}</a>
                <span class="file-stats">
                    ${file.additions > 0 ? `<span class="add">+${file.additions}</span>` : ''}
                    ${file.deletions > 0 ? `<span class="del">-${file.deletions}</span>` : ''}
                </span>
            </div>
        `;
    }

    return renderLayout(`${title} · ${owner}/${repo}`, `
        <header>
            <h1>
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a>
            </h1>
            <div class="breadcrumb">
                <a href="/${owner}/${repo}">Code</a> / <a href="/${owner}/${repo}/commits">Commits</a> / ${commit.sha.substring(0, 7)}
            </div>
        </header>
        <div class="commit-detail">
            <div class="commit-detail-header">
                <div class="commit-detail-title">${escapeHtml(title)}</div>
                ${body ? `<div class="commit-detail-body">${escapeHtml(body)}</div>` : ''}
                <div class="commit-detail-meta">
                    <img src="${avatarUrl}" alt="${escapeHtml(author.name)}">
                    ${authorLogin ? `<a href="/${authorLogin}">${escapeHtml(author.name)}</a>` : escapeHtml(author.name)}
                    committed on ${formatDate(author.date)}
                </div>
            </div>
            <div class="commit-stats">
                <span>Showing <strong>${files.length}</strong> changed files</span>
                <span class="stat-add">+${stats.additions} additions</span>
                <span class="stat-del">-${stats.deletions} deletions</span>
            </div>
            <div class="file-changes">
                ${filesHtml}
            </div>
        </div>
        <div style="margin-top:16px;">
            <a href="/${owner}/${repo}/tree/${commit.sha}">Browse files at this commit →</a>
        </div>
    `);
}
