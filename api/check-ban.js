import { promises as fs } from 'fs';
import path from 'path';

const dataDir = '/tmp/data';
const bansFilePath = path.join(dataDir, 'bans.json');

export default async function handler(req, res) {
  try {
    // Get real client IP (works with Cloudflare and other proxies)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   req.connection?.remoteAddress;

    // Skip checking for the 403 page itself
    if (req.url === '/403.html') {
      return res.status(200).next();
    }

    // Read current bans
    const bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));
    
    // Check if IP is banned
    const isBanned = bans.some(ban => {
      if (ban.ip === clientIP) {
        // For page-specific bans, check if current path matches
        if (ban.type === 'page') {
          return req.url.startsWith(ban.page);
        }
        return true; // Full site ban
      }
      return false;
    });

    if (isBanned) {
      console.log(`Redirecting banned IP: ${clientIP} from ${req.url}`);
      return res.redirect(308, '/403.html');
    }

    // Not banned - continue to requested page
    return res.status(200).next();

  } catch (err) {
    console.error('Ban check error:', err);
    // Allow access if there's an error checking bans
    return res.status(200).next();
  }
}
