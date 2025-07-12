import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const bansFilePath = path.join(dataDir, 'bans.json');

// Helper functions
async function ensureBansFile() {
  try {
    await fs.access(bansFilePath);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(bansFilePath, '[]');
  }
}

export default async function handler(req, res) {
  try {
    await ensureBansFile();
    const fileData = await fs.readFile(bansFilePath, 'utf8');
    let bans = JSON.parse(fileData);

    switch (req.method) {
      case 'GET':
        res.setHeader('Content-Type', 'application/json');
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

      case 'DELETE':
        const { ip } = req.query;
        const updatedBans = bans.filter(b => b.ip !== ip);
        
        if (updatedBans.length === bans.length) {
          return res.status(404).json({ error: 'IP not found' });
        }

        await fs.writeFile(bansFilePath, JSON.stringify(updatedBans, null, 2));
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
