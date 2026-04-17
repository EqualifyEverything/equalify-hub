import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { addToWaitlist } from '#src/utils/db';

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
.signup-form {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 32px;
}
.signup-form h2 { margin: 0 0 16px 0; font-size: 16px; color: #1f2937; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.form-group input[type="text"], .form-group input[type="email"] {
    width: 100%;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #1f2937;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
}
.form-group input[type="text"]:focus, .form-group input[type="email"]:focus {
    outline: none;
    border-color: #C8102E;
}
.checkbox-group { display: flex; flex-direction: column; gap: 8px; }
.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #1f2937;
    cursor: pointer;
}
.checkbox-group input[type="checkbox"] { width: 16px; height: 16px; accent-color: #C8102E; }
.submit-btn {
    background: #C8102E;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    font-weight: 600;
}
.submit-btn:hover { background: #a00d25; }
.success-box {
    background: #f0fdf4;
    border: 1px solid #059669;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
}
.success-box h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #059669;
}
.success-box p {
    margin: 0;
    color: #6b7280;
    font-size: 15px;
}
`;

const SignupForm: FC<{ error?: string; product?: string }> = ({ error, product }) => {
    return (
        <div class="signup-form">
            <h2>Request Access</h2>
            {error && <div class="alert alert-error">{error}</div>}
            <form method="post" action="/signup/submit">
                <div class="form-group">
                    <label>Products</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="product" value="equalify" checked={product !== 'reflow'} />
                            Equalify Dashboard
                        </label>
                        <label>
                            <input type="checkbox" name="product" value="reflow" checked={product === 'reflow'} />
                            Equalify Reflow
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" placeholder="Your name" required maxlength={100} />
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" required maxlength={200} />
                </div>
                <button type="submit" class="submit-btn">Join the Waitlist</button>
            </form>
        </div>
    );
};

const SignupPage: FC<{ onList: boolean; error?: string; product?: string }> = ({ onList, error, product }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Sign Up - Equalify" styles={styles} user={user} product={product}>
            <div class="container">
                <h1>Sign Up for Updates</h1>
                <p class="subtitle">Equalify's tools are rolling out in <a href="/about#roadmap" style="color:#C8102E;">phases</a>. Sign up to be the first to receive access.</p>

                {onList ? (
                    <div class="success-box">
                        <h2>You're on the list!</h2>
                        <p>We'll be in touch soon. Thanks for your interest!</p>
                    </div>
                ) : (
                    <SignupForm error={error} product={product} />
                )}
            </div>
        </Layout>
    );
};

export async function signupHandler(c: Context, product?: string) {
    return c.html(<SignupPage onList={false} product={product} />);
}

export async function signupReflowHandler(c: Context) {
    return signupHandler(c, 'reflow');
}

export async function signupSubmitHandler(c: Context) {
    const body = await c.req.parseBody({ all: true });
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('cloudfront-viewer-address')?.split(':')[0]
        || 'Unknown';

    // Checkboxes: body.product is a string if one checked, array if multiple
    const rawProduct = body.product;
    const products = Array.isArray(rawProduct)
        ? rawProduct.map(p => String(p).trim()).filter(Boolean)
        : rawProduct ? [String(rawProduct).trim()] : [];
    const product = products.length > 0 ? products.join(',') : 'equalify';

    if (!name) {
        return c.html(<SignupPage onList={false} error="Name is required" />);
    }
    if (!email) {
        return c.html(<SignupPage onList={false} error="Email is required" />);
    }
    if (products.length === 0) {
        return c.html(<SignupPage onList={false} error="Please select at least one product" />);
    }

    const result = await addToWaitlist(name, email, ip, product);

    if (!result) {
        return c.html(<SignupPage onList={false} error="Something went wrong. Please try again." />);
    }

    // Render the success page directly — no redirect needed
    return c.html(<SignupPage onList={true} />);
}
