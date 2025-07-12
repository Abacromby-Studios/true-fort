// api/bans/index.js
import fs from 'fs';
import path from 'path';

const bansFilePath = path.join(process.cwd(), 'data', 'bans.json');

// Ensure bans file exists
if (!fs.existsSync(bansFilePath)) {
    fs.writeFileSync(bansFilePath, JSON.stringify([], null, 2));
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const bansData = fs.readFileSync(bansFilePath, 'utf8');
            const bans = JSON.parse(bansData);
            res.status(200).json(bans);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read bans' });
        }
    } 
    else if (req.method === 'POST') {
        try {
            const bansData = fs.readFileSync(bansFilePath, 'utf8');
            const bans = JSON.parse(bansData);
            
            const newBan = {
                ip: req.body.ip,
                type: req.body.type,
                page: req.body.page || null,
                reason: req.body.reason,
                timestamp: new Date().toISOString()
            };
            
            bans.push(newBan);
            fs.writeFileSync(bansFilePath, JSON.stringify(bans, null, 2));
            
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to add ban' });
        }
    } 
    else if (req.method === 'DELETE') {
        try {
            const ipToRemove = req.query.ip;
            const bansData = fs.readFileSync(bansFilePath, 'utf8');
            let bans = JSON.parse(bansData);
            
            bans = bans.filter(ban => ban.ip !== ipToRemove);
            fs.writeFileSync(bansFilePath, JSON.stringify(bans, null, 2));
            
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to remove ban' });
        }
    } 
    else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
