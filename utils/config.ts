/**
 * Configuration for Equalify Hub
 * 
 * These values can be customized via environment variables when deploying
 * your own instance of Equalify Hub. Set these in your Lambda environment
 * variables or in a local .env file for development.
 */

// Site configuration
export const config = {
    /**
     * The name of this Hub instance
     * @default "Equalify Hub"
     */
    siteName: process.env.SITE_NAME || 'Equalify Hub',

    /**
     * The URL of the Equalify app this Hub connects to
     * Used for "Sign into Equalify" links and favicon
     * @default "https://app.equalify.uic.edu"
     */
    equalifyAppUrl: process.env.EQUALIFY_APP_URL || 'https://app.equalify.uic.edu',

    /**
     * The GitHub organization to display repos/issues from
     * @default "EqualifyEverything"
     */
    githubOrg: process.env.GITHUB_ORG || 'EqualifyEverything',

    /**
     * The favicon URL for the site
     * Defaults to the Equalify app's favicon
     */
    get favicon() {
        return process.env.FAVICON_URL || `${this.equalifyAppUrl}/favicon.ico`;
    },

    /**
     * The organization logo URL (shown in header)
     * Defaults to the GitHub org's avatar
     */
    get orgLogo() {
        return process.env.ORG_LOGO_URL || `https://github.com/${this.githubOrg}.png`;
    },
};

export default config;
