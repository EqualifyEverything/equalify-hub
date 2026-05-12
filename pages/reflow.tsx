import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';

const styles = `
/* Hero */
.reflow-hero {
    background: #001e62;
    color: #ffffff;
    padding: 64px 24px;
    text-align: center;
}
.reflow-hero h1 {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 16px;
    color: #ffffff;
}
.reflow-hero .tagline {
    font-size: 20px;
    color: #ffffff;
    max-width: 700px;
    margin: 0 auto 32px;
    line-height: 1.5;
}
.reflow-hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}
.reflow-hero-buttons a {
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

/* Sections */
.reflow-section {
    padding: 64px 24px;
    max-width: 900px;
    margin: 0 auto;
}
.reflow-section h2 {
    font-size: 28px;
    font-weight: 700;
    color: #001e62;
    text-align: center;
    margin: 0 0 12px;
}
.reflow-section .section-desc {
    text-align: center;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto 40px;
    line-height: 1.6;
}
/* Phases */
.phases-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 40px;
}
@media (max-width: 600px) {
    .phases-grid { grid-template-columns: 1fr; }
}
.phase-card {
    text-align: center;
    padding: 24px;
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}
.phase-card h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
}
.phase-card p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}
.partner-cta {
    background: #001e62;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    color: #ffffff;
}
.partner-cta h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px;
}
.partner-cta p {
    font-size: 14px;
    color: rgba(255,255,255,0.75);
    margin: 0 0 16px;
    max-width: 550px;
    margin-left: auto;
    margin-right: auto;
}
.partner-cta a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #C8102E;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s;
}
.partner-cta a:hover { background: #a00d25; }

/* Docs heading */
.docs-heading {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
}
.docs-subheading {
    color: var(--color-text-secondary);
    margin: 0 0 24px;
    font-size: 15px;
}

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
    color: #4b5563;
    margin-top: 8px;
}

/* Category sections on the list */
.reflow-category {
    margin-top: 32px;
}
.reflow-category:first-of-type { margin-top: 0; }
.reflow-category-heading {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 4px;
}
.reflow-category-sub {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0 0 16px;
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
.reflow-crumb {
    font-size: 13px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
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
.reflow-content ul { margin: 0 0 16px; padding-left: 24px; list-style: disc; }
.reflow-content ol { margin: 0 0 16px; padding-left: 24px; list-style: decimal; }
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
    slug: string;          // path slug, e.g. "how-to/use-the-wordpress-plugin"
    category: string;      // top-level dir name, '' for root-level files
    title: string;
    description: string;
    author: string;
    date: string;
    dateFormatted: string;
}

interface ReflowCategory {
    key: string;           // folder name (or '' for root-level)
    label: string;         // display name
    description: string;   // one-line description
    docs: ReflowListItem[];
}

interface ReflowFile {
    name: string;
    title: string;
    author: string;
    date: string;
    dateFormatted: string;
    content: string;
    html_url: string;
    categoryLabel: string;  // display label for the crumb, '' if uncategorised
}

interface Frontmatter {
    title: string;
    date: string;
    dateFormatted: string;
    description: string;
    author: string;
}

// Category display config. Keys map to top-level folder names under
// `reflow/`; anything not listed here still renders — it just uses a
// generic title-cased label derived from the folder name.
const CATEGORY_CONFIG: Record<string, { label: string; description: string; order: number }> = {
    '': {
        label: 'Overview',
        description: 'Start here.',
        order: 0,
    },
    'tutorials': {
        label: 'Tutorials',
        description: 'Guided, hands-on walkthroughs for learning by doing.',
        order: 1,
    },
    'how-to': {
        label: 'How-to guides',
        description: 'Task recipes for specific jobs.',
        order: 2,
    },
    'reference': {
        label: 'Reference',
        description: 'Authoritative lookups — tables, endpoint shapes, options.',
        order: 3,
    },
    'explanation': {
        label: 'Explanation',
        description: 'Background, design rationale, and concepts.',
        order: 4,
    },
};

// Filenames we hide from the list view entirely (index / meta files).
const HIDDEN_FILENAMES = new Set(['README.md']);

// Which ref of equalify-docs to fetch. Defaults to `main`; override via
// the EQUALIFY_DOCS_REF env var when previewing a docs branch locally.
function getDocsRef(): string {
    return process.env.EQUALIFY_DOCS_REF || 'main';
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

// Convert filename or path-leaf to fallback title
function filenameToTitle(filename: string): string {
    return filename
        .replace('.md', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// Derive a display label for a category (folder name). Configured
// categories use their label; anything else gets title-cased.
function categoryLabel(key: string): string {
    if (CATEGORY_CONFIG[key]) return CATEGORY_CONFIG[key].label;
    if (!key) return 'Overview';
    return key.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function categoryDescription(key: string): string {
    return CATEGORY_CONFIG[key]?.description ?? '';
}

function categoryOrder(key: string): number {
    // Known keys get their configured order; unknown keys come after the
    // configured ones, alphabetised.
    return CATEGORY_CONFIG[key]?.order ?? 1000;
}

// List view - landing page + grouped docs listing
export const ReflowListPage: FC<{ categories: ReflowCategory[] }> = ({ categories }) => {
    const user = getCurrentUser();
    const hasAnyDocs = categories.some(c => c.docs.length > 0);

    return (
        <Layout title="Reflow - Equalify Hub" styles={styles} user={user} product="reflow">
            {/* Hero */}
            <section class="reflow-hero">
                <h1>Equalify Reflow</h1>
                <p class="tagline">
                    Escaping static files into semantic freedom. An open-source pipeline that converts PDFs into accessible, reflowable content.
                </p>
                <div class="reflow-hero-buttons">
                    <a href="https://reflow.equalify.uic.edu" class="btn-primary" rel="noopener" target="_blank">
                        Try Reflow (UIC Users Only)
                    </a>
                </div>
            </section>

            {/* Open Source & Partnership */}
            <section class="reflow-section">
                <h2>Open Source PDF Conversion</h2>
                <p class="section-desc">
                    Built in the open. Shaped by the community. Licensed under AGPL.
                    Supported by the <a href="https://osf.it.uic.edu/" style="color:#001e62;text-decoration:underline;">UIC Technology Solutions Open Source Fund</a>.
                </p>
                <div class="phases-grid">
                    <div class="phase-card">
                        <h3>Phase 1: UIC</h3>
                        <p>Tight feedback loops, real document collections, iterative improvement.</p>
                    </div>
                    <div class="phase-card">
                        <h3>Phase 2: Partners</h3>
                        <p>Early access, roadmap influence, pressure-testing across document types.</p>
                    </div>
                    <div class="phase-card">
                        <h3>Phase 3: Public</h3>
                        <p>AGPL license — adopt, run, improve, contribute back.</p>
                    </div>
                </div>
                <div class="partner-cta">
                    <h3>Partners get: Early access + Roadmap commenting</h3>
                    <p>We need accessibility experts, institutions with real document collections, and practitioners who understand day-to-day remediation.</p>
                    <a href="/signup/reflow">Sign Up for Early Access</a>
                </div>
            </section>

            {/* Documentation listing */}
            <div id="docs" class="reflow-section" style="padding-top:0;">
                <h2 class="docs-heading">Documentation</h2>
                <p class="docs-subheading">Pick the entry point that matches what you're trying to do.</p>

                {hasAnyDocs ? (
                    categories.map(category => (
                        category.docs.length > 0 ? (
                            <div class="reflow-category">
                                <h3 class="reflow-category-heading">{category.label}</h3>
                                {category.description && (
                                    <p class="reflow-category-sub">{category.description}</p>
                                )}
                                {category.docs.map(doc => (
                                    <a href={`/reflow/${doc.slug}`} class="reflow-card">
                                        <h3>{doc.title}</h3>
                                        {doc.description && (
                                            <p>{doc.description}</p>
                                        )}
                                        {doc.dateFormatted && (
                                            <div class="reflow-date">{doc.dateFormatted}</div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        ) : null
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
        <Layout title={`${doc.title} - Reflow - Equalify Hub`} styles={styles} user={user} product="reflow">
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/reflow" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Reflow
                </a>

                <div class="reflow-header">
                    <div>
                        {doc.categoryLabel && (
                            <div class="reflow-crumb">{doc.categoryLabel}</div>
                        )}
                        <h1>{doc.title}</h1>
                    </div>
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

// Fetch every .md file under reflow/ in one Git Trees API call (recursive),
// then enrich each with frontmatter via the Contents API (cached).
async function listReflowDocs(token: string | null): Promise<ReflowListItem[]> {
    // Git Trees API with recursive=1 returns every path in one shot.
    const tree = await fetchGitHub(
        `https://api.github.com/repos/EqualifyEverything/equalify-docs/git/trees/${getDocsRef()}?recursive=1`,
        token,
    );

    if (!tree || !Array.isArray(tree.tree)) return [];

    const blobs: Array<{ path: string }> = tree.tree
        .filter((item: any) =>
            item.type === 'blob' &&
            typeof item.path === 'string' &&
            item.path.startsWith('reflow/') &&
            item.path.endsWith('.md') &&
            !HIDDEN_FILENAMES.has(item.path.split('/').pop() as string)
        )
        .map((item: any) => ({ path: item.path as string }));

    const docPromises = blobs.map(async ({ path }) => {
        // Strip the `reflow/` prefix; everything after is the slug and
        // category info we need to render.
        const relative = path.slice('reflow/'.length);  // e.g. "how-to/use-the-wordpress-plugin.md"
        const lastSlash = relative.lastIndexOf('/');
        const category = lastSlash === -1 ? '' : relative.slice(0, lastSlash);
        const filename = lastSlash === -1 ? relative : relative.slice(lastSlash + 1);
        const slug = relative.replace(/\.md$/, '');  // URL-safe path slug
        const fallbackTitle = filenameToTitle(filename);

        try {
            const fileData = await fetchGitHub(
                `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/${path}?ref=${encodeURIComponent(getDocsRef())}`,
                token,
            );

            if (fileData && fileData.content) {
                const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                const { frontmatter } = parseFrontmatter(content, fallbackTitle);
                return {
                    name: filename,
                    slug,
                    category,
                    title: frontmatter.title,
                    description: frontmatter.description,
                    author: frontmatter.author,
                    date: frontmatter.date,
                    dateFormatted: frontmatter.dateFormatted,
                };
            }
        } catch (error) {
            console.error(`Error fetching ${path}:`, error);
        }

        return {
            name: filename,
            slug,
            category,
            title: fallbackTitle,
            description: '',
            author: '',
            date: '',
            dateFormatted: '',
        };
    });

    const docs = await Promise.all(docPromises);

    // Sort within each category: dated items by date descending, then by
    // title. Orphan date-less items go last, alphabetical.
    docs.sort((a, b) => {
        if (!a.date && !b.date) return a.title.localeCompare(b.title);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
    });

    return docs;
}

// Group a flat list of docs by top-level folder, respecting CATEGORY_CONFIG
// ordering for known keys and alphabetising unknown ones.
function groupIntoCategories(docs: ReflowListItem[]): ReflowCategory[] {
    const byKey = new Map<string, ReflowListItem[]>();
    for (const doc of docs) {
        const key = doc.category;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key)!.push(doc);
    }

    const keys = Array.from(byKey.keys());
    keys.sort((a, b) => {
        const oa = categoryOrder(a);
        const ob = categoryOrder(b);
        if (oa !== ob) return oa - ob;
        return a.localeCompare(b);
    });

    return keys.map(key => ({
        key,
        label: categoryLabel(key),
        description: categoryDescription(key),
        docs: byKey.get(key)!,
    }));
}

// Handler for list view
export async function reflowHandler(c: Context) {
    const token = getGitHubToken();

    let categories: ReflowCategory[] = [];
    try {
        const docs = await listReflowDocs(token);
        categories = groupIntoCategories(docs);
    } catch (error) {
        console.error('Error fetching reflow docs:', error);
    }

    return c.html(<ReflowListPage categories={categories} />);
}

// Handler for single doc view. Slug may be a nested path, e.g.
// "how-to/use-the-wordpress-plugin". Registered against the
// `/reflow/*` wildcard route (see app.tsx / dev.tsx).
export async function reflowDocHandler(c: Context) {
    // Pull the trailing path off `c.req.path` rather than trusting a
    // named parameter — matches the pattern used by the repo routes
    // (`/:owner/:repo/tree/:branch/*`).
    const rawSlug = c.req.path.replace(/^\/reflow\/?/, '').replace(/\/$/, '');
    // Decode once so humans can link to slugs with URI-encoded characters,
    // but stop short of re-decoding the result (avoid double-decode CVE shape).
    let slug: string;
    try {
        slug = decodeURIComponent(rawSlug);
    } catch {
        slug = rawSlug;
    }

    // Defend against traversal — slugs must not start with '/' or contain
    // '..' segments. If anything looks off, drop to the list view.
    if (!slug || slug.startsWith('/') || slug.split('/').some(seg => seg === '..' || seg === '.')) {
        return c.redirect('/reflow');
    }

    const token = getGitHubToken();
    const filename = `${slug}.md`;
    const lastSlash = slug.lastIndexOf('/');
    const category = lastSlash === -1 ? '' : slug.slice(0, lastSlash);
    const leafName = lastSlash === -1 ? slug : slug.slice(lastSlash + 1);

    try {
        const fileData = await fetchGitHub(
            `https://api.github.com/repos/EqualifyEverything/equalify-docs/contents/reflow/${filename}?ref=${encodeURIComponent(getDocsRef())}`,
            token,
        );

        if (fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const fallbackTitle = filenameToTitle(leafName);
            const { frontmatter, body } = parseFrontmatter(content, fallbackTitle);

            const doc: ReflowFile = {
                name: filename,
                title: frontmatter.title,
                author: frontmatter.author,
                date: frontmatter.date,
                dateFormatted: frontmatter.dateFormatted,
                content: renderMarkdown(body),
                html_url: fileData.html_url,
                categoryLabel: category ? categoryLabel(category) : '',
            };

            return c.html(<ReflowDocPage doc={doc} />);
        }
    } catch (error) {
        console.error('Error fetching reflow doc:', error);
    }

    // Doc not found - redirect to list
    return c.redirect('/reflow');
}
