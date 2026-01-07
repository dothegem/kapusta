window.Parser = window.Parser || {};

window.Parser.helpers = {
    clean: (text) => text ? text.replace(/\s+/g, ' ').trim() : "",
    parseNum: (str) => {
        if (!str) return 0;
        return parseFloat(String(str).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    }
};

window.Parser.extractData = async () => {
    const url = window.location.href;
    const h = window.Parser.helpers;
    
    // Default empty structure
    const data = {
        tender: {
            source: '',
            sourceTenderId: '',
            lawType: 'Unknown',
            nmc: 0,
            dates: { submission: null },
            customer: { name: '', inn: '', kpp: '' },
            contacts: { fio: '', phone: '', email: '' }
        }
    };

    // --- ЛОГИКА KONTUR ---
    if (url.includes("zakupki.kontur.ru")) {
        data.tender.source = 'kontur';
        
        // 1. ID Тендера (Чистый)
        const idMatch = document.body.innerText.match(/№\s*(\d{11,20})/);
        data.tender.sourceTenderId = idMatch ? idMatch[1] : 'Не найден';

        // 2. Закон (44/223)
        if (document.querySelector('.tender-type-badge_44')) data.tender.lawType = '44-ФЗ';
        else if (document.querySelector('.tender-type-badge_223')) data.tender.lawType = '223-ФЗ';
        else {
             const text = document.body.innerText;
             if (text.includes('44-ФЗ')) data.tender.lawType = '44-ФЗ';
             else if (text.includes('223-ФЗ')) data.tender.lawType = '223-ФЗ';
        }

        // 3. Даты (Окончание подачи)
        // TODO: SELECTOR - Найти точный класс элемента с датой на странице
        // data.tender.dates.submission = ...

        // 4. Основные данные (из старого парсера)
        const orgEl = document.querySelector('.lot-customer__info');
        if (orgEl) {
            data.tender.customer.name = h.clean(orgEl.innerText).split("ИНН")[0].trim();
            const innMatch = orgEl.innerText.match(/ИНН\s*(\d+)/);
            if (innMatch) data.tender.customer.inn = innMatch[1];
            const kppMatch = orgEl.innerText.match(/КПП\s*(\d+)/);
            if (kppMatch) data.tender.customer.kpp = kppMatch[1];
        }
        
        const priceEl = document.querySelector('.purchase-headers__price');
        if (priceEl) data.tender.nmc = h.parseNum(priceEl.innerText);

        const contactsEl = document.querySelector('.pd-additional__contact-values');
        if (contactsEl) {
            const text = contactsEl.innerText;
            const emailMatch = text.match(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/);
            if (emailMatch) data.tender.contacts.email = emailMatch[0];
            const phoneMatch = text.match(/(\+7|8|7)[\s\(]*\d{3}[\s\)]*[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/);
            if (phoneMatch) data.tender.contacts.phone = phoneMatch[0];
            data.tender.contacts.fio = h.clean(text.split('\n')[0]);
        }
    } else if (url.includes("bidzaar.com")) {
        data.tender.source = 'bidzaar';
        // TODO: Implement Bidzaar logic similar to Kontur
    }

    return data;
};