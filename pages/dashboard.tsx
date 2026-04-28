import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';

const styles = `
/* Hero */
.dashboard-hero {
    background: #001e62;
    color: #ffffff;
    padding: 64px 24px;
    text-align: center;
}
.dashboard-hero h1 {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 16px;
    color: #ffffff;
}
.dashboard-hero .tagline {
    font-size: 20px;
    color: #ffffff;
    max-width: 700px;
    margin: 0 auto 32px;
    line-height: 1.5;
}
.dashboard-hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}
.dashboard-hero-buttons a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 15px;
    text-decoration: none;
    transition: all 0.2s;
}
.btn-primary {
    background: #C8102E;
    color: #ffffff;
}
.btn-primary:hover { background: #a00d25; }
.btn-secondary {
    background: rgba(255,255,255,0.2);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.5);
}
.btn-secondary:hover { background: rgba(255,255,255,0.3); }

/* Docs section */
.docs-section {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 48px 64px;
}
@media (max-width: 768px) {
    .docs-section { padding: 32px 20px 48px; }
}
.docs-group {
    margin-bottom: 48px;
}
.docs-group h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.docs-group .group-desc {
    color: #6b7280;
    margin: 0 0 24px;
    font-size: 15px;
}

/* Doc cards */
.doc-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.2s;
    text-decoration: none;
    display: block;
}
.doc-card:hover {
    border-color: #C8102E;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.doc-card h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #C8102E;
}
.doc-card p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}

/* Single doc view */
.doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}
.doc-header h1 {
    margin: 0;
    font-size: 28px;
    color: #1f2937;
}
.back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
    font-size: 14px;
    text-decoration: none;
    margin-bottom: 16px;
}
.back-link:hover {
    color: #C8102E;
}
.edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #4b5563;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;
}
.edit-btn:hover {
    border-color: #C8102E;
    color: #C8102E;
}
.doc-content {
    color: #1f2937;
    line-height: 1.7;
}
.doc-content h1 { font-size: 24px; margin: 24px 0 16px; color: #1f2937; }
.doc-content h2 { font-size: 20px; margin: 24px 0 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
.doc-content h3 { font-size: 16px; margin: 20px 0 10px; color: #1f2937; }
.doc-content p { margin: 0 0 16px; }
.doc-content ul { margin: 0 0 16px; padding-left: 24px; list-style: disc; }
.doc-content ol { margin: 0 0 16px; padding-left: 24px; list-style: decimal; }
.doc-content li { margin: 4px 0; }
.doc-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.doc-content pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 0 0 16px; }
.doc-content pre code { background: none; padding: 0; color: inherit; }
.doc-content blockquote { border-left: 4px solid #C8102E; margin: 0 0 16px; padding: 12px 16px; background: #fef2f2; color: #991b1b; }
.doc-content table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.doc-content th, .doc-content td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
.doc-content th { background: #f8f9fa; font-weight: 600; }
.doc-content a { color: #C8102E; }
.doc-content img { max-width: 100%; border-radius: 6px; }
.doc-content .md-callout { font-size: 15px; }
.doc-content .md-callout a { color: inherit; text-decoration: underline; }

/* User Guide section list */
.ug-section {
    margin-bottom: 32px;
    padding: 20px;
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
}
.ug-section-title {
    font-size: 18px;
    font-weight: 700;
    color: #001e62;
    margin: 0 0 12px;
}
.ug-page-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.ug-page-list li {
    margin: 0;
    padding: 0;
}
.ug-page-list li a {
    display: flex;
    gap: 10px;
    padding: 8px 12px;
    margin: 4px -12px;
    color: #1f2937;
    text-decoration: none;
    border-radius: 6px;
    font-size: 15px;
    transition: background 0.15s;
}
.ug-page-list li a:hover {
    background: #ffffff;
    color: #C8102E;
}
.ug-page-number {
    color: #6b7280;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    min-width: 32px;
}

/* User Guide doc page layout (sidebar + content) */
.ug-doc-layout {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 48px;
    align-items: start;
}
@media (max-width: 900px) {
    .ug-doc-layout {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px 16px 48px;
    }
}

/* Sidebar */
.ug-sidebar {
    position: sticky;
    top: 100px;
    align-self: start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    border-right: 1px solid #e5e7eb;
    padding-right: 16px;
}
@media (max-width: 900px) {
    .ug-sidebar {
        position: static;
        max-height: none;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        padding-right: 0;
        padding-bottom: 16px;
        margin-bottom: 8px;
    }
}
.ug-sidebar-inner {
    font-size: 14px;
}
.ug-sidebar-title {
    display: block;
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    text-decoration: none;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
}
.ug-sidebar-title:hover {
    color: #C8102E;
}
.ug-sidebar-section {
    margin-bottom: 16px;
}
.ug-sidebar-section-title {
    font-size: 13px;
    font-weight: 700;
    color: #001e62;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
}
.ug-sidebar-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border-left: 1px solid #e5e7eb;
}
.ug-sidebar-link {
    display: flex;
    gap: 8px;
    padding: 6px 12px;
    margin-left: -1px;
    color: #4b5563;
    text-decoration: none;
    font-size: 14px;
    line-height: 1.4;
    border-left: 2px solid transparent;
}
.ug-sidebar-link:hover {
    color: #C8102E;
    background: #f9fafb;
}
.ug-sidebar-link-active {
    color: #C8102E;
    font-weight: 600;
    border-left-color: #C8102E;
    background: #fef2f2;
}
.ug-sidebar-page-num {
    color: #9ca3af;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    flex-shrink: 0;
}
.ug-sidebar-link-active .ug-sidebar-page-num {
    color: #C8102E;
}

/* Main doc content */
.ug-doc-main {
    min-width: 0;
}

/* Prev/Next pagination */
.ug-pagination {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 64px;
    padding-top: 48px;
    padding-bottom: 16px;
    border-top: 1px solid #e5e7eb;
}
@media (max-width: 600px) {
    .ug-pagination { grid-template-columns: 1fr; }
}
.ug-pagination-link {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px 20px;
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    text-decoration: none;
    color: #1f2937;
    transition: all 0.15s;
}
.ug-pagination-link:hover {
    border-color: #C8102E;
    background: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.ug-pagination-prev { text-align: left; }
.ug-pagination-next { text-align: right; }
.ug-pagination-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.ug-pagination-next .ug-pagination-label {
    justify-content: flex-end;
}
.ug-pagination-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
}
.ug-pagination-link:hover .ug-pagination-title {
    color: #C8102E;
}
`;

// Convert a folder/file name like "1. Onboarding and Setup" or "1.1: Quick Start Guide.md"
// into a URL-friendly slug ("1-onboarding-and-setup", "1-1-quick-start-guide").
function slugify(name: string): string {
    return name
        .replace(/\.md$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Strip leading number prefix ("1. " or "1.1: ") from a name to get the display title
function stripNumberPrefix(name: string): string {
    return name
        .replace(/\.md$/i, '')
        .replace(/^\d+(?:\.\d+)?\s*[:.\)]\s*/, '')
        .trim();
}

// Extract sortable order key from a folder/file name with leading number
function orderKey(name: string): number[] {
    const match = name.match(/^(\d+(?:\.\d+)*)/);
    if (!match) return [9999];
    return match[1].split('.').map(n => parseInt(n, 10));
}

function compareByOrder(a: string, b: string): number {
    const ka = orderKey(a);
    const kb = orderKey(b);
    for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
        const va = ka[i] ?? 0;
        const vb = kb[i] ?? 0;
        if (va !== vb) return va - vb;
    }
    return a.localeCompare(b);
}

// Technical doc metadata
const technicalDocMetadata: Record<string, { title: string; description: string; order: number }> = {
    'architecture.md': { title: 'Architecture Overview', description: 'System design, cloud infrastructure, and how major components interact.', order: 1 },
    'api-reference.md': { title: 'API Reference', description: 'Complete REST API documentation with authentication, endpoints, and examples.', order: 2 },
    'contributing.md': { title: 'Contributing Guide', description: 'How to set up your development environment, coding standards, and PR guidelines.', order: 3 },
    'deployment.md': { title: 'Deployment Guide', description: 'Self-hosting Equalify, AWS configuration, and production best practices.', order: 4 },
    'testing.md': { title: 'Testing Guide', description: 'How Equalify integrates with axe-core, WAVE, and other accessibility testing engines.', order: 5 },
};

interface DocListItem {
    name: string;       // Original filename (or folder name)
    slug: string;       // URL slug
    title: string;
    description: string;
}

interface DocFile {
    name: string;
    title: string;
    content: string;
    html_url: string;
}

// User guide section (a folder containing pages)
interface UserGuideSection {
    name: string;       // Original folder name e.g. "1. Onboarding and Setup"
    slug: string;       // URL slug e.g. "1-onboarding-and-setup"
    title: string;      // Display title e.g. "Onboarding and Setup"
    number: string;     // Section number e.g. "1"
    pages: UserGuidePage[];
}

interface UserGuidePage {
    name: string;       // Original filename e.g. "1.1: Quick Start Guide.md"
    slug: string;       // URL slug e.g. "1-1-quick-start-guide"
    title: string;      // Display title e.g. "Quick Start Guide"
    number: string;     // Page number e.g. "1.1"
}

// Landing page with both doc sections
export const DashboardPage: FC<{ userSections: UserGuideSection[]; technicalDocs: DocListItem[] }> = ({ userSections, technicalDocs }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Equalify Dashboard - Equalify Hub" styles={styles} user={user}>
            {/* Hero */}
            <section class="dashboard-hero">
                <h1>Equalify Dashboard</h1>
                <p class="tagline">
                    Track and manage web accessibility issues across your sites.
                    Scan, audit, and monitor your organization's accessibility compliance.
                </p>
                <div class="dashboard-hero-buttons">
                    <a href="/signup" class="btn-primary">
                        Sign Up for Dashboard
                    </a>
                    <a href="https://github.com/EqualifyEverything/equalify" class="btn-secondary" rel="noopener">
                        View on GitHub
                    </a>
                </div>
            </section>

            {/* Documentation sections */}
            <div class="docs-section">
                {/* User Guide */}
                <div class="docs-group" id="user-guide">
                    <h2>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#001e62" stroke-width="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        User Guide
                    </h2>
                    <p class="group-desc">Guides for end users on how to use Equalify effectively.</p>

                    {userSections.length > 0 ? (
                        userSections.map(section => (
                            <div class="ug-section">
                                <h3 class="ug-section-title">{section.number}. {section.title}</h3>
                                <ul class="ug-page-list">
                                    {section.pages.map(page => (
                                        <li>
                                            <a href={`/dashboard/user-guide/${section.slug}/${page.slug}`}>
                                                <span class="ug-page-number">{page.number}</span> {page.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                            <p style="margin:0;color:#713f12;">Documentation is being loaded. Please refresh the page.</p>
                        </div>
                    )}
                </div>

                {/* Technical Docs */}
                <div class="docs-group" id="technical">
                    <h2>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#001e62" stroke-width="2">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                        </svg>
                        Technical Documentation
                    </h2>
                    <p class="group-desc">API documentation, architecture guides, and developer resources for contributors.</p>

                    {technicalDocs.length > 0 ? (
                        technicalDocs.map(doc => (
                            <a href={`/dashboard/technical/${doc.slug}`} class="doc-card">
                                <h3>{doc.title}</h3>
                                <p>{doc.description}</p>
                            </a>
                        ))
                    ) : (
                        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                            <p style="margin:0;color:#92400e;">Documentation is being loaded. Please refresh the page.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

// Focused list page for User Guide (sectioned)
export const DashboardUserGuideListPage: FC<{ sections: UserGuideSection[] }> = ({ sections }) => {
    const user = getCurrentUser();

    return (
        <Layout title="User Guide - Equalify Dashboard" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/dashboard" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Equalify Dashboard
                </a>

                <h1 style="font-size:32px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">User Guide</h1>
                <p style="color:#4b5563;margin:0 0 32px 0;font-size:16px;">Guides for end users on how to use Equalify effectively.</p>

                {sections.length > 0 ? (
                    sections.map(section => (
                        <div class="ug-section">
                            <h2 class="ug-section-title">{section.number}. {section.title}</h2>
                            <ul class="ug-page-list">
                                {section.pages.map(page => (
                                    <li>
                                        <a href={`/dashboard/user-guide/${section.slug}/${page.slug}`}>
                                            <span class="ug-page-number">{page.number}</span> {page.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                        <p style="margin:0;color:#713f12;">Documentation is being loaded. Please refresh the page.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Focused list page for Technical Documentation (flat)
export const DashboardTechnicalListPage: FC<{ docs: DocListItem[] }> = ({ docs }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Technical Documentation - Equalify Dashboard" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/dashboard" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Equalify Dashboard
                </a>

                <h1 style="font-size:32px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">Technical Documentation</h1>
                <p style="color:#4b5563;margin:0 0 32px 0;font-size:16px;">API documentation, architecture guides, and developer resources for contributors.</p>

                {docs.length > 0 ? (
                    docs.map(doc => (
                        <a href={`/dashboard/technical/${doc.slug}`} class="doc-card">
                            <h3>{doc.title}</h3>
                            <p>{doc.description}</p>
                        </a>
                    ))
                ) : (
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                        <p style="margin:0;color:#713f12;">Documentation is being loaded. Please refresh the page.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Single doc view (shared by both user-guide and technical docs)
export const DashboardDocPage: FC<{ doc: DocFile; section: string }> = ({ doc, section }) => {
    const user = getCurrentUser();
    const sectionLabel = section === 'user-guide' ? 'User Guide' : 'Technical Documentation';

    return (
        <Layout title={`${doc.title} - ${sectionLabel} - Equalify Dashboard`} styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href={`/dashboard/${section}`} class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to {sectionLabel}
                </a>

                <div class="doc-header">
                    <h1>{doc.title}</h1>
                    <a href={doc.html_url} class="edit-btn" rel="noopener" target="_blank">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit on GitHub
                    </a>
                </div>

                <div class="doc-content" dangerouslySetInnerHTML={{ __html: doc.content }} />
            </div>
        </Layout>
    );
};

// User guide page with TOC sidebar and prev/next nav
export const DashboardUserGuideDocPage: FC<{
    doc: DocFile;
    sections: UserGuideSection[];
    currentSectionSlug: string;
    currentPageSlug: string;
    prev: { sectionSlug: string; pageSlug: string; title: string } | null;
    next: { sectionSlug: string; pageSlug: string; title: string } | null;
}> = ({ doc, sections, currentSectionSlug, currentPageSlug, prev, next }) => {
    const user = getCurrentUser();

    return (
        <Layout title={`${doc.title} - User Guide - Equalify Dashboard`} styles={styles} user={user}>
            <div class="ug-doc-layout">
                {/* Sidebar TOC */}
                <aside class="ug-sidebar" aria-label="User guide navigation">
                    <div class="ug-sidebar-inner">
                        <a href="/dashboard/user-guide" class="ug-sidebar-title">User Guide</a>
                        {sections.map(section => (
                            <div class="ug-sidebar-section">
                                <div class="ug-sidebar-section-title">
                                    {section.number}. {section.title}
                                </div>
                                <ul>
                                    {section.pages.map(page => {
                                        const isActive = section.slug === currentSectionSlug && page.slug === currentPageSlug;
                                        return (
                                            <li>
                                                <a
                                                    href={`/dashboard/user-guide/${section.slug}/${page.slug}`}
                                                    class={isActive ? 'ug-sidebar-link ug-sidebar-link-active' : 'ug-sidebar-link'}
                                                    aria-current={isActive ? 'page' : undefined}
                                                >
                                                    <span class="ug-sidebar-page-num">{page.number}</span>
                                                    {page.title}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main content */}
                <article class="ug-doc-main">
                    <a href="/dashboard/user-guide" class="back-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to User Guide
                    </a>

                    <div class="doc-header">
                        <h1>{doc.title}</h1>
                        <a href={doc.html_url} class="edit-btn" rel="noopener" target="_blank">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit on GitHub
                        </a>
                    </div>

                    <div class="doc-content" dangerouslySetInnerHTML={{ __html: doc.content }} />

                    {/* Prev/Next navigation */}
                    <nav class="ug-pagination" aria-label="Page navigation">
                        {prev ? (
                            <a href={`/dashboard/user-guide/${prev.sectionSlug}/${prev.pageSlug}`} class="ug-pagination-link ug-pagination-prev">
                                <span class="ug-pagination-label">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                                    </svg>
                                    Previous
                                </span>
                                <span class="ug-pagination-title">{prev.title}</span>
                            </a>
                        ) : <span></span>}
                        {next ? (
                            <a href={`/dashboard/user-guide/${next.sectionSlug}/${next.pageSlug}`} class="ug-pagination-link ug-pagination-next">
                                <span class="ug-pagination-label">
                                    Next
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </span>
                                <span class="ug-pagination-title">{next.title}</span>
                            </a>
                        ) : <span></span>}
                    </nav>
                </article>
            </div>
        </Layout>
    );
};

// Fetch docs helper (flat folder)
async function fetchDocList(folder: string, metadata: Record<string, { title: string; description: string; order: number }>, token: string): Promise<DocListItem[]> {
    try {
        const contents = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/${folder}`,
            token
        );

        if (Array.isArray(contents)) {
            const mdFiles = contents.filter((f: any) => f.type === 'file' && f.name.endsWith('.md'));

            const docs: DocListItem[] = mdFiles.map((file: any) => {
                const meta = metadata[file.name] || {
                    title: file.name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    description: 'Documentation for Equalify.',
                    order: 999,
                };
                return {
                    name: file.name,
                    slug: file.name.replace('.md', ''),
                    title: meta.title,
                    description: meta.description,
                };
            });

            docs.sort((a, b) => {
                const orderA = metadata[a.name]?.order ?? 999;
                const orderB = metadata[b.name]?.order ?? 999;
                return orderA - orderB;
            });

            return docs;
        }
    } catch (error) {
        console.error(`Error fetching ${folder} docs:`, error);
    }
    return [];
}

// Fetch user guide sections (nested folder structure: user/<section>/<page>.md)
async function fetchUserGuideSections(token: string): Promise<UserGuideSection[]> {
    try {
        const userContents = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user`,
            token
        );

        if (!Array.isArray(userContents)) return [];

        // Find folders matching the numbered pattern (skip non-numbered folders like "User Guide Images")
        const sectionFolders = userContents
            .filter((item: any) => item.type === 'dir' && /^\d+\.\s/.test(item.name))
            .sort((a: any, b: any) => compareByOrder(a.name, b.name));

        // Fetch each section's pages in parallel
        const sections: UserGuideSection[] = await Promise.all(
            sectionFolders.map(async (folder: any) => {
                const numberMatch = folder.name.match(/^(\d+)\./);
                const sectionNumber = numberMatch ? numberMatch[1] : '';
                const sectionTitle = stripNumberPrefix(folder.name);
                const sectionSlug = slugify(folder.name);

                let pages: UserGuidePage[] = [];
                try {
                    const folderContents = await fetchGitHub(
                        `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user/${encodeURIComponent(folder.name)}`,
                        token
                    );
                    if (Array.isArray(folderContents)) {
                        pages = folderContents
                            .filter((f: any) => f.type === 'file' && f.name.endsWith('.md'))
                            .sort((a: any, b: any) => compareByOrder(a.name, b.name))
                            .map((f: any) => {
                                const pageNumMatch = f.name.match(/^(\d+(?:\.\d+)?)/);
                                return {
                                    name: f.name,
                                    slug: slugify(f.name),
                                    title: stripNumberPrefix(f.name),
                                    number: pageNumMatch ? pageNumMatch[1] : '',
                                };
                            });
                    }
                } catch (error) {
                    console.error(`Error fetching pages for ${folder.name}:`, error);
                }

                return {
                    name: folder.name,
                    slug: sectionSlug,
                    title: sectionTitle,
                    number: sectionNumber,
                    pages,
                };
            })
        );

        return sections;
    } catch (error) {
        console.error('Error fetching user guide sections:', error);
        return [];
    }
}

// Find the original folder/file name in equalify-docs that matches a given slug
async function resolveUserGuidePath(sectionSlug: string, pageSlug: string, token: string): Promise<{ sectionName: string; pageName: string } | null> {
    try {
        const userContents = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user`,
            token
        );
        if (!Array.isArray(userContents)) return null;

        const sectionFolder = userContents.find((item: any) =>
            item.type === 'dir' && slugify(item.name) === sectionSlug
        );
        if (!sectionFolder) return null;

        const folderContents = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user/${encodeURIComponent(sectionFolder.name)}`,
            token
        );
        if (!Array.isArray(folderContents)) return null;

        const pageFile = folderContents.find((f: any) =>
            f.type === 'file' && f.name.endsWith('.md') && slugify(f.name) === pageSlug
        );
        if (!pageFile) return null;

        return { sectionName: sectionFolder.name, pageName: pageFile.name };
    } catch (error) {
        console.error('Error resolving user guide path:', error);
        return null;
    }
}

// Handler for landing page
export async function dashboardHandler(c: Context) {
    const token = getGitHubToken();

    const [userSections, technicalDocs] = await Promise.all([
        fetchUserGuideSections(token),
        fetchDocList('technical', technicalDocMetadata, token),
    ]);

    return c.html(<DashboardPage userSections={userSections} technicalDocs={technicalDocs} />);
}

// Handler for the focused User Guide list page
export async function dashboardUserGuideListHandler(c: Context) {
    const token = getGitHubToken();
    const sections = await fetchUserGuideSections(token);
    return c.html(<DashboardUserGuideListPage sections={sections} />);
}

// Handler for the focused Technical Documentation list page
export async function dashboardTechnicalListHandler(c: Context) {
    const token = getGitHubToken();
    const docs = await fetchDocList('technical', technicalDocMetadata, token);
    return c.html(<DashboardTechnicalListPage docs={docs} />);
}

// Handler for individual user-guide page (nested URL: /dashboard/user-guide/:section/:page)
export async function dashboardUserGuideDocHandler(c: Context) {
    const sectionSlug = c.req.param('section');
    const pageSlug = c.req.param('page');
    const token = getGitHubToken();

    if (!sectionSlug || !pageSlug) {
        return c.redirect('/dashboard/user-guide');
    }

    try {
        // Fetch sections (for sidebar TOC + prev/next) and the requested file in parallel
        const sections = await fetchUserGuideSections(token);

        // Find the requested section/page
        const section = sections.find(s => s.slug === sectionSlug);
        const page = section?.pages.find(p => p.slug === pageSlug);
        if (!section || !page) {
            return c.redirect('/dashboard/user-guide');
        }

        const fileData = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user/${encodeURIComponent(section.name)}/${encodeURIComponent(page.name)}`,
            token
        );

        if (!fileData || !fileData.content) {
            return c.redirect('/dashboard/user-guide');
        }

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const doc: DocFile = {
            name: page.name,
            title: page.title,
            content: renderMarkdown(content),
            html_url: fileData.html_url,
        };

        // Flatten all pages across sections to compute prev/next
        const flat: { sectionSlug: string; pageSlug: string; title: string }[] = [];
        for (const s of sections) {
            for (const p of s.pages) {
                flat.push({ sectionSlug: s.slug, pageSlug: p.slug, title: p.title });
            }
        }
        const currentIndex = flat.findIndex(p => p.sectionSlug === sectionSlug && p.pageSlug === pageSlug);
        const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
        const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

        return c.html(
            <DashboardUserGuideDocPage
                doc={doc}
                sections={sections}
                currentSectionSlug={sectionSlug}
                currentPageSlug={pageSlug}
                prev={prev}
                next={next}
            />
        );
    } catch (error) {
        console.error('Error fetching user guide doc:', error);
    }

    return c.redirect('/dashboard/user-guide');
}

// Handler for individual technical doc
export async function dashboardTechnicalDocHandler(c: Context) {
    const slug = c.req.param('slug');
    const token = getGitHubToken();
    const filename = `${slug}.md`;

    try {
        const fileData = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/technical/${filename}`,
            token
        );

        if (fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const meta = technicalDocMetadata[filename] || {
                title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            };

            const doc: DocFile = {
                name: filename,
                title: meta.title,
                content: renderMarkdown(content),
                html_url: fileData.html_url,
            };

            return c.html(<DashboardDocPage doc={doc} section="technical" />);
        }
    } catch (error) {
        console.error('Error fetching technical doc:', error);
    }

    return c.redirect('/dashboard');
}
