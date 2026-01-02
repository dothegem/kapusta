// FILE: background.js
// VERSION: 5.0
// START_MODULE_CONTRACT:
// PURPOSE: Фоновый сервис-воркер для управления процессом массового парсинга закупок.
// SCOPE: Управление очередью ссылок, создание вкладок, инъекция скриптов парсинга, сохранение результатов.
// INPUT: Сообщения от popup.js (start_parsing), данные из chrome.storage.local.
// OUTPUT: Обновление chrome.storage.local (результаты парсинга, статус).
// KEYWORDS_MODULE: background, service_worker, parsing, queue, chrome_api
// LINKS_TO_MODULE: popup.js
// END_MODULE_CONTRACT

// START_MODULE_MAP:
// VAR [10] [Флаг состояния обработки] => isProcessing
// FUNC [10] [Обработчик сообщений от popup] => chrome.runtime.onMessage
// FUNC [08] [Безопасное закрытие вкладки] => safeCloseTab
// FUNC [08] [Проверка существования вкладки] => checkTabExists
// FUNC [10] [Основной цикл обработки очереди ссылок] => processNextLink
// FUNC [10] [Скрипт парсинга, выполняемый на странице] => extractDataOnPage
// END_MODULE_MAP

// START_CHANGE_SUMMARY
// LAST_CHANGE: Добавлена полная семантическая разметка и блочная структура.
// END_CHANGE_SUMMARY

let isProcessing = false;

// START_BLOCK_MESSAGE_LISTENER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // CONTRACT:
    // PURPOSE: Слушает команды от popup.js для запуска процесса парсинга.
    if (request.action === "start_parsing") {
        if (!isProcessing) {
            isProcessing = true;
            processNextLink();
        }
    }
});
// END_BLOCK_MESSAGE_LISTENER

// START_FUNCTION_SAFE_CLOSE_TAB
// CONTRACT:
// PURPOSE: Безопасно закрывает вкладку, игнорируя ошибки, если вкладка уже закрыта.
// INPUTS:
//   - [ID вкладки для закрытия] => tabId: [number]
async function safeCloseTab(tabId) {
    if (!tabId) return;
    try { await chrome.tabs.remove(tabId); } catch (e) {}
}
// END_FUNCTION_SAFE_CLOSE_TAB

// START_FUNCTION_CHECK_TAB_EXISTS
// CONTRACT:
// PURPOSE: Проверяет, существует ли вкладка с указанным ID.
// INPUTS:
//   - [ID вкладки] => tabId: [number]
// OUTPUTS:
//   - [boolean] - true если существует, иначе false.
async function checkTabExists(tabId) {
    try { await chrome.tabs.get(tabId); return true; } catch { return false; }
}
// END_FUNCTION_CHECK_TAB_EXISTS

// START_FUNCTION_PROCESS_NEXT_LINK
// CONTRACT:
// PURPOSE: Рекурсивная функция для обработки следующей ссылки из очереди.
// SIDE_EFFECTS:
//   - Создает и закрывает вкладки.
//   - Обновляет chrome.storage.local.
async function processNextLink() {
    // START_BLOCK_INIT_STATE
    const data = await chrome.storage.local.get(['linkQueue', 'parsingResults', 'processedCount', 'parsingState', 'priceThreshold']);
    
    if (data.parsingState !== 'running') {
        isProcessing = false;
        return;
    }

    if (!data.linkQueue || data.linkQueue.length === 0) {
        console.log("[Background][processNextLink] Queue is empty. Finishing.");
        await chrome.storage.local.set({ parsingState: 'finished' });
        isProcessing = false;
        return;
    }
    // END_BLOCK_INIT_STATE

    // START_BLOCK_PREPARE_LINK
    const url = data.linkQueue[0];
    const remainingLinks = data.linkQueue.slice(1);
    const threshold = data.priceThreshold || 0;
    let tabId = null;
    
    console.log(`[Background][processNextLink] Processing URL: ${url}. Remaining: ${remainingLinks.length}`);
    // END_BLOCK_PREPARE_LINK

    try {
        // START_BLOCK_OPEN_TAB
        const tab = await chrome.tabs.create({ url: url, active: false });
        tabId = tab.id;

        // Ждем немного для инициализации вкладки
        await new Promise(resolve => setTimeout(resolve, 1000));
        // END_BLOCK_OPEN_TAB

        // START_BLOCK_CHECK_STATE_BEFORE_PARSE
        const currentState = (await chrome.storage.local.get('parsingState')).parsingState;
        if (currentState !== 'running') {
            await safeCloseTab(tabId);
            isProcessing = false;
            return;
        }
        // END_BLOCK_CHECK_STATE_BEFORE_PARSE

        // START_BLOCK_EXECUTE_PARSING
        if (await checkTabExists(tabId)) {
            console.log(`[Background][processNextLink] Executing script on tab ${tabId}`);
            const result = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['src/parser.js']
            });
            
            const executionResult = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (threshold) => {
                    return window.Parser.extractData(threshold, true);
                },
                args: [threshold]
            });
            console.log(`[Background][processNextLink] Script result (JSON):`, JSON.stringify(result));

            if (executionResult && executionResult[0] && executionResult[0].result) {
                const resData = executionResult[0].result;
                console.log(`[Background][processNextLink] Extracted Data:`, JSON.stringify(resData));
                
                // Проверка на пустоту (фильтр)
                if (resData.dataArray && resData.dataArray.length > 0 && resData.formattedText.length > 20) {
                    const newItems = resData.dataArray;
                    const currentResults = data.parsingResults || [];
                    
                    await chrome.storage.local.set({
                        parsingResults: [...currentResults, ...newItems],
                        processedCount: (data.processedCount || 0) + 1,
                        linkQueue: remainingLinks
                    });
                } else {
                     await chrome.storage.local.set({
                        processedCount: (data.processedCount || 0) + 1,
                        linkQueue: remainingLinks
                    });
                }
            } else {
                 await chrome.storage.local.set({
                    processedCount: (data.processedCount || 0) + 1,
                    linkQueue: remainingLinks
                });
            }
        } else {
            await chrome.storage.local.set({
                linkQueue: remainingLinks,
                processedCount: (data.processedCount || 0) + 1
            });
        }
        // END_BLOCK_EXECUTE_PARSING

    } catch (e) {
        // START_BLOCK_ERROR_HANDLING
        console.error("Error processing link:", url, e);
        await chrome.storage.local.set({
            linkQueue: remainingLinks,
            processedCount: (data.processedCount || 0) + 1
        });
        // END_BLOCK_ERROR_HANDLING
    } finally {
        // START_BLOCK_CLEANUP_AND_RECURSION
        await safeCloseTab(tabId);
        processNextLink();
        // END_BLOCK_CLEANUP_AND_RECURSION
    }
}
// END_FUNCTION_processNextLink
