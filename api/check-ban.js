import { promises as fs } from 'fs';
import path from 'path';

const bansFilePath = '/tmp/data/bans.json';

export default async function handler(req, res) {
  try {
    // Get client IP (handling Cloudflare proxy if needed)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Read bans
    const bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));
    
    // Check for matching ban
    const isBanned = bans.some(ban => {
      if (ban.ip === clientIP) {
        if (ban.type === 'page') {
          return req.url.startsWith(ban.page);
        }
        return true; // Full site ban
      }
      return false;
    });

    if (isBanned) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Not banned - continue
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Ban check error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
