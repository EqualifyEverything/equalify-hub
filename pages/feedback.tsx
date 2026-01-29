import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { escapeHtml, timeAgo, getVisitorIp, parseFormBody } from '#src/components/utils';
import { getCurrentUser } from '#src/utils/auth';
import { getFeatureRequests, createFeatureRequest, voteFeature, deleteFeatureRequest, FeatureRequest } from '#src/utils/db';
import { event } from '#src/utils';

const styles = `
.container {
    max-width: 700px;
    margin: 0 auto;
    padding: 32px 20px;
}
h1 { margin: 0 0 8px 0; font-size: 28px; color: #1f2937; }
.subtitle { color: #6b7280; margin: 0 0 32px 0; }
.alert {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
    font-size: 14px;
}
.alert-error { background: #fef2f2; border: 1px solid #C8102E; color: #C8102E; }
.alert-success { background: #f0fdf4; border: 1px solid #059669; color: #059669; }
.submit-form {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 32px;
}
.submit-form h2 { margin: 0 0 16px 0; font-size: 16px; color: #1f2937; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.form-group input, .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #1f2937;
    font-size: 14px;
    font-family: inherit;
}
.form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #C8102E;
}
.form-group textarea { resize: vertical; min-height: 80px; }
.submit-btn {
    background: #C8102E;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}
.submit-btn:hover { background: #9a0c23; }
.feature-list { display: flex; flex-direction: column; gap: 12px; }
.feature-item {
    display: flex;
    gap: 16px;
    background: #f8f9fa;
    border: 1px solid #d1d5db;
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
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
}
.vote-btn:hover { background: #e5e7eb; color: #1f2937; }
.vote-btn.voted { color: #C8102E; }
.score { font-size: 16px; font-weight: 600; color: #1f2937; }
.score.positive { color: #059669; }
.score.negative { color: #C8102E; }
.feature-content { flex: 1; min-width: 0; }
.feature-content h3 { margin: 0 0 4px 0; font-size: 15px; color: #1f2937; }
.feature-content p { margin: 0 0 8px 0; font-size: 13px; color: #6b7280; }
.feature-meta { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.feature-meta a { color: #C8102E; }
.delete-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
}
.delete-btn:hover { color: #C8102E; }
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
}
`;

const FeatureItem: FC<{ feature: FeatureRequest; visitorIp: string; currentUser?: string }> = ({ feature, visitorIp, currentUser }) => {
    const score = (feature.upvotes?.length || 0) - (feature.downvotes?.length || 0);
    const userUpvoted = feature.upvotes?.includes(visitorIp);
    const userDownvoted = feature.downvotes?.includes(visitorIp);
    const canDelete = currentUser && feature.created_by === currentUser;
    
    return (
        <div class="feature-item">
            <div class="vote-section">
                <form method="post" action="/feature-request/vote">
                    <input type="hidden" name="id" value={feature.id} />
                    <input type="hidden" name="vote" value="up" />
                    <button type="submit" class={`vote-btn ${userUpvoted ? 'voted' : ''}`}>▲</button>
                </form>
                <span class={`score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}`}>{score}</span>
                <form method="post" action="/feature-request/vote">
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
                    {canDelete && (
                        <form method="post" action="/feature-request/delete" style="display:inline;margin-left:8px;">
                            <input type="hidden" name="id" value={feature.id} />
                            <button type="submit" class="delete-btn" onclick="return confirm('Delete this feature request?')">Delete</button>
                        </form>
                    )}
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
                    <form method="post" action="/feature-request/submit">
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
                        ? features.map(f => <FeatureItem feature={f} visitorIp={visitorIp} currentUser={user?.login} />)
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
        return c.redirect('/feature-request?error=Title+is+required');
    }
    
    await createFeatureRequest(title, description, visitorIp, user?.login);
    return c.redirect('/feature-request?success=1');
}

export async function voteHandler(c: Context) {
    const visitorIp = getVisitorIp(event.headers);
    const params = parseFormBody(event);
    const featureId = params.get('id') || '';
    const voteType = params.get('vote') as 'up' | 'down';
    
    if (featureId && (voteType === 'up' || voteType === 'down')) {
        await voteFeature(featureId, visitorIp, voteType);
    }
    
    return c.redirect('/feature-request');
}

export async function deleteFeatureHandler(c: Context) {
    const user = getCurrentUser();
    const params = parseFormBody(event);
    const featureId = params.get('id') || '';
    
    if (!user) {
        return c.redirect('/feature-request?error=You+must+be+signed+in+to+delete');
    }
    
    if (featureId) {
        const deleted = await deleteFeatureRequest(featureId, user.login);
        if (!deleted) {
            return c.redirect('/feature-request?error=Could+not+delete+feature+request');
        }
    }
    
    return c.redirect('/feature-request');
}
