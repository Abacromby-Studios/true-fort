import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  const { email, username, subject, ...data } = req.body;
  
  await resend.emails.send({
    from: 'support@abacromby9-studios.xyz',
    to: 'your-real@email.com',
    subject: `[Support] ${subject}`,
    html: `
      <h3>New support request</h3>
      <p><strong>From:</strong> ${username} (${email})</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `
  });
  
  return res.status(200).json({ success: true });
};
