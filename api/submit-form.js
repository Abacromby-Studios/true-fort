// api/submit-form.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, username, subject, ...formData } = req.body;

    const { data, error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_RESEND_FROM,
      to: process.env.NEXT_PUBLIC_RESEND_TO,
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

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
