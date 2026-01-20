import type { FC, PropsWithChildren } from 'hono/jsx';

// Import built Tailwind CSS (esbuild loads it as text)
import tailwindCss from '#src/styles/tailwind.css';
import { getTheme, getThemeClass, getThemeLabel } from '#src/utils/theme';

// Site configuration
export const site = {
    name: 'Equalify Open Source',
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
        <nav>
            <a href="/" class="logo" style="display:flex;align-items:center;gap:8px;">
                <img src="https://github.com/EqualifyEverything.png" alt="Equalify" style="width:24px;height:24px;border-radius:4px;" />
                {site.name}
            </a>
            {user ? (
                <div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
                    <a href={`/${user.login}`} style="display:flex;align-items:center;gap:8px;">
                        <img src={user.avatar_url} alt={user.login} style="width:20px;height:20px;border-radius:50%;" />
                        {user.login}
                    </a>
                    <a href="/logout">Sign out</a>
                </div>
            ) : (
                <a href="/github" style="margin-left:auto;">Sign in with GitHub</a>
            )}
        </nav>
    );
};

export const Footer: FC = () => {
    return (
        <footer>
            <a href="/about">About</a> · 
            <a href="https://github.com/EqualifyEverything" rel="noopener">GitHub</a> · 
            <a href="https://app.equalify.uic.edu" rel="noopener">Equalify</a>
        </footer>
    );
};

export const baseStyles = `
nav {
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}
nav .logo { font-size: 18px; font-weight: 600; color: var(--color-text); text-decoration: none; }
nav a { color: var(--color-text-secondary); text-decoration: none; font-size: 14px; white-space: nowrap; }
nav a:hover { color: var(--color-text); text-decoration: none; }
footer {
    text-align: center;
    padding: 24px 16px;
    color: var(--color-text-secondary);
    font-size: 12px;
    border-top: 1px solid var(--color-border);
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
            </body>
        </html>
    );
};
