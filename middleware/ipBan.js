// middleware/ipBan.js
import fs from 'fs';
import path from 'path';

const bansFilePath = path.join(process.cwd(), 'data', 'bans.json');

export default function ipBanMiddleware(req, res, next) {
    try {
        // Read bans from JSON file
        const bansData = fs.readFileSync(bansFilePath, 'utf8');
        const bans = JSON.parse(bansData);
        
        const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Check for full bans
        const fullBan = bans.find(ban => 
            ban.type === 'full' && (ban.ip === clientIP || ipMatchesCIDR(clientIP, ban.ip))
        );
        
        if (fullBan) {
            return res.redirect(`/403.html?reason=${encodeURIComponent(fullBan.reason)}`);
        }
        
        // Check for page-specific bans
        const pageBan = bans.find(ban => 
            ban.type === 'page' && 
            (ban.ip === clientIP || ipMatchesCIDR(clientIP, ban.ip)) &&
            req.path.startsWith(ban.page)
        );
        
        if (pageBan) {
            return res.redirect(`/403.html?reason=${encodeURIComponent(pageBan.reason)}`);
        }
        
        next();
    } catch (error) {
        console.error('IP ban middleware error:', error);
        next();
    }
}

// Helper function for CIDR notation matching
function ipMatchesCIDR(ip, cidr) {
    // Implementation depends on your IP format
    // You might want to use a library like ip-cidr
    // For simplicity, we'll do exact match here
    return ip === cidr;
}
