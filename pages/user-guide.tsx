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

export const UserGuidePage: FC = () => {
    const user = getCurrentUser();
    
    return (
        <Layout title="User Guide - Equalify Hub" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <h1 style="font-size:32px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">📖 User Guide</h1>
                <p style="color:#6b7280;margin:0 0 32px 0;font-size:16px;">
                    Guides for end users on how to use Equalify effectively. Maintained by Helen's team.
                </p>
                
                <div class="doc-card">
                    <h3><a href="/user-guide/getting-started">Getting Started with Equalify</a></h3>
                    <p>Learn how to set up your account, configure your first scan, and understand your results.</p>
                    <div class="meta">Beginner · 10 min read</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/user-guide/scanning">Running Accessibility Scans</a></h3>
                    <p>How to scan websites for accessibility issues, configure scan settings, and schedule recurring scans.</p>
                    <div class="meta">Beginner · 8 min read</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/user-guide/reports">Understanding Reports</a></h3>
                    <p>How to read and interpret Equalify reports, export data, and share findings with your team.</p>
                    <div class="meta">Intermediate · 12 min read</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/user-guide/integrations">Integrations & Workflows</a></h3>
                    <p>Connect Equalify with your existing tools like Jira, Slack, and CI/CD pipelines.</p>
                    <div class="meta">Advanced · 15 min read</div>
                </div>
                
                <div class="doc-card">
                    <h3><a href="/user-guide/faq">Frequently Asked Questions</a></h3>
                    <p>Common questions about Equalify, accessibility testing, and WCAG compliance.</p>
                    <div class="meta">Reference</div>
                </div>
                
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:24px;">
                    <strong style="color:#166534;">📝 Want to contribute?</strong>
                    <p style="margin:8px 0 0 0;font-size:14px;color:#166534;">
                        User documentation is maintained in Markdown. 
                        <a href="https://github.com/EqualifyEverything/docs/tree/main/user" style="color:#166534;text-decoration:underline;">
                            Edit on GitHub →
                        </a>
                    </p>
                </div>
            </div>
        </Layout>
    );
};
