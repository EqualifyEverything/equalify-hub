import type { Context } from 'hono';
import { getGitHubToken, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';
import { renderPage } from '#src/utils/legacyLayout';

// Wrapper to use current user's token with caching
function fetchGitHub(url: string) {
    const token = getGitHubToken();
    return fetchGitHubWithAuth(url, token);
}

// Archived repos are hidden from the hub entirely
async function isRepoUnavailable(owner: string, repo: string): Promise<boolean> {
    const data = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
    return !data || data.message === 'Not Found' || data.archived === true;
}

async function fetchIssue(owner: string, repo: string, issueNumber: string) {
    const data = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`
    );
    // Return null if we got an error response instead of issue data
    return data && !data.message ? data : null;
}

async function fetchComments(owner: string, repo: string, issueNumber: string) {
    const data = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`
    );
    return Array.isArray(data) ? data : [];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export const issues = async (c: Context) => {
    const owner = c.req.param('owner');
    const repo = c.req.param('repo');
    const issueNumber = c.req.param('number');

    const unavailable = await isRepoUnavailable(owner, repo);
    const issue = unavailable ? null : await fetchIssue(owner, repo, issueNumber);
    if (!issue) {
        return c.html(renderPage('Issue Not Found', `
            <div class="container">
                <h1>Issue #${issueNumber} not found</h1>
                <p>This issue may not exist or you may not have permission to view it.</p>
                <p><a href="/${owner}/${repo}">Back to ${owner}/${repo}</a></p>
            </div>
        `), 404);
    }

    const comments = await fetchComments(owner, repo, issueNumber);
    const stateColor = issue.state === 'open' ? '#3fb950' : '#a371f7';
    const stateIcon = issue.state === 'open' 
        ? '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>'
        : '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path></svg>';

    const labelsHtml = issue.labels?.length 
        ? issue.labels.map((l: any) => `<span class="label" style="background:#${l.color};color:${parseInt(l.color, 16) > 0x7fffff ? '#000' : '#fff'}">${escapeHtml(l.name)}</span>`).join(' ')
        : '';

    const commentsHtml = comments.map((comment: any) => `
        <div class="comment">
            <div class="comment-header">
                <img src="${comment.user.avatar_url}" alt="${escapeHtml(comment.user.login)}" class="avatar">
                <strong><a href="/${comment.user.login}">${escapeHtml(comment.user.login)}</a></strong>
                <span class="meta">commented on ${formatDate(comment.created_at)}</span>
            </div>
            <div class="comment-body">${escapeHtml(comment.body || '')}</div>
        </div>
    `).join('');

    const content = `
        <div class="container">
            <div class="breadcrumb">
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a> / Issues
            </div>
            
            <div class="issue-header">
                <h1>${escapeHtml(issue.title)} <span class="issue-number">#${issue.number}</span></h1>
                <div class="issue-meta">
                    <span class="state" style="background:${stateColor}">${stateIcon} ${issue.state}</span>
                    <span><a href="/${issue.user.login}">${escapeHtml(issue.user.login)}</a> opened this issue on ${formatDate(issue.created_at)}</span>
                    <span>· ${issue.comments} comment${issue.comments !== 1 ? 's' : ''}</span>
                </div>
                ${labelsHtml ? `<div class="labels">${labelsHtml}</div>` : ''}
            </div>

            <div class="issue-body">
                <div class="comment main-comment">
                    <div class="comment-header">
                        <img src="${issue.user.avatar_url}" alt="${escapeHtml(issue.user.login)}" class="avatar">
                        <strong><a href="/${issue.user.login}">${escapeHtml(issue.user.login)}</a></strong>
                        <span class="meta">opened on ${formatDate(issue.created_at)}</span>
                    </div>
                    <div class="comment-body">${escapeHtml(issue.body || 'No description provided.')}</div>
                </div>
                ${commentsHtml}
            </div>

            <div class="actions">
                <a href="https://github.com/${owner}/${repo}/issues/${issueNumber}" class="btn" target="_blank" rel="noopener">View on GitHub →</a>
            </div>
        </div>
    `;

    const styles = `
        .breadcrumb { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 16px; }
        .issue-header { margin-bottom: 24px; }
        .issue-header h1 { font-size: 28px; margin: 0 0 12px 0; line-height: 1.3; }
        .issue-number { color: var(--color-text-secondary); font-weight: normal; }
        .issue-meta { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text-secondary); flex-wrap: wrap; }
        .state { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px; color: #fff; font-size: 14px; font-weight: 500; text-transform: capitalize; }
        .labels { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
        .label { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .comment { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: 16px; }
        .comment-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--color-border); background: var(--color-bg-tertiary); font-size: 14px; }
        .avatar { width: 24px; height: 24px; border-radius: 50%; }
        .meta { color: var(--color-text-secondary); }
        .comment-body { padding: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
        .actions { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--color-border); }
        .btn { display: inline-block; background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: 8px 16px; border-radius: 6px; font-size: 14px; color: var(--color-text); }
        .btn:hover { background: var(--color-bg-tertiary); text-decoration: none; }
    `;

    return c.html(renderPage(`Issue #${issueNumber} · ${owner}/${repo}`, content, styles));
};

export const issuesList = async (c: Context) => {
    const owner = c.req.param('owner');
    const repo = c.req.param('repo');

    if (await isRepoUnavailable(owner, repo)) {
        return c.html(renderPage('Repository Not Found', `
            <div class="container">
                <h1>Repository ${escapeHtml(owner)}/${escapeHtml(repo)} not found</h1>
                <p>This repository may not exist or is no longer available on this hub.</p>
                <p><a href="/">Back to home</a></p>
            </div>
        `), 404);
    }

    const data = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=50`
    );
    const issues = Array.isArray(data) ? data : [];

    const issuesHtml = issues.length ? issues.map((issue: any) => `
        <div class="issue-row">
            <div class="issue-icon" style="color:${issue.state === 'open' ? '#3fb950' : '#a371f7'}">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
            </div>
            <div class="issue-content">
                <a href="/${owner}/${repo}/issues/${issue.number}" class="issue-title">${escapeHtml(issue.title)}</a>
                <div class="issue-meta">#${issue.number} opened on ${formatDate(issue.created_at)} by ${escapeHtml(issue.user.login)}</div>
            </div>
            <div class="issue-comments">${issue.comments > 0 ? `💬 ${issue.comments}` : ''}</div>
        </div>
    `).join('') : '<p class="empty">No open issues</p>';

    const content = `
        <div class="container">
            <div class="breadcrumb">
                <a href="/${owner}">${escapeHtml(owner)}</a> / <a href="/${owner}/${repo}">${escapeHtml(repo)}</a> / Issues
            </div>
            <h1>Issues</h1>
            <div class="issues-list">${issuesHtml}</div>
            <div class="actions">
                <a href="https://github.com/${owner}/${repo}/issues" class="btn" target="_blank" rel="noopener">View all on GitHub →</a>
            </div>
        </div>
    `;

    const styles = `
        .breadcrumb { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 16px; }
        h1 { font-size: 24px; margin: 0 0 20px 0; }
        .issues-list { border: 1px solid var(--color-border); border-radius: 6px; }
        .issue-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
        .issue-row:last-child { border-bottom: none; }
        .issue-icon { padding-top: 2px; }
        .issue-content { flex: 1; }
        .issue-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
        .issue-title:hover { color: var(--color-link); }
        .issue-meta { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
        .issue-comments { font-size: 12px; color: var(--color-text-secondary); }
        .empty { padding: 24px; text-align: center; color: var(--color-text-secondary); }
        .actions { margin-top: 16px; }
        .btn { display: inline-block; background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: 8px 16px; border-radius: 6px; font-size: 14px; color: var(--color-text); }
        .btn:hover { background: var(--color-bg-tertiary); text-decoration: none; }
    `;

    return c.html(renderPage(`Issues · ${owner}/${repo}`, content, styles));
};
