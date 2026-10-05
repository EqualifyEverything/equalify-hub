import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

const styles = `
/* Hero */
.iris-hero {
    background: #001e62;
    color: #ffffff;
    padding: 64px 24px;
    text-align: center;
}
.iris-hero h1 {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 16px;
    color: #ffffff;
}
.iris-hero .tagline {
    font-size: 20px;
    color: #ffffff;
    max-width: 700px;
    margin: 0 auto 32px;
    line-height: 1.5;
}
.iris-hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}
.iris-hero-buttons a {
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
.iris-section {
    padding: 64px 24px;
    max-width: 900px;
    margin: 0 auto;
}
.iris-section h2 {
    font-size: 28px;
    font-weight: 700;
    color: #001e62;
    text-align: center;
    margin: 0 0 12px;
}
.iris-section .section-desc {
    text-align: center;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto 40px;
    line-height: 1.6;
}

/* Try Equalify Iris Today */
#try {
    scroll-margin-top: 120px; /* clear the sticky header when jumped to from the hero */
}
.platform-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
}
.platform-banner {
    background: #001e62;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}
.platform-banner h3 {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
}
.live-pill {
    background: #047857; /* 5.5:1 against white text */
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 999px;
}
.platform-body {
    padding: 24px;
}
.platform-steps {
    margin: 0 0 24px;
    padding-left: 24px;
    list-style: decimal;
}
.platform-steps li {
    font-size: 15px;
    color: #1f2937;
    line-height: 1.6;
    margin: 0 0 10px;
    padding-left: 4px;
}
.platform-steps li::marker {
    color: #C8102E;
    font-weight: 700;
}
.iris-callout {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-left: 4px solid #001e62;
    border-radius: 8px;
    padding: 16px 20px;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
    margin: 0;
}
.iris-callout a {
    color: #C8102E;
    font-weight: 600;
}
.iris-callout-standalone {
    margin-top: 20px;
    border-left-color: #C8102E;
    font-size: 15px;
    padding: 20px 24px;
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
`;

export const IrisPage: FC = () => {
    const user = getCurrentUser();

    return (
        <Layout title="Iris - Equalify Hub" styles={styles} user={user} product="iris">
            {/* Hero */}
            <section class="iris-hero">
                <h1>Equalify Iris</h1>
                <p class="tagline">
                    Efficient, Automated PDF Accessibility Tagging
                </p>
                <div class="iris-hero-buttons">
                    <a href="#try" class="btn-primary">
                        Try Iris
                    </a>
                    <a href="https://github.com/EqualifyEverything/equalify-iris" class="btn-secondary" rel="noopener" target="_blank">
                        View on GitHub
                    </a>
                </div>
            </section>

            {/* Where Iris is live today */}
            <section id="try" class="iris-section">
                <h2>Try Equalify Iris Today</h2>
                <p class="section-desc">
                    Wherever you upload or edit PDFs, Equalify Iris aims to be.
                    Currently live in: <strong style="white-space:nowrap;">Red Multisite</strong>.
                </p>

                <div class="platform-card">
                    <div class="platform-banner">
                        <h3>Red Multisite</h3>
                        <span class="live-pill">Live</span>
                    </div>
                    <div class="platform-body">
                        <ol class="platform-steps">
                            <li>Log in to Red Multisite.</li>
                            <li>Click the <strong>Equalify Iris</strong> tab in the WordPress dashboard.</li>
                            <li>Select <strong>"Add accessibility tags to every PDF visitors can reach."</strong></li>
                            <li>Equalify Iris will run in the background, tagging any publicly accessible PDF.</li>
                        </ol>
                        <p class="iris-callout">
                            Don't know what Red is?{' '}
                            <a href="https://red.uic.edu/help/red-tutorial/what-is-red/" rel="noopener" target="_blank">Find out more</a>
                        </p>
                    </div>
                </div>

                <p class="iris-callout iris-callout-standalone">
                    <strong>Want to use automated PDF tagging elsewhere?</strong>{' '}
                    <a href="mailto:equalify@uic.edu">Get in touch</a> to request an Equalify Iris integration.
                </p>
            </section>

            {/* Open Source & Partnership */}
            <section class="iris-section" style="padding-top:0;">
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
                        <h3>Phase 2: Sustainers</h3>
                        <p>Early access, roadmap influence, pressure-testing across document types.</p>
                    </div>
                    <div class="phase-card">
                        <h3>Phase 3: Public</h3>
                        <p>AGPL license — adopt, run, improve, contribute back.</p>
                    </div>
                </div>
                <div class="partner-cta">
                    <h3>Sustainers get: Early access + Roadmap commenting</h3>
                    <p>We need accessibility experts, institutions with real document collections, and practitioners who understand day-to-day remediation. Sustaining institutions join monthly roadmap meetings and get direct access to the core engineers.</p>
                    <a href="/sustainers">Become a Sustainer</a>
                </div>
            </section>
        </Layout>
    );
};

export async function irisHandler(c: Context) {
    return c.html(<IrisPage />);
}
