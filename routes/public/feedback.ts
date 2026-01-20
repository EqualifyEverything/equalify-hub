import { event } from '#src/utils';
import { getCurrentUser } from '#src/utils/auth';
import { getFeatureRequests, createFeatureRequest, voteFeature, FeatureRequest } from '#src/utils/db';

function getVisitorIp(): string {
    const headers = event.headers || {};
    const getHeader = (name: string): string => {
        const lower = name.toLowerCase();
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase() === lower) return String(value || '');
        }
        return '';
    };
    return getHeader('x-forwarded-for')?.split(',')[0]?.trim() || 
           getHeader('cloudfront-viewer-address')?.split(':')[0] || 
           'Unknown';
}

// Main feedback page - list features and submit form
export const feedback = async () => {
    const user = getCurrentUser();
    const features = await getFeatureRequests();
    const visitorIp = getVisitorIp();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: renderFeedbackPage(user, features, visitorIp)
    };
};

// Submit a new feature request
export const submitFeature = async () => {
    const visitorIp = getVisitorIp();
    const user = getCurrentUser();
    
    // Parse form body - handle base64 encoding from API Gateway
    let body = event.body || '';
    if ((event as any).isBase64Encoded && typeof body === 'string') {
        body = Buffer.from(body, 'base64').toString('utf-8');
    }
    // If body was parsed as JSON object, convert back to string
    if (typeof body === 'object') {
        body = (event as any).rawBody || '';
        if ((event as any).isBase64Encoded && typeof body === 'string') {
            body = Buffer.from(body, 'base64').toString('utf-8');
        }
    }
    const params = new URLSearchParams(body);
    const title = params.get('title')?.trim() || '';
    const description = params.get('description')?.trim() || '';
    
    if (!title) {
        return {
            statusCode: 302,
            headers: { 'Location': '/feedback?error=Title+is+required' },
            body: ''
        };
    }
    
    await createFeatureRequest(title, description, visitorIp, user?.login);
    
    return {
        statusCode: 302,
        headers: { 'Location': '/feedback?success=1' },
        body: ''
    };
};

// Vote on a feature
export const vote = async () => {
    const visitorIp = getVisitorIp();
    
    // Parse form body - handle base64 encoding from API Gateway
    let body = event.body || '';
    if ((event as any).isBase64Encoded && typeof body === 'string') {
        body = Buffer.from(body, 'base64').toString('utf-8');
    }
    if (typeof body === 'object') {
        body = (event as any).rawBody || '';
        if ((event as any).isBase64Encoded && typeof body === 'string') {
            body = Buffer.from(body, 'base64').toString('utf-8');
        }
    }
    const params = new URLSearchParams(body);
    const featureId = params.get('id') || '';
    const voteType = params.get('vote') as 'up' | 'down';
    
    if (featureId && (voteType === 'up' || voteType === 'down')) {
        await voteFeature(featureId, visitorIp, voteType);
    }
    
    return {
        statusCode: 302,
        headers: { 'Location': '/feedback' },
        body: ''
    };
};

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function renderFeedbackPage(
    user: { login: string; avatar_url: string } | null, 
    features: FeatureRequest[],
    visitorIp: string
): string {
    const authSection = user 
        ? `<div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
               <a href="/${user.login}" style="display:flex;align-items:center;gap:8px;">
                   <img src="${user.avatar_url}" alt="${user.login}" style="width:20px;height:20px;border-radius:50%;">
                   ${user.login}
               </a>
               <a href="/logout">Sign out</a>
           </div>`
        : `<a href="/github" style="margin-left:auto;">Sign in</a>`;
    
    const error = event.queryStringParameters?.error;
    const success = event.queryStringParameters?.success;
    
    const featuresHtml = features.map(f => {
        const score = (f.upvotes?.length || 0) - (f.downvotes?.length || 0);
        const userUpvoted = f.upvotes?.includes(visitorIp);
        const userDownvoted = f.downvotes?.includes(visitorIp);
        
        return `
            <div class="feature-item">
                <div class="vote-section">
                    <form method="post" action="/feedback/vote">
                        <input type="hidden" name="id" value="${f.id}">
                        <input type="hidden" name="vote" value="up">
                        <button type="submit" class="vote-btn ${userUpvoted ? 'voted' : ''}">▲</button>
                    </form>
                    <span class="score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">${score}</span>
                    <form method="post" action="/feedback/vote">
                        <input type="hidden" name="id" value="${f.id}">
                        <input type="hidden" name="vote" value="down">
                        <button type="submit" class="vote-btn ${userDownvoted ? 'voted' : ''}">▼</button>
                    </form>
                </div>
                <div class="feature-content">
                    <h3>${escapeHtml(f.title)}</h3>
                    ${f.description ? `<p>${escapeHtml(f.description)}</p>` : ''}
                    <div class="feature-meta">
                        ${f.created_by !== 'Anonymous' ? `<a href="/${f.created_by}">${escapeHtml(f.created_by)}</a>` : 'Anonymous'} · ${timeAgo(f.created_at)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature Requests – Equalify Open Source</title>
    <link rel="icon" href="https://app.equalify.uic.edu/favicon.ico">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: #0d1117;
            color: #e6edf3;
        }
        a { color: #58a6ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        nav {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        @media (min-width: 600px) {
            nav { gap: 24px; padding: 12px 20px; }
        }
        nav .logo { font-size: 20px; font-weight: 600; color: #e6edf3; text-decoration: none; }
        nav a { color: #8b949e; text-decoration: none; font-size: 14px; }
        nav a:hover { color: #e6edf3; }
        .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 32px 20px;
        }
        h1 { margin: 0 0 8px 0; font-size: 28px; }
        .subtitle { color: #8b949e; margin: 0 0 32px 0; }
        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 14px;
        }
        .alert-error { background: #3d1a1a; border: 1px solid #f85149; color: #f85149; }
        .alert-success { background: #1a3d1a; border: 1px solid #3fb950; color: #3fb950; }
        .submit-form {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 32px;
        }
        .submit-form h2 { margin: 0 0 16px 0; font-size: 16px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; color: #8b949e; margin-bottom: 6px; }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 6px;
            color: #e6edf3;
            font-size: 14px;
            font-family: inherit;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: #58a6ff;
        }
        .form-group textarea { resize: vertical; min-height: 80px; }
        .submit-btn {
            background: #238636;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        .submit-btn:hover { background: #2ea043; }
        .feature-list { display: flex; flex-direction: column; gap: 12px; }
        .feature-item {
            display: flex;
            gap: 16px;
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px;
        }
        .vote-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 40px;
        }
        .vote-btn {
            background: none;
            border: none;
            color: #8b949e;
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .vote-btn:hover { background: #21262d; color: #e6edf3; }
        .vote-btn.voted { color: #58a6ff; }
        .vote-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .score { font-size: 16px; font-weight: 600; }
        .score.positive { color: #3fb950; }
        .score.negative { color: #f85149; }
        .feature-content { flex: 1; min-width: 0; }
        .feature-content h3 { margin: 0 0 4px 0; font-size: 15px; }
        .feature-content p { margin: 0 0 8px 0; font-size: 13px; color: #8b949e; }
        .feature-meta { font-size: 12px; color: #6e7681; }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #8b949e;
        }
        footer {
            text-align: center;
            padding: 24px;
            color: #8b949e;
            font-size: 12px;
            border-top: 1px solid #30363d;
            margin-top: 48px;
        }
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo" style="display:flex;align-items:center;gap:5px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="20" height="20" style="margin-top:1px;"><circle cx="100" cy="100" r="65" fill="none" stroke="#e6edf3" stroke-width="28"/><line x1="100" y1="125" x2="100" y2="90" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="90" x2="65" y2="50" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="90" x2="120" y2="112" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="125" r="10" fill="#e6edf3"/><circle cx="100" cy="90" r="10" fill="#e6edf3"/><circle cx="120" cy="112" r="10" fill="#e6edf3"/></svg>Equalify Open Source</a>
        <a href="/feed">Feed</a>
        <a href="/explore">Explore</a>
        <a href="/random">Random</a>
        ${authSection}
    </nav>
    
    <div class="container">
        <h1>Feature Requests</h1>
        <p class="subtitle">Vote on what to build next</p>
        
        ${error ? `<div class="alert alert-error">${escapeHtml(decodeURIComponent(error))}</div>` : ''}
        ${success ? `<div class="alert alert-success">Thanks! Your request has been added.</div>` : ''}
        
        <div class="submit-form">
            <h2>💡 Suggest a feature</h2>
            <form method="post" action="/feedback/submit">
                <div class="form-group">
                    <label for="title">What do you want?</label>
                    <input type="text" id="title" name="title" placeholder="e.g., Contribution graph" required maxlength="200">
                </div>
                <div class="form-group">
                    <label for="description">Details (optional)</label>
                    <textarea id="description" name="description" placeholder="Any extra context..." maxlength="500"></textarea>
                </div>
                <button type="submit" class="submit-btn">Submit</button>
                ${user ? `<span style="margin-left:12px;font-size:12px;color:#8b949e;">as ${user.login}</span>` : ''}
            </form>
        </div>
        
        <div class="feature-list">
            ${features.length > 0 ? featuresHtml : `
                <div class="empty-state">
                    <p>No feature requests yet. Be the first!</p>
                </div>
            `}
        </div>
    </div>
    
    <footer>
        <a href="/">Home</a> · <a href="/about">About</a>
    </footer>
</body>
</html>`;
}
