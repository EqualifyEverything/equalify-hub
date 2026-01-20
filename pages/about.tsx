import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

export const AboutPage: FC = () => {
    const user = getCurrentUser();
    
    return (
        <Layout title="About" user={user}>
            <div class="max-w-[640px] mx-auto px-5 py-12 pb-20">
                <h1 class="text-3xl font-semibold mb-8 text-[var(--color-text)]">About</h1>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    <strong>Equalify Open Source</strong> is a developer tool for the <a href="https://github.com/EqualifyEverything">EqualifyEverything</a> organization.
                </p>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    This tool helps developers track issues, view repositories, and aggregate stats across Equalify's open source projects. It's built to make contributing to accessibility tooling easier.
                </p>
                
                <p class="text-[var(--color-text)] mb-5 text-[15px] leading-relaxed">
                    <a href="https://app.equalify.uic.edu">Equalify</a> is on a mission to make the web accessible to everyone. Our open source tools help organizations identify and fix accessibility issues at scale.
                </p>

                <div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-6 my-8">
                    <h2 class="text-lg font-semibold mb-4 text-[var(--color-text)]">What you can do here:</h2>
                    <ul class="pl-5 list-disc">
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Browse repositories</strong> – View all EqualifyEverything repos and their details</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Track issues</strong> – See open issues across all projects</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">View stats</strong> – Aggregate metrics for the organization</li>
                        <li class="text-[var(--color-text-secondary)] my-2"><strong class="text-[var(--color-text)]">Read code</strong> – Fast, lightweight code browsing</li>
                    </ul>
                </div>

                <p class="text-[var(--color-text-secondary)] mb-5 text-[15px] leading-relaxed">
                    Questions? Something broken? <a href="https://github.com/EqualifyEverything/equalifyuic-opensource-tool/issues">Open an issue</a>.
                </p>

                <div class="flex items-center gap-4 mt-10 pt-6 border-t border-[var(--color-border)]">
                    <img 
                        src="https://github.com/EqualifyEverything.png" 
                        alt="EqualifyEverything" 
                        class="w-16 h-16 rounded-md border-2 border-[var(--color-border)]"
                    />
                    <div class="flex-1">
                        <div class="font-semibold text-[var(--color-text)]">
                            <a href="https://app.equalify.uic.edu">Equalify</a>
                        </div>
                        <div class="text-[13px] text-[var(--color-text-secondary)]">
                            Making the web accessible to everyone
                        </div>
                        <div class="text-[13px] text-[var(--color-text-secondary)]">
                            Built by <a href="https://uic.edu">UIC</a>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
