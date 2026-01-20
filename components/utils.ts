// Common utility functions shared across components

export function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

export function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

export function getLanguageColor(lang: string): string {
    const colors: Record<string, string> = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C': '#555555',
        'C#': '#178600',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Swift': '#F05138',
        'Kotlin': '#A97BFF',
        'Dart': '#00B4AB',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Shell': '#89e051',
        'Vue': '#41b883',
        'Svelte': '#ff3e00',
    };
    return colors[lang] || '#8b949e';
}

// Parse form body - handles base64 encoding from API Gateway
export function parseFormBody(event: any): URLSearchParams {
    let body = event.body || '';
    if (event.isBase64Encoded && typeof body === 'string') {
        body = Buffer.from(body, 'base64').toString('utf-8');
    }
    if (typeof body === 'object') {
        body = event.rawBody || '';
        if (event.isBase64Encoded && typeof body === 'string') {
            body = Buffer.from(body, 'base64').toString('utf-8');
        }
    }
    return new URLSearchParams(body);
}

// Get visitor IP from request headers
export function getVisitorIp(headers: Record<string, any>): string {
    const getHeader = (name: string): string => {
        const lower = name.toLowerCase();
        for (const [key, value] of Object.entries(headers || {})) {
            if (key.toLowerCase() === lower) return String(value || '');
        }
        return '';
    };
    return getHeader('x-forwarded-for')?.split(',')[0]?.trim() || 
           getHeader('cloudfront-viewer-address')?.split(':')[0] || 
           'Unknown';
}
