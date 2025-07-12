import { promises as fs } from 'fs';
import path from 'path';

const dataDir = '/tmp/data';
const bansFilePath = path.join(dataDir, 'bans.json');

export default async function handler(req, res) {
  try {
    // Get real client IP (works with Cloudflare)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   req.connection?.remoteAddress;

    console.log(`Checking IP: ${clientIP}`);

    // Read current bans
    const bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));
    
    // Check for active bans
    const activeBan = bans.find(ban => {
      if (ban.ip === clientIP) {
        // For page bans, verify the requested path
        if (ban.type === 'page') {
          return req.url.startsWith(ban.page);
        }
        return true; // Full site ban
      }
      return false;
    });

    if (activeBan) {
      console.log(`Blocking banned IP: ${clientIP}`, activeBan);
      return res.redirect(303, '/403.html');
    }

    // Not banned - send success response
    return res.status(200).json({ allowed: true });

  } catch (err) {
    console.error('IP check error:', err);
    // Allow access if there's an error checking bans
    return res.status(200).json({ allowed: true });
  }
}
