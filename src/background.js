// FILE: background.js
// VERSION: 2.2.0
// PURPOSE: Service worker for extension defaults and alarms.

// DISABLED (2026-01-08):
// Chrome alarms logic is commented out because it caused "Service Worker Registration Failed (Status 15)"
// due to missing "alarms" permission in manifest.
//
// TODO: When implementing background auto-parsing:
// 1. Add "alarms" to manifest.json "permissions".
// 2. Uncomment the logic below.

/*
const ALARM_NAME = 'check_tenders';
const CHECK_INTERVAL = 60; // minutes

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Installed/Updated', details.reason);

  const current = await chrome.storage.local.get(null);

  // Minimal defaults (no Telegram token in extension)
  if (current.parserminprice === undefined) {
    await chrome.storage.local.set({
      parserminprice: 350,
      tgChatId: ''
    });
  }

  chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[Background] Alarm fired: check_tenders');
    // TODO: background parsing later
  }
});
*/

// Keep simple message listener if needed for debug, otherwise this file is inactive without manifest entry.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log('[Background] Message received:', request);
  if (request.type === 'ping') {
    sendResponse({ status: 'ok', timestamp: Date.now() });
  }
  return false;
});
