// middleware/ipBan.js
import fs from 'fs';
import path from 'path';

const bansFilePath = path.join(process.cwd(), 'data', 'bans.json');

export default function ipBanMiddleware(req, res, next) {
    try {
        // Read current bans
        const bansData = fs.readFileSync(bansFilePath, 'utf8');
        const bans = JSON.parse(bansData);
        
        const clientIP = req.ip || 
                       req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                       req.connection.remoteAddress;
        
        // Check for matching bans
        const matchingBan = bans.find(ban => {
            // Simple IP match (for now - consider adding CIDR support later)
            if (ban.ip !== clientIP) return false;
            
            // For page bans, check if path matches
            if (ban.type === 'page') {
                return req.path.startsWith(ban.page);
            }
            
            // Full bans match all paths
            return true;
        });
        
        if (matchingBan) {
            return res.redirect(`/403.html?reason=${encodeURIComponent(matchingBan.reason)}`);
        }
        
        next();
    } catch (error) {
        console.error('IP ban check failed:', error);
        next(); // Allow access if there's an error reading bans
    }
}
