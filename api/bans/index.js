import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase.from('bans').select('*');
  res.status(200).json(data || []);
}

  // Set headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  try {
    client = await db.connect();

    switch (req.method) {
      case 'GET': {
        const { rows } = await client.query('SELECT * FROM bans ORDER BY timestamp DESC');
        return res.status(200).json(rows);
      }

      case 'POST': {
        const { ip, type, reason, page } = req.body;
        
        // Validation
        if (!ip || !type || !reason) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['ip', 'type', 'reason']
          });
        }

        // Check existing
        const exists = await client.query('SELECT 1 FROM bans WHERE ip = $1', [ip]);
        if (exists.rows.length > 0) {
          return res.status(409).json({ error: 'IP already banned' });
        }

        // Insert
        const result = await client.query(
          'INSERT INTO bans (ip, type, reason, page) VALUES ($1, $2, $3, $4) RETURNING *',
          [ip, type, reason, type === 'page' ? page : null]
        );
        
        return res.status(201).json(result.rows[0]);
      }

      case 'DELETE': {
        const { ip } = req.query;
        if (!ip) return res.status(400).json({ error: 'IP parameter required' });

        const result = await client.query(
          'DELETE FROM bans WHERE ip = $1 RETURNING ip', 
          [ip]
        );
        
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
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Database operation failed'
    });
  } finally {
    if (client) client.release();
  }
}
