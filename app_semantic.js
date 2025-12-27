// FILE: app_semantic.js
// VERSION: 1.0.0
// START_MODULE_CONTRACT:
// PURPOSE: Центральный модуль инициализации popup-интерфейса браузерного расширения для работы с тендерами.
//          Управляет жизненным циклом приложения, переключением вкладок, автопарсингом данных тендеров,
//          интеграцией с CRM и сохранением состояния.
// SCOPE: UI инициализация, управление событиями, автопарсинг тендеров, CRM-интерфейс, управление состоянием dirty/clean
// INPUT: DOM-события, chrome.storage данные, результаты парсинга от Parser модуля
// OUTPUT: Инициализированный UI, обработчики событий, сохраненные данные в chrome.storage
// KEYWORDS_MODULE: [popup_initialization, tab_management, tender_parsing, crm_interface, state_management, chrome_extension]
// LINKS_TO_MODULE: [calculator.js, parser.js, rules.js, data.js, background.js]
// LINKS_TO_SPECIFICATION: [Автоматический парсинг тендеров, Управление сделками в CRM, Сохранение данных расчетов]
// END_MODULE_CONTRACT

// START_MODULE_MAP:
// (Формат: ТИП [Вес важности 1-10] [Краткое описание] => [имя_сущности])
// OBJECT [10] [Глобальный объект приложения] => window.App
// FUNCTION [10] [Инициализация приложения при загрузке] => window.App.init
// FUNCTION [7] [Маркировка несохраненных изменений] => window.App.markDirty
// FUNCTION [7] [Сброс флага изменений] => window.App.markClean
// FUNCTION [8] [Сохранение всех данных] => window.App.saveAll
// FUNCTION [6] [Рендеринг карточки сделки] => window.App.renderDealCard
// FUNCTION [9] [Автоматический парсинг тендера] => window.App.runAutoParsing
// FUNCTION [5] [Получение ID тендера из URL] => window.App.getTenderId
// FUNCTION [8] [Рендеринг списка сделок CRM] => window.App.renderCRM
// FUNCTION [4] [Открытие сделки] => window.App.openDeal
// FUNCTION [6] [Удаление тендера] => window.App.deleteTender
// END_MODULE_MAP

// START_USE_CASES:
// (AAG-нотация: Actor (Context) -> Action (Component's Role) -> Goal)
// - [Автопарсинг]: Пользователь (на странице тендера) -> Открывает popup -> Автоматически извлекаются данные тендера
// - [Управление расчетами]: Пользователь (редактирует данные) -> Изменяет поля калькулятора -> Данные отмечаются как несохраненные
// - [CRM просмотр]: Пользователь (вкладка CRM) -> Просматривает список сделок -> Видит сохраненные тендеры с дедлайнами
// - [Сохранение]: Пользователь (несохраненные изменения) -> Нажимает "Сохранить все" -> Данные сохраняются в chrome.storage
// - [Экспорт]: Пользователь (готовый расчет) -> Нажимает "Экспорт" -> Скачивается текстовый файл с результатами
// END_USE_CASES

// START_CHANGE_SUMMARY
// LAST_CHANGE: Добавлена полная семантическая разметка модуля согласно semantic_templ.xml
// PREV_CHANGE_SUMMARY: Исходная версия с базовой функциональностью popup, парсинга и CRM
// IMPORTANT_NOTICE: При модификации логики сохранения учитывать формат ключей tenderCalc_{id}
// END_CHANGE_SUMMARY

// ============================================================================
// ==                        ГЛОБАЛЬНЫЙ ОБЪЕКТ APP                           ==
// ============================================================================

// CONTRACT:
// PURPOSE: Основной namespace приложения, хранит флаг несохраненных изменений
// ATTRIBUTES:
//   - [Флаг наличия несохраненных изменений] => isDirty: Boolean
window.App = window.App || {};
window.App.isDirty = false;

// ============================================================================
// ==                    ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ                               ==
// ============================================================================

// CONTRACT:
// PURPOSE: Инициализирует popup-интерфейс расширения: загружает константы, настраивает обработчики,
//          восстанавливает настройки из storage, запускает автопарсинг текущей страницы.
// INPUTS: Нет (async функция, вызывается при DOMContentLoaded)
// OUTPUTS:
//   - Promise<void> - Завершается после полной инициализации UI и обработчиков
// SIDE_EFFECTS:
//   - Загружает данные из chrome.storage.local
//   - Модифицирует DOM: устанавливает значения полей, добавляет обработчики событий
//   - Вызывает Calculator.init() и Rules.loadConstants()
//   - Запускает автопарсинг текущей вкладки
// KEYWORDS: [initialization, event_handlers, chrome_storage, dom_manipulation, auto_parsing]
// LINKS: [Calculator.init, Rules.loadConstants, runAutoParsing, chrome.storage.local]
window.App.init = async () => {
    // #START_LOAD_CONSTANTS
    // Загружаем глобальные константы и правила расчета
    if (window.Rules && window.Rules.loadConstants) await window.Rules.loadConstants();
    // #END_LOAD_CONSTANTS

    // #START_TAB_SWITCHING
    // Настройка переключения основных вкладок (Калькулятор, Прайс, CRM, Настройки)
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    const switchTab = (target) => {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        contents.forEach(c => c.style.display = c.id === `tab-${target}` ? 'block' : 'none');
        if (target === 'crm') window.App.renderCRM();
    };
    tabs.forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));
    // #END_TAB_SWITCHING

    // #START_CRM_SUBTABS
    // Настройка подвкладок в разделе CRM (Сделки, Аналитика, Шаблоны)
    const subtabs = document.querySelectorAll('[data-subtab]');
    const subtabContents = document.querySelectorAll('.crm-subtab');
    subtabs.forEach(btn => btn.onclick = () => {
        subtabs.forEach(t => t.classList.toggle('active', t.dataset.subtab === btn.dataset.subtab));
        subtabContents.forEach(c => c.style.display = c.id === `crm-${btn.dataset.subtab}` ? 'block' : 'none');
    });
    // #END_CRM_SUBTABS

    // #START_INIT_CALCULATOR
    // Инициализация модуля калькулятора
    if (window.Calculator) await window.Calculator.init();
    // #END_INIT_CALCULATOR

    // #START_RESTORE_SETTINGS
    // Восстановление настроек из chrome.storage (параметры парсера, переменные расчета, Telegram)
    const s = await chrome.storage.local.get([
        'parserminprice','tguser','tgtoken',
        'var_mrot', 'var_ndfl', 'var_usn', 'var_osn', 'var_profit_tax', 'var_dividend'
    ]);
    if (document.getElementById('minPriceVal')) document.getElementById('minPriceVal').value = s.parserminprice ?? 350;
    if (document.getElementById('tgUser')) document.getElementById('tgUser').value = s.tguser ?? '';
    if (document.getElementById('tgToken')) document.getElementById('tgToken').value = s.tgtoken ?? '';
    
    if (document.getElementById('var_mrot')) document.getElementById('var_mrot').value = s.var_mrot ?? 27093;
    if (document.getElementById('var_ndfl')) document.getElementById('var_ndfl').value = s.var_ndfl ?? 13;
    if (document.getElementById('var_usn')) document.getElementById('var_usn').value = s.var_usn ?? 6;
    if (document.getElementById('var_osn')) document.getElementById('var_osn').value = s.var_osn ?? 22;
    if (document.getElementById('var_profit_tax')) document.getElementById('var_profit_tax').value = s.var_profit_tax ?? 25;
    if (document.getElementById('var_dividend')) document.getElementById('var_dividend').value = s.var_dividend ?? 0.85;
    // #END_RESTORE_SETTINGS

    // #START_LOAD_SPEC_FILE
    // Загрузка файла спецификации калькулятора (calc_spec.yaml)
    try {
        const response = await fetch(chrome.runtime.getURL('calc_spec.yaml'));
        const specText = await response.text();
        if (document.getElementById('calcSpecArea')) document.getElementById('calcSpecArea').value = specText;
    } catch (e) { console.error("[App] Failed to load spec:", e); }
    // #END_LOAD_SPEC_FILE

    // #START_ATTACH_EVENT_LISTENERS
    // Подключение обработчиков событий ко всем кнопкам и элементам управления
    document.getElementById('addCalcRowBtn')?.addEventListener('click', () => window.Calculator.addRow());
    document.getElementById('addExtraRowBtn')?.addEventListener('click', () => window.Calculator.addExtraRow());
    
    document.getElementById('addPriceRowBtn')?.addEventListener('click', () => {
        const newId = Date.now();
        window.Calculator.state.priceList.push({ id: newId, name: 'Новый тип', region: 'Москва', weapon: false, shift: 'Нет', hoursMonth: 365, rateHour: 500 });
        window.Calculator.renderPriceTable();
        window.App.markDirty();
    });
    
    document.getElementById('addExtraPriceRowBtn')?.addEventListener('click', () => {
        const newId = Date.now();
        window.Calculator.state.extraPriceList.push({ id: newId, name: 'Новый расход', amount: 0, type: 'monthly' });
        window.Calculator.renderExtraPriceTable();
        window.App.markDirty();
    });
    
    document.getElementById('saveAllBtn')?.addEventListener('click', () => window.App.saveAll());
    document.getElementById('savePriceBtn')?.addEventListener('click', () => window.Calculator.handleSavePrice());
    
    document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
        await chrome.storage.local.set({
            parserminprice: parseFloat(document.getElementById('minPriceVal').value) || 350,
            tguser: document.getElementById('tgUser').value,
            tgtoken: document.getElementById('tgToken').value,
            var_mrot: document.getElementById('var_mrot').value,
            var_ndfl: document.getElementById('var_ndfl').value,
            var_usn: document.getElementById('var_usn').value,
            var_osn: document.getElementById('var_osn').value,
            var_profit_tax: document.getElementById('var_profit_tax').value,
            var_dividend: document.getElementById('var_dividend').value
        });
        await window.Rules.loadConstants();
        window.Calculator.renderAll();
        alert('✅ Настройки сохранены');
    });
    
    document.getElementById('reParseBtn')?.addEventListener('click', () => window.App.runAutoParsing(true));
    
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        const text = document.getElementById('resultArea').value;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tender_calc_${Date.now()}.txt`;
        a.click();
    });
    // #END_ATTACH_EVENT_LISTENERS

    // #START_OBSERVE_CHANGES
    // Отслеживание изменений во всех полях ввода для активации кнопки "Сохранить"
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('change', window.App.markDirty);
    });
    // #END_OBSERVE_CHANGES

    // #START_INITIAL_AUTOPARSING
    // Запуск автоматического парсинга при открытии popup
    await window.App.runAutoParsing();
    // #END_INITIAL_AUTOPARSING
};

// ============================================================================
// ==                   ФУНКЦИИ УПРАВЛЕНИЯ СОСТОЯНИЕМ                        ==
// ============================================================================

// CONTRACT:
// PURPOSE: Отмечает наличие несохраненных изменений и показывает кнопку "Сохранить все"
// INPUTS: Нет
// OUTPUTS: Нет (void)
// SIDE_EFFECTS:
//   - Устанавливает window.App.isDirty = true
//   - Показывает кнопку saveAllBtn (display = 'block')
// KEYWORDS: [state_management, ui_feedback, dirty_flag]
// LINKS: [markClean, saveAll]
window.App.markDirty = () => {
    // #START_SET_DIRTY_FLAG
    window.App.isDirty = true;
    const btn = document.getElementById('saveAllBtn');
    if (btn) btn.style.display = 'block';
    // #END_SET_DIRTY_FLAG
};

// CONTRACT:
// PURPOSE: Сбрасывает флаг несохраненных изменений и скрывает кнопку "Сохранить все"
// INPUTS: Нет
// OUTPUTS: Нет (void)
// SIDE_EFFECTS:
//   - Устанавливает window.App.isDirty = false
//   - Скрывает кнопку saveAllBtn (display = 'none')
// KEYWORDS: [state_management, ui_feedback, clean_state]
// LINKS: [markDirty, saveAll]
window.App.markClean = () => {
    // #START_SET_CLEAN_FLAG
    window.App.isDirty = false;
    const btn = document.getElementById('saveAllBtn');
    if (btn) btn.style.display = 'none';
    // #END_SET_CLEAN_FLAG
};

// CONTRACT:
// PURPOSE: Сохраняет все данные калькулятора и сбрасывает флаг несохраненных изменений
// INPUTS: Нет (async функция)
// OUTPUTS:
//   - Promise<void> - Завершается после сохранения
// SIDE_EFFECTS:
//   - Вызывает Calculator.handleSaveMain()
//   - Вызывает markClean()
//   - Показывает alert с подтверждением
// KEYWORDS: [data_persistence, chrome_storage, save_operation]
// LINKS: [Calculator.handleSaveMain, markClean, markDirty]
window.App.saveAll = async () => {
    // #START_SAVE_MAIN_DATA
    await window.Calculator.handleSaveMain();
    // #END_SAVE_MAIN_DATA
    
    // #START_RESET_DIRTY_STATE
    window.App.markClean();
    alert('✅ Все изменения сохранены');
    // #END_RESET_DIRTY_STATE
};

// ============================================================================
// ==                      ФУНКЦИИ CRM ИНТЕРФЕЙСА                            ==
// ============================================================================

// CONTRACT:
// PURPOSE: Создает HTML-разметку карточки сделки для отображения в списке CRM
// INPUTS:
//   - [Объект с данными сделки] => deal: Object {id, customerName, customerInn, totalSum, profitability, deadline}
//   - [Флаг развернутого отображения] => isExpanded: Boolean (по умолчанию false)
// OUTPUTS:
//   - String - HTML-строка с разметкой карточки
// KEYWORDS: [crm_ui, card_rendering, deal_visualization, deadline_tracking]
// LINKS: [renderCRM, openDeal, deleteTender, Rules.fmtNum]
window.App.renderDealCard = (deal, isExpanded = false) => {
    // #START_CALCULATE_DEADLINE
    const deadline = new Date(deal.deadline);
    const now = new Date();
    const timeLeft = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
    const timerColor = timeLeft < 3 ? 'var(--accent-red)' : (timeLeft < 7 ? 'var(--accent-orange)' : 'var(--accent-green)');
    // #END_CALCULATE_DEADLINE
  
    // #START_RENDER_COMPACT_CARD
    if (!isExpanded) {
      return `
        <div class="crm-card" data-deal-id="${deal.id}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 10px; color: var(--text-muted);">${deal.customerName || 'Без названия'}</div>
              <div style="font-size: 13px; font-weight: 700; margin: 2px 0;">${window.Rules.fmtNum(deal.totalSum || 0)}</div>
              <div style="font-size: 9px;">ИНН: ${deal.customerInn || '-'} | Рент.: <strong class="text-success">${deal.profitability || '0%'}</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: ${timerColor}; font-weight: 700; margin-bottom: 4px;">
                <i class="fas fa-clock"></i> ${timeLeft > 0 ? timeLeft + ' дн.' : (timeLeft === 0 ? 'Сегодня' : 'Просрочено')}
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn-icon" onclick="window.App.openDeal('${deal.id}')"><i class="fas fa-external-link-alt"></i></button>
                <button class="btn-icon danger" onclick="window.App.deleteTender('tenderCalc_${deal.id}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    // #END_RENDER_COMPACT_CARD
    
    return '';
};

// CONTRACT:
// PURPOSE: Запускает автоматический парсинг данных тендера с текущей активной вкладки браузера
// INPUTS:
//   - [Флаг принудительного парсинга] => force: Boolean (по умолчанию false)
// OUTPUTS:
//   - Promise<void> - Завершается после парсинга или пропуска
// SIDE_EFFECTS:
//   - Проверяет URL активной вкладки
//   - Загружает сохраненные данные из chrome.storage
//   - Выполняет content script (parser.js) на странице
//   - Заполняет поля формы результатами парсинга
//   - Вызывает Parser.checkCounterparty()
// KEYWORDS: [content_script, data_extraction, form_autofill, chrome_tabs, scripting_api]
// LINKS: [Parser.extractData, Parser.checkCounterparty, getTenderId, chrome.storage.local, chrome.scripting]
window.App.runAutoParsing = async (force = false) => {
    // #START_GET_ACTIVE_TAB
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    // #END_GET_ACTIVE_TAB
    
    // #START_CHECK_TENDER_URL
    const isTender = tab.url.match(/zakupki\.kontur\.ru\/\d+/) || tab.url.includes("bidzaar.com/tender/");
    if (!isTender) return;
    // #END_CHECK_TENDER_URL

    // #START_CHECK_SAVED_DATA
    const tid = window.App.getTenderId(tab.url);
    if (!force && tid) {
        const saved = await chrome.storage.local.get([`tenderCalc_${tid}`]);
        if (saved[`tenderCalc_${tid}`]?.resultText) {
            document.getElementById("resultArea").value = saved[`tenderCalc_${tid}`].resultText;
            // Восстановление других полей
            const data = saved[`tenderCalc_${tid}`];
            if (data.url) document.getElementById('tenderUrl').value = data.url;
            if (data.customerName) document.getElementById('customerName').value = data.customerName;
            if (data.customerInn) document.getElementById('customerInn').value = data.customerInn;
            if (data.customerKpp) document.getElementById('customerKpp').value = data.customerKpp;
            return;
        }
    }
    // #END_CHECK_SAVED_DATA

    // #START_EXECUTE_PARSER
    try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['parser.js'] });
        const s = await chrome.storage.local.get(['parserminprice']);
        const min = s.parserminprice || 350;
        const res = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (t) => window.Parser.extractData(t, false),
            args: [min]
        });

        if (res?.[0]?.result) {
            const data = res[0].result;
            document.getElementById("resultArea").value = data.formattedText;
            // Автозаполнение формы
            const tenderData = data.dataArray[0];
            document.getElementById('tenderUrl').value = tenderData.url;
            document.getElementById('customerName').value = tenderData.organizer;
            document.getElementById('contactName').value = tenderData.contactName;
            document.getElementById('contactPhone').value = tenderData.contactPhone;
            document.getElementById('contactEmail').value = tenderData.contactEmail;
            document.getElementById('nmcValue').value = tenderData.priceValue;
            
            // Проверка контрагента
            if (window.Parser && window.Parser.checkCounterparty) {
                await window.Parser.checkCounterparty(tenderData.customerInn, tenderData.customerKpp, tenderData.organizer);
            }
        }
    } catch (e) { console.error("[App] Parser error:", e); }
    // #END_EXECUTE_PARSER
};

// CONTRACT:
// PURPOSE: Извлекает уникальный ID тендера из URL страницы
// INPUTS:
//   - [URL страницы тендера] => url: String
// OUTPUTS:
//   - String - ID тендера с префиксом источника (kontur_ или bidzaar_) или пустая строка
// KEYWORDS: [url_parsing, tender_identification, string_manipulation]
// LINKS: [runAutoParsing]
window.App.getTenderId = (url) => {
    // #START_PARSE_KONTUR_URL
    if (url.includes("zakupki.kontur.ru/")) 
        return (url.match(/zakupki\.kontur\.ru\/(\d+)/)||[])[1] ? `kontur_${url.match(/zakupki\.kontur\.ru\/(\d+)/)[1]}` : "";
    // #END_PARSE_KONTUR_URL
    
    // #START_PARSE_BIDZAAR_URL
    if (url.includes("bidzaar.com/tender/")) 
        return (url.match(/bidzaar\.com\/tender\/([\w-]+)/)||[])[1] ? `bidzaar_${url.match(/bidzaar\.com\/tender\/([\w-]+)/)[1]}` : "";
    // #END_PARSE_BIDZAAR_URL
    
    return "";
};

// CONTRACT:
// PURPOSE: Отображает список сохраненных тендеров в разделе CRM
// INPUTS: Нет (async функция)
// OUTPUTS:
//   - Promise<void> - Завершается после рендеринга списка
// SIDE_EFFECTS:
//   - Загружает все данные из chrome.storage.local
//   - Модифицирует DOM элемента dealsContainer
//   - Вызывает renderDealCard для каждого тендера
// KEYWORDS: [crm_rendering, storage_retrieval, list_visualization]
// LINKS: [renderDealCard, chrome.storage.local]
window.App.renderCRM = async () => {
    // #START_GET_CONTAINER
    const container = document.getElementById('dealsContainer');
    if (!container) return;
    container.innerHTML = '';
    // #END_GET_CONTAINER
    
    // #START_LOAD_TENDERS
    const store = await chrome.storage.local.get(null);
    const tenderKeys = Object.keys(store).filter(k => k.startsWith('tenderCalc_'));
    // #END_LOAD_TENDERS
    
    // #START_RENDER_EMPTY_STATE
    if (tenderKeys.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет сохраненных тендеров</div>';
      return;
    }
    // #END_RENDER_EMPTY_STATE
    
    // #START_RENDER_CARDS
    tenderKeys.forEach(k => {
      const data = store[k];
      const tid = k.replace('tenderCalc_', '');
      container.innerHTML += window.App.renderDealCard({...data, id: tid});
    });
    // #END_RENDER_CARDS
};

// CONTRACT:
// PURPOSE: Открывает детальный просмотр сделки (заглушка для будущей реализации)
// INPUTS:
//   - [ID тендера] => tid: String
// OUTPUTS: Нет (void)
// SIDE_EFFECTS:
//   - Выводит в консоль ID открываемой сделки
// KEYWORDS: [crm_navigation, deal_details, placeholder]
// LINKS: [renderDealCard, renderCRM]
window.App.openDeal = (tid) => { 
    console.log('Opening:', tid); 
};

// CONTRACT:
// PURPOSE: Удаляет сохраненный тендер из chrome.storage после подтверждения
// INPUTS:
//   - [Ключ хранилища тендера] => key: String (формат: tenderCalc_{id})
// OUTPUTS:
//   - Promise<void> - Завершается после удаления
// SIDE_EFFECTS:
//   - Показывает confirmation dialog
//   - Удаляет данные из chrome.storage.local
//   - Обновляет отображение CRM через renderCRM()
// KEYWORDS: [data_deletion, confirmation_dialog, crm_management]
// LINKS: [renderCRM, chrome.storage.local]
window.App.deleteTender = async (key) => {
    // #START_CONFIRM_DELETION
    if (confirm('Удалить?')) {
      await chrome.storage.local.remove(key);
      window.App.renderCRM();
    }
    // #END_CONFIRM_DELETION
};

// ============================================================================
// ==                         ИНИЦИАЛИЗАЦИЯ                                  ==
// ============================================================================

// Запуск инициализации при загрузке DOM
document.addEventListener('DOMContentLoaded', window.App.init);
