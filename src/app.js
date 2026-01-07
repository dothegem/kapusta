// src/app.js - CLEAN VERSION FOR MVP v1.0

window.App = window.App || {};

window.App.init = async () => {
    console.log("[App] Initializing MVP v1.0...");

    // 1. Инициализация парсера (авто-запуск при открытии)
    await window.App.runAutoParsing();

    // 2. Привязка кнопок UI
    const calcBtn = document.getElementById('calculateBtn');
    if (calcBtn) calcBtn.addEventListener('click', window.App.handleCalculate);

    const saveBtn = document.getElementById('saveDealBtn');
    if (saveBtn) saveBtn.addEventListener('click', window.App.handleSaveDeal);

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => window.App.runAutoParsing(true));
};

// Запуск парсинга и заполнение UI
window.App.runAutoParsing = async (force = false) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    try {
        // Инъекция скриптов (Parser + Helpers)
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/parser.js']
        });

        const res = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.Parser.extractData()
        });

        if (res?.[0]?.result) {
            const data = res[0].result;
            window.App.currentTenderData = data.tender; // Сохраняем в память
            window.App.renderTenderInfo(data.tender);
        }
    } catch (e) {
        console.error("[App] Parsing failed:", e);
        const statusEl = document.getElementById('tenderStatus');
        if (statusEl) {
            statusEl.textContent = "Error";
            statusEl.classList.add('error');
        }
    }
};

window.App.renderTenderInfo = (tender) => {
    if (!tender) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    
    set('tenderId', tender.sourceTenderId || 'ID н/д');
    set('lawType', tender.lawType || '---');
    set('tenderCustomer', tender.customer.name || 'Заказчик не определен');
    set('tenderNmc', window.Rules.fmtNum(tender.nmc) + ' ₽');
    set('tenderStatus', 'Active'); 
    
    // Подсветка ФЗ
    const lawBadge = document.getElementById('lawType');
    if (lawBadge) {
        if (tender.lawType === '44-ФЗ') lawBadge.style.backgroundColor = '#0056b3'; // Blue
        if (tender.lawType === '223-ФЗ') lawBadge.style.backgroundColor = '#6f42c1'; // Purple
    }
};

window.App.handleCalculate = () => {
    // Сбор данных из инпутов
    const baseAmount = parseFloat(document.getElementById('baseAmountInput').value) || 0;
    const posts = parseFloat(document.getElementById('postsInput').value) || 0;
    const shifts = parseFloat(document.getElementById('shiftsInput').value) || 0;
    const hours = parseFloat(document.getElementById('hoursInput').value) || 0;

    if (baseAmount <= 0) {
        alert('Введите базовую сумму (ФОТ + Расходы)');
        return;
    }

    const input = {
        baseAmount: baseAmount,
        workload: { posts, shifts, hoursPerPost: hours },
        schemaSet: ['BEL_USN', 'BEL_NDS', 'SER_USN', 'SER_NDS', 'IP_NDS']
    };

    // Вызов ядра калькулятора
    const output = window.Calculator.calc(input);
    window.App.currentCalculation = output.calculations[0]; 
    window.App.currentResults = output; // Сохраняем всё

    // Рендер результатов
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    output.calculations.forEach(calc => {
        const div = document.createElement('div');
        div.className = 'result-card';
        const margin = calc.aggregates.margin;
        const colorClass = margin < 10 ? 'bad' : (margin > 15 ? 'good' : 'medium');

        div.innerHTML = `
            <div class="result-header">
                <strong>${calc.schemaCode}</strong>
                <span class="margin-badge ${colorClass}">${margin.toFixed(1)}%</span>
            </div>
            <div class="result-row"><span>Выручка:</span> <span>${window.Rules.fmtNum(calc.aggregates.total)}</span></div>
            <div class="result-row"><span>Налоги:</span> <span>${window.Rules.fmtNum(calc.aggregates.taxes)}</span></div>
            <div class="result-row"><span>Прибыль:</span> <span>${window.Rules.fmtNum(calc.aggregates.profitCash)}</span></div>
        `;
        container.appendChild(div);
    });
};

window.App.handleSaveDeal = async () => {
    if (!window.App.currentTenderData) {
        alert('Нет данных тендера для сохранения');
        return;
    }
    // Берем результат первой схемы или той, что выбрана
    const calcData = window.App.currentResults?.calculations?.[0] || { aggregates: { total: 0, margin: 0 } };

    try {
        const deal = await window.CRM.createDeal(window.App.currentTenderData, calcData);
        alert(`Сделка сохранена! ID: ${deal.id.slice(0,8)}...`);
    } catch (e) {
        console.error("Save failed", e);
        alert('Ошибка сохранения');
    }
};

document.addEventListener('DOMContentLoaded', window.App.init);