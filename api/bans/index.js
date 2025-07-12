import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
            error: 'Database query failed',
            message: 'Could not retrieve bans',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      case 'POST':
        try {
          const { ip, type, page, reason } = req.body;
          
          // Validate input
          if (!ip || !type || !reason) {
            return res.status(400).json({ 
              error: 'Missing required fields',
              required: ['ip', 'type', 'reason'],
              received: Object.keys(req.body)
            });
          }

          if (!isValidIP(ip)) {
            return res.status(400).json({ 
              error: 'Invalid IP format',
              message: 'Please provide a valid IPv4 address or CIDR notation'
            });
          }

          // Check for existing ban
          const existing = await client.sql`
            SELECT 1 FROM bans WHERE ip = ${ip}
          `;
          
          if (existing.rows.length > 0) {
            return res.status(409).json({ 
              error: 'Duplicate IP',
              message: 'This IP address is already banned'
            });
          }

          // Insert new ban
          const result = await client.sql`
            INSERT INTO bans (ip, type, page, reason)
            VALUES (${ip}, ${type}, ${type === 'page' ? page : null}, ${reason})
            RETURNING *
          `;
          
          return res.status(201).json({
            success: true,
            ban: result.rows[0]
          });

        } catch (err) {
          console.error('POST Error:', err);
          return res.status(500).json({ 
            error: 'Database operation failed',
            message: 'Failed to create ban',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      case 'DELETE':
        try {
          const ipToRemove = req.query.ip;
          if (!ipToRemove) {
            return res.status(400).json({ 
              error: 'Missing parameter',
              message: 'IP address query parameter is required'
            });
          }

          const result = await client.sql`
            DELETE FROM bans 
            WHERE ip = ${ipToRemove}
            RETURNING ip
          `;
          
          if (result.rowCount === 0) {
            return res.status(404).json({ 
              error: 'Not found',
              message: 'No ban found for this IP address'
            });
          }
          
          return res.status(200).json({ 
            success: true,
            message: 'Ban removed successfully',
            ip: result.rows[0].ip
          });

        } catch (err) {
          console.error('DELETE Error:', err);
          return res.status(500).json({ 
            error: 'Database operation failed',
            message: 'Failed to remove ban',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
        return res.status(405).json({ 
          error: 'Method not allowed',
          message: `HTTP method ${req.method} is not supported`,
          allowedMethods: ['GET', 'POST', 'DELETE']
        });
    }
  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Could not connect to the database',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (client) client.release();
  }
}

// Enhanced IP validation
function isValidIP(ip) {
  // IPv4 with optional CIDR (e.g., 192.168.1.1 or 192.168.1.0/24)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
  
  // IPv6 (basic pattern - for future compatibility)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
