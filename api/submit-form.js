import sgMail from '@sendgrid/mail';

// Initialize SendGrid (Vercel will use this env var)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, username, subject, ...formData } = req.body;

  // Build email message
  const msg = {
    to: 'support@abacromby9-studios.xyz', // Your support email
    from: 'no-reply@abacromby9-studios.xyz', // Verified SendGrid domain
    subject: `[Support] ${subject} - ${username}`,
    text: `
      New support request:
      Email: ${email}
      Username: ${username}
      Subject: ${subject}
      
      Details:
      ${JSON.stringify(formData, null, 2)}
    `,
    html: `
      <h3>New support request</h3>
      <p><strong>From:</strong> ${username} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <pre>${JSON.stringify(formData, null, 2)}</pre>
    `
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
