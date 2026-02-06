import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { BaseLayout, Nav, Footer, site } from '#src/components/Layout';
import { escapeHtml } from '#src/components/utils';
import { getCurrentUser, getGitHubToken, fetchGitHub as fetchGitHubWithAuth } from '#src/utils/auth';
import config from '#src/utils/config';

const ORG_NAME = config.githubOrg;

const styles = `
body {
    min-height: 100vh;
    background: #ffffff;
}
.site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
}
.top-bar {
    height: 8px;
    background: #C8102E;
}
.container { max-width: 1200px; margin: 0 auto; padding: 24px 48px; }
@media (max-width: 768px) {
    .container { padding: 16px 20px; }
}

/* Mobile nav */
.nav-desktop { display: flex; align-items: center; gap: 32px; }
.nav-mobile-toggle { display: none; background: none; border: none; padding: 8px; cursor: pointer; color: #4b5563; }
.nav-mobile { display: none; }
@media (max-width: 900px) {
    .nav-desktop { display: none; }
    .nav-mobile-toggle { display: block; }
    .nav-mobile {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ffffff;
        border-bottom: 1px solid #d1d5db;
        padding: 16px 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .nav-mobile.open { display: block; }
    .nav-mobile a {
        display: block;
        padding: 12px 0;
        color: #4b5563;
        font-size: 15px;
        border-bottom: 1px solid #e5e7eb;
    }
    .nav-mobile a:last-child { border-bottom: none; }
    .nav-mobile .sign-in-mobile {
        display: inline-block;
        margin-top: 12px;
        background: #C8102E;
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
    }
}

/* Org header */
.org-header {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #d1d5db;
    margin-bottom: 24px;
}
@media (max-width: 768px) {
    .org-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
        padding-bottom: 16px;
        margin-bottom: 16px;
    }
}
.org-avatar {
    width: 100px;
    height: 100px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}
@media (max-width: 768px) {
    .org-avatar { width: 80px; height: 80px; }
}
.org-info h1 { margin: 0 0 8px 0; font-size: 28px; color: #1f2937; }
@media (max-width: 768px) {
    .org-info h1 { font-size: 22px; }
}
.org-info .org-name { color: #4b5563; font-size: 18px; margin-bottom: 8px; }
@media (max-width: 768px) {
    .org-info .org-name { font-size: 15px; }
}
.org-info .org-bio { color: #4b5563; margin-bottom: 12px; }
@media (max-width: 768px) {
    .org-info .org-bio { font-size: 14px; margin-bottom: 8px; }
}
.org-links { display: flex; gap: 16px; font-size: 14px; color: #4b5563; flex-wrap: wrap; }
@media (max-width: 768px) {
    .org-links { justify-content: center; gap: 12px; font-size: 13px; }
}
.org-links a { color: #C8102E; }

/* Stats */
.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
}
@media (max-width: 768px) {
    .stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 24px;
    }
}
.stat-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 16px;
    text-align: center;
}
@media (max-width: 768px) {
    .stat-card { padding: 12px 8px; }
}
.stat-value { font-size: 32px; font-weight: 600; color: #1f2937; }
@media (max-width: 768px) {
    .stat-value { font-size: 24px; }
}
.stat-label { font-size: 14px; color: #4b5563; margin-top: 4px; }
.stat-value.stars { color: #d97706; }
.stat-value.forks { color: #2563eb; }
.stat-value.issues { color: #C8102E; }
.stat-value.repos { color: #059669; }

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
    color: #1f2937;
}
.repo-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
}
.repo-card h3 { margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: #1f2937; }
.repo-card h3 a { color: #C8102E; }
.repo-card .desc { color: #4b5563; font-size: 14px; margin-bottom: 12px; }
.repo-card .meta { display: flex; gap: 16px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
.lang-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
.badge { font-size: 12px; font-weight: 400; padding: 2px 8px; border-radius: 24px; }
.badge.private { background: #e5e7eb; color: #6b7280; }
.badge.archived { background: #fee2e2; color: #C8102E; }

/* Issues */
.issues-section {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 16px;
}
.issue-item {
    padding: 12px 0;
    border-bottom: 1px solid #e5e7eb;
}
.issue-item:last-child { border-bottom: none; }
.issue-title { margin-bottom: 4px; }
.issue-title a { color: #1f2937; font-weight: 500; }
.issue-title a:hover { color: #C8102E; }
.issue-meta { font-size: 12px; color: #6b7280; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.issue-meta a { color: #6b7280; }
.issue-meta a:hover { color: #C8102E; }
.repo-link { font-weight: 500; }
.label { font-size: 11px; padding: 2px 6px; border-radius: 12px; font-weight: 500; }

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #001e62 0%, #001845 100%);
    padding: 80px 48px;
    text-align: center;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
}
.hero-content {
    max-width: 800px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
}
.hero-badge {
    display: inline-block;
    background: rgba(200, 16, 46, 0.9);
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.hero h1 {
    color: #ffffff;
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 20px 0;
    line-height: 1.2;
}
@media (max-width: 768px) {
    .hero h1 { font-size: 32px; }
    .hero { padding: 48px 24px; }
}
.hero p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 20px;
    line-height: 1.6;
    margin: 0 0 32px 0;
}
.hero-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
}
.hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
}
.hero-btn-primary {
    background: #C8102E;
    color: #ffffff;
}
.hero-btn-primary:hover {
    background: #9a0c23;
    text-decoration: none;
    transform: translateY(-2px);
}
.hero-btn-secondary {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.3);
}
.hero-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.25);
    text-decoration: none;
    transform: translateY(-2px);
}

/* Quick Links below hero */
.quick-links {
    background: #f8f9fa;
    padding: 24px 48px;
    border-bottom: 1px solid #d1d5db;
}
@media (max-width: 768px) {
    .quick-links { padding: 16px 20px; }
}
.quick-links-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    gap: 48px;
    flex-wrap: wrap;
}
@media (max-width: 768px) {
    .quick-links-inner {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
}
.quick-link {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #4b5563;
    font-size: 14px;
    text-decoration: none;
}
@media (max-width: 768px) {
    .quick-link {
        flex-direction: column;
        text-align: center;
        gap: 6px;
        font-size: 12px;
        padding: 12px 8px;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 8px;
    }
}
.quick-link:hover {
    color: #C8102E;
}
.quick-link-icon {
    width: 40px;
    height: 40px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}
@media (max-width: 768px) {
    .quick-link-icon {
        width: 36px;
        height: 36px;
        font-size: 16px;
        border: none;
        background: transparent;
    }
}

/* Section divider */
.section-divider {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 48px 16px;
}
@media (max-width: 768px) {
    .section-divider { padding: 24px 20px 12px; }
}
.section-divider h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}
@media (max-width: 768px) {
    .section-divider h2 { font-size: 20px; gap: 8px; }
    .section-divider h2 svg { width: 20px; height: 20px; }
}
.section-divider p {
    color: #6b7280;
    margin: 8px 0 0 0;
    font-size: 15px;
}
@media (max-width: 768px) {
    .section-divider p { font-size: 13px; }
}
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
    issuesClosed: number;
    contributorCount: number;
}> = ({ org, repos, issues, totalStars, totalForks, totalOpenIssues, issuesClosed, contributorCount }) => {
    const user = getCurrentUser();
    
    return (
        <BaseLayout title={`${site.name} – Developer tools for EqualifyEverything`} styles={styles}>
            <header class="site-header">
                <div class="top-bar"></div>
                <nav style="background:#ffffff;border-bottom:1px solid #d1d5db;padding:0;position:relative;">
                    <div style="max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;">
                        <a href="/" class="logo" style="font-size:20px;font-weight:600;color:#001e62;text-decoration:none;display:flex;align-items:center;gap:14px;">
                            <img src={org?.avatar_url || `https://github.com/${ORG_NAME}.png`} alt="UIC" style="width:64px;height:64px;border-radius:50%;" />
                            <span style="width:1px;height:48px;background:#d1d5db;"></span>
                            <span>Equalify Hub</span>
                        </a>
                        <div class="nav-desktop">
                            <a href="/user-guide" style="color:#4b5563;font-size:15px;">User Guide</a>
                            <a href="/technical-docs" style="color:#4b5563;font-size:15px;">Technical</a>
                            <a href="/roadmap" style="color:#4b5563;font-size:15px;">Roadmap</a>
                            <a href="/updates" style="color:#4b5563;font-size:15px;">Updates</a>
                            <a href="/feature-request" style="color:#4b5563;font-size:15px;">Feature Request</a>
                            <a href="/about" style="color:#4b5563;font-size:15px;">About</a>
                            {user ? (
                                <>
                                    <a href={`/${user.login}`} style="display:flex;align-items:center;gap:8px;color:#4b5563;font-size:15px;">
                                        <img src={user.avatar_url} alt={user.login} style="width:20px;height:20px;border-radius:50%;" />
                                        {user.login}
                                    </a>
                                    <a href="/logout" style="color:#4b5563;font-size:15px;">Sign out</a>
                                </>
                            ) : (
                                <a href={config.equalifyAppUrl} style="background:#C8102E;color:#ffffff;padding:10px 20px;border-radius:4px;font-size:14px;font-weight:500;">Sign into Equalify</a>
                            )}
                        </div>
                        <button class="nav-mobile-toggle" onclick="document.querySelector('.nav-mobile').classList.toggle('open')" aria-label="Toggle menu">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="12" x2="21" y2="12"/>
                                <line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="nav-mobile">
                        <a href="/user-guide">User Guide</a>
                        <a href="/technical-docs">Technical</a>
                        <a href="/roadmap">Roadmap</a>
                        <a href="/updates">Updates</a>
                        <a href="/feature-request">Feature Request</a>
                        <a href="/about">About</a>
                        {user ? (
                            <>
                                <a href={`/${user.login}`}>{user.login}</a>
                                <a href="/logout">Sign out</a>
                            </>
                        ) : (
                            <a href={config.equalifyAppUrl} class="sign-in-mobile">Sign into Equalify</a>
                        )}
                    </div>
                </nav>
            </header>
            
            {/* Hero Section */}
            <section class="hero">
                <div class="hero-content">
                    <span class="hero-badge">UIC Digital Accessibility</span>
                    <h1>Welcome to the Equalify Hub</h1>
                    <p>
                        Your central resource for Equalify – UIC's open-source web accessibility platform. 
                        Find documentation, track development progress, and learn how to contribute.
                    </p>
                    <div class="hero-buttons">
                        <a href="/user-guide" class="hero-btn hero-btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            User Guide
                        </a>
                        <a href={config.equalifyAppUrl} class="hero-btn hero-btn-secondary" rel="noopener">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            Go to Equalify App
                        </a>
                    </div>
                </div>
            </section>
            
            {/* Quick Links */}
            <div class="quick-links">
                <div class="quick-links-inner">
                    <a href="/user-guide" class="quick-link">
                        <span class="quick-link-icon">📖</span>
                        <span><strong>User Guide</strong><br/>How to use Equalify</span>
                    </a>
                    <a href={`https://github.com/${ORG_NAME}`} class="quick-link" rel="noopener">
                        <span class="quick-link-icon">💻</span>
                        <span><strong>Source Code</strong><br/>View on GitHub</span>
                    </a>
                    <a href="/feature-request" class="quick-link">
                        <span class="quick-link-icon">💬</span>
                        <span><strong>Feature Request</strong><br/>Request features</span>
                    </a>
                    <a href="https://osf.it.uic.edu/" class="quick-link" rel="noopener">
                        <span class="quick-link-icon">🎓</span>
                        <span><strong>Open Source Fund</strong><br/>UIC initiative</span>
                    </a>
                </div>
            </div>

            {/* Section Header for Dashboard */}
            <div class="section-divider">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    Development Dashboard
                </h2>
                <p>Live activity from the EqualifyEverything GitHub organization</p>
            </div>
            
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
                    <div class="stat-card">
                        <div class="stat-value" style="color:#059669;">{formatNumber(issuesClosed)}</div>
                        <div class="stat-label">Issues Closed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color:#7c3aed;">{formatNumber(contributorCount)}</div>
                        <div class="stat-label">Contributors</div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div class="main-content">
                    {/* Repos Column */}
                    <div>
                        <div class="section-title">📦 Repositories</div>
                        {repos.filter(r => !r.fork && !r.archived).slice(0, 20).map(repo => <RepoCard repo={repo} />)}
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
        
        return { org, repos: Array.isArray(repos) ? repos : [] };
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
            ).then(result => Array.isArray(result) ? result : []).catch(() => [])
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
            issuesClosed={245}
            contributorCount={12}
        />
    );
}
