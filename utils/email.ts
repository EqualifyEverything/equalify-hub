import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// equalify.uic.edu is a verified SES domain identity in us-east-2
const client = new SESv2Client({ region: 'us-east-2' });

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Equalify Hub <noreply@equalify.uic.edu>';

export interface SendEmailOptions {
    to: string[];
    subject: string;
    text: string;
    replyTo?: string;
}

// Send a plain-text email via SES. Never throws — callers treat email as best-effort.
export async function sendEmail({ to, subject, text, replyTo }: SendEmailOptions): Promise<boolean> {
    try {
        await client.send(new SendEmailCommand({
            FromEmailAddress: FROM_ADDRESS,
            Destination: { ToAddresses: to },
            ReplyToAddresses: replyTo ? [replyTo] : undefined,
            Content: {
                Simple: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Text: { Data: text, Charset: 'UTF-8' } },
                },
            },
        }));
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
