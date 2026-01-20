import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { escapeHtml, timeAgo, getVisitorIp, parseFormBody } from '#src/components/utils';
import { getCurrentUser } from '#src/utils/auth';
import { getFeatureRequests, createFeatureRequest, voteFeature, FeatureRequest } from '#src/utils/db';
import { event } from '#src/utils';

const styles = `
.container {
    max-width: 700px;
    margin: 0 auto;
    padding: 32px 20px;
}
h1 { margin: 0 0 8px 0; font-size: 28px; }
.subtitle { color: #8b949e; margin: 0 0 32px 0; }
.alert {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
    font-size: 14px;
}
.alert-error { background: #3d1a1a; border: 1px solid #f85149; color: #f85149; }
.alert-success { background: #1a3d1a; border: 1px solid #3fb950; color: #3fb950; }
.submit-form {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 32px;
}
.submit-form h2 { margin: 0 0 16px 0; font-size: 16px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: #8b949e; margin-bottom: 6px; }
.form-group input, .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 14px;
    font-family: inherit;
}
.form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #58a6ff;
}
.form-group textarea { resize: vertical; min-height: 80px; }
.submit-btn {
    background: #238636;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}
.submit-btn:hover { background: #2ea043; }
.feature-list { display: flex; flex-direction: column; gap: 12px; }
.feature-item {
    display: flex;
    gap: 16px;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
}
.vote-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 40px;
}
.vote-btn {
    background: none;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
}
.vote-btn:hover { background: #21262d; color: #e6edf3; }
.vote-btn.voted { color: #58a6ff; }
.score { font-size: 16px; font-weight: 600; }
.score.positive { color: #3fb950; }
.score.negative { color: #f85149; }
.feature-content { flex: 1; min-width: 0; }
.feature-content h3 { margin: 0 0 4px 0; font-size: 15px; }
.feature-content p { margin: 0 0 8px 0; font-size: 13px; color: #8b949e; }
.feature-meta { font-size: 12px; color: #6e7681; }
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #8b949e;
}
`;

const FeatureItem: FC<{ feature: FeatureRequest; visitorIp: string }> = ({ feature, visitorIp }) => {
    const score = (feature.upvotes?.length || 0) - (feature.downvotes?.length || 0);
    const userUpvoted = feature.upvotes?.includes(visitorIp);
    const userDownvoted = feature.downvotes?.includes(visitorIp);
    
    return (
        <div class="feature-item">
            <div class="vote-section">
                <form method="post" action="/feedback/vote">
                    <input type="hidden" name="id" value={feature.id} />
                    <input type="hidden" name="vote" value="up" />
                    <button type="submit" class={`vote-btn ${userUpvoted ? 'voted' : ''}`}>▲</button>
                </form>
                <span class={`score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}`}>{score}</span>
                <form method="post" action="/feedback/vote">
                    <input type="hidden" name="id" value={feature.id} />
                    <input type="hidden" name="vote" value="down" />
                    <button type="submit" class={`vote-btn ${userDownvoted ? 'voted' : ''}`}>▼</button>
                </form>
            </div>
            <div class="feature-content">
                <h3>{escapeHtml(feature.title)}</h3>
                {feature.description && <p>{escapeHtml(feature.description)}</p>}
                <div class="feature-meta">
                    {feature.created_by !== 'Anonymous' 
                        ? <a href={`/${feature.created_by}`}>{escapeHtml(feature.created_by)}</a> 
                        : 'Anonymous'
                    } · {timeAgo(feature.created_at)}
                </div>
            </div>
        </div>
    );
};

export const FeedbackPage: FC<{ features: FeatureRequest[]; visitorIp: string; error?: string; success?: boolean }> = ({ 
    features, visitorIp, error, success 
}) => {
    const user = getCurrentUser();
    
    return (
        <Layout title="Feature Requests" styles={styles} user={user}>
            <div class="container">
                <h1>Feature Requests</h1>
                <p class="subtitle">Vote on what to build next</p>
                
                {error && <div class="alert alert-error">{escapeHtml(decodeURIComponent(error))}</div>}
                {success && <div class="alert alert-success">Thanks! Your request has been added.</div>}
                
                <div class="submit-form">
                    <h2>💡 Suggest a feature</h2>
                    <form method="post" action="/feedback/submit">
                        <div class="form-group">
                            <label for="title">What do you want?</label>
                            <input type="text" id="title" name="title" placeholder="e.g., Contribution graph" required maxlength={200} />
                        </div>
                        <div class="form-group">
                            <label for="description">Details (optional)</label>
                            <textarea id="description" name="description" placeholder="Any extra context..." maxlength={500}></textarea>
                        </div>
                        <button type="submit" class="submit-btn">Submit</button>
                        {user && <span style="margin-left:12px;font-size:12px;color:#8b949e;">as {user.login}</span>}
                    </form>
                </div>
                
                <div class="feature-list">
                    {features.length > 0 
                        ? features.map(f => <FeatureItem feature={f} visitorIp={visitorIp} />)
                        : <div class="empty-state"><p>No feature requests yet. Be the first!</p></div>
                    }
                </div>
            </div>
        </Layout>
    );
};

// Route handlers
export async function feedbackHandler(c: Context) {
    const features = await getFeatureRequests();
    const visitorIp = getVisitorIp(event.headers);
    const error = event.queryStringParameters?.error;
    const success = event.queryStringParameters?.success === '1';
    
    return c.html(<FeedbackPage features={features} visitorIp={visitorIp} error={error} success={success} />);
}

export async function submitFeatureHandler(c: Context) {
    const visitorIp = getVisitorIp(event.headers);
    const user = getCurrentUser();
    const params = parseFormBody(event);
    const title = params.get('title')?.trim() || '';
    const description = params.get('description')?.trim() || '';
    
    if (!title) {
        return c.redirect('/feedback?error=Title+is+required');
    }
    
    await createFeatureRequest(title, description, visitorIp, user?.login);
    return c.redirect('/feedback?success=1');
}

export async function voteHandler(c: Context) {
    const visitorIp = getVisitorIp(event.headers);
    const params = parseFormBody(event);
    const featureId = params.get('id') || '';
    const voteType = params.get('vote') as 'up' | 'down';
    
    if (featureId && (voteType === 'up' || voteType === 'down')) {
        await voteFeature(featureId, visitorIp, voteType);
    }
    
    return c.redirect('/feedback');
}
