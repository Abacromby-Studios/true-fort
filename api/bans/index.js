// api/bans/index.js
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const bansFilePath = path.join(dataDir, 'bans.json');

// Initialize bans file if it doesn't exist
if (!fs.existsSync(bansFilePath)) {
    fs.writeFileSync(bansFilePath, '[]');
}

export default async function handler(req, res) {
    try {
        // Read bans from file
        const readBans = () => {
            const data = fs.readFileSync(bansFilePath, 'utf8');
            return JSON.parse(data);
        };

        // Write bans to file
        const writeBans = (bans) => {
            fs.writeFileSync(bansFilePath, JSON.stringify(bans, null, 2));
        };

        if (req.method === 'GET') {
            const bans = readBans();
            return res.status(200).json(bans);
        }
        else if (req.method === 'POST') {
            const { ip, type, page, reason } = req.body;
            
            if (!ip || !type || !reason) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const bans = readBans();
            
            // Check if ban already exists
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

            bans.push(newBan);
            writeBans(bans);

            return res.status(201).json(newBan);
        }
        else if (req.method === 'DELETE') {
            const { ip } = req.query;
            
            if (!ip) {
                return res.status(400).json({ error: 'IP address required' });
            }

            let bans = readBans();
            const initialLength = bans.length;
            
            bans = bans.filter(ban => ban.ip !== ip);
            
            if (bans.length === initialLength) {
                return res.status(404).json({ error: 'IP not found in bans' });
            }

            writeBans(bans);
            return res.status(200).json({ success: true });
        }
        else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Bans API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
