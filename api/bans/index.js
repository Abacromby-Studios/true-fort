// api/bans/index.js
import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const bansFilePath = path.join(dataDir, 'bans.json');

// Initialize in-memory cache
let bansCache = null;
let lastModified = 0;

async function readBans() {
  try {
    const stats = await fs.stat(bansFilePath);
    if (stats.mtimeMs > lastModified || !bansCache) {
      const data = await fs.readFile(bansFilePath, 'utf8');
      bansCache = JSON.parse(data);
      lastModified = stats.mtimeMs;
    }
    return bansCache;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist yet
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(bansFilePath, '[]');
      return [];
    }
    throw err;
  }
}

async function writeBans(bans) {
  await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2));
  bansCache = bans;
  lastModified = Date.now();
}

export default async function handler(req, res) {
  try {
    const bans = await readBans();

    switch (req.method) {
      case 'GET':
        return res.status(200).json(bans);

      case 'POST':
        const { ip, type, page, reason } = req.body;
        if (!ip || !type || !reason) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (bans.some(ban => ban.ip === ip)) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        const newBan = {
          ip,
          type,
          page: type === 'page' ? page : null,
          reason,
          timestamp: new Date().toISOString()
        };

        await writeBans([...bans, newBan]);
        return res.status(201).json(newBan);

      case 'DELETE':
        const { ip } = req.query;
        if (!ip) return res.status(400).json({ error: 'IP required' });

        const updatedBans = bans.filter(ban => ban.ip !== ip);
        if (updatedBans.length === bans.length) {
          return res.status(404).json({ error: 'IP not found' });
        }

        await writeBans(updatedBans);
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
