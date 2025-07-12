// Only run if not already on the 403 page
if (!window.location.pathname.includes('403.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/api/check-ip');
            
            // If redirected to 403.html, the response.redirected will be true
            if (response.redirected) {
                window.location.href = '/403.html';
            }
        } catch (error) {
            console.error('Ban check failed:', error);
        }
    });

    // Periodic checks (every 5 minutes)
    setInterval(async () => {
        try {
            const response = await fetch('/api/check-ip');
            if (response.redirected) {
                window.location.href = '/403.html';
            }
        } catch (error) {
            console.error('Periodic ban check failed:', error);
        }
    }, 300000);
}
