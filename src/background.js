// FILE: background.js
// VERSION: 1.1.0
// START_MODULE_CONTRACT:
// PURPOSE: Управление состоянием расширения, обработка событий установки, сообщений и alarms.
// SCOPE: Service Worker (Manifest V3).
// EVENTS: onInstalled, onMessage, alarms.onAlarm.
// DEPENDENCIES: chrome.storage, chrome.alarms.
// END_MODULE_CONTRACT

const ALARM_NAME = 'check_tenders';
const CHECK_INTERVAL = 60; // minutes

// START_FUNCTION_Background_onInstalled
// START_CONTRACT:
// PURPOSE: Инициализация дефолтных настроек при установке расширения.
// INPUTS: details (object).
// SIDE_EFFECTS: Запись в chrome.storage.local, создание alarm.
// END_CONTRACT
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[Background] Installed/Updated', details.reason);
    
    // Initialize default storage if empty
    const current = await chrome.storage.local.get(null);
    if (!current.parserminprice) {
        await chrome.storage.local.set({
            parserminprice: 350, // Default min price filter
            tguser: '',
            tgtoken: ''
        });
    }

    // Set up periodic check
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL });
});

// START_FUNCTION_Background_onAlarm
// START_CONTRACT:
// PURPOSE: Периодическая проверка тендеров (заглушка для будущей функциональности).
// INPUTS: alarm (object).
// END_CONTRACT
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        console.log('[Background] Alarm fired: check_tenders');
        // Placeholder for background checks logic
        // TODO: Implement background parsing or API checks
    }
});

// START_FUNCTION_Background_onMessage
// START_CONTRACT:
// PURPOSE: Обработка сообщений от popup или content scripts.
// INPUTS: request, sender, sendResponse.
// HANDLES:
// - 'ping': Проверка связи.
// - 'open_options': Открытие настроек (не реализовано в MVP).
// END_CONTRACT
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Message received:', request);
    
    if (request.type === 'ping') {
        sendResponse({ status: 'ok', timestamp: Date.now() });
    }
    
    // Return true if async response is needed
    return false; 
});
