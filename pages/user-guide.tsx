import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';

const styles = `
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
.doc-content ul, .doc-content ol { margin: 0 0 16px; padding-left: 24px; }
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

// Map filenames to friendly titles and descriptions
const docMetadata: Record<string, { title: string; description: string; order: number }> = {
    'getting-started.md': {
        title: 'Getting Started',
        description: 'Learn how to set up your account and get started with Equalify.',
        order: 1
    },
    'general-guide.md': {
        title: 'General Guide',
        description: 'Overview of Equalify features and how to use the platform.',
        order: 2
    },
    'managing-audits.md': {
        title: 'Managing Audits',
        description: 'How to create, run, and manage accessibility audits.',
        order: 3
    },
    'understanding-blockers.md': {
        title: 'Understanding Blockers',
        description: 'Learn about accessibility blockers and how to resolve them.',
        order: 4
    },
    'compliance-and-logs.md': {
        title: 'Compliance and Logs',
        description: 'Track compliance status and review audit logs.',
        order: 5
    },
    'notifications-and-sharing.md': {
        title: 'Notifications and Sharing',
        description: 'Set up notifications and share reports with your team.',
        order: 6
    },
    'technical-support.md': {
        title: 'Technical Support',
        description: 'Get help and support for technical issues.',
        order: 7
    }
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

// List view - shows all docs as clickable cards
export const UserGuideListPage: FC<{ docs: DocListItem[] }> = ({ docs }) => {
    const user = getCurrentUser();
    
    return (
        <Layout title="User Guide - Equalify Hub" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <h1 style="font-size:32px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">📖 User Guide</h1>
                <p style="color:#6b7280;margin:0 0 32px 0;font-size:16px;">
                    Guides for end users on how to use Equalify effectively.
                </p>
                
                {docs.length > 0 ? (
                    docs.map(doc => (
                        <a href={`/user-guide/${doc.slug}`} class="doc-card">
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
        </Layout>
    );
};

// Single doc view - shows one doc's content
export const UserGuideDocPage: FC<{ doc: DocFile }> = ({ doc }) => {
    const user = getCurrentUser();
    
    return (
        <Layout title={`${doc.title} - User Guide - Equalify Hub`} styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/user-guide" class="back-link">
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
            </div>
        </Layout>
    );
};

// Handler for list view
export async function userGuideHandler(c: Context) {
    const token = getGitHubToken();
    
    let docs: DocListItem[] = [];
    try {
        const contents = await fetchGitHub(
            'https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/user',
            token
        );
        
        if (Array.isArray(contents)) {
            const mdFiles = contents.filter((f: any) => f.name.endsWith('.md'));
            
            docs = mdFiles.map((file: any) => {
                const meta = docMetadata[file.name] || {
                    title: file.name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    description: 'Documentation for Equalify.',
                    order: 999
                };
                return {
                    name: file.name,
                    slug: file.name.replace('.md', ''),
                    title: meta.title,
                    description: meta.description
                };
            });
            
            // Sort by order
            docs.sort((a, b) => {
                const orderA = docMetadata[a.name]?.order ?? 999;
                const orderB = docMetadata[b.name]?.order ?? 999;
                return orderA - orderB;
            });
        }
    } catch (error) {
        console.error('Error fetching user docs:', error);
    }
    
    return c.html(<UserGuideListPage docs={docs} />);
}

// Handler for single doc view
export async function userGuideDocHandler(c: Context) {
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
            const meta = docMetadata[filename] || {
                title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
            };
            
            const doc: DocFile = {
                name: filename,
                title: meta.title,
                content: renderMarkdown(content),
                html_url: fileData.html_url
            };
            
            return c.html(<UserGuideDocPage doc={doc} />);
        }
    } catch (error) {
        console.error('Error fetching doc:', error);
    }
    
    // Doc not found - redirect to list
    return c.redirect('/user-guide');
}
