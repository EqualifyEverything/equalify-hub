import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import config from '#src/utils/config';

export const AboutPage: FC = () => {
    const user = getCurrentUser();
    
    return (
        <Layout title="About" user={user}>
            <div class="max-w-[640px] mx-auto px-5 py-12 pb-20">
                <h1 class="text-3xl font-semibold mb-8 text-[var(--color-text)]">About Equalify Hub</h1>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    <strong>Equalify Hub</strong> is the central hub for the <a href="https://github.com/EqualifyEverything">EqualifyEverything</a> project – organizing documentation, repositories, contribution guides, and support resources in one accessible place.
                </p>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    This hub supports our transition efforts by providing a single place for Equalify support (not just bugs), tracking development progress, and helping both internal teams and external contributors stay aligned.
                </p>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    <a href={config.equalifyAppUrl}>Equalify</a> is on a mission to make the web accessible to everyone. Our open source tools help organizations identify and fix accessibility issues at scale.
                </p>

                <div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-6 my-8">
                    <h2 class="text-lg font-semibold mb-4 text-[var(--color-text)]">For the Transition Team</h2>
                    <ul class="pl-5 list-disc mb-6">
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Support resources</strong> – Central place for all Equalify support, not limited to bugs</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">KPI dashboards</strong> – Track key metrics and development progress</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Issue tracking</strong> – Aggregate view across all repositories</li>
                    </ul>
                    
                    <h2 class="text-lg font-semibold mb-4 text-[var(--color-text)]">For Documentation Contributors</h2>
                    <ul class="pl-5 list-disc mb-6">
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">User documentation</strong> – Help end users learn how the app works</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Technical documentation</strong> – API docs, code structure, architecture</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Easy contribution</strong> – Just sign in with GitHub and use basic markdown</li>
                    </ul>
                    
                    <h2 class="text-lg font-semibold mb-4 text-[var(--color-text)]">For Developers</h2>
                    <ul class="pl-5 list-disc">
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Browse repositories</strong> – View all EqualifyEverything repos and their details</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Contribution guides</strong> – Learn how to contribute to Equalify</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Read code</strong> – Fast, lightweight code browsing</li>
                    </ul>
                </div>

                <div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-6 my-8">
                    <h2 class="text-lg font-semibold mb-4 text-[var(--color-text)]">How to Contribute Documentation</h2>
                    <p class="text-[var(--color-text-secondary)] mb-4 text-[14px]">
                        Contributing documentation is simple – no advanced Git knowledge required:
                    </p>
                    <ol class="pl-5 list-decimal">
                        <li class="text-[var(--color-text-secondary)] my-2">Sign in with your GitHub account (must be part of EqualifyEverything org)</li>
                        <li class="text-[var(--color-text-secondary)] my-2">Create or edit documentation using standard Markdown</li>
                        <li class="text-[var(--color-text-secondary)] my-2">Submit your changes – that's it!</li>
                    </ol>
                </div>

                <p class="text-[var(--color-text-secondary)] mb-5 text-[15px] leading-relaxed">
                    Questions? Need support? <a href="https://github.com/EqualifyEverything/equalifyuic-opensource-tool/issues">Open an issue</a> or reach out to the team.
                </p>

                <div class="flex items-center gap-4 mt-10 pt-6 border-t border-[var(--color-border)]">
                    <img 
                        src={config.orgLogo}
                        alt={config.githubOrg}
                        class="w-16 h-16 rounded-md border-2 border-[var(--color-border)]"
                    />
                    <div class="flex-1">
                        <div class="font-semibold text-[var(--color-text)]">
                            <a href={config.equalifyAppUrl}>Equalify</a>
                        </div>
                        <div class="text-[13px] text-[var(--color-text-secondary)]">
                            Making the web accessible to everyone
                        </div>
                        <div class="text-[13px] text-[var(--color-text-secondary)]">
                            Built by <a href="https://uic.edu">UIC</a> Digital Accessibility
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
