// api/bans/index.js
import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  try {
    client = await db.connect();

    switch (req.method) {
      case 'GET': {
        const result = await client.query('SELECT * FROM bans ORDER BY timestamp DESC');
        return res.status(200).json(result.rows);
      }

      case 'POST': {
        const { ip, type, reason, page } = req.body;
        
        if (!ip || !type || !reason) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const exists = await client.query('SELECT 1 FROM bans WHERE ip = $1', [ip]);
        if (exists.rows.length > 0) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        const insert = await client.query(
          'INSERT INTO bans (ip, type, reason, page) VALUES ($1, $2, $3, $4) RETURNING *',
          [ip, type, reason, type === 'page' ? page : null]
        );
        
        return res.status(201).json(insert.rows[0]);
      }

      case 'DELETE': {
        const { ip } = req.query;
        if (!ip) return res.status(400).json({ error: 'IP parameter required' });

        const result = await client.query('DELETE FROM bans WHERE ip = $1 RETURNING ip', [ip]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Ban not found' });
        }
        
        return res.status(200).json({ success: true, ip: result.rows[0].ip });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
}
