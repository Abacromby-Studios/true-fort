import { promises as fs } from 'fs';
import path from 'path';

const dataDir = '/tmp/data';
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

    if (req.method === 'POST') {
      const { ip, type, page, reason } = req.body;
      console.log('Ban data received:', { ip, type, page, reason });

      // Validation
      if (!ip || !type || !reason) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          received: req.body
        });
      }

      // Check for duplicates
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
      console.log('Ban successfully added:', newBan);
      
      return res.status(201).json({
        success: true,
        message: 'Ban added successfully',
        ban: newBan
      });
    }

    // ... other methods ...

res.setHeader('Cache-Control', 'no-store');

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
}
