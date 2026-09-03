import { getGitHubCache, getStaleGitHubCache, setGitHubCache } from '#src/utils/db';

// Equalify's Hasura endpoint. With GRAPHQL_ADMIN_SECRET set (Lambda env), queries run as
// admin so tables the anonymous role can't aggregate (e.g. blockers) are available.
const GRAPHQL_URL = process.env.GRAPHQL_URL || 'https://graphql.equalifyapp.com/v1/graphql';
const GRAPHQL_ADMIN_SECRET = process.env.GRAPHQL_ADMIN_SECRET;

// Synthetic cache key — reuses the GitHub response cache (1 min fresh, 7 day stale fallback)
const CACHE_KEY = 'equalify-stats://blockers';

// Last known values, used only if the API and cache are both unavailable (as of 2026-09-03)
const FALLBACK: BlockerStats = { total: 2509460, last30d: 256841 };

export interface BlockerStats {
    total: number;   // COUNT(*) FROM blockers — matches "Total Blockers Found" in Equalify's admin stats
    last30d: number; // blockers created in the last 30 days
}

async function graphql(query: string, variables?: Record<string, unknown>): Promise<any> {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Equalify-Hub',
            ...(GRAPHQL_ADMIN_SECRET ? { 'X-Hasura-Admin-Secret': GRAPHQL_ADMIN_SECRET } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new Error(`Equalify GraphQL HTTP ${response.status}`);
    const json = await response.json();
    if (json.errors?.length) throw new Error(`Equalify GraphQL: ${json.errors[0].message}`);
    return json.data;
}

async function fetchBlockerStats(): Promise<BlockerStats> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const data = await graphql(`query ($since: timestamptz!) {
        total: blockers_aggregate { aggregate { count } }
        recent: blockers_aggregate(where: { created_at: { _gte: $since } }) { aggregate { count } }
    }`, { since });
    const total = data.total?.aggregate?.count;
    const last30d = data.recent?.aggregate?.count;
    if (typeof total !== 'number' || typeof last30d !== 'number') throw new Error('Equalify GraphQL: unexpected shape');
    return { total, last30d };
}

function isStats(v: any): v is BlockerStats {
    return typeof v?.total === 'number' && typeof v?.last30d === 'number';
}

export async function getBlockerStats(): Promise<BlockerStats> {
    const cached = await getGitHubCache(CACHE_KEY);
    if (isStats(cached)) return cached;

    try {
        const stats = await fetchBlockerStats();
        await setGitHubCache(CACHE_KEY, stats);
        return stats;
    } catch (error) {
        console.error('Error fetching Equalify blocker stats:', error);
        const stale = await getStaleGitHubCache(CACHE_KEY);
        return isStats(stale) ? stale : FALLBACK;
    }
}
