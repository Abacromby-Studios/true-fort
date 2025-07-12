import { promises as fs } from 'fs';
import path from 'path';

// Use a more persistent data directory
const dataDir = path.join(process.cwd(), 'data');
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
  console.log(`Received ${req.method} request to ${req.url}`);
  
  try {
    await initStorage();
    let bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));

    switch (req.method) {
      case 'GET':
        return res.status(200).json(bans);
        
      case 'POST':
        const { ip, type, page, reason } = req.body;
        console.log('Ban data received:', { ip, type, page, reason });

        if (!ip || !type || !reason) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            received: req.body
          });
        }

        if (bans.some(b => b.ip === ip)) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        const newBan = {
          ip,
          type,
          page: type === 'page' ? page : null,
          reason,
          timestamp: new Date().toISOString()
        };

        bans.push(newBan);
        await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2));
        return res.status(201).json(newBan);

      case 'DELETE':
        const ipToRemove = req.query.ip;
        if (!ipToRemove) {
          return res.status(400).json({ error: 'IP parameter missing' });
        }

        bans = bans.filter(ban => ban.ip !== ipToRemove);
        await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2));
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
}
