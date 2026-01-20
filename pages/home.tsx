import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { BaseLayout, Nav, Footer, site } from '#src/components/Layout';
import { escapeHtml } from '#src/components/utils';
import { getCurrentUser, getGitHubToken, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';

const ORG_NAME = 'EqualifyEverything';

const styles = `
body {
    min-height: 100vh;
}
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
`;

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
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Shell': '#89e051',
        'Vue': '#41b883',
    };
    return colors[lang] || '#8b949e';
}

const RepoCard: FC<{ repo: any }> = ({ repo }) => (
    <div class="repo-card">
        <h3>
            <a href={`/${repo.full_name}`}>{escapeHtml(repo.name)}</a>
            {repo.private && <span class="badge private">Private</span>}
            {repo.archived && <span class="badge archived">Archived</span>}
        </h3>
        {repo.description && <div class="desc">{escapeHtml(repo.description)}</div>}
        <div class="meta">
            {repo.language && (
                <span>
                    <span class="lang-dot" style={`background:${getLanguageColor(repo.language)}`}></span>
                    {escapeHtml(repo.language)}
                </span>
            )}
            {repo.stargazers_count > 0 && <span>★ {formatNumber(repo.stargazers_count)}</span>}
            {repo.forks_count > 0 && <span>⑂ {formatNumber(repo.forks_count)}</span>}
            {repo.open_issues_count > 0 && <span>🔴 {repo.open_issues_count} issues</span>}
            <span>Updated {formatDate(repo.updated_at)}</span>
        </div>
    </div>
);

const IssueItem: FC<{ issue: any }> = ({ issue }) => {
    const repoName = issue.repository_url?.split('/').pop() || '';
    return (
        <div class="issue-item">
            <div class="issue-title">
                <a href={`/${ORG_NAME}/${repoName}/issues/${issue.number}`}>{escapeHtml(issue.title)}</a>
            </div>
            <div class="issue-meta">
                <a href={`/${ORG_NAME}/${repoName}`} class="repo-link">{repoName}</a>
                #{issue.number} opened {formatDate(issue.created_at)} by{' '}
                <a href={`/${issue.user?.login}`}>{issue.user?.login}</a>
                {issue.labels?.slice(0, 3).map((l: any) => (
                    <span class="label" style={`background:#${l.color}20;color:#${l.color};border:1px solid #${l.color}40;`}>
                        {escapeHtml(l.name)}
                    </span>
                ))}
            </div>
        </div>
    );
};

export const HomePage: FC<{
    org: any;
    repos: any[];
    issues: any[];
    totalStars: number;
    totalForks: number;
    totalOpenIssues: number;
}> = ({ org, repos, issues, totalStars, totalForks, totalOpenIssues }) => {
    const user = getCurrentUser();
    
    return (
        <BaseLayout title={`${site.name} – Developer tools for EqualifyEverything`} styles={styles}>
            <nav style="background:#161b22;border-bottom:1px solid #30363d;padding:12px 16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                <a href="/" class="logo" style="font-size:18px;font-weight:600;color:#e6edf3;text-decoration:none;display:flex;align-items:center;gap:8px;">
                    <img src={org?.avatar_url || `https://github.com/${ORG_NAME}.png`} alt="Equalify" style="width:24px;height:24px;border-radius:4px;" />
                    Equalify Open Source
                </a>
                {user ? (
                    <div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
                        <a href={`/${user.login}`} style="display:flex;align-items:center;gap:8px;color:#8b949e;font-size:14px;">
                            <img src={user.avatar_url} alt={user.login} style="width:20px;height:20px;border-radius:50%;" />
                            {user.login}
                        </a>
                        <a href="/logout" style="color:#8b949e;font-size:14px;">Sign out</a>
                    </div>
                ) : (
                    <a href="/github" style="margin-left:auto;color:#8b949e;font-size:14px;">Sign in with GitHub</a>
                )}
            </nav>
            
            <div class="container">
                {/* Org Header */}
                <div class="org-header">
                    <img class="org-avatar" src={org?.avatar_url || `https://github.com/${ORG_NAME}.png`} alt={ORG_NAME} />
                    <div class="org-info">
                        <h1>{org?.name || ORG_NAME}</h1>
                        <div class="org-name">@{ORG_NAME}</div>
                        {org?.description && <div class="org-bio">{escapeHtml(org.description)}</div>}
                        <div class="org-links">
                            {org?.blog && <span>🔗 <a href={org.blog} rel="noopener">{org.blog}</a></span>}
                            {org?.location && <span>📍 {escapeHtml(org.location)}</span>}
                            <span><a href={`https://github.com/${ORG_NAME}`} rel="noopener">View on GitHub →</a></span>
                        </div>
                    </div>
                </div>
                
                {/* Stats */}
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value repos">{repos.length}</div>
                        <div class="stat-label">Repositories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value stars">{formatNumber(totalStars)}</div>
                        <div class="stat-label">Total Stars</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value forks">{formatNumber(totalForks)}</div>
                        <div class="stat-label">Total Forks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value issues">{formatNumber(totalOpenIssues)}</div>
                        <div class="stat-label">Open Issues</div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div class="main-content">
                    {/* Repos Column */}
                    <div>
                        <div class="section-title">📦 Repositories</div>
                        {repos.filter(r => !r.fork).slice(0, 20).map(repo => <RepoCard repo={repo} />)}
                        {repos.length === 0 && <p style="color:#8b949e;">No repositories found</p>}
                    </div>
                    
                    {/* Issues Column */}
                    <div>
                        <div class="section-title">🔴 Recent Issues</div>
                        <div class="issues-section">
                            {issues.length > 0 
                                ? issues.map(issue => <IssueItem issue={issue} />)
                                : <p style="color:#8b949e;text-align:center;">No open issues found</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            <footer style="text-align:center;padding:24px 16px;color:#8b949e;font-size:12px;border-top:1px solid #30363d;margin-top:48px;">
                <a href="/about">About</a> · 
                <a href={`https://github.com/${ORG_NAME}`} rel="noopener">GitHub</a> · 
                <a href="https://app.equalify.uic.edu" rel="noopener">Equalify</a>
            </footer>
        </BaseLayout>
    );
};

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
        const issuePromises = repos.slice(0, 10).map(repo =>
            fetchGitHubWithAuth(
                `https://api.github.com/repos/${ORG_NAME}/${repo.name}/issues?state=open&per_page=5`,
                token
            ).catch(() => [])
        );
        
        const issueResults = await Promise.all(issuePromises);
        openIssues = issueResults.flat().filter(i => !i.pull_request);
        openIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return openIssues.slice(0, 10);
    } catch (error) {
        console.error('Error fetching issues:', error);
        return [];
    }
}

export async function homeHandler(c: Context) {
    const { org, repos } = await fetchOrgData();
    const issues = await fetchOrgIssues(repos);
    
    const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum: number, r: any) => sum + (r.forks_count || 0), 0);
    const totalOpenIssues = repos.reduce((sum: number, r: any) => sum + (r.open_issues_count || 0), 0);

    return c.html(
        <HomePage 
            org={org}
            repos={repos}
            issues={issues}
            totalStars={totalStars}
            totalForks={totalForks}
            totalOpenIssues={totalOpenIssues}
        />
    );
}
