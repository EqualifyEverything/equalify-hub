import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';

const styles = `
/* Hero */
.reflow-hero {
    background: linear-gradient(135deg, #001e62 0%, #001845 100%);
    color: #ffffff;
    padding: 64px 24px;
    text-align: center;
}
.reflow-hero h1 {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 16px;
}
.reflow-hero .tagline {
    font-size: 20px;
    color: rgba(255,255,255,0.85);
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
    background: rgba(255,255,255,0.1);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.2);
}
.btn-secondary:hover { background: rgba(255,255,255,0.2); }

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
.reflow-section-alt {
    background: #f8f9fa;
}

/* Stats */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    text-align: center;
}
@media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
}
.stat-value {
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 4px;
}
.stat-value.blue { color: #001e62; }
.stat-value.red { color: #C8102E; }
.stat-label {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

/* Flow diagram */
.flow-diagram {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 40px;
}
.flow-card {
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    min-width: 150px;
}
.flow-card-dark {
    background: #001e62;
    color: #ffffff;
}
.flow-card-light {
    background: #ffffff;
    color: #1f2937;
    border: 2px solid #f59e0b;
}
.flow-card h3 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.flow-card p { font-size: 13px; opacity: 0.8; margin: 0; }
.flow-arrow {
    color: #C8102E;
    font-size: 24px;
    font-weight: 700;
}

/* Pipeline */
.pipeline-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
}
@media (max-width: 900px) {
    .pipeline-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
    .pipeline-grid { grid-template-columns: 1fr; }
}
.pipeline-card {
    text-align: center;
    padding: 20px 16px;
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}
.pipeline-stage {
    font-size: 11px;
    font-weight: 600;
    color: #C8102E;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 4px;
}
.pipeline-card h3 {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
}
.pipeline-card p {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

/* Economics */
.econ-section {
    background: linear-gradient(135deg, #001e62 0%, #001845 100%);
    color: #ffffff;
    padding: 64px 24px;
}
.econ-section h2 {
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin: 0 0 40px;
    color: #ffffff;
}
.econ-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    max-width: 700px;
    margin: 0 auto 24px;
}
@media (max-width: 600px) {
    .econ-grid { grid-template-columns: 1fr; }
}
.econ-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
}
.econ-card .label { font-size: 13px; color: #6b7280; margin: 0 0 8px; }
.econ-card .price { font-size: 32px; font-weight: 700; margin: 0 0 4px; }
.econ-card .price.red { color: #C8102E; }
.econ-card .price.blue { color: #001e62; }
.econ-card .total { font-size: 14px; color: #6b7280; margin: 0; }
.econ-card .note { font-size: 12px; color: #9ca3af; font-style: italic; margin: 4px 0 0; }
.econ-highlight {
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    color: #67e8f9;
    margin: 0 0 16px;
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

// List view - landing page + docs listing
export const ReflowListPage: FC<{ docs: ReflowListItem[] }> = ({ docs }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Reflow - Equalify Hub" styles={styles} user={user} product="reflow">
            {/* Hero */}
            <section class="reflow-hero">
                <h1>Equalify Reflow</h1>
                <p class="tagline">
                    Escaping static files into semantic freedom. An open-source pipeline that converts PDFs into accessible, reflowable content.
                </p>
                <div class="reflow-hero-buttons">
                    <a href="#docs" class="btn-primary">
                        Documentation
                    </a>
                    <a href="/signup/reflow" class="btn-secondary">
                        Become a Partner
                    </a>
                </div>
            </section>

            {/* The Problem */}
            <section class="reflow-section">
                <h2>The Problem</h2>
                <p class="section-desc">
                    PDFs are visual-first documents designed for print fidelity. Accessibility is bolted on after the fact, the spec is controlled by a private company, and every document update means redoing its tagging.
                </p>
                <div class="stats-grid">
                    <div>
                        <p class="stat-value blue">200,000+</p>
                        <p class="stat-label">PDFs uploaded at UIC in 2023 alone</p>
                    </div>
                    <div>
                        <p class="stat-value red">$5-12</p>
                        <p class="stat-label">per page for manual remediation</p>
                    </div>
                    <div>
                        <p class="stat-value blue">$1M+</p>
                        <p class="stat-label">annual cost at even the cheapest rate</p>
                    </div>
                </div>
            </section>

            {/* The Escape */}
            <div class="reflow-section-alt">
                <section class="reflow-section" style="padding-top:64px;padding-bottom:64px;">
                    <h2>The Escape</h2>
                    <p class="section-desc">
                        Stop fixing the container. Extract the content and rebuild it in a format that is natively accessible.
                    </p>
                    <div class="flow-diagram">
                        <div class="flow-card flow-card-dark">
                            <h3>PDF</h3>
                            <p>Visual-first</p>
                            <p>Print fidelity</p>
                        </div>
                        <span class="flow-arrow">&rarr;</span>
                        <div class="flow-card flow-card-light">
                            <h3>Markdown</h3>
                            <p>Semantic</p>
                            <p>Human-readable, open</p>
                        </div>
                        <span class="flow-arrow">&rarr;</span>
                        <div class="flow-card flow-card-dark">
                            <h3>HTML</h3>
                            <p>Accessible by</p>
                            <p>construction</p>
                        </div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;text-align:center;">
                        <p style="color:#4b5563;margin:0;line-height:1.6;">
                            <strong style="color:#001e62;">AI acting as a semantic translator.</strong> Multimodal AI models can process both images and text, giving them an understanding of visual language and the coding knowledge to express it as semantic structure. This means translating from a visual layout to accessible HTML is a natural fit for what these models already do.
                        </p>
                    </div>
                </section>
            </div>

            {/* The Pipeline */}
            <section class="reflow-section">
                <h2>The Pipeline</h2>
                <p class="section-desc">
                    Five stages, from raw PDF to reflowable, accessible content.
                </p>
                <div class="pipeline-grid">
                    <div class="pipeline-card">
                        <p class="pipeline-stage">Stage 1</p>
                        <h3>Docling Extraction</h3>
                        <p>IBM Docling handles the first pass using smaller, efficient models. Produces a first-pass markdown covering text blocks, tables, images, and reading order.</p>
                    </div>
                    <div class="pipeline-card">
                        <p class="pipeline-stage">Stage 2</p>
                        <h3>Structure Analysis</h3>
                        <p>Classifies the document type and flags key elements like columns, tables, and images. This context dynamically tunes how later stages process each page.</p>
                    </div>
                    <div class="pipeline-card">
                        <p class="pipeline-stage">Stage 3</p>
                        <h3>Headings First</h3>
                        <p>Heading hierarchy is the backbone of document accessibility. A dedicated pass infers heading levels from visual signals: size, weight, position, spacing.</p>
                    </div>
                    <div class="pipeline-card">
                        <p class="pipeline-stage">Stage 4</p>
                        <h3>The Translator</h3>
                        <p>A multimodal LLM compares each visual page to its markdown and makes tool-call edits with reasoning. Alt text and table tasks spawn specialist sub-agents.</p>
                    </div>
                    <div class="pipeline-card">
                        <p class="pipeline-stage">Stage 5</p>
                        <h3>Escape the Page</h3>
                        <p>Merges all pages into one document. AI fixes boundary artifacts — split words, broken tables and lists — producing reflowable, responsive content.</p>
                    </div>
                </div>
            </section>

            {/* The Economics */}
            <section class="econ-section">
                <h2>The Economics</h2>
                <div class="econ-grid">
                    <div class="econ-card">
                        <p class="label">Manual Remediation</p>
                        <p class="price red">$5-12 / page</p>
                        <p class="total">= $1,000,000+ annually</p>
                        <p class="note">Recurring cost. Resets with every update.</p>
                    </div>
                    <div class="econ-card">
                        <p class="label">Equalify Reflow</p>
                        <p class="price blue">~$0.20 / page</p>
                        <p class="total">= ~$40,000 annually</p>
                        <p class="note">Improves as models improve. Compounds.</p>
                    </div>
                </div>
                <p class="econ-highlight">25x cost reduction</p>
            </section>

            {/* Open Source & Partnership */}
            <section class="reflow-section">
                <h2>Open Source</h2>
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
                <p class="docs-subheading">Technical documentation and guides for Reflow.</p>

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
        <Layout title={`${doc.title} - Reflow - Equalify Hub`} styles={styles} user={user} product="reflow">
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
