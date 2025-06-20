// api/submit-form.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, username, subject, ...formData } = req.body;

    // Validate required fields
    if (!email || !username || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'email-admin@abacromby9-studios.xyz',
      to: 'support@email.com', // Replace with your email
      subject: `[Support] ${subject} - ${username}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${username} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Details:</h3>
        <pre>${JSON.stringify(formData, null, 2)}</pre>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
