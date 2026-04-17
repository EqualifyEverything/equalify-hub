import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

const styles = `
.about-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px 64px;
}
@media (max-width: 768px) {
    .about-container { padding: 32px 20px 48px; }
}
.about-container h1 {
    font-size: 36px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 20px;
}
.about-intro {
    font-size: 18px;
    line-height: 1.6;
    color: #1f2937;
    margin: 0 0 48px;
}

/* Roadmap section */
.roadmap-heading {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
    scroll-margin-top: 100px;
}
.roadmap-subheading {
    color: #4b5563;
    margin: 0 0 24px;
    font-size: 16px;
}

/* KPI cards */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
}
@media (max-width: 768px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
.kpi-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
}
.kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: #C8102E;
}
.kpi-label {
    font-size: 14px;
    color: #4b5563;
    margin-top: 4px;
}

/* Milestones */
.milestones-heading {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 32px 0 16px 0;
}
.roadmap-item {
    display: flex;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid #e5e7eb;
}
.roadmap-item:last-child { border-bottom: none; }
.roadmap-status {
    flex-shrink: 0;
    width: 100px;
    text-align: center;
}
.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}
.status-completed { background: #d1fae5; color: #065f46; }
.status-in-progress { background: #dbeafe; color: #1e40af; }
.status-planned { background: #f3f4f6; color: #4b5563; }
.roadmap-content { flex: 1; }
.roadmap-content h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #1f2937;
}
.roadmap-content p {
    margin: 0;
    font-size: 14px;
    color: #4b5563;
}
.roadmap-date {
    font-size: 12px;
    color: #6b7280;
    margin-top: 8px;
}
`;

export const AboutPage: FC = () => {
    const user = getCurrentUser();

    return (
        <Layout title="About Equalify" styles={styles} user={user}>
            <div class="about-container">
                <h1>About Equalify</h1>

                <p class="about-intro">
                    Equalify is on a mission to make the web accessible to everyone. Our Open Source tools
                    help organizations identify and fix accessibility issues at scale.
                </p>

                <h2 id="roadmap" class="roadmap-heading">Roadmap</h2>
                <p class="roadmap-subheading">
                    Track our progress, upcoming features, and key milestones for the Equalify project.
                </p>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-value">158</div>
                        <div class="kpi-label">GitHub Stars</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">245</div>
                        <div class="kpi-label">Issues Closed</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">12</div>
                        <div class="kpi-label">Contributor Count</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">Q1 2026</div>
                        <div class="kpi-label">Next Major Release</div>
                    </div>
                </div>

                <h3 class="milestones-heading">Milestones</h3>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-completed">Completed</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Equalify Hub Launch</h3>
                        <p>Central documentation and dashboard for the Equalify project.</p>
                        <div class="roadmap-date">January 2026</div>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-in-progress">In Progress</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Equalify 1.0 Release</h3>
                        <p>Meet or exceed feature set of existing commercial platforms.</p>
                        <div class="roadmap-date">Q1 2026</div>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-in-progress">In Progress</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>AI PDF Accessibility Converter</h3>
                        <p>Turn PDFs into accessible markdown.</p>
                        <div class="roadmap-date">Q1 2026</div>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-in-progress">In Progress</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Guided User Testing</h3>
                        <p>Report on user testing results inside Equalify.</p>
                        <div class="roadmap-date">Q1 2026</div>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-planned">Planned</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Open Source Contributor Program</h3>
                        <p>Onboarding process and tooling for external contributors to the UIC accessibility mission.</p>
                        <div class="roadmap-date">Q2 2026</div>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-planned">Planned</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Equalify 2.0 Release</h3>
                        <p>Add user feedback into new features.</p>
                        <div class="roadmap-date">Q2 2026</div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
