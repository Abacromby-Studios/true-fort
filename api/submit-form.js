import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
    // Set JSON headers
    res.setHeader('Content-Type', 'application/json');
    
    try {
        // Parse incoming JSON
        const { email, username, subject, ...data } = JSON.parse(req.body);
        
        // Validate
        if (!email || !username || !subject) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                missing: {
                    email: !email,
                    username: !username,
                    subject: !subject
                }
            });
        }
        
        // Send email
        const { error } = await resend.emails.send({
            from: 'email-admin@abacromby9-studios.xyz',
            to: process.env.CONTACT_TO_EMAIL,
            subject: `[Support] ${subject}`,
            html: `
                <h2>New Support Request</h2>
                <p><strong>From:</strong> ${username} (${email})</p>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `
        });
        
        if (error) throw error;
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};
