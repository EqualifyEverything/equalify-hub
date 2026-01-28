import { readFileSync } from 'fs';

// Custom loader to handle .css imports as text (like esbuild --loader:.css=text)
export async function load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
        const filePath = new URL(url).pathname;
        // Handle Windows paths (remove leading slash for drive letters)
        const normalizedPath = process.platform === 'win32' && filePath.match(/^\/[A-Z]:/)
            ? filePath.slice(1)
            : filePath;
        const content = readFileSync(normalizedPath, 'utf-8');
        return {
            format: 'module',
            shortCircuit: true,
            source: `export default ${JSON.stringify(content)};`,
        };
    }
    return nextLoad(url, context);
}
