import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // Skip checking for static files and the 403 page
  if (req.url.startsWith('/_next/') || req.url === '/403.html') {
    return res.status(200).end();
  }

  const client = await db.connect();
  
  try {
    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   req.connection?.remoteAddress;

    // Check for bans
    const { rows } = await client.sql`
      SELECT type, page FROM bans WHERE ip = ${clientIP}
    `;

    const isBanned = rows.some(ban => {
      if (ban.type === 'page') {
        return req.url.startsWith(ban.page);
      }
      return true; // Full site ban
    });

    if (isBanned) {
      console.log(`Blocking banned IP: ${clientIP} from ${req.url}`);
      return res.redirect(307, '/403.html');
    }

    return res.status(200).end();
  } catch (err) {
    console.error('Ban check error:', err);
    return res.status(200).end(); // Allow access if error occurs
  } finally {
    client.release();
  }
}
