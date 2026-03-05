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
.form-group input, .form-group select {
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
.form-group input:focus, .form-group select:focus {
    outline: none;
    border-color: #C8102E;
}
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
                    <label>Product</label>
                    {product === 'reflow' ? (
                        <select name="product">
                            <option value="equalify">Equalify</option>
                            <option value="reflow" selected>Reflow</option>
                        </select>
                    ) : (
                        <select name="product">
                            <option value="equalify" selected>Equalify</option>
                            <option value="reflow">Reflow</option>
                        </select>
                    )}
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
    const productName = product === 'reflow' ? 'Reflow' : 'Equalify';

    return (
        <Layout title={`Sign Up - ${productName}`} styles={styles} user={user} product={product}>
            <div class="container">
                <h1>Sign Up for {productName}</h1>
                <p class="subtitle">Request early access to {productName}. We'll reach out when your spot is ready.</p>

                {onList ? (
                    <div class="success-box">
                        <h2>You're on the list!</h2>
                        <p>We'll be in touch soon. Thanks for your interest in {productName}!</p>
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
    const body = await c.req.parseBody();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const product = String(body.product || 'equalify').trim();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('cloudfront-viewer-address')?.split(':')[0]
        || 'Unknown';

    if (!name) {
        return c.html(<SignupPage onList={false} error="Name is required" product={product} />);
    }
    if (!email) {
        return c.html(<SignupPage onList={false} error="Email is required" product={product} />);
    }

    const result = await addToWaitlist(name, email, ip, product);

    if (!result) {
        return c.html(<SignupPage onList={false} error="Something went wrong. Please try again." product={product} />);
    }

    // Render the success page directly — no redirect needed
    return c.html(<SignupPage onList={true} product={product} />);
}
