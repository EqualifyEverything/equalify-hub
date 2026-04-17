import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';

import { logView } from '#src/utils/db';
import { setEvent } from '#src/utils/event';

// Migrated pages (JSX components)
import { AboutPage } from '#src/pages/about';
import { userGuideHandler, userGuideDocHandler } from '#src/pages/user-guide';
import { technicalDocsHandler, technicalDocsDocHandler } from '#src/pages/technical-docs';
import { RoadmapPage } from '#src/pages/roadmap';
import { feedbackHandler, submitFeatureHandler, voteHandler } from '#src/pages/feedback';
import { homeHandler } from '#src/pages/home';
import { reflowHandler, reflowDocHandler } from '#src/pages/reflow';

// Route handlers
import { github, githubPro, callback, logout } from '#src/routes/public/auth';
import { robots, sitemap, security, humans } from '#src/routes/public/static';
import { repo } from '#src/routes/public/repo';
import { commits } from '#src/routes/public/commits';
import { issues, issuesList } from '#src/routes/public/issues';

// Create app for local dev (no Lambda bindings needed)
const app = new Hono();

// Middleware to set legacy event (mocked for local dev) and log views
app.use('*', async (c, next) => {
    const mockEvent = {
        headers: Object.fromEntries(
            [...c.req.raw.headers.entries()].map(([k, v]) => [k, v])
        ),
        requestContext: {}
    };
    setEvent(mockEvent as any);
    logView(mockEvent.headers || {}, c.req.path);
    await next();
});

// ============ THEME TOGGLE ============
app.post('/theme', async (c) => {
    const body = await c.req.parseBody();
    const theme = body.theme as string;
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
        setCookie(c, 'theme', theme, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'Lax',
        });
    }
    const referer = c.req.header('referer') || '/';
    return c.redirect(referer, 303);
});

// ============ STATIC FILES ============
app.get('/robots.txt', robots);
app.get('/sitemap.xml', sitemap);
app.get('/humans.txt', humans);
app.get('/.well-known/security.txt', security);

// ============ AUTH ROUTES ============
app.get('/github', github);
app.get('/github-pro', githubPro);
app.get('/callback', callback);
app.get('/auth/github/callback', callback);
app.get('/logout', logout);

// ============ MIGRATED ROUTES (Hono native JSX) ============
app.get('/', homeHandler);
app.get('/about', (c) => c.html(<AboutPage />));
app.get('/user-guide', userGuideHandler);
app.get('/user-guide/:slug', userGuideDocHandler);
app.get('/technical-docs', technicalDocsHandler);
app.get('/technical-docs/:slug', technicalDocsDocHandler);
app.get('/reflow', reflowHandler);
app.get('/reflow/*', reflowDocHandler);
app.get('/roadmap', (c) => c.html(<RoadmapPage />));
app.get('/feedback', feedbackHandler);
app.post('/feedback/submit', submitFeatureHandler);
app.post('/feedback/vote', voteHandler);

// ============ DYNAMIC ROUTES ============
app.get('/:owner', repo);
app.get('/:owner/:repo', repo);
app.get('/:owner/:repo/tree/:branch/*', repo);
app.get('/:owner/:repo/blob/:branch/*', repo);

// Issues routes
app.get('/:owner/:repo/issues', issuesList);
app.get('/:owner/:repo/issues/:issue', issues);

// Commits routes
app.get('/:owner/:repo/commits', commits);
app.get('/:owner/:repo/commits/:branch', commits);
app.get('/:owner/:repo/commits/:branch/*', commits);

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`🚀 Server running at http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});
