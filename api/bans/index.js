import { promises as fs } from 'fs';
import path from 'path';

// Use /tmp for writable storage in Vercel
const dataDir = '/tmp/data';
const bansFilePath = path.join(dataDir, 'bans.json');

// Initialize storage with error handling
async function initStorage() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(bansFilePath);
    } catch {
      await fs.writeFile(bansFilePath, '[]', 'utf8');
      console.log('Created new bans file');
    }
  } catch (err) {
    console.error('Storage initialization failed:', err);
    throw err;
  }
}

export default async function handler(req, res) {
  console.log(`${req.method} request to /api/bans`);
  
  try {
    await initStorage();
    const fileData = await fs.readFile(bansFilePath, 'utf8');
    let bans = JSON.parse(fileData);

    switch (req.method) {
      case 'GET':
        console.log('Returning bans:', bans);
        return res.status(200).json(bans);

      case 'POST':
        const { ip, type, page, reason } = req.body;
        
        // Validate input
        if (!ip || !type || !reason) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: { ip: !ip, type: !type, reason: !reason }
          });
        }

        // Check for duplicates
        if (bans.some(b => b.ip === ip)) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        // Add new ban
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
        const { ip } = req.query;
        const initialLength = bans.length;
        bans = bans.filter(b => b.ip !== ip);
        
        if (bans.length === initialLength) {
          return res.status(404).json({ error: 'IP not found' });
        }

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
