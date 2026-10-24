import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { lastFullMonth, formatMonthLabel, type PublicStats } from '#src/utils/equalifyStats';

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
.kpi-note {
    font-size: 13px;
    color: #6b7280;
    margin: -16px 0 32px;
}
.kpi-note a { color: #C8102E; }
.kpi-live { margin: -8px 0 40px; }
.kpi-live summary { cursor: pointer; color: #4b5563; font-size: 14px; }
.kpi-live .kpi-note { margin-top: 8px; }

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

const fmt = (n: number) => n.toLocaleString('en-US');

// Platform KPI cards: the last full month from the Equalify API, with the live
// figures behind a disclosure. Figures and definitions come from the same
// endpoint the admin Statistics panel and the monthly reports use.
const PlatformKpis: FC<{ stats: PublicStats | null }> = ({ stats }) => {
    const month = stats ? lastFullMonth(stats) : null;
    if (!stats || !month) {
        return <p class="kpi-note">Platform usage figures are temporarily unavailable. See the <a href="/reports">monthly development reports</a>.</p>;
    }
    // The Red share is only published once (nearly) every tracked host has had its
    // first theme check; before that it would understate adoption.
    const adoption = stats.snapshot?.adoption ?? null;
    const red = adoption && adoption.redHostsPending <= Math.max(5, adoption.uicHostsTracked * 0.1) ? adoption : null;
    const redTotal = stats.redSitesTotal;
    const redShare = red && redTotal && redTotal.total > 0 ? Math.round((red.redSitesTracked / redTotal.total) * 100) : null;
    const live = stats.live;
    return (
        <>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-value">{fmt(month.htmlScans + month.pdfScans)}</div>
                    <div class="kpi-label">Pages Scanned</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{fmt(month.activeUsers)}</div>
                    <div class="kpi-label">Active Users</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{fmt(month.sessions)}</div>
                    <div class="kpi-label">Sessions Started</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{redShare !== null ? `${redShare}%` : fmt(month.unitsServed)}</div>
                    <div class="kpi-label">{redShare !== null ? 'UIC Red Sites Monitored' : 'Units Served'}</div>
                </div>
            </div>
            <p class="kpi-note">
                Platform KPIs for {formatMonthLabel(month.month)}.{' '}
                {red && redTotal && <>{fmt(red.redSitesTracked)} of {fmt(redTotal.total)} live UIC Red sites are monitored with Equalify (Red site total as of {redTotal.asOf}{red.redHostsPending > 0 ? `; ${fmt(red.redHostsPending)} newly tracked hosts still being checked` : ''}).{' '}</>}
                Month-over-month figures and definitions are in the <a href="/reports">monthly development reports</a>.
            </p>
            <details class="kpi-live">
                <summary>Live right now</summary>
                <p class="kpi-note">
                    {fmt(live.totalUsers)} accounts, {fmt(live.activeUsers30d)} active in the last 30 days · {fmt(live.totalAudits)} audits tracking {fmt(live.totalUrls)} pages ·{' '}
                    {fmt(live.htmlScans30d + live.pdfScans30d)} pages scanned in the last 30 days. Updated {new Date(stats.generatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })} Chicago time.
                </p>
            </details>
        </>
    );
};

export const AboutPage: FC<{ stats?: PublicStats | null }> = ({ stats = null }) => {
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

                <PlatformKpis stats={stats} />

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
                        <h3><a href="/iris" style="color:#C8102E;">AI PDF Accessibility Converter</a></h3>
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
                        <span class="status-badge status-completed">Launched</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Open Source Contributor Program</h3>
                        <p>
                            Onboarding process and tooling for external contributors to the UIC accessibility mission.{' '}
                            <a href="/sustainers">Become an Equalify Sustainer &rarr;</a>
                        </p>
                        <div class="roadmap-date">September 2026</div>
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
