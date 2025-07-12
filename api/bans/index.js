import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  const client = await db.connect();
  
  try {
    switch (req.method) {
      case 'GET':
        const { rows } = await client.sql`SELECT * FROM bans ORDER BY timestamp DESC`;
        return res.status(200).json(rows);

      case 'POST':
        const { ip, type, page, reason } = req.body;
        
        if (!ip || !type || !reason) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            received: req.body
          });
        }

        // Check for existing ban
        const existing = await client.sql`
          SELECT 1 FROM bans WHERE ip = ${ip}
        `;
        
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        // Insert new ban
        await client.sql`
          INSERT INTO bans (ip, type, page, reason)
          VALUES (${ip}, ${type}, ${type === 'page' ? page : null}, ${reason})
        `;
        
        return res.status(201).json({
          ip, type, page, reason,
          timestamp: new Date().toISOString()
        });

      case 'DELETE':
        const ipToRemove = req.query.ip;
        if (!ipToRemove) {
          return res.status(400).json({ error: 'IP parameter missing' });
        }

        await client.sql`
          DELETE FROM bans WHERE ip = ${ipToRemove}
        `;
        
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
}
