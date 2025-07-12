import { promises as fs } from 'fs';
import path from 'path';

const dataDir = '/tmp/data';
const bansFilePath = path.join(dataDir, 'bans.json');

async function initStorage() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(bansFilePath, '[]'); // Always overwrite if exists
  } catch (err) {
    console.error('Storage init failed:', err);
    throw err;
  }
}

export default async function handler(req, res) {
  // Set Content-Type first
  res.setHeader('Content-Type', 'application/json');
  
  try {
    await initStorage();
    const bans = JSON.parse(await fs.readFile(bansFilePath, 'utf8'));

    switch (req.method) {
      case 'GET':
        return res.status(200).json(bans);

      case 'POST':
        const { ip, type, page, reason } = req.body;
        
        if (!ip || !type || !reason) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            required: { ip: !ip, type: !type, reason: !reason }
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
