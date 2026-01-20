import { getCurrentUser, getGitHubToken, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';
import { event } from '#src/utils';

const ORG_NAME = 'EqualifyEverything';

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function getLanguageColor(lang: string): string {
    const colors: Record<string, string> = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'C++': '#f34b7d',
        'C': '#555555',
        'C#': '#178600',
        'Swift': '#F05138',
        'Kotlin': '#A97BFF',
        'Scala': '#c22d40',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Shell': '#89e051',
        'Vue': '#41b883',
        'Svelte': '#ff3e00',
    };
    return colors[lang] || '#8b949e';
}

async function fetchOrgData() {
    const token = getGitHubToken();
    
    try {
        const [org, repos] = await Promise.all([
            fetchGitHubWithAuth(`https://api.github.com/orgs/${ORG_NAME}`, token),
            fetchGitHubWithAuth(`https://api.github.com/orgs/${ORG_NAME}/repos?sort=updated&per_page=100&type=all`, token)
        ]);
        
        return { org, repos: repos || [] };
    } catch (error) {
        console.error('Error fetching org data:', error);
        return { org: null, repos: [] };
    }
}

async function fetchOrgIssues(repos: any[]) {
    const token = getGitHubToken();
    let openIssues: any[] = [];
    
    try {
        // Fetch open issues from all repos (limited to first 10 repos for performance)
        const issuePromises = repos.slice(0, 10).map(repo =>
            fetchGitHubWithAuth(
                `https://api.github.com/repos/${ORG_NAME}/${repo.name}/issues?state=open&per_page=5`,
                token
            ).catch(() => [])
        );
        
        const issueResults = await Promise.all(issuePromises);
        openIssues = issueResults.flat().filter(i => !i.pull_request); // Exclude PRs
        
        // Sort by created date, newest first
        openIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return openIssues.slice(0, 10);
    } catch (error) {
        console.error('Error fetching issues:', error);
        return [];
    }
}

export const home = async () => {
    const user = getCurrentUser();
    const proBadge = user?.isPro ? `<span style="background:linear-gradient(135deg,#f78166,#da3633);color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">PRO</span>` : '';
    const authSection = user
        ? `<div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
               <a href="/${user.login}" style="display:flex;align-items:center;gap:8px;">
                   <img src="${user.avatar_url}" alt="${user.login}" style="width:20px;height:20px;border-radius:50%;">
                   ${user.login}
                   ${proBadge}
               </a>
               <a href="/logout">Sign out</a>
           </div>`
        : `<a href="/github" style="margin-left:auto;">Sign in with GitHub</a>`;

    // Fetch org data
    const { org, repos } = await fetchOrgData();
    const recentIssues = await fetchOrgIssues(repos);
    
    // Calculate aggregate stats
    const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum: number, r: any) => sum + (r.forks_count || 0), 0);
    const totalOpenIssues = repos.reduce((sum: number, r: any) => sum + (r.open_issues_count || 0), 0);
    const languages = [...new Set(repos.map((r: any) => r.language).filter(Boolean))];
    
    // Build repo cards
    const repoCards = repos
        .filter((r: any) => !r.fork)
        .slice(0, 20)
        .map((r: any) => `
            <div class="repo-card">
                <h3>
                    <a href="/${r.full_name}">${escapeHtml(r.name)}</a>
                    ${r.private ? `<span class="badge private">Private</span>` : ''}
                    ${r.archived ? `<span class="badge archived">Archived</span>` : ''}
                </h3>
                ${r.description ? `<div class="desc">${escapeHtml(r.description)}</div>` : ''}
                <div class="meta">
                    ${r.language ? `<span><span class="lang-dot" style="background:${getLanguageColor(r.language)}"></span> ${escapeHtml(r.language)}</span>` : ''}
                    ${r.stargazers_count > 0 ? `<span>★ ${formatNumber(r.stargazers_count)}</span>` : ''}
                    ${r.forks_count > 0 ? `<span>⑂ ${formatNumber(r.forks_count)}</span>` : ''}
                    ${r.open_issues_count > 0 ? `<span>🔴 ${r.open_issues_count} issues</span>` : ''}
                    <span>Updated ${formatDate(r.updated_at)}</span>
                </div>
            </div>
        `).join('');
    
    // Build issues list
    const issuesHtml = recentIssues.length > 0 
        ? recentIssues.map((issue: any) => {
            const repoName = issue.repository_url?.split('/').pop() || '';
            const labels = issue.labels?.slice(0, 3).map((l: any) => 
                `<span class="label" style="background:#${l.color}20;color:#${l.color};border:1px solid #${l.color}40;">${escapeHtml(l.name)}</span>`
            ).join('') || '';
            return `
                <div class="issue-item">
                    <div class="issue-title">
                        <a href="/${ORG_NAME}/${repoName}/issues/${issue.number}">${escapeHtml(issue.title)}</a>
                    </div>
                    <div class="issue-meta">
                        <a href="/${ORG_NAME}/${repoName}" class="repo-link">${repoName}</a>
                        #${issue.number} opened ${formatDate(issue.created_at)} by 
                        <a href="/${issue.user?.login}">${issue.user?.login}</a>
                        ${labels}
                    </div>
                </div>
            `;
        }).join('')
        : '<p style="color:#8b949e;text-align:center;">No open issues found</p>';

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Equalify Open Source – Developer tools for EqualifyEverything</title>
    <link rel="icon" href="https://app.equalify.uic.edu/favicon.ico">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: #0d1117;
            color: #e6edf3;
            min-height: 100vh;
        }
        a { color: #58a6ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        nav {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        nav .logo { font-size: 18px; font-weight: 600; color: #e6edf3; text-decoration: none; }
        nav a { color: #8b949e; text-decoration: none; font-size: 14px; white-space: nowrap; }
        nav a:hover { color: #e6edf3; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
        
        /* Org header */
        .org-header {
            display: flex;
            align-items: flex-start;
            gap: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid #30363d;
            margin-bottom: 24px;
        }
        .org-avatar {
            width: 100px;
            height: 100px;
            border-radius: 6px;
            border: 1px solid #30363d;
        }
        .org-info h1 { margin: 0 0 8px 0; font-size: 28px; }
        .org-info .org-name { color: #8b949e; font-size: 18px; margin-bottom: 8px; }
        .org-info .org-bio { color: #8b949e; margin-bottom: 12px; }
        .org-links { display: flex; gap: 16px; font-size: 14px; color: #8b949e; flex-wrap: wrap; }
        .org-links a { color: #58a6ff; }
        
        /* Stats */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
            text-align: center;
        }
        .stat-value { font-size: 32px; font-weight: 600; color: #e6edf3; }
        .stat-label { font-size: 14px; color: #8b949e; margin-top: 4px; }
        .stat-value.stars { color: #f1e05a; }
        .stat-value.forks { color: #58a6ff; }
        .stat-value.issues { color: #f85149; }
        .stat-value.repos { color: #3fb950; }
        
        /* Two column layout */
        .main-content {
            display: grid;
            grid-template-columns: 1fr;
            gap: 32px;
        }
        @media (min-width: 900px) {
            .main-content { grid-template-columns: 2fr 1fr; }
        }
        
        /* Repo cards */
        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .repo-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        }
        .repo-card h3 { margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .repo-card h3 a { color: #58a6ff; }
        .repo-card .desc { color: #8b949e; font-size: 14px; margin-bottom: 12px; }
        .repo-card .meta { display: flex; gap: 16px; font-size: 12px; color: #8b949e; flex-wrap: wrap; }
        .lang-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
        .badge { font-size: 12px; font-weight: 400; padding: 2px 8px; border-radius: 24px; }
        .badge.private { background: #30363d; color: #8b949e; }
        .badge.archived { background: #f8514940; color: #f85149; }
        
        /* Issues */
        .issues-section {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
        }
        .issue-item {
            padding: 12px 0;
            border-bottom: 1px solid #21262d;
        }
        .issue-item:last-child { border-bottom: none; }
        .issue-title { margin-bottom: 4px; }
        .issue-title a { color: #e6edf3; font-weight: 500; }
        .issue-title a:hover { color: #58a6ff; }
        .issue-meta { font-size: 12px; color: #8b949e; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .issue-meta a { color: #8b949e; }
        .issue-meta a:hover { color: #58a6ff; }
        .repo-link { font-weight: 500; }
        .label { font-size: 11px; padding: 2px 6px; border-radius: 12px; font-weight: 500; }
        
        footer {
            text-align: center;
            padding: 24px 16px;
            color: #8b949e;
            font-size: 12px;
            border-top: 1px solid #30363d;
            margin-top: 48px;
        }
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo" style="display:flex;align-items:center;gap:8px;">
            <img src="${org?.avatar_url || 'https://github.com/EqualifyEverything.png'}" alt="Equalify" style="width:24px;height:24px;border-radius:4px;">
            Equalify Open Source
        </a>
        ${authSection}
    </nav>
    
    <div class="container">
        <!-- Org Header -->
        <div class="org-header">
            <img class="org-avatar" src="${org?.avatar_url || 'https://github.com/EqualifyEverything.png'}" alt="${ORG_NAME}">
            <div class="org-info">
                <h1>${org?.name || ORG_NAME}</h1>
                <div class="org-name">@${ORG_NAME}</div>
                ${org?.description ? `<div class="org-bio">${escapeHtml(org.description)}</div>` : ''}
                <div class="org-links">
                    ${org?.blog ? `<span>🔗 <a href="${org.blog}" rel="noopener">${org.blog}</a></span>` : ''}
                    ${org?.location ? `<span>📍 ${escapeHtml(org.location)}</span>` : ''}
                    <span><a href="https://github.com/${ORG_NAME}" rel="noopener">View on GitHub →</a></span>
                </div>
            </div>
        </div>
        
        <!-- Stats -->
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value repos">${repos.length}</div>
                <div class="stat-label">Repositories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value stars">${formatNumber(totalStars)}</div>
                <div class="stat-label">Total Stars</div>
            </div>
            <div class="stat-card">
                <div class="stat-value forks">${formatNumber(totalForks)}</div>
                <div class="stat-label">Total Forks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value issues">${formatNumber(totalOpenIssues)}</div>
                <div class="stat-label">Open Issues</div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Repos Column -->
            <div>
                <div class="section-title">📦 Repositories</div>
                ${repoCards || '<p style="color:#8b949e;">No repositories found</p>'}
            </div>
            
            <!-- Issues Column -->
            <div>
                <div class="section-title">🔴 Recent Issues</div>
                <div class="issues-section">
                    ${issuesHtml}
                </div>
            </div>
        </div>
    </div>
    
    <footer>
        <a href="/about">About</a> · 
        <a href="https://github.com/${ORG_NAME}" rel="noopener">GitHub</a> · 
        <a href="https://app.equalify.uic.edu" rel="noopener">Equalify</a>
    </footer>
</body>
</html>`
    };
};