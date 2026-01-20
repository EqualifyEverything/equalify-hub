import { event } from './event';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

// Parse cookies from request headers
export function parseCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    // Lambda function URLs send cookies as an array
    if (Array.isArray((event as any).cookies)) {
        (event as any).cookies.forEach((cookie: string) => {
            const [name, ...rest] = cookie.split('=');
            if (name) {
                cookies[name] = rest.join('=');
            }
        });
        return cookies;
    }
    
    // Fallback to header parsing for API Gateway
    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies[name] = rest.join('=');
        }
    });
    
    return cookies;
}

// Get GitHub token from cookie
export function getGitHubToken(): string | null {
    const cookies = parseCookies();
    return cookies['gh_token'] || null;
}

// Get current user info from cookie
export function getCurrentUser(): { login: string; avatar_url: string; isPro?: boolean } | null {
    const cookies = parseCookies();
    const userCookie = cookies['gh_user'];
    if (!userCookie) return null;
    
    try {
        return JSON.parse(decodeURIComponent(userCookie));
    } catch {
        return null;
    }
}

// Check if user has pro status (survives logout)
export function hasProStatus(): boolean {
    const cookies = parseCookies();
    return cookies['gc_pro'] === '1';
}

// Create secure cookie string
export function createCookie(name: string, value: string, maxAge: number = 86400 * 30): string {
    return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// Create cookie deletion string
export function deleteCookie(name: string): string {
    return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// GitHub OAuth URLs - pro users get private repo access
export function getGitHubAuthUrl(isPro: boolean = false): string {
    // Pro users get repo + read:org scope for private repo and org access
    // GitHub accepts space-separated scopes (URL encoded as %20)
    const scopes = isPro ? 'read:user repo read:org' : 'read:user';
    return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scopes)}`;
}

// Get pro auth URL (for re-auth after subscribing)
export function getGitHubProAuthUrl(): string {
    return getGitHubAuthUrl(true);
}

// Exchange code for token
export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; error?: string }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        }),
    });
    
    return response.json();
}

// Fallback token for unauthenticated users (5000 req/hour vs 60)
const GITHUB_FALLBACK_TOKEN = process.env.GITHUB_FALLBACK_TOKEN || '';

// Fetch from GitHub with optional auth
export async function fetchGitHub(url: string, token?: string | null) {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EqualifyOpenSource'
    };
    
    // Use user's token, or fallback token for unauthenticated users
    const authToken = token || GITHUB_FALLBACK_TOKEN;
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, { headers });
    return response.json();
}

// Fetch current user from GitHub
export async function fetchCurrentUser(token: string) {
    return fetchGitHub('https://api.github.com/user', token);
}
