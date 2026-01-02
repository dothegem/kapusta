// FILE: parser.js
// VERSION: 2.1.0
// START_MODULE_CONTRACT:
// PURPOSE: Контентный скрипт для извлечения данных о тендерах со страниц площадок.
// SCOPE: Парсинг DOM (Kontur, Bidzaar), нормализация данных, проверка контрагентов в CRM.
// INPUT: DOM страницы.
// OUTPUT: Объект с данными тендера (ИНН, НМЦ, контакты).
// KEYWORDS: [DOMAIN(9): Parsing; DOMAIN(7): CRM_Integration; TECH(6): Regex; TECH(8): DOMSelector]
// LINKS: [CALLED_BY(9): App.runAutoParsing; CALLED_BY(8): Background.processNextLink]
// END_MODULE_CONTRACT
// START_MODULE_MAP:
// OBJ 05 [Утилиты для очистки текста и парсинга чисел] => Parser.helpers
// FUNC 09 [Проверка и создание контрагента в локальной CRM] => Parser.checkCounterparty
// FUNC 10 [Основной метод экстракции данных со страницы] => Parser.extractData
// END_MODULE_MAP

window.Parser = window.Parser || {};

window.Parser.helpers = {
    clean: (text) => text ? text.replace(/\s+/g, ' ').trim() : "",
    parseNum: (str) => {
        if (!str) return 0;
        return parseFloat(String(str).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    },
    formatNum: (num) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num),
    formatInt: (num) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num)
};

// START_FUNCTION_Parser_checkCounterparty
// START_CONTRACT:
// PURPOSE: Проверяет наличие контрагента в базе. Если нет - создает. Если есть - обновляет активность.
// INPUTS:
// - [inn] => string: ИНН организации.
// - [kpp] => string: КПП.
// - [name] => string: Название.
// OUTPUTS:
// - [number] ID контрагента.
// END_CONTRACT
window.Parser.checkCounterparty = async (inn, kpp, name) => {
    // START_BLOCK_CRM_CHECK
    if (!inn) return null;
    const stored = await chrome.storage.local.get('counterparties');
    const list = stored.counterparties || [];
    const existing = list.find(c => c.inn === inn);
    
    if (!existing) {
      const newCP = {
        id: Date.now(),
        inn, kpp: kpp || '', name,
        dealsCount: 1,
        lastActivity: new Date().toISOString()
      };
      list.push(newCP);
      await chrome.storage.local.set({ counterparties: list });
      return newCP.id;
    } else {
      existing.dealsCount++;
      existing.lastActivity = new Date().toISOString();
      await chrome.storage.local.set({ counterparties: list });
      return existing.id;
    }
    // END_BLOCK_CRM_CHECK
};
// END_FUNCTION_Parser_checkCounterparty

// START_FUNCTION_Parser_extractData
// START_CONTRACT:
// PURPOSE: Извлекает данные тендера из текущей страницы на основе URL.
// INPUTS:
// - [threshold] => number: Минимальная цена (опционально, для фильтрации).
// - [autoSetStatus] => boolean: Флаг автоматического обновления статуса (не используется в текущей версии).
// OUTPUTS:
// - [object] { dataArray: [...], formattedText: string }
// END_CONTRACT
window.Parser.extractData = async (threshold, autoSetStatus = false) => {
    const h = window.Parser.helpers;
    const url = window.location.href.split('?')[0];
    
    // START_BLOCK_IDENTIFY_PLATFORM
    let tenderId = "";
    if (url.includes("zakupki.kontur.ru/")) {
        const match = url.match(/zakupki\.kontur\.ru\/(\d+)/);
        tenderId = match ? `kontur_${match[1]}` : `kontur_${url}`;
    } else if (url.includes("bidzaar.com/tender/")) {
        const match = url.match(/bidzaar\.com\/tender\/([\w-]+)/);
        tenderId = match ? `bidzaar_${match[1]}` : `bidzaar_${url}`;
    }
    // END_BLOCK_IDENTIFY_PLATFORM

    let data = {
        tenderId: tenderId,
        url: url,
        organizer: "",
        customerInn: "",
        customerKpp: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        priceValue: 0,
        formattedText: ""
    };

    // START_BLOCK_EXTRACT_KONTUR
    if (url.includes("zakupki.kontur.ru")) {
        const orgEl = document.querySelector('.lot-customer__info');
        if (orgEl) {
            data.organizer = h.clean(orgEl.innerText).split("ИНН")[0].trim();
            const innMatch = orgEl.innerText.match(/ИНН\s*(\d+)/);
            if (innMatch) data.customerInn = innMatch[1];
            const kppMatch = orgEl.innerText.match(/КПП\s*(\d+)/);
            if (kppMatch) data.customerKpp = kppMatch[1];
        }
        
        const priceEl = document.querySelector('.purchase-headers__price');
        if (priceEl) data.priceValue = h.parseNum(priceEl.innerText);

        const contactsEl = document.querySelector('.pd-additional__contact-values');
        if (contactsEl) {
            const text = contactsEl.innerText;
            const emailMatch = text.match(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/);
            if (emailMatch) data.contactEmail = emailMatch[0];
            const phoneMatch = text.match(/(\+7|8|7)[\s\(]*\d{3}[\s\)]*[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/);
            if (phoneMatch) data.contactPhone = phoneMatch[0];
            data.contactName = h.clean(text.split('\n')[0]);
        }
    }
    // END_BLOCK_EXTRACT_KONTUR

    data.formattedText = `${data.organizer}\nИНН: ${data.customerInn}\nНМЦ: ${data.priceValue}\nКонтакты: ${data.contactName} ${data.contactPhone}`;

    return {
        dataArray: [data],
        formattedText: data.formattedText
    };
};
// END_FUNCTION_Parser_extractData
