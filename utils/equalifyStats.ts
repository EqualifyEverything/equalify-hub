import { getGitHubCache, getStaleGitHubCache, setGitHubCache } from '#src/utils/db';
import config from '#src/utils/config';

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

// Fresh cache (1 min) → fetch → cache; on failure, the stale copy (up to 7 days) or `fallback`.
async function cachedJson<T>(key: string, fetcher: () => Promise<T>, isValid: (v: any) => v is T, fallback: T): Promise<T> {
    const cached = await getGitHubCache(key);
    if (isValid(cached)) return cached;
    try {
        const fresh = await fetcher();
        await setGitHubCache(key, fresh);
        return fresh;
    } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        const stale = await getStaleGitHubCache(key);
        return isValid(stale) ? stale : fallback;
    }
}

export async function getBlockerStats(): Promise<BlockerStats> {
    return cachedJson(CACHE_KEY, fetchBlockerStats, isStats, FALLBACK);
}

// ─── Platform KPIs (GET /public/getPublicStats) ───────────────────────────────
// Shapes mirror apps/backend/utils/kpis.ts in the equalify repo, the one place
// every platform KPI is defined. The hub shows the last full month by default
// (`lastFullMonth`) and can show the live figures (`live`) on request.

export interface PublicMonthlyKpi {
    month: string;        // YYYY-MM (UTC)
    sessions: number;
    activeUsers: number;
    unitsServed: number;
    scanRuns: number;
    htmlScans: number;    // page scans started
    pdfScans: number;     // document scans started
    newUsers: number;
    newAudits: number;
    partial: boolean;     // the current, incomplete month
}

export interface PublicRemediationKpi { month: string; auditsRescanned: number; resolvedIssues: number; newIssues: number; computedAt: string }

export interface PublicStats {
    generatedAt: string;
    live: {
        totalUsers: number;
        newUsers30d: number;
        activeUsers30d: number;
        unitsServed30d: number;
        auditOwners: number;
        totalAudits: number;
        totalUrls: number;
        totalBlockers: number;
        scanRuns30d: number;
        htmlScans30d: number;
        pdfScans30d: number;
    };
    monthly: PublicMonthlyKpi[];
    snapshot: {
        computedAt: string;
        adoption: { uicHostsTracked: number; redSitesTracked: number; redSitesScanned30d: number; redSiteOwners: number; redHostsPending: number; computedAt: string } | null;
        conformance: { monitoredPages: number; conformantPages: number; conformantShare: number; openBlockers: number; openBlockersLevelA: number; openBlockersLevelAA: number; computedAt: string } | null;
        remediation: PublicRemediationKpi | null;              // current month to date
        remediationPreviousMonth: PublicRemediationKpi | null; // last full month
    } | null;
    redSitesTotal: { total: number; asOf: string; source?: string } | null;
}

const PUBLIC_STATS_CACHE_KEY = 'equalify-stats://public';

const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v);

function isPublicStats(v: any): v is PublicStats {
    if (!v || typeof v.generatedAt !== 'string' || !Array.isArray(v.monthly)) return false;
    const live = v.live;
    if (!live || !['totalUsers', 'activeUsers30d', 'totalAudits', 'totalUrls', 'htmlScans30d', 'pdfScans30d'].every((k) => isNum(live[k]))) return false;
    return v.monthly.every((m: any) => m && typeof m.month === 'string' && typeof m.partial === 'boolean'
        && ['sessions', 'activeUsers', 'unitsServed', 'scanRuns', 'htmlScans', 'pdfScans', 'newUsers', 'newAudits'].every((k) => isNum(m[k])));
}

async function fetchPublicStats(timeoutMs: number): Promise<PublicStats> {
    const response = await fetch(`${config.equalifyApiUrl}/public/getPublicStats`, {
        headers: { 'User-Agent': 'Equalify-Hub' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Equalify API HTTP ${response.status}`);
    const json = await response.json();
    if (!isPublicStats(json)) throw new Error('Equalify API: unexpected getPublicStats shape');
    return json;
}

/**
 * Platform KPIs for a page render: cached like the GitHub responses (1 min fresh,
 * 7 day stale fallback) with a short timeout so an API outage can't stall the page.
 * Returns null if nothing is available.
 */
export async function getPublicStats(): Promise<PublicStats | null> {
    return cachedJson<PublicStats | null>(PUBLIC_STATS_CACHE_KEY, () => fetchPublicStats(4_000), isPublicStats, null);
}

/**
 * Platform KPIs for the monthly report: always fetched fresh (a stale copy could
 * carry last week's partial figures), null if the API can't be reached.
 */
export async function getPublicStatsFresh(): Promise<PublicStats | null> {
    try {
        const stats = await fetchPublicStats(15_000);
        await setGitHubCache(PUBLIC_STATS_CACHE_KEY, stats);
        return stats;
    } catch (error) {
        console.error('Error fetching Equalify public stats (fresh):', error);
        return null;
    }
}

/** The most recent complete calendar month, or null if the series is empty. */
export function lastFullMonth(stats: PublicStats): PublicMonthlyKpi | null {
    const full = stats.monthly.filter((m) => !m.partial);
    return full.length ? full[full.length - 1] : null;
}

export function formatMonthLabel(month: string): string {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
