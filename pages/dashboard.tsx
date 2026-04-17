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
`;

// User guide doc metadata
const userGuideMetadata: Record<string, { title: string; description: string; order: number }> = {
    'getting-started.md': { title: 'Getting Started', description: 'Learn how to set up your account and get started with Equalify.', order: 1 },
    'general-guide.md': { title: 'General Guide', description: 'Overview of Equalify features and how to use the platform.', order: 2 },
    'managing-audits.md': { title: 'Managing Audits', description: 'How to create, run, and manage accessibility audits.', order: 3 },
    'understanding-blockers.md': { title: 'Understanding Blockers', description: 'Learn about accessibility blockers and how to resolve them.', order: 4 },
    'compliance-and-logs.md': { title: 'Compliance and Logs', description: 'Track compliance status and review audit logs.', order: 5 },
    'notifications-and-sharing.md': { title: 'Notifications and Sharing', description: 'Set up notifications and share reports with your team.', order: 6 },
    'user-roles.md': { title: 'User Roles and Permissions', description: 'Understand admin and user roles, teams, and data access.', order: 7 },
    'technical-support.md': { title: 'Technical Support', description: 'Get help and support for technical issues.', order: 8 },
};

// Technical doc metadata
const technicalDocMetadata: Record<string, { title: string; description: string; order: number }> = {
    'architecture.md': { title: 'Architecture Overview', description: 'System design, cloud infrastructure, and how major components interact.', order: 1 },
    'api-reference.md': { title: 'API Reference', description: 'Complete REST API documentation with authentication, endpoints, and examples.', order: 2 },
    'contributing.md': { title: 'Contributing Guide', description: 'How to set up your development environment, coding standards, and PR guidelines.', order: 3 },
    'deployment.md': { title: 'Deployment Guide', description: 'Self-hosting Equalify, AWS configuration, and production best practices.', order: 4 },
    'testing.md': { title: 'Testing Guide', description: 'How Equalify integrates with axe-core, WAVE, and other accessibility testing engines.', order: 5 },
};

interface DocListItem {
    name: string;
    slug: string;
    title: string;
    description: string;
}

interface DocFile {
    name: string;
    title: string;
    content: string;
    html_url: string;
}

// Landing page with both doc sections
export const DashboardPage: FC<{ userDocs: DocListItem[]; technicalDocs: DocListItem[] }> = ({ userDocs, technicalDocs }) => {
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

                    {userDocs.length > 0 ? (
                        userDocs.map(doc => (
                            <a href={`/dashboard/user-guide/${doc.slug}`} class="doc-card">
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

// Single doc view (shared by both user-guide and technical docs)
export const DashboardDocPage: FC<{ doc: DocFile; section: string }> = ({ doc, section }) => {
    const user = getCurrentUser();
    const sectionLabel = section === 'user-guide' ? 'User Guide' : 'Technical Documentation';

    return (
        <Layout title={`${doc.title} - ${sectionLabel} - Equalify Dashboard`} styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/dashboard" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Equalify Dashboard
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

// Fetch docs helper
async function fetchDocList(folder: string, metadata: Record<string, { title: string; description: string; order: number }>, token: string): Promise<DocListItem[]> {
    try {
        const contents = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/${folder}`,
            token
        );

        if (Array.isArray(contents)) {
            const mdFiles = contents.filter((f: any) => f.name.endsWith('.md'));

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

// Handler for landing page
export async function dashboardHandler(c: Context) {
    const token = getGitHubToken();

    const [userDocs, technicalDocs] = await Promise.all([
        fetchDocList('user', userGuideMetadata, token),
        fetchDocList('technical', technicalDocMetadata, token),
    ]);

    return c.html(<DashboardPage userDocs={userDocs} technicalDocs={technicalDocs} />);
}

// Handler for individual user-guide doc
export async function dashboardUserGuideDocHandler(c: Context) {
    const slug = c.req.param('slug');
    const token = getGitHubToken();
    const filename = `${slug}.md`;

    try {
        const fileData = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user/${filename}`,
            token
        );

        if (fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const meta = userGuideMetadata[filename] || {
                title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            };

            const doc: DocFile = {
                name: filename,
                title: meta.title,
                content: renderMarkdown(content),
                html_url: fileData.html_url,
            };

            return c.html(<DashboardDocPage doc={doc} section="user-guide" />);
        }
    } catch (error) {
        console.error('Error fetching user guide doc:', error);
    }

    return c.redirect('/dashboard');
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
