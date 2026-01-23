import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

const styles = `
/* Doc cards */
.doc-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    transition: border-color 0.2s;
}
.doc-card:hover {
    border-color: #C8102E;
}
.doc-card h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #1f2937;
}
.doc-card h3 a {
    color: #C8102E;
    text-decoration: none;
}
.doc-card h3 a:hover {
    text-decoration: underline;
}
.doc-card p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}
.doc-card .meta {
    margin-top: 12px;
    font-size: 12px;
    color: #9ca3af;
}
`;

export const TechnicalDocsPage: FC = () => {
    const user = getCurrentUser();
    
    return (
        <Layout title="Technical Docs - Equalify Hub" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <h1 style="font-size:32px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">⚙️ Technical Documentation</h1>
                <p style="color:#6b7280;margin:0 0 32px 0;font-size:16px;">
                    API documentation, architecture guides, and developer resources for contributors.
                </p>
                
                <div class="doc-card">
                    <h3><a href="/technical-docs/api">API Reference</a></h3>
                    <p>Complete REST API documentation with authentication, endpoints, and code examples.</p>
                    <div class="meta">Reference · OpenAPI 3.0</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/technical-docs/architecture">Architecture Overview</a></h3>
                    <p>System design, cloud infrastructure, and how the major components interact.</p>
                    <div class="meta">Technical · Diagrams included</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/technical-docs/contributing">Contributing Guide</a></h3>
                    <p>How to set up your development environment, coding standards, and PR guidelines.</p>
                    <div class="meta">Getting Started · 20 min read</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/technical-docs/deployment">Deployment Guide</a></h3>
                    <p>Self-hosting Equalify, AWS configuration, and production best practices.</p>
                    <div class="meta">DevOps · Advanced</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/technical-docs/testing">Testing A11y Services</a></h3>
                    <p>How Equalify integrates with axe-core, WAVE, and other accessibility testing engines.</p>
                    <div class="meta">Technical · Integration</div>
                </div>
                
                <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin-top:24px;">
                    <strong style="color:#1e40af;">💻 Quick Links</strong>
                    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:12px;">
                        <a href="https://github.com/EqualifyEverything/equalify" style="color:#1e40af;font-size:14px;">
                            GitHub Repo →
                        </a>
                        <a href="https://github.com/EqualifyEverything/equalify/issues" style="color:#1e40af;font-size:14px;">
                            Open Issues →
                        </a>
                        <a href="https://github.com/EqualifyEverything/equalify/pulls" style="color:#1e40af;font-size:14px;">
                            Pull Requests →
                        </a>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
