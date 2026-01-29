/**
 * Markdown renderer - converts markdown to HTML
 */

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderMarkdown(md: string): string {
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
