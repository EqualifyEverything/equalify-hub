import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';

const styles = `
/* Reflow cards */
.reflow-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.2s;
    text-decoration: none;
    display: block;
}
.reflow-card:hover {
    border-color: #C8102E;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.reflow-card h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #C8102E;
}
.reflow-card p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
}
.reflow-card .reflow-date {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 8px;
    opacity: 0.8;
}

/* Single reflow doc view */
.reflow-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
}
.reflow-header h1 {
    margin: 0;
    font-size: 28px;
    color: var(--color-text);
}
.back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-secondary);
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
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;
}
.edit-btn:hover {
    border-color: #C8102E;
    color: #C8102E;
}
.reflow-meta {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
}
.reflow-content {
    color: var(--color-text);
    line-height: 1.7;
}
.reflow-content h1 { font-size: 24px; margin: 24px 0 16px; color: var(--color-text); }
.reflow-content h2 { font-size: 20px; margin: 24px 0 12px; color: var(--color-text); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
.reflow-content h3 { font-size: 16px; margin: 20px 0 10px; color: var(--color-text); }
.reflow-content p { margin: 0 0 16px; }
.reflow-content ul, .reflow-content ol { margin: 0 0 16px; padding-left: 24px; }
.reflow-content li { margin: 4px 0; }
.reflow-content code { background: var(--color-bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.reflow-content pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 0 0 16px; }
.reflow-content pre code { background: none; padding: 0; color: inherit; }
.reflow-content blockquote { border-left: 4px solid #C8102E; margin: 0 0 16px; padding: 12px 16px; background: var(--color-bg-secondary); color: var(--color-text-secondary); }
.reflow-content table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.reflow-content th, .reflow-content td { border: 1px solid var(--color-border); padding: 8px 12px; text-align: left; }
.reflow-content th { background: var(--color-bg-secondary); font-weight: 600; }
.reflow-content a { color: #C8102E; }
.reflow-content img { max-width: 100%; border-radius: 6px; }
.reflow-content strong { color: var(--color-text); }
`;

interface ReflowListItem {
    name: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    dateFormatted: string;
}

interface ReflowFile {
    name: string;
    title: string;
    author: string;
    date: string;
    dateFormatted: string;
    content: string;
    html_url: string;
}

interface Frontmatter {
    title: string;
    date: string;
    dateFormatted: string;
    description: string;
    author: string;
}

// Parse YAML frontmatter from markdown content
function parseFrontmatter(content: string, fallbackTitle: string): { frontmatter: Frontmatter; body: string } {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    let frontmatter: Frontmatter = {
        title: fallbackTitle,
        date: '',
        dateFormatted: '',
        description: '',
        author: ''
    };
    let body = content;

    if (frontmatterMatch) {
        const yaml = frontmatterMatch[1];
        body = frontmatterMatch[2];

        const titleMatch = yaml.match(/^title:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (titleMatch) {
            frontmatter.title = titleMatch[1].trim();
        }

        const dateMatch = yaml.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m);
        if (dateMatch) {
            frontmatter.date = dateMatch[1];
            const dateObj = new Date(dateMatch[1] + 'T00:00:00');
            frontmatter.dateFormatted = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        const descMatch = yaml.match(/^description:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (descMatch) {
            frontmatter.description = descMatch[1].trim();
        }

        const authorMatch = yaml.match(/^author:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (authorMatch) {
            frontmatter.author = authorMatch[1].trim();
        }
    } else {
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
            frontmatter.title = h1Match[1].trim();
        }
    }

    return { frontmatter, body };
}

// Convert filename to fallback title
function filenameToTitle(filename: string): string {
    return filename
        .replace('.md', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// List view - shows all reflow docs as clickable cards
export const ReflowListPage: FC<{ docs: ReflowListItem[] }> = ({ docs }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Reflow - Equalify Hub" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <h1 style="font-size:32px;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">Reflow</h1>
                <p style="color:var(--color-text-secondary);margin:0 0 32px 0;font-size:16px;">
                    Documentation for Reflow, the PDF accessibility converter.
                </p>

                {docs.length > 0 ? (
                    docs.map(doc => (
                        <a href={`/reflow/${doc.slug}`} class="reflow-card">
                            <h3>{doc.title}</h3>
                            {doc.description && (
                                <p>{doc.description}</p>
                            )}
                            {doc.dateFormatted && (
                                <div class="reflow-date">{doc.dateFormatted}</div>
                            )}
                        </a>
                    ))
                ) : (
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                        <p style="margin:0;color:#92400e;">No Reflow documentation available yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Single doc view - shows one reflow doc's content
export const ReflowDocPage: FC<{ doc: ReflowFile }> = ({ doc }) => {
    const user = getCurrentUser();

    return (
        <Layout title={`${doc.title} - Reflow - Equalify Hub`} styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/reflow" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Reflow
                </a>

                <div class="reflow-header">
                    <h1>{doc.title}</h1>
                    <a href={doc.html_url} class="edit-btn" rel="noopener" target="_blank">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit on GitHub
                    </a>
                </div>

                {(doc.dateFormatted || doc.author) && (
                    <div class="reflow-meta">
                        {doc.dateFormatted && <>Published {doc.dateFormatted}</>}
                        {doc.dateFormatted && doc.author && <> · </>}
                        {doc.author && <>By {doc.author}</>}
                    </div>
                )}

                <div class="reflow-content" dangerouslySetInnerHTML={{ __html: doc.content }} />
            </div>
        </Layout>
    );
};

// Handler for list view
export async function reflowHandler(c: Context) {
    const token = getGitHubToken();

    let docs: ReflowListItem[] = [];
    try {
        const contents = await fetchGitHub(
            'https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/reflow',
            token
        );

        if (Array.isArray(contents)) {
            const mdFiles = contents.filter((f: any) => f.name.endsWith('.md'));

            const docPromises = mdFiles.map(async (file: any) => {
                try {
                    const fileData = await fetchGitHub(
                        `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/reflow/${file.name}`,
                        token
                    );

                    if (fileData && fileData.content) {
                        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                        const fallbackTitle = filenameToTitle(file.name);
                        const { frontmatter } = parseFrontmatter(content, fallbackTitle);

                        return {
                            name: file.name,
                            slug: file.name.replace('.md', ''),
                            title: frontmatter.title,
                            description: frontmatter.description,
                            author: frontmatter.author,
                            date: frontmatter.date,
                            dateFormatted: frontmatter.dateFormatted
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching ${file.name}:`, error);
                }

                const fallbackTitle = filenameToTitle(file.name);
                return {
                    name: file.name,
                    slug: file.name.replace('.md', ''),
                    title: fallbackTitle,
                    description: '',
                    author: '',
                    date: '',
                    dateFormatted: ''
                };
            });

            docs = await Promise.all(docPromises);

            // Sort by date descending (newest first), files without dates go last
            docs.sort((a, b) => {
                if (!a.date && !b.date) return a.title.localeCompare(b.title);
                if (!a.date) return 1;
                if (!b.date) return -1;
                return b.date.localeCompare(a.date);
            });
        }
    } catch (error) {
        console.error('Error fetching reflow docs:', error);
    }

    return c.html(<ReflowListPage docs={docs} />);
}

// Handler for single doc view
export async function reflowDocHandler(c: Context) {
    const slug = c.req.param('slug');
    const token = getGitHubToken();
    const filename = `${slug}.md`;

    try {
        const fileData = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/reflow/${filename}`,
            token
        );

        if (fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const fallbackTitle = filenameToTitle(filename);
            const { frontmatter, body } = parseFrontmatter(content, fallbackTitle);

            const doc: ReflowFile = {
                name: filename,
                title: frontmatter.title,
                author: frontmatter.author,
                date: frontmatter.date,
                dateFormatted: frontmatter.dateFormatted,
                content: renderMarkdown(body),
                html_url: fileData.html_url
            };

            return c.html(<ReflowDocPage doc={doc} />);
        }
    } catch (error) {
        console.error('Error fetching reflow doc:', error);
    }

    // Doc not found - redirect to list
    return c.redirect('/reflow');
}
