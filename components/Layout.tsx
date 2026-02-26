import type { FC, PropsWithChildren } from 'hono/jsx';

// Import built Tailwind CSS (esbuild loads it as text)
import tailwindCss from '#src/styles/tailwind.css';
import { getTheme, getThemeClass, getThemeLabel } from '#src/utils/theme';
import config from '#src/utils/config';

// Site configuration (using config from environment)
export const site = {
    name: config.siteName,
    favicon: config.favicon,
};

export const Logo: FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="20" height="20" style="margin-top:1px;">
        <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" stroke-width="28"/>
        <line x1="100" y1="125" x2="100" y2="90" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <line x1="100" y1="90" x2="65" y2="50" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <line x1="100" y1="90" x2="120" y2="112" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <circle cx="100" cy="125" r="10" fill="currentColor"/>
        <circle cx="100" cy="90" r="10" fill="currentColor"/>
        <circle cx="120" cy="112" r="10" fill="currentColor"/>
    </svg>
);

export const BigLogo: FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="58" height="58" style="margin-top:8px;">
        <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" stroke-width="28"/>
        <line x1="100" y1="125" x2="100" y2="90" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <line x1="100" y1="90" x2="65" y2="50" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <line x1="100" y1="90" x2="120" y2="112" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <circle cx="100" cy="125" r="10" fill="currentColor"/>
        <circle cx="100" cy="90" r="10" fill="currentColor"/>
        <circle cx="120" cy="112" r="10" fill="currentColor"/>
    </svg>
);

// User type from auth
type User = {
    login: string;
    avatar_url: string;
    isPro?: boolean;
} | null;

export const Nav: FC<{ user?: User }> = ({ user }) => {
    return (
        <header class="site-header">
            <div class="top-bar"></div>
            <nav>
                <div class="nav-inner">
                    <a href="/" class="logo" style="display:flex;align-items:center;gap:14px;">
                        <img src={config.orgLogo} alt="UIC" style="width:64px;height:64px;border-radius:50%;" />
                        <span style="width:1px;height:48px;background:#d1d5db;"></span>
                        <span>{site.name}</span>
                    </a>
                    <div class="nav-links">
                        <a href="/user-guide">User Guide</a>
                        <a href="/technical-docs">Technical</a>
                        <a href="/roadmap">Roadmap</a>
                        <a href="/updates">Updates</a>
                        <a href="/reports">Reports</a>
                        <a href="/about">About</a>
                        {user ? (
                            <>
                                <a href={`/${user.login}`} style="display:flex;align-items:center;gap:8px;">
                                    <img src={user.avatar_url} alt={user.login} style="width:20px;height:20px;border-radius:50%;" />
                                    {user.login}
                                </a>
                                <a href="/logout">Sign out</a>
                            </>
                        ) : (
                            <a href="/signup" class="sign-in-btn">Sign Up for Equalify</a>
                        )}
                    </div>
                    <button class="nav-mobile-toggle" onclick="document.querySelector('.nav-mobile').classList.toggle('open')" aria-label="Toggle menu">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="nav-mobile">
                    <a href="/user-guide">User Guide</a>
                    <a href="/technical-docs">Technical</a>
                    <a href="/roadmap">Roadmap</a>
                    <a href="/updates">Updates</a>
                    <a href="/reports">Reports</a>
                    <a href="/about">About</a>
                    {user ? (
                        <>
                            <a href={`/${user.login}`}>{user.login}</a>
                            <a href="/logout">Sign out</a>
                        </>
                    ) : (
                        <a href="/signup" class="sign-in-mobile">Sign Up for Equalify</a>
                    )}
                </div>
            </nav>
        </header>
    );
};

// UIC Logo SVG component
const UICLogo: FC = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#C8102E"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial, sans-serif">UIC</text>
    </svg>
);

// Call to action section before footer
export const CallToAction: FC = () => {
    return (
        <section class="cta-section">
            <div class="cta-content">
                <h2>Contribute to Equalify</h2>
                <p>
                    We're building accessible technology for everyone. Join us in making 
                    the web more inclusive through open source contributions.
                </p>
                <a href={config.equalifyAppUrl} class="cta-button">
                    Sign into Equalify
                </a>
            </div>
        </section>
    );
};

export const Footer: FC = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer class="uic-footer">
            <div class="footer-main">
                <div class="footer-brand">
                    <UICLogo />
                    <div class="footer-address">
                        <p>1200 West Harrison St.</p>
                        <p>Chicago, IL 60607</p>
                        <p>(312) 996-7000</p>
                    </div>
                </div>
                
                <div class="footer-links">
                    <div class="footer-column">
                        <h3>Resources</h3>
                        <a href="https://catalog.uic.edu/ucat/academic-calendar/" rel="noopener">Academic Calendar</a>
                        <a href="https://library.uic.edu/" rel="noopener">Library</a>
                        <a href="https://maps.uic.edu/" rel="noopener">Maps</a>
                        <a href="https://www.uic.edu/apps/departments-az/search" rel="noopener">Directory</a>
                        <a href="https://today.uic.edu/events" rel="noopener">Event Calendar</a>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Quick Links</h3>
                        <a href="https://it.uic.edu/support/" rel="noopener">Get Support</a>
                        <a href="https://uic.edu/about/job-opportunities" rel="noopener">Job Openings</a>
                        <a href="https://emergency.uic.edu/" rel="noopener">Emergency Information</a>
                        <a href="https://reportaconcern.uic.edu/" rel="noopener">Report a Concern</a>
                        <a href="https://uihealth.uic.edu/" rel="noopener">UI Health</a>
                    </div>
                    
                    <div class="footer-column">
                        <h3>University</h3>
                        <a href="https://www.uillinois.edu" rel="noopener">University of Illinois System</a>
                        <a href="https://illinois.edu" rel="noopener">Urbana-Champaign</a>
                        <a href="https://www.uis.edu" rel="noopener">Springfield</a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>© {currentYear} The Board of Trustees of the University of Illinois | <a href="https://www.vpaa.uillinois.edu/resources/web_privacy" rel="noopener">Privacy Statement</a></p>
            </div>
            
            <div class="footer-bar"></div>
        </footer>
    );
};

export const baseStyles = `
/* Top bar and navigation */
.site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
}
.top-bar {
    height: 8px;
    background: #C8102E;
}
nav {
    background: #ffffff;
    border-bottom: 1px solid var(--color-border);
    padding: 0;
    position: relative;
}
.nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}
.nav-mobile-toggle {
    display: none;
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: #4b5563;
}
.nav-mobile {
    display: none;
}
@media (max-width: 900px) {
    .nav-inner {
        padding: 12px 20px;
    }
    .nav-links {
        display: none !important;
    }
    .nav-mobile-toggle {
        display: block;
    }
    .nav-mobile {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ffffff;
        border-bottom: 1px solid #d1d5db;
        padding: 16px 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 100;
    }
    .nav-mobile.open {
        display: block;
    }
    .nav-mobile a {
        display: block;
        padding: 12px 0;
        color: #4b5563;
        font-size: 15px;
        border-bottom: 1px solid #e5e7eb;
    }
    .nav-mobile a:last-child {
        border-bottom: none;
    }
    .sign-in-mobile {
        display: block;
        margin: 12px 16px 0;
        background: #C8102E !important;
        color: #ffffff !important;
        padding: 12px 20px;
        border-radius: 4px;
        font-weight: 500;
        text-align: center;
    }
}
nav .logo { 
    font-size: 20px; 
    font-weight: 600; 
    color: #001e62; 
    text-decoration: none; 
}
nav .logo:hover {
    text-decoration: none;
}
.nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
}
@media (max-width: 768px) {
    .nav-links {
        gap: 16px;
    }
}
nav a { 
    color: #4b5563; 
    text-decoration: none; 
    font-size: 15px; 
    white-space: nowrap; 
}
nav a:hover { 
    color: #C8102E; 
    text-decoration: none; 
}
.sign-in-btn {
    background: #C8102E !important;
    color: #ffffff !important;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
}
.sign-in-btn:hover {
    background: #9a0c23 !important;
    color: #ffffff !important;
}

/* Call to Action Section */
.cta-section {
    background: linear-gradient(135deg, #001e62 0%, #001845 100%);
    padding: 64px 24px;
    text-align: center;
}
.cta-content {
    max-width: 700px;
    margin: 0 auto;
}
.cta-section h2 {
    color: #ffffff;
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 16px 0;
}
.cta-section p {
    color: rgba(255, 255, 255, 0.85);
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 24px 0;
}
.cta-button {
    display: inline-flex;
    align-items: center;
    background: #ffffff;
    color: #001e62;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s;
}
.cta-button:hover {
    background: #f0f0f0;
    transform: translateY(-1px);
    text-decoration: none;
}

/* UIC Footer */
.uic-footer {
    background: #f8f9fa;
    border-top: none;
}
.footer-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 24px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
}
@media (min-width: 768px) {
    .footer-main {
        grid-template-columns: 250px 1fr;
    }
}
.footer-brand {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.footer-address {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
}
.footer-address p {
    margin: 0;
}
.footer-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 32px;
}
.footer-column h3 {
    font-size: 14px;
    font-weight: 600;
    color: #001e62;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}
.footer-column a {
    display: block;
    font-size: 14px;
    color: #4b5563;
    text-decoration: none;
    margin-bottom: 8px;
}
.footer-column a:hover {
    color: #C8102E;
    text-decoration: underline;
}
.footer-bottom {
    border-top: 1px solid #d1d5db;
    padding: 24px;
    text-align: center;
}
.footer-bottom p {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
}
.footer-bottom a {
    color: #6b7280;
}
.footer-bottom a:hover {
    color: #C8102E;
}
.footer-bar {
    height: 8px;
    background: #001e62;
}

@media (min-width: 600px) {
    nav { gap: 24px; }
}
`;

type LayoutProps = PropsWithChildren<{
    title: string;
    styles?: string;
    user?: User;
}>;

export const Layout: FC<LayoutProps> = ({ title, styles, user, children }) => {
    const themeClass = getThemeClass();
    
    return (
        <html lang="en" class={themeClass || undefined}>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title} – {site.name}</title>
                <link rel="icon" href={site.favicon} />
                <style dangerouslySetInnerHTML={{ __html: tailwindCss + baseStyles + (styles || '') }} />
            </head>
            <body>
                <Nav user={user} />
                {children}
                <Footer />
            </body>
        </html>
    );
};

// For pages that need custom structure (home page, etc)
type BaseLayoutProps = PropsWithChildren<{
    title: string;
    styles?: string;
}>;

export const BaseLayout: FC<BaseLayoutProps> = ({ title, styles, children }) => {
    const themeClass = getThemeClass();
    
    return (
        <html lang="en" class={themeClass || undefined}>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title} – {site.name}</title>
                <link rel="icon" href={site.favicon} />
                <style dangerouslySetInnerHTML={{ __html: tailwindCss + baseStyles + (styles || '') }} />
            </head>
            <body>
                {children}
                <Footer />
            </body>
        </html>
    );
};
