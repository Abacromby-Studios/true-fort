import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  // 1. Set proper headers
  res.setHeader('Content-Type', 'application/json');
  
  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 3. Parse the body safely
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    const { email, username, subject } = body;

    // 4. Validate required fields
    if (!email || !username || !subject) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: { email: !email, username: !username, subject: !subject }
      });
    }

    // 5. Send email (with error handling)
    const { data, error: sendError } = await resend.emails.send({
      from: 'email-admin@abacromby9-studios.xyz',
      to: process.env.CONTACT_TO_EMAIL || 'GABEK6892@gmail.com',
      subject: `[Support] ${subject}`,
      html: `<pre>${JSON.stringify(body, null, 2)}</pre>`
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return res.status(502).json({ 
        error: 'Email service failed',
        details: sendError.message 
      });
    }

    // 6. Success response
    return res.status(200).json({ 
      success: true,
      message: 'Contact request submitted'
    });

  } catch (err) {
    // 7. Catch-all error handler
    console.error('API Crash:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
};
