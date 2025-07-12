import { promises as fs } from 'fs';
import path from 'path';

const dataDir = '/tmp/data'; // Using Vercel's writable /tmp directory
const bansFilePath = path.join(dataDir, 'bans.json');

async function initStorage() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(bansFilePath);
    } catch {
      await fs.writeFile(bansFilePath, '[]');
    }
  } catch (err) {
    console.error('Storage init error:', err);
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    await initStorage();
    let bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));

    switch (req.method) {
      case 'GET':
        return res.status(200).json(bans);

      case 'POST':
        const { ip: newIp, type, page, reason } = req.body; // Renamed to newIp to avoid conflict
        
        if (!newIp || !type || !reason) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            required: { ip: !newIp, type: !type, reason: !reason }
          });
        }

        if (bans.some(ban => ban.ip === newIp)) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        const newBan = {
          ip: newIp, // Using the renamed variable
          type,
          page: type === 'page' ? page : null,
          reason,
          timestamp: new Date().toISOString()
        };

        bans.push(newBan);
        await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2));
        return res.status(201).json(newBan);

      case 'DELETE':
        const { ip: ipToDelete } = req.query; // Renamed to avoid conflict
        
        bans = bans.filter(ban => ban.ip !== ipToDelete);
        await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2));
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
}
