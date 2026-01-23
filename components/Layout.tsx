import type { FC, PropsWithChildren } from 'hono/jsx';

// Import built Tailwind CSS (esbuild loads it as text)
import tailwindCss from '#src/styles/tailwind.css';
import { getTheme, getThemeClass, getThemeLabel } from '#src/utils/theme';

// Site configuration
export const site = {
    name: 'Equalify Hub',
    favicon: 'https://app.equalify.uic.edu/favicon.ico',
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
                    <a href="/" class="logo" style="display:flex;align-items:center;gap:10px;">
                        <img src="https://github.com/EqualifyEverything.png" alt="Equalify" style="width:32px;height:32px;border-radius:4px;" />
                        {site.name}
                    </a>
                    <div class="nav-links">
                        <a href="/user-guide">User Guide</a>
                        <a href="/technical-docs">Technical</a>
                        <a href="/roadmap">Roadmap</a>
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
                            <a href="/github" class="sign-in-btn">Sign in with GitHub</a>
                        )}
                    </div>
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
                <a href="/github" class="cta-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px;">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    Sign in with GitHub
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
                        <h3>Equalify Hub</h3>
                        <a href="/">Dashboard</a>
                        <a href="/docs">Documentation</a>
                        <a href="/about">About</a>
                        <a href="/feedback">Feedback</a>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Quick Links</h3>
                        <a href="https://github.com/EqualifyEverything" rel="noopener">GitHub</a>
                        <a href="https://app.equalify.uic.edu" rel="noopener">Equalify App</a>
                        <a href="https://osf.it.uic.edu/" rel="noopener">Open Source Fund</a>
                        <a href="https://it.uic.edu/accessibility/" rel="noopener">Digital Accessibility</a>
                    </div>
                    
                    <div class="footer-column">
                        <h3>University</h3>
                        <a href="https://www.uillinois.edu" rel="noopener">U of I System</a>
                        <a href="https://illinois.edu" rel="noopener">Urbana-Champaign</a>
                        <a href="https://www.uis.edu" rel="noopener">Springfield</a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>© {currentYear} The Board of Trustees of the University of Illinois | <a href="https://www.uic.edu/privacy-statement" rel="noopener">Privacy Statement</a></p>
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
    height: 4px;
    background: #C8102E;
}
nav {
    background: #ffffff;
    border-bottom: 1px solid var(--color-border);
    padding: 0;
}
.nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}
@media (max-width: 768px) {
    .nav-inner {
        padding: 12px 20px;
        flex-wrap: wrap;
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
    height: 4px;
    background: #C8102E;
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
                <CallToAction />
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
                <CallToAction />
                <Footer />
            </body>
        </html>
    );
};
