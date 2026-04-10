/**
 * Internal route: Generate monthly development report from GitHub standup issues
 *
 * Invocation:
 *   - Lambda Test event: { "report": { "issueNumber": 587, "month": "2026-03" } }
 *   - POST /internal/generate-report (with JSON body)
 *
 * Reads a GitHub issue + its full edit history, tracks checkbox completion,
 * and generates a structured markdown report with KPIs.
 *
 * When GITHUB_REPORT_TOKEN is set, can push the report directly to
 * equalify-docs/reports/ via GitHub Contents API.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import config from '#src/utils/config';

const OWNER = config.githubOrg;
const DOCS_REPO = 'equalify-docs';
const MAIN_REPO = 'equalify';

// GitHub username → display name for faculty-facing reports
const CONTRIBUTORS: Record<string, string> = {
    'heythisischris': 'C. Aitken',
    'azdak': 'T. Daniel',
    'bbertucc': 'B. Bertuccelli-Booth',
    'dylan-isaac': 'D. Isaac',
    'a11ydoer': 'J. Ku',
};

// Accounts to exclude from git activity stats (test/bot accounts)
const EXCLUDED_ACCOUNTS = new Set(['equalifyuic1', 'equalifyuic3']);

function displayName(username: string): string {
    return CONTRIBUTORS[username] || username;
}

function replaceHandles(text: string): string {
    return text.replace(/@(\w+)/g, (_, username) => displayName(username));
}

// ── GitHub GraphQL fetch ──────────────────────────────────────────────────────

async function githubGraphQL(query: string, token: string): Promise<any> {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'EqualifyHub-ReportGenerator',
        },
        body: JSON.stringify({ query }),
    });
    return response.json();
}

async function githubREST(url: string, token: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'EqualifyHub-ReportGenerator',
            ...options.headers as Record<string, string>,
        },
    });
    return response.json();
}

// ── Fetch issue with edit history ─────────────────────────────────────────────

async function fetchIssueWithEdits(issueNumber: number, token: string) {
    const query = `{
  repository(owner: "${OWNER}", name: "${MAIN_REPO}") {
    issue(number: ${issueNumber}) {
      title
      createdAt
      updatedAt
      body
      author { login }
      assignees(first: 10) { nodes { login } }
      labels(first: 10) { nodes { name } }
      userContentEdits(first: 100) {
        totalCount
        nodes {
          editedAt
          diff
          editor { login }
        }
      }
      comments(first: 50) {
        nodes {
          body
          createdAt
          author { login }
        }
      }
    }
  }
}`;
    const result = await githubGraphQL(query, token);
    if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    const issue = result.data?.repository?.issue;
    if (!issue) throw new Error(`Issue #${issueNumber} not found`);
    issue.number = issueNumber;
    return issue;
}

// ── Checkbox parsing ──────────────────────────────────────────────────────────

interface Task {
    text: string;
    checked: boolean;
    assignee: string;
    category: string;
}

function parseCheckboxes(body: string): Task[] {
    const tasks: Task[] = [];
    const lines = body.split('\n');

    let currentAssignee = '';
    let currentCategory = '';

    for (const line of lines) {
        // Detect assignee sections
        const assigneeMatch = line.match(/^@(\w+)\s+To\s+Dos?:/i);
        if (assigneeMatch) {
            currentAssignee = assigneeMatch[1];
            continue;
        }

        // Detect category headers — reset assignee when entering a new section
        if (line.match(/^#{1,3}\s+/)) {
            currentCategory = line.replace(/^#{1,3}\s+/, '').trim();
            currentAssignee = '';
            continue;
        }

        // Parse checkboxes (any indent level)
        const checkMatch = line.match(/^\s*- \[([ x])\]\s+(.+)/);
        if (checkMatch) {
            tasks.push({
                text: checkMatch[2].trim(),
                checked: checkMatch[1] === 'x',
                assignee: currentAssignee,
                category: currentCategory,
            });
        }
    }

    return tasks;
}

// ── Diff analysis ─────────────────────────────────────────────────────────────

function analyzeEditHistory(edits: any[]) {
    // Edits come newest-first from GraphQL; reverse to chronological
    const sorted = [...edits].filter(e => e.diff).reverse();
    if (sorted.length < 2) return { tasksCompleted: 0, tasksAdded: 0 };

    const firstTasks = parseCheckboxes(sorted[0].diff);
    const lastTasks = parseCheckboxes(sorted[sorted.length - 1].diff);

    const firstTexts = new Set(firstTasks.map(t => t.text));

    const tasksCompleted = lastTasks.filter(t =>
        t.checked && !firstTasks.find(ft => ft.text === t.text && ft.checked)
    ).length;

    const tasksAdded = lastTasks.filter(t => !firstTexts.has(t.text)).length;

    return { tasksCompleted, tasksAdded };
}

// ── Clean task text for display ───────────────────────────────────────────────

function cleanTaskText(text: string): string {
    return text
        .replace(/\(@\w+\s+proposed\s+[\d/]+\)\s*/g, '')
        .replace(/\(@\w+\s*\/\s*@\w+\s+proposed\s+[\d/]+\)\s*/g, '')
        .replace(/\(From\s+[\d/]+.*?\)\s*/g, '')
        .replace(/\([\d/]+\s+roadmap meeting\)\s*/g, '')
        .replace(/\(Michael\s+[\d/]+\)\s*/g, '')
        .replace(/\(proposed\s+[\d/]+\)\s*/g, '')
        .replace(/https:\/\/github\.com\/\S+\/issues\/(\d+)/g, '#$1')
        .replace(/#(\d+)\s+/g, '#$1 ')
        .replace(/^\*\*(.+?)\*\*:?/, '$1')
        .replace(/:\s*$/, '')
        .replace(/@(\w+)/g, (_, u) => displayName(u))
        .trim();
}

// ── Git activity across org repos ─────────────────────────────────────────────

interface GitActivity {
    totalCommits: number;
    commitsByContributor: Map<string, number>;
    activeRepos: Map<string, number>;
    topCommitMessages: string[];
}

async function fetchGitActivity(token: string, since: string, until: string): Promise<GitActivity> {
    const activity: GitActivity = {
        totalCommits: 0,
        commitsByContributor: new Map(),
        activeRepos: new Map(),
        topCommitMessages: [],
    };

    // Fetch org repos
    const repos = await githubREST(
        `https://api.github.com/orgs/${OWNER}/repos?per_page=100&sort=pushed&direction=desc`,
        token
    );

    if (!Array.isArray(repos)) {
        console.error('[REPORT] Failed to fetch repos:', JSON.stringify(repos));
        return activity;
    }

    // Filter to repos pushed within our window (rough filter)
    const sinceDate = new Date(since);
    const activeRepos = repos.filter((r: any) =>
        new Date(r.pushed_at) >= sinceDate && !r.archived
    );

    console.log(`[REPORT] Scanning ${activeRepos.length} active repos for git activity...`);

    // Fetch commits for each active repo in parallel
    await Promise.all(activeRepos.map(async (repo: any) => {
        const repoName = repo.name;
        let repoCommits = 0;

        // Fetch commits on default branch (main/staging)
        for (const branch of ['main', 'staging']) {
            try {
                const commits = await githubREST(
                    `https://api.github.com/repos/${OWNER}/${repoName}/commits?sha=${branch}&since=${since}&until=${until}&per_page=100`,
                    token
                );
                if (!Array.isArray(commits)) continue;

                for (const commit of commits) {
                    const author = commit.author?.login || commit.commit?.author?.name || 'unknown';

                    // Skip test/bot accounts
                    if (EXCLUDED_ACCOUNTS.has(author)) continue;

                    activity.commitsByContributor.set(author, (activity.commitsByContributor.get(author) || 0) + 1);
                    repoCommits++;

                    // Collect meaningful commit messages (skip merge commits)
                    const msg = commit.commit?.message || '';
                    if (!msg.startsWith('Merge') && msg.length > 10) {
                        activity.topCommitMessages.push(`[${repoName}] ${msg.split('\n')[0]}`);
                    }
                }
            } catch { /* branch doesn't exist */ }
        }

        if (repoCommits > 0) {
            activity.activeRepos.set(repoName, repoCommits);
        }

        activity.totalCommits += repoCommits;
    }));

    // Keep only top 20 most recent commit messages for context
    activity.topCommitMessages = activity.topCommitMessages.slice(0, 20);

    console.log(`[REPORT] Git activity: ${activity.totalCommits} commits across ${activity.activeRepos.size} repos`);

    return activity;
}

// ── Report markdown generation ────────────────────────────────────────────────

function generateReportMarkdown(issues: any[], month: string, gitActivity?: GitActivity): string {
    // Merge data from all issues
    let allTasks: Task[] = [];
    let allComments: any[] = [];
    let allAssignees = new Set<string>();
    let totalEdits = 0;
    let totalTasksAdded = 0;

    for (const issue of issues) {
        allTasks.push(...parseCheckboxes(issue.body));
        allComments.push(...(issue.comments.nodes || []).map((c: any) => ({ ...c, issueNumber: issue.number })));
        issue.assignees.nodes.forEach((a: any) => allAssignees.add(a.login));
        totalEdits += issue.userContentEdits.totalCount;
        totalTasksAdded += analyzeEditHistory(issue.userContentEdits.nodes).tasksAdded;
    }

    // Deduplicate tasks by text (same task may appear across issues)
    const seen = new Set<string>();
    allTasks = allTasks.filter(t => {
        if (seen.has(t.text)) return false;
        seen.add(t.text);
        return true;
    });

    // Sort comments by date
    allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const completed = allTasks.filter(t => t.checked);
    const remaining = allTasks.filter(t => !t.checked);
    // Completion rate excludes newly added tasks — measures throughput against original scope
    const originalScope = allTasks.length - totalTasksAdded;
    const completionRate = originalScope > 0
        ? Math.round((completed.length / originalScope) * 100)
        : 0;

    const displayMonth = new Date(month + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Group completed tasks by assignee
    const completedByAssignee = new Map<string, Task[]>();
    for (const t of completed) {
        const key = t.assignee || 'Team';
        if (!completedByAssignee.has(key)) completedByAssignee.set(key, []);
        completedByAssignee.get(key)!.push(t);
    }

    // Group remaining by section
    const remainingByCategory = new Map<string, Task[]>();
    for (const t of remaining) {
        const key = t.category || 'Outstanding';
        if (!remainingByCategory.has(key)) remainingByCategory.set(key, []);
        remainingByCategory.get(key)!.push(t);
    }

    // Date range across all issues
    const dates = issues.flatMap(i => [new Date(i.createdAt), new Date(i.updatedAt)]);
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));

    // Build markdown
    let md = '';

    // Frontmatter
    md += `---\n`;
    md += `title: "${displayMonth} Development Report"\n`;
    md += `date: ${month}-01\n`;
    md += `description: "Monthly development progress report for ${displayMonth}"\n`;
    md += `author: "Equalify Team"\n`;
    md += `---\n\n`;

    // Header
    md += `# ${displayMonth} Development Report\n\n`;

    const startDate = earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    md += `**Reporting period:** ${startDate} – ${endDate}  \n`;

    // Source links
    if (issues.length === 1) {
        md += `**Source:** [${issues[0].title}](https://github.com/${OWNER}/${MAIN_REPO}/issues/${issues[0].number})  \n`;
    } else {
        const links = issues.map(i => `[#${i.number}](https://github.com/${OWNER}/${MAIN_REPO}/issues/${i.number})`).join(', ');
        md += `**Sources:** ${links}  \n`;
    }
    md += `**Contributors:** ${[...allAssignees].map(a => displayName(a)).join(', ')}\n\n`;

    // KPI Table
    md += `## Key Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Tasks completed | **${completed.length}** |\n`;
    md += `| Tasks remaining | ${remaining.length} |\n`;
    md += `| New tasks added | ${totalTasksAdded} |\n`;
    md += `| Completion rate | **${completionRate}%** |\n`;
    if (gitActivity) {
        md += `| Code commits | **${gitActivity.totalCommits}** |\n`;
        md += `| Repositories with activity | **${gitActivity.activeRepos.size}** |\n`;
    }
    md += `| Issue edits (activity) | ${totalEdits} |\n`;
    if (issues.length > 1) {
        md += `| Source issues | ${issues.length} |\n`;
    }
    md += `\n`;

    // Development activity breakdown
    if (gitActivity && gitActivity.totalCommits > 0) {
        md += `## Development Activity\n\n`;

        // Per-contributor commit stats
        md += `### Contributor Activity\n\n`;
        md += `| Contributor | Commits |\n`;
        md += `|------------|--------|\n`;
        const sortedContributors = [...gitActivity.commitsByContributor.entries()].sort((a, b) => b[1] - a[1]);
        for (const [username, commits] of sortedContributors) {
            md += `| ${displayName(username)} | ${commits} |\n`;
        }
        md += `\n`;

        // Active repos
        md += `### Active Repositories\n\n`;
        md += `| Repository | Commits |\n`;
        md += `|-----------|--------|\n`;
        const sortedRepos = [...gitActivity.activeRepos.entries()].sort((a, b) => b[1] - a[1]);
        for (const [repoName, commits] of sortedRepos) {
            md += `| [${repoName}](https://github.com/${OWNER}/${repoName}) | ${commits} |\n`;
        }
        md += `\n`;

        // Notable commit messages for Claude to use as context
        if (gitActivity.topCommitMessages.length > 0) {
            md += `### Recent Commit Highlights\n\n`;
            for (const msg of gitActivity.topCommitMessages) {
                md += `- ${msg}\n`;
            }
            md += `\n`;
        }
    }

    // Completed work
    md += `## Completed Work\n\n`;
    for (const [assignee, tasks] of completedByAssignee) {
        md += `### ${displayName(assignee)}\n\n`;
        for (const t of tasks) {
            md += `- ${cleanTaskText(t.text)}\n`;
        }
        md += `\n`;
    }

    // Notable events from comments
    if (allComments.length > 0) {
        md += `## Notable Events\n\n`;
        for (const c of allComments) {
            const date = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const firstLine = c.body.split('\n').filter((l: string) => l.trim())[0] || '';
            md += `- **${date}** (${displayName(c.author.login)}): ${firstLine.substring(0, 250)}\n`;
        }
        md += `\n`;
    }

    // Remaining work — skip Future Sprints and Backlog for the main section
    const priorityRemaining = [...remainingByCategory.entries()]
        .filter(([cat]) => !cat.match(/Future|Backlog|FOSS|Design|Onboard/i));

    if (priorityRemaining.length > 0) {
        md += `## In Progress & Upcoming\n\n`;
        for (const [category, tasks] of priorityRemaining) {
            md += `### ${category}\n\n`;
            for (const t of tasks) {
                const owner = t.assignee ? ` _(${displayName(t.assignee)})_` : '';
                md += `- ${cleanTaskText(t.text)}${owner}\n`;
            }
            md += `\n`;
        }
    }

    // Future sprints summary
    const futureCategories = [...remainingByCategory.entries()]
        .filter(([cat]) => cat.match(/Future|FOSS|Design|Onboard/i));

    if (futureCategories.length > 0) {
        md += `## Planned Sprints\n\n`;
        for (const [category, tasks] of futureCategories) {
            if (!category.match(/Future/i)) {
                md += `### ${category}\n\n`;
            }
            for (const t of tasks) {
                md += `- ${cleanTaskText(t.text)}\n`;
            }
            md += `\n`;
        }
    }

    return md;
}

// ── Fetch previous month's published report ──────────────────────────────────

async function fetchPreviousReport(month: string, token: string): Promise<string | null> {
    const date = new Date(month + '-15');
    date.setMonth(date.getMonth() - 1);
    const prevMonth = date.toISOString().substring(0, 7); // YYYY-MM
    const path = `reports/${prevMonth}.md`;
    const apiUrl = `https://api.github.com/repos/${OWNER}/${DOCS_REPO}/contents/${path}`;

    try {
        const result = await githubREST(apiUrl, token);
        if (result.content) {
            return Buffer.from(result.content, 'base64').toString('utf-8');
        }
    } catch { /* file doesn't exist */ }

    console.log(`[REPORT] No previous report found at ${DOCS_REPO}/${path}`);
    return null;
}

// ── Polish with Claude via Bedrock ────────────────────────────────────────────

async function polishReport(rawMarkdown: string, month: string, token: string): Promise<string> {
    const client = new BedrockRuntimeClient({ region: 'us-east-2' });

    const previousReport = await fetchPreviousReport(month, token);

    const referenceSection = previousReport
        ? `
17. **Match the tone, structure, and style of last month's published report** shown in the reference below. Use it as a template for section ordering, sentence style, and level of detail.

## Reference: Last month's published report

${previousReport}

## End of reference`
        : '';

    const prompt = `You are a technical writer preparing a monthly development progress report for university faculty and stakeholders at UIC (University of Illinois Chicago). Equalify is a web accessibility scanning platform.

Take the raw markdown report below and rewrite it into a polished, professional document. Follow these rules:

1. **Keep the frontmatter (--- block) exactly as-is** — do not modify it
2. **Add an Executive Summary** immediately after the H1 title and reporting period metadata, before Key Metrics. This should be 2-3 sentences summarizing the month's most important achievements and overall trajectory. Write it in a confident, positive tone appropriate for university leadership.
3. **Add a Highlights section** (## Highlights) right after the Executive Summary, before Key Metrics. List the 3-5 most impactful completed items as concise bullet points. Pick items that would resonate with non-technical stakeholders — launches, user-facing features, stability improvements.
4. **Key Metrics table**: Keep the structure and numbers exactly as-is, BUT if "New tasks added" is significant relative to "Tasks remaining", add an italic note below the table like: *(Note: X new tasks were identified and added during the reporting period, which accounts for the expanded backlog.)*
5. **Keep all section headers** (## Completed Work, ## Notable Events, etc.)
6. **Rewrite task descriptions** into clear, concise, professional language:
   - Remove GitHub jargon, internal shorthand, and developer slang
   - Turn checkbox-style fragments into complete sentences
   - Group related items where it makes sense (e.g., multiple CSV subtasks → one bullet about the CSV integration feature)
   - Use plain language a non-technical stakeholder can understand
7. **Notable Events**: Only include substantive events (bug fixes, outages, infrastructure changes, milestones). Remove internal housekeeping like sprint issue consolidation or renumbering — faculty don't need to see that.
8. **Add a Risks & Blockers section** (## Risks & Blockers) after Notable Events. Extract any ongoing issues, outages, or concerns from the report (e.g., hung scans, performance incidents) and present them as 2-4 concise bullets with current status. If there are no risks, write "No critical blockers at this time."
9. **In Progress & Upcoming**: Merge ALL outstanding/upcoming items into a single flat list under "## In Progress & Upcoming" — do NOT create duplicate subsections. Use clear subcategories if needed (e.g., ### Development, ### Operations) but never repeat a heading like "### Outstanding" twice.
10. **Rename "### New" subsections** to "### Newly Identified Work" or "### Backlog Additions" — "New" is too vague for a formal report.
11. **Development Activity section**: Keep the Contributor Activity and Active Repositories tables exactly as-is (these are computed from git data). For "Recent Commit Highlights", rewrite the raw commit messages into 5-8 polished bullet points that describe the most significant changes in plain language. Group related commits together. Drop trivial commits (typo fixes, version bumps, merge commits). Frame them positively as accomplishments.
12. **For Planned Sprints**, summarize each sprint's goals in 1-2 sentences instead of listing individual tasks
13. **Do not invent information** — only rewrite what's there
14. **Do not add emoji**
15. **Keep contributor names** (e.g., "C. Aitken", "T. Daniel") exactly as-is — do not convert them to GitHub @mentions
16. Output ONLY the polished markdown — no commentary, no code fences${referenceSection}

Raw report to polish:

${rawMarkdown}`;

    const response = await client.send(new InvokeModelCommand({
        modelId: 'us.anthropic.claude-opus-4-6-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 16000,
            thinking: {
                type: 'enabled',
                budget_tokens: 10000,
            },
            messages: [{ role: 'user', content: prompt }],
        }),
    }));

    const body = JSON.parse(new TextDecoder().decode(response.body));
    // With thinking enabled, response has thinking blocks + text blocks
    const textBlock = body.content?.find((b: any) => b.type === 'text');
    const polished = textBlock?.text;

    if (!polished) {
        console.error('[REPORT] Bedrock returned no content:', JSON.stringify(body));
        throw new Error('Bedrock returned empty response');
    }

    return polished;
}

// ── Push to GitHub ────────────────────────────────────────────────────────────

async function pushReportToGitHub(markdown: string, slug: string, token: string): Promise<{ url: string; status: string }> {
    const path = `reports/${slug}.md`;
    const apiUrl = `https://api.github.com/repos/${OWNER}/${DOCS_REPO}/contents/${path}`;

    // Check if file already exists (to get sha for update)
    let sha: string | undefined;
    try {
        const existing = await githubREST(apiUrl, token);
        if (existing.sha) sha = existing.sha;
    } catch { /* file doesn't exist yet */ }

    const body: Record<string, string> = {
        message: `Add ${slug} report`,
        content: Buffer.from(markdown).toString('base64'),
        branch: 'main',
    };
    if (sha) body.sha = sha;

    const result = await githubREST(apiUrl, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (result.content?.html_url) {
        return { url: result.content.html_url, status: 'pushed' };
    }

    return { url: '', status: result.message || 'unknown error' };
}

// ── Main handler ──────────────────────────────────────────────────────────────

interface ReportRequest {
    issueNumber: number | number[];  // Single issue or multiple issues to merge
    month?: string;                  // YYYY-MM, defaults to earliest issue creation month
    polish?: boolean;                // Rewrite with Claude via Bedrock for faculty-ready language
    push?: boolean;                  // Push to equalify-docs repo (requires GITHUB_REPORT_TOKEN)
}

export async function generateReport(params: ReportRequest) {
    const token = process.env.GITHUB_FALLBACK_TOKEN_1
        || process.env.GITHUB_REPORT_TOKEN
        || '';

    if (!token) {
        return { error: 'No GitHub token configured' };
    }

    // Normalize to array
    const issueNumbers = Array.isArray(params.issueNumber) ? params.issueNumber : [params.issueNumber];

    // Fetch all issues in parallel
    const issues = await Promise.all(
        issueNumbers.map(async (num) => {
            console.log(`[REPORT] Fetching issue #${num}...`);
            const issue = await fetchIssueWithEdits(num, token);
            console.log(`[REPORT] "#${num}: ${issue.title}" — ${issue.userContentEdits.totalCount} edits, ${issue.comments.nodes.length} comments`);
            return issue;
        })
    );

    const month = params.month || issues[0].createdAt.substring(0, 7);
    const slug = `${month}-development-report`;

    // Fetch git activity across the org for the reporting period (goes back ~2 months for context)
    const monthDate = new Date(month + '-01');
    const sinceDate = new Date(monthDate);
    sinceDate.setMonth(sinceDate.getMonth() - 1); // Start 1 month before
    const untilDate = new Date(monthDate);
    untilDate.setMonth(untilDate.getMonth() + 1); // End of reporting month
    const gitActivity = await fetchGitActivity(
        token,
        sinceDate.toISOString(),
        untilDate.toISOString()
    );

    let markdown = generateReportMarkdown(issues, month, gitActivity);

    // Polish with Claude via Bedrock if requested
    if (params.polish) {
        console.log('[REPORT] Polishing report with Claude via Bedrock...');
        markdown = await polishReport(markdown, month, token);
        console.log('[REPORT] Polishing complete');
    }

    // Log final markdown to CloudWatch for easy copy/paste review
    console.log('[REPORT] === FINAL MARKDOWN ===');
    console.log(markdown);
    console.log('[REPORT] === END MARKDOWN ===');

    const totalEdits = issues.reduce((sum, i) => sum + i.userContentEdits.totalCount, 0);
    const result: Record<string, any> = {
        slug,
        month,
        issues: issues.map(i => ({ number: i.number, title: i.title })),
        editCount: totalEdits,
        polished: !!params.polish,
        markdown,
        hubUrl: `/reports/${slug}`,
    };

    // Push to repo if requested and token available
    if (params.push) {
        const reportToken = process.env.GITHUB_REPORT_TOKEN || '';
        if (!reportToken) {
            result.pushStatus = 'skipped — GITHUB_REPORT_TOKEN not set';
        } else {
            console.log(`[REPORT] Pushing to ${OWNER}/${DOCS_REPO}/reports/${slug}.md...`);
            const pushResult = await pushReportToGitHub(markdown, slug, reportToken);
            result.pushStatus = pushResult.status;
            result.pushUrl = pushResult.url;
        }
    }

    return result;
}
