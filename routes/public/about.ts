import { htmlResponse } from '#src/utils/html';

export const about = async () => {
    return htmlResponse({
        title: 'About',
        styles: `
            .container {
                max-width: 640px;
                margin: 0 auto;
                padding: 48px 20px 80px;
            }
            h1 { font-size: 32px; margin: 0 0 32px 0; }
            p { color: #8b949e; margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; }
            p strong { color: #e6edf3; }
            .story { color: #e6edf3; }
            .features {
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 6px;
                padding: 24px;
                margin: 32px 0;
            }
            .features h2 { margin: 0 0 16px 0; font-size: 18px; color: #e6edf3; }
            .features ul { margin: 0; padding-left: 20px; }
            .features li { color: #8b949e; margin: 8px 0; }
            .org-card {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid #30363d;
            }
            .org-card img {
                width: 64px;
                height: 64px;
                border-radius: 6px;
                border: 2px solid #30363d;
            }
            .org-info { flex: 1; }
            .org-info .name { font-weight: 600; font-size: 16px; color: #e6edf3; }
            .org-info .meta { font-size: 13px; color: #8b949e; }
        `,
        body: `
    <div class="container">
        <h1>About</h1>
        
        <p class="story">
            <strong>Equalify Open Source</strong> is a developer tool for the <a href="https://github.com/EqualifyEverything">EqualifyEverything</a> organization.
        </p>
        
        <p class="story">
            This tool helps developers track issues, view repositories, and aggregate stats across Equalify's open source projects. It's built to make contributing to accessibility tooling easier.
        </p>
        
        <p class="story">
            <a href="https://app.equalify.uic.edu">Equalify</a> is on a mission to make the web accessible to everyone. Our open source tools help organizations identify and fix accessibility issues at scale.
        </p>

        <div class="features">
            <h2>What you can do here:</h2>
            <ul>
                <li><strong>Browse repositories</strong> – View all EqualifyEverything repos and their details</li>
                <li><strong>Track issues</strong> – See open issues across all projects</li>
                <li><strong>View stats</strong> – Aggregate metrics for the organization</li>
                <li><strong>Read code</strong> – Fast, lightweight code browsing</li>
            </ul>
        </div>

        <p>
            Questions? Something broken? <a href="https://github.com/EqualifyEverything/equalifyuic-opensource-tool/issues">Open an issue</a>.
        </p>

        <div class="org-card">
            <img src="https://github.com/EqualifyEverything.png" alt="EqualifyEverything">
            <div class="org-info">
                <div class="name"><a href="https://app.equalify.uic.edu">Equalify</a></div>
                <div class="meta">Making the web accessible to everyone</div>
                <div class="meta">Built by <a href="https://uic.edu">UIC</a></div>
            </div>
        </div>
    </div>`
    });
};
