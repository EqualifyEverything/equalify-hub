/**
 * Where the Hub reads its markdown content from.
 *
 * Product docs (User Guide + Technical Documentation) live in the main
 * `equalify` repo under `docs/`, so they can be updated in the same PR as the
 * code they describe. That repo is the source of truth for them.
 *
 * Hub-only content (Reflow docs, monthly reports, news updates) still lives in
 * the `equalify-docs` repo.
 *
 * Both sources can be overridden via environment variables (see .env.example),
 * e.g. to preview a docs branch locally.
 */

import config from './config';

export type DocsSource = {
    /** Repository name within config.githubOrg */
    repo: string;
    /** Folder inside the repo that holds the docs ('' for repo root) */
    basePath: string;
    /** Branch, tag, or commit to read from */
    ref: string;
};

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');

/** User Guide + Technical Documentation — EqualifyEverything/equalify/docs */
export const productDocs: DocsSource = {
    repo: process.env.PRODUCT_DOCS_REPO || 'equalify',
    basePath: trimSlashes(process.env.PRODUCT_DOCS_PATH ?? 'docs'),
    ref: process.env.PRODUCT_DOCS_REF || 'main',
};

/** Reflow docs, monthly reports, news updates — EqualifyEverything/equalify-docs */
export const hubDocs: DocsSource = {
    repo: process.env.HUB_DOCS_REPO || 'equalify-docs',
    basePath: trimSlashes(process.env.HUB_DOCS_PATH ?? ''),
    ref: process.env.EQUALIFY_DOCS_REF || 'main',
};

// Encode each path segment individually so slashes survive but spaces etc. don't break the URL
function encodePath(path: string): string {
    return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

/**
 * GitHub Contents API URL for a file or folder within a docs source.
 * Pass raw (un-encoded) folder/file names — encoding is handled here.
 */
export function contentsUrl(source: DocsSource, path: string = ''): string {
    const fullPath = [source.basePath, trimSlashes(path)].filter(Boolean).join('/');
    return `https://api.github.com/repos/${config.githubOrg}/${source.repo}/contents/${encodePath(fullPath)}?ref=${encodeURIComponent(source.ref)}`;
}

/**
 * GitHub Git Trees API URL listing every path in the source's ref (recursive).
 * Paths in the response are relative to the repo root, not `basePath`.
 */
export function treeUrl(source: DocsSource): string {
    return `https://api.github.com/repos/${config.githubOrg}/${source.repo}/git/trees/${encodeURIComponent(source.ref)}?recursive=1`;
}
