import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  let client;
  
  try {
    client = await db.connect();

    switch (req.method) {
      case 'GET':
        try {
          const { rows } = await client.sql`
            SELECT 
              ip, 
              type, 
              page, 
              reason, 
              timestamp 
            FROM bans 
            ORDER BY timestamp DESC
          `;
          return res.status(200).json(rows);
        } catch (err) {
          console.error('GET Error:', err);
          return res.status(500).json({ 
            error: 'Failed to fetch bans',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      case 'POST':
        try {
          const { ip, type, page, reason } = req.body;
          
          // Validate input
          if (!ip || !type || !reason) {
            return res.status(400).json({ 
              error: 'Missing required fields (ip, type, reason)',
              received: req.body
            });
          }

          // Validate IP format
          if (!isValidIP(ip)) {
            return res.status(400).json({ error: 'Invalid IP address format' });
          }

          // Check for existing ban
          const existing = await client.sql`
            SELECT 1 FROM bans WHERE ip = ${ip}
          `;
          
          if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'IP already banned' });
          }

          // Insert new ban
          const result = await client.sql`
            INSERT INTO bans (ip, type, page, reason)
            VALUES (${ip}, ${type}, ${type === 'page' ? page : null}, ${reason})
            RETURNING *
          `;
          
          return res.status(201).json(result.rows[0]);

        } catch (err) {
          console.error('POST Error:', err);
          return res.status(500).json({ 
            error: 'Failed to create ban',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      case 'DELETE':
        try {
          const ipToRemove = req.query.ip;
          if (!ipToRemove) {
            return res.status(400).json({ error: 'IP parameter missing' });
          }

          const result = await client.sql`
            DELETE FROM bans 
            WHERE ip = ${ipToRemove}
            RETURNING ip
          `;
          
          if (result.rowCount === 0) {
            return res.status(404).json({ error: 'IP not found in bans' });
          }
          
          return res.status(200).json({ 
            success: true,
            ip: result.rows[0].ip
          });

        } catch (err) {
          console.error('DELETE Error:', err);
          return res.status(500).json({ 
            error: 'Failed to remove ban',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed`,
          allowedMethods: ['GET', 'POST', 'DELETE']
        });
    }
  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({ 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (client) client.release();
  }
}

// Helper function to validate IP addresses
function isValidIP(ip) {
  // Basic IP validation (supports both IPv4 and CIDR notation)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
  return ipRegex.test(ip);
}
