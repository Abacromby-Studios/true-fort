// api/submit-form.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Webhook handler function
async function sendToWebhook(data) {
    try {
        const webhookResponse = await fetch(process.env.RESEND_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: 'contact_form_submission',
                data: data
            })
        });
        
        if (!webhookResponse.ok) {
            console.error('Webhook failed:', await webhookResponse.text());
        }
    } catch (err) {
        console.error('Webhook error:', err);
    }
}

export default async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body;
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }

        const { email, username, subject } = body;

        if (!email || !username || !subject) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: { email: !email, username: !username, subject: !subject }
            });
        }

        // Determine recipient based on subject
        let toEmail, emailSubject;
        switch(subject) {
            case 'player_report':
                toEmail = process.env.POLICY_ENFORCEMENT_EMAIL || 'policy@abacromby9-studios.xyz';
                emailSubject = `[PLAYER REPORT] ${body.broken_rule || 'No subject'}`;
                break;
            case 'legal_inquiry':
                toEmail = process.env.LEGAL_EMAIL || 'legal@abacromby9-studios.xyz';
                emailSubject = `[LEGAL INQUIRY] ${body.legal_subject || 'No subject'}`;
                break;
            case 'appeal_request':
                toEmail = process.env.APPEALS_EMAIL || 'appeals@abacromby9-studios.xyz';
                emailSubject = `[APPEAL REQUEST] ${body.enforcement_action || 'No subject'}`;
                break;
            case 'bug_support':
                toEmail = process.env.BUG_SUPPORT_EMAIL || 'bugs@abacromby9-studios.xyz';
                emailSubject = `[BUG REPORT] ${body.bug_subject || 'No subject'}`;
                if (body.security_concern) {
                    emailSubject = '[SECURITY] ' + emailSubject;
                }
                break;
            default:
                toEmail = process.env.SUPPORT_EMAIL || 'support@abacromby9-studios.xyz';
                emailSubject = `[SUPPORT] ${body.general_subject || 'No subject'}`;
        }

        // Send email
        const { data: emailData, error: sendError } = await resend.emails.send({
            from: 'support@abacromby9-studios.xyz',
            to: toEmail,
            subject: emailSubject,
            html: `<pre>${JSON.stringify(body, null, 2)}</pre>`
        });

        if (sendError) {
            console.error('Resend error:', sendError);
            return res.status(502).json({ 
                error: 'Email service failed',
                details: sendError.message 
            });
        }

        // Send to webhook
        await sendToWebhook(body);

        return res.status(200).json({ 
            success: true,
            message: 'Contact request submitted'
        });

    } catch (err) {
        console.error('API Crash:', err);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: err.message 
        });
    }
};
