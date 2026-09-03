import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { addSustainerApplication, syncToCampaignMonitor, type SustainerApplicationInput } from '#src/utils/db';
import { sendEmail } from '#src/utils/email';
import { getBlockerStats, type BlockerStats } from '#src/utils/equalifyStats';

// Public-facing contact shown on the page
const CONTACT_EMAIL = 'equalify@uic.edu';
// Where new approval letters are sent for review
const NOTIFY_EMAIL = process.env.SUSTAINER_NOTIFY_EMAIL || 'b3b@uic.edu';

const styles = `
/* Hero */
.sustainers-hero {
    background: #001e62;
    color: #ffffff;
    padding: 64px 24px;
    text-align: center;
}
.sustainers-hero h1 {
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 16px;
    color: #ffffff;
}
@media (max-width: 600px) {
    .sustainers-hero h1 { font-size: 30px; }
}
.sustainers-hero .tagline {
    font-size: 19px;
    color: #ffffff;
    max-width: 760px;
    margin: 0 auto 32px;
    line-height: 1.5;
}
.hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}
.hero-buttons a {
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
.btn-primary { background: #C8102E; color: #ffffff; }
.btn-primary:hover { background: #a00d25; }
.btn-secondary {
    background: rgba(255,255,255,0.2);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.5);
}
.btn-secondary:hover { background: rgba(255,255,255,0.3); }

/* Sections */
.sustainers-section {
    padding: 56px 24px;
    max-width: 900px;
    margin: 0 auto;
}
.sustainers-section h2 {
    font-size: 28px;
    font-weight: 700;
    color: #001e62;
    text-align: center;
    margin: 0 0 12px;
    scroll-margin-top: 110px;
}
.sustainers-section .section-desc {
    text-align: center;
    color: #6b7280;
    max-width: 640px;
    margin: 0 auto 36px;
    line-height: 1.6;
}
.sustainers-section p.prose {
    font-size: 16px;
    line-height: 1.7;
    color: #1f2937;
    max-width: 760px;
    margin: 0 auto;
}

/* Stats */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 700px;
    margin: -32px auto 0;
    padding: 0 24px;
    position: relative;
}
@media (max-width: 500px) {
    .stats-grid { grid-template-columns: 1fr; }
}
.stat-card {
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.stat-value { font-size: 32px; font-weight: 700; color: #C8102E; }
.stat-label { font-size: 14px; color: #4b5563; margin-top: 4px; }
.stat-sub { font-size: 12px; color: #6b7280; margin-top: 6px; }

/* Cards */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
.cards-grid.two { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 700px) {
    .cards-grid, .cards-grid.two { grid-template-columns: 1fr; }
}
.info-card {
    padding: 24px;
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}
.info-card h3 {
    font-size: 17px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 10px;
}
.info-card ul {
    list-style: disc outside;
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
}
.info-card li { margin-bottom: 6px; }
.info-card li:last-child { margin-bottom: 0; }
.info-card p {
    font-size: 14px;
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
}

/* Application form */
.apply-section {
    background: #f8f9fa;
    border-top: 1px solid #e5e7eb;
    max-width: none;
    width: 100%;
    box-sizing: border-box;
    padding: 56px 24px 72px;
}
.apply-inner { max-width: 760px; margin: 0 auto; }
.alert {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
    font-size: 14px;
}
.alert-error { background: #fef2f2; border: 1px solid #C8102E; color: #C8102E; }
.apply-form {
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 28px;
}
.apply-form fieldset {
    border: none;
    padding: 0;
    margin: 0 0 28px;
}
.apply-form legend {
    font-size: 17px;
    font-weight: 700;
    color: #001e62;
    margin-bottom: 4px;
    padding: 0;
}
.apply-form .legend-help {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 14px;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: #4b5563; margin-bottom: 6px; font-weight: 500; }
.form-group input[type="text"], .form-group input[type="email"], .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #1f2937;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
}
.form-group textarea { min-height: 80px; resize: vertical; }
.form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #C8102E;
    box-shadow: 0 0 0 3px rgba(200,16,46,0.15);
}
.choice-group { display: flex; flex-direction: column; gap: 10px; }
.choice-group label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: #1f2937;
    cursor: pointer;
    padding: 12px 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #ffffff;
    line-height: 1.5;
}
.choice-group label:has(input:checked) { border-color: #C8102E; background: #fff7f8; }
.choice-group input { width: 16px; height: 16px; accent-color: #C8102E; margin-top: 3px; flex-shrink: 0; }
.choice-group .choice-note { display: block; font-size: 13px; color: #6b7280; }
.terms-box {
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 14px 16px;
    font-size: 14px;
    color: #1f2937;
    line-height: 1.6;
    margin-bottom: 12px;
}
.honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.submit-btn {
    background: #C8102E;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
    font-weight: 600;
}
.submit-btn:hover { background: #a00d25; }
.form-footnote { font-size: 13px; color: #6b7280; margin: 16px 0 0; line-height: 1.5; }
.success-box {
    background: #f0fdf4;
    border: 1px solid #059669;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
}
.success-box h2 { margin: 0 0 8px 0; font-size: 24px; color: #059669; }
.success-box p { margin: 0 0 8px; color: #374151; font-size: 15px; line-height: 1.6; }
`;

type FormValues = Partial<Record<
    'institution' | 'commitment' | 'official_name' | 'official_title' | 'official_email' |
    'designee_name' | 'designee_title' | 'designee_email' | 'designee_department' | 'notes',
    string
>>;

const ApplicationForm: FC<{ error?: string; values?: FormValues }> = ({ error, values = {} }) => {
    return (
        <div class="apply-form">
            {error && <div class="alert alert-error" role="alert">{error}</div>}
            <form method="post" action="/sustainers/submit">
                {/* Honeypot: real browsers leave this empty */}
                <div class="honeypot" aria-hidden="true">
                    <label>Website <input type="text" name="website" tabindex={-1} autocomplete="off" /></label>
                </div>

                <fieldset>
                    <legend>Institution</legend>
                    <p class="legend-help">
                        The institution named below agrees to become a sustainer of Equalify for a term of one year
                        from the date of submission, renewable by mutual agreement.
                    </p>
                    <div class="form-group">
                        <label for="institution">Institution name</label>
                        <input type="text" id="institution" name="institution" required maxlength={200} value={values.institution || ''} placeholder="University of ..." />
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Annual Commitment</legend>
                    <p class="legend-help">Select one.</p>
                    <div class="choice-group">
                        <label>
                            <input type="radio" name="commitment" value="staff-hours" required checked={values.commitment === 'staff-hours'} />
                            <span>
                                100 staff hours toward feature development and monthly planning meetings
                                <span class="choice-note">About one workday per month.</span>
                            </span>
                        </label>
                        <label>
                            <input type="radio" name="commitment" value="donation" required checked={values.commitment === 'donation'} />
                            <span>
                                $10,000 to the UIC Technology Solutions Open Source Fund
                                <span class="choice-note">You will receive an invoice and remittance details after submitting this form.</span>
                            </span>
                        </label>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Approving Official</legend>
                    <p class="legend-help">The individual authorized to commit institutional resources.</p>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="official_name">Name</label>
                            <input type="text" id="official_name" name="official_name" required maxlength={100} value={values.official_name || ''} />
                        </div>
                        <div class="form-group">
                            <label for="official_title">Title</label>
                            <input type="text" id="official_title" name="official_title" required maxlength={100} value={values.official_title || ''} />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="official_email">Email</label>
                        <input type="email" id="official_email" name="official_email" required maxlength={200} value={values.official_email || ''} />
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Designee</legend>
                    <p class="legend-help">The staff member who will attend monthly roadmap meetings and coordinate the institution's contribution.</p>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="designee_name">Name</label>
                            <input type="text" id="designee_name" name="designee_name" required maxlength={100} value={values.designee_name || ''} />
                        </div>
                        <div class="form-group">
                            <label for="designee_title">Title</label>
                            <input type="text" id="designee_title" name="designee_title" maxlength={100} value={values.designee_title || ''} />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="designee_email">Email</label>
                            <input type="email" id="designee_email" name="designee_email" required maxlength={200} value={values.designee_email || ''} />
                        </div>
                        <div class="form-group">
                            <label for="designee_department">Department</label>
                            <input type="text" id="designee_department" name="designee_department" maxlength={100} value={values.designee_department || ''} />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="notes">Anything else we should know? (optional)</label>
                        <textarea id="notes" name="notes" maxlength={1000}>{values.notes || ''}</textarea>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Use of Institution Name</legend>
                    <div class="terms-box">
                        As a condition of membership, UIC will name the institution in Equalify press releases,
                        on the project website, and in project emails. Press releases are circulated for member
                        review at the monthly roadmap meetings before publication.
                    </div>
                    <div class="choice-group">
                        <label>
                            <input type="checkbox" name="agree_name_use" value="yes" required />
                            <span>The institution agrees to the use of its name as described above.</span>
                        </label>
                        <label>
                            <input type="checkbox" name="attest" value="yes" required />
                            <span>I confirm that the approving official named above is authorized to commit institutional resources, and that submitting this form serves as their signature.</span>
                        </label>
                    </div>
                </fieldset>

                <button type="submit" class="submit-btn">Submit Application</button>
                <p class="form-footnote">
                    Prefer to send a signed letter instead? Email us at{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
            </form>
        </div>
    );
};

const SustainersPage: FC<{ stats: BlockerStats; submitted?: boolean; error?: string; values?: FormValues }> = ({ stats, submitted, error, values }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Sustainers" styles={styles} user={user}>
            {/* Hero */}
            <section class="sustainers-hero">
                <h1>Become an Equalify Open Source Sustainer</h1>
                <p class="tagline">
                    The University of Illinois Chicago is recruiting sustaining partners for Equalify, an Open Source
                    digital accessibility platform. Sustainers cut accessibility tooling costs, shape the product
                    roadmap, and share the maintenance burden with peer universities.
                </p>
                <div class="hero-buttons">
                    <a href="#apply" class="btn-primary">Become a Sustainer</a>
                    <a href={`mailto:${CONTACT_EMAIL}`} class="btn-secondary">Contact Us</a>
                </div>
            </section>

            {/* Stats */}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats.total.toLocaleString('en-US')}</div>
                    <div class="stat-label">Accessibility issues found by Equalify</div>
                    <div class="stat-sub">{stats.last30d.toLocaleString('en-US')} new in last 30 days</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$0</div>
                    <div class="stat-label">Licensing fees — it's Open Source</div>
                    <div class="stat-sub">No per-seat or per-site pricing</div>
                </div>
            </div>

            {/* Benefits */}
            <section class="sustainers-section">
                <h2>Sustainer Benefits</h2>
                <p class="section-desc">
                    Lower costs, a direct line to the engineers, and a seat at the table with peer institutions.
                </p>
                <div class="cards-grid">
                    <div class="info-card">
                        <h3>Reduced Costs</h3>
                        <ul>
                            <li>Equalify is Open Source, so there are no license fees.</li>
                            <li>Equalify runs lean. Its PDF remediation solution converts documents to accessible HTML for as little as $0.02 per document.</li>
                        </ul>
                    </div>
                    <div class="info-card">
                        <h3>Direct Support</h3>
                        <ul>
                            <li>Join monthly roadmap meetings.</li>
                            <li>Gain direct access to core engineers.</li>
                            <li>Elevate roadmap items to accelerate feature development.</li>
                        </ul>
                    </div>
                    <div class="info-card">
                        <h3>Increased Collaboration</h3>
                        <p>
                            A growing list of institutions are Equalify contributors. Sustainers become part of this
                            team on the vanguard of web accessibility tooling.
                        </p>
                    </div>
                </div>
            </section>

            {/* What's asked */}
            <section class="sustainers-section" style="padding-top:0;">
                <h2>What's Asked</h2>
                <p class="section-desc">Two commitments, renewed annually.</p>
                <div class="cards-grid two">
                    <div class="info-card">
                        <h3>100 Staff Hours or $10,000 Annually</h3>
                        <ul>
                            <li>Members contribute 100 staff hours per year (about one workday per month) to feature development and planning meetings.</li>
                            <li>Members who cannot commit staff donate $10,000 to the UIC Technology Solutions Open Source Fund, which funds development.</li>
                        </ul>
                    </div>
                    <div class="info-card">
                        <h3>Rights to Use Institution's Name</h3>
                        <ul>
                            <li>Members are named in Equalify press releases, on the project website, and in project emails.</li>
                            <li>Members review press releases in advance at the monthly roadmap meetings.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* About */}
            <section class="sustainers-section" style="padding-top:0;">
                <h2>More About Equalify</h2>
                <p class="prose">
                    Equalify launched in 2021, guided by a Braintrust of university partners. In 2024, the project
                    moved to UIC with three full-time engineers.
                    Equalify has since expanded beyond scanning to include AI-driven document accessibility, reducing
                    the cost of PDF accessibility remediation. Developing the Equalify sustainers network is the next
                    chapter of our story, as we reduce the cost of accessibility for every institution.
                    Supported by the <a href="https://osf.it.uic.edu/" rel="noopener">UIC Technology Solutions Open Source Fund</a>.
                </p>
            </section>

            {/* Application */}
            <section class="sustainers-section apply-section">
                <div class="apply-inner">
                    <h2 id="apply">Equalify Sustainer Application</h2>
                    <p class="section-desc">
                        Complete the application below. We will review it and invite your designee to the
                        next roadmap meeting.
                    </p>
                    {submitted ? (
                        <div class="success-box">
                            <h2>Application received</h2>
                            <p>Thank you for sustaining Equalify. We will be in touch with your designee about the next monthly roadmap meeting.</p>
                            <p>If you selected the $10,000 commitment, an invoice and remittance details will follow by email.</p>
                        </div>
                    ) : (
                        <ApplicationForm error={error} values={values} />
                    )}
                </div>
            </section>
        </Layout>
    );
};

export async function sustainersHandler(c: Context) {
    const stats = await getBlockerStats();
    return c.html(<SustainersPage stats={stats} />);
}

const COMMITMENT_LABELS: Record<string, string> = {
    'staff-hours': '100 staff hours toward feature development and monthly planning meetings',
    'donation': '$10,000 to the UIC Technology Solutions Open Source Fund',
};

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sustainersSubmitHandler(c: Context) {
    const body = await c.req.parseBody();
    const field = (name: string, max: number) => String(body[name] || '').trim().substring(0, max);
    const stats = await getBlockerStats();

    // Honeypot filled → bot. Pretend success without storing anything.
    if (field('website', 10)) {
        return c.html(<SustainersPage stats={stats} submitted={true} />);
    }

    const values: FormValues = {
        institution: field('institution', 200),
        commitment: field('commitment', 20),
        official_name: field('official_name', 100),
        official_title: field('official_title', 100),
        official_email: field('official_email', 200),
        designee_name: field('designee_name', 100),
        designee_title: field('designee_title', 100),
        designee_email: field('designee_email', 200),
        designee_department: field('designee_department', 100),
        notes: field('notes', 1000),
    };

    const fail = (error: string) => c.html(<SustainersPage stats={stats} error={error} values={values} />);

    if (!values.institution) return fail('Institution name is required.');
    if (values.commitment !== 'staff-hours' && values.commitment !== 'donation') return fail('Please select an annual commitment.');
    if (!values.official_name || !values.official_title) return fail('Approving official name and title are required.');
    if (!values.official_email || !isValidEmail(values.official_email)) return fail('A valid approving official email is required.');
    if (!values.designee_name) return fail('Designee name is required.');
    if (!values.designee_email || !isValidEmail(values.designee_email)) return fail('A valid designee email is required.');
    if (body.agree_name_use !== 'yes') return fail('Please agree to the use of your institution\'s name.');
    if (body.attest !== 'yes') return fail('Please confirm the approving official is authorized to commit institutional resources.');

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('cloudfront-viewer-address')?.split(':')[0]
        || 'Unknown';

    const input: SustainerApplicationInput = {
        institution: values.institution!,
        commitment: values.commitment as 'staff-hours' | 'donation',
        official_name: values.official_name!,
        official_title: values.official_title!,
        official_email: values.official_email!,
        designee_name: values.designee_name!,
        designee_title: values.designee_title || '',
        designee_email: values.designee_email!,
        designee_department: values.designee_department || '',
        notes: values.notes || '',
        ip,
    };

    const saved = await addSustainerApplication(input);
    if (!saved) {
        return fail('Something went wrong saving your application. Please try again or email ' + CONTACT_EMAIL + '.');
    }

    // Best-effort side effects: notify Blake, and add both contacts to the Equalify mailing list
    const emailText = [
        `New Equalify Sustainer application submitted via equalify.uic.edu/sustainers`,
        ``,
        `Institution: ${input.institution}`,
        `Annual commitment: ${COMMITMENT_LABELS[input.commitment]}`,
        ``,
        `Approving Official`,
        `  Name:  ${input.official_name}`,
        `  Title: ${input.official_title}`,
        `  Email: ${input.official_email}`,
        ``,
        `Designee`,
        `  Name:       ${input.designee_name}`,
        `  Title:      ${input.designee_title || '(not provided)'}`,
        `  Email:      ${input.designee_email}`,
        `  Department: ${input.designee_department || '(not provided)'}`,
        ``,
        `Notes: ${input.notes || '(none)'}`,
        ``,
        `Agreed to institution name use: yes`,
        `Authorization attested: yes`,
        `Submitted: ${saved.created_at}`,
        `Record ID: ${saved.id}`,
    ].join('\n');

    await Promise.all([
        sendEmail({
            to: [NOTIFY_EMAIL],
            replyTo: input.official_email,
            subject: `Equalify Sustainer application: ${input.institution}`,
            text: emailText,
        }),
        syncToCampaignMonitor(input.designee_name, input.designee_email, 'sustainer'),
        syncToCampaignMonitor(input.official_name, input.official_email, 'sustainer'),
    ]);

    return c.html(<SustainersPage stats={stats} submitted={true} />);
}
