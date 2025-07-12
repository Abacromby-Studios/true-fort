import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const bansFilePath = path.join(dataDir, 'bans.json');

export default async function handler(req, res) {
  try {
    // Skip checking for static files and the 403 page
    if (req.url.startsWith('/_next/') || req.url === '/403.html') {
      return res.status(200).end();
    }

    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   req.connection?.remoteAddress;

    // Read current bans
    let bans = [];
    try {
      bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));
    } catch (err) {
      console.error('Error reading bans file:', err);
      return res.status(200).end(); // Allow access if we can't read bans
    }

    // Check if IP is banned
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
      console.log(`Blocking banned IP: ${clientIP} from ${req.url}`);
      return res.redirect(307, '/403.html');
    }

    // Not banned - continue
    return res.status(200).end();

  } catch (err) {
    console.error('Ban check error:', err);
    return res.status(200).end(); // Allow access if error occurs
  }
}
