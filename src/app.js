// FILE: app.js
// PURPOSE: Central module for popup initialization and event management

window.App = window.App || {};
window.App.isDirty = false;

window.App.init = async () => {
    // 1. Load Constants
    if (window.Rules && window.Rules.loadConstants) await window.Rules.loadConstants();

    // 2. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    const switchTab = (target) => {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        contents.forEach(c => c.style.display = c.id === `tab-${target}` ? 'block' : 'none');
        if (target === 'crm') window.App.renderCRM();
    };
    tabs.forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));

    // 2.1 CRM Subtabs Logic
    const subtabs = document.querySelectorAll('[data-subtab]');
    const subtabContents = document.querySelectorAll('.crm-subtab');
    subtabs.forEach(btn => btn.onclick = () => {
        subtabs.forEach(t => t.classList.toggle('active', t.dataset.subtab === btn.dataset.subtab));
        subtabContents.forEach(c => c.style.display = c.id === `crm-${btn.dataset.subtab}` ? 'block' : 'none');
    });

    // 3. Initialize Calculator and Data
    if (window.Calculator) await window.Calculator.init();

    // 4. Restore Settings
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

    // Load spec file
    try {
        const response = await fetch(chrome.runtime.getURL('src/calc_spec.yaml'));
        const specText = await response.text();
        if (document.getElementById('calcSpecArea')) document.getElementById('calcSpecArea').value = specText;
    } catch (e) { console.error("[App] Failed to load spec:", e); }

    // 5. Attach Event Listeners
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

    // Observe changes
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('change', window.App.markDirty);
    });

    // Run initial auto-parsing
    await window.App.runAutoParsing();
};

window.App.markDirty = () => {
    window.App.isDirty = true;
    const btn = document.getElementById('saveAllBtn');
    if (btn) btn.style.display = 'block';
};

window.App.markClean = () => {
    window.App.isDirty = false;
    const btn = document.getElementById('saveAllBtn');
    if (btn) btn.style.display = 'none';
};

window.App.saveAll = async () => {
    await window.Calculator.handleSaveMain();
    window.App.markClean();
    alert('✅ Все изменения сохранены');
};

// START_FUNCTION_App_renderDealCard
window.App.renderDealCard = (deal, isExpanded = false) => {
    // START_BLOCK_CALC_DEADLINE
    const deadline = new Date(deal.deadline);
    const now = new Date();
    const timeLeft = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
    const timerColor = timeLeft < 3 ? 'var(--accent-red)' : (timeLeft < 7 ? 'var(--accent-orange)' : 'var(--accent-green)');
    // END_BLOCK_CALC_DEADLINE
  
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
    return '';
};
// END_FUNCTION_App_renderDealCard

// START_FUNCTION_App_runAutoParsing
// START_CONTRACT:
// PURPOSE: Запускает процесс автоматического парсинга данных с текущей вкладки.
// INPUTS:
// - [force] => boolean: Принудительный перезапуск парсинга (игнорирование кэша).
// SIDE_EFFECTS: Инъектирует скрипт parser.js во вкладку, обновляет DOM.
// END_CONTRACT
window.App.runAutoParsing = async (force = false) => {
    // START_BLOCK_VALIDATE_TAB: [Проверка текущей вкладки на соответствие целевым доменам.]
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    const isTender = tab.url.match(/zakupki\.kontur\.ru\/\d+/) || tab.url.includes("bidzaar.com/tender/");
    if (!isTender) return;
    // END_BLOCK_VALIDATE_TAB

    // START_BLOCK_CHECK_CACHE: [Проверка наличия сохраненных данных для этого тендера.]
    const tid = window.App.getTenderId(tab.url);
    if (!force && tid) {
        const saved = await chrome.storage.local.get([`tenderCalc_${tid}`]);
        if (saved[`tenderCalc_${tid}`]?.resultText) {
            console.log("[App][runAutoParsing][CHECK_CACHE][Info] Data found in cache.");
            document.getElementById("resultArea").value = saved[`tenderCalc_${tid}`].resultText;
            // Restore other fields
            const data = saved[`tenderCalc_${tid}`];
            if (data.url) document.getElementById('tenderUrl').value = data.url;
            if (data.customerName) document.getElementById('customerName').value = data.customerName;
            if (data.customerInn) document.getElementById('customerInn').value = data.customerInn;
            if (data.customerKpp) document.getElementById('customerKpp').value = data.customerKpp;
            return;
        }
    }
    // END_BLOCK_CHECK_CACHE

    // START_BLOCK_EXECUTE_PARSER: [Инъекция скрипта и извлечение данных.]
    try {
        console.log("[App][runAutoParsing][EXECUTE_PARSER][Start] Injecting parser script...");
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/parser.js'] });
        const s = await chrome.storage.local.get(['parserminprice']);
        const min = s.parserminprice || 350;
        const res = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (t) => window.Parser.extractData(t, false),
            args: [min]
        });

        if (res?.[0]?.result) {
            const data = res[0].result;
            console.log("[App][runAutoParsing][EXECUTE_PARSER][Success] Data extracted:", data);
            // Auto-fill form
            const tenderData = data.dataArray[0];
            document.getElementById('tenderUrl').value = tenderData.url;
            document.getElementById('customerName').value = tenderData.organizer;
            document.getElementById('customerInn').value = tenderData.customerInn;
            document.getElementById('customerKpp').value = tenderData.customerKpp;
            document.getElementById('contactName').value = tenderData.contactName;
            document.getElementById('contactPhone').value = tenderData.contactPhone;
            document.getElementById('contactEmail').value = tenderData.contactEmail;
            document.getElementById('nmcValue').value = tenderData.priceValue;

            // Update formulas
            window.App.updateFormulas();

            // Check counterparty
            if (window.Parser && window.Parser.checkCounterparty) {
                await window.Parser.checkCounterparty(tenderData.customerInn, tenderData.customerKpp, tenderData.organizer);
            }
        }
    } catch (e) { console.error("[App] Parser error:", e); }
    // END_BLOCK_EXECUTE_PARSER
};
// END_FUNCTION_App_runAutoParsing

// START_FUNCTION_App_getTenderId
window.App.getTenderId = (url) => {
    if (url.includes("zakupki.kontur.ru/")) return (url.match(/zakupki\.kontur\.ru\/(\d+)/)||[])[1] ? `kontur_${url.match(/zakupki\.kontur\.ru\/(\d+)/)[1]}` : "";
    if (url.includes("bidzaar.com/tender/")) return (url.match(/bidzaar\.com\/tender\/([\w-]+)/)||[])[1] ? `bidzaar_${url.match(/bidzaar\.com\/tender\/([\w-]+)/)[1]}` : "";
    return "";
};
// END_FUNCTION_App_getTenderId

// START_FUNCTION_App_renderCRM
window.App.renderCRM = async () => {
    // START_BLOCK_LOAD_DEALS
    const container = document.getElementById('dealsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    const store = await chrome.storage.local.get(null);
    const tenderKeys = Object.keys(store).filter(k => k.startsWith('tenderCalc_'));
    
    if (tenderKeys.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет сохраненных тендеров</div>';
      return;
    }
    // END_BLOCK_LOAD_DEALS
    
    // START_BLOCK_RENDER_CARDS
    tenderKeys.forEach(k => {
      const data = store[k];
      const tid = k.replace('tenderCalc_', '');
      container.innerHTML += window.App.renderDealCard({...data, id: tid});
    });
    // END_BLOCK_RENDER_CARDS
};
// END_FUNCTION_App_renderCRM

window.App.openDeal = (tid) => { console.log('Opening:', tid); };
// START_FUNCTION_App_deleteTender
window.App.deleteTender = async (key) => {
    if (confirm('Удалить?')) {
      await chrome.storage.local.remove(key);
      window.App.renderCRM();
    }
};

window.App.updateFormulas = () => {
    const posts = 24; // Assume 24 posts
    const months = parseInt(document.getElementById('serviceMonths').value) || 8;
    const hoursPerDay = 12; // Assume 12 hours per day
    const rate = parseFloat(document.getElementById('avgRate').value) || 264.00;
    const securityTotal = posts * months * hoursPerDay * rate;

    const extraRate = 500.00; // Assume 500 per month
    const extraMonths = months;
    const extraPeriod = 12; // Assume annual
    const extraTotal = extraRate * extraMonths * extraPeriod;

    document.getElementById('securityFormula').textContent = `${posts} × ${months} × ${hoursPerDay} × ${rate.toFixed(2)} = ${window.Rules.fmtNum(securityTotal)}`;
    document.getElementById('extraFormula').textContent = `${extraRate.toFixed(2)} × ${extraMonths} × ${extraPeriod} = ${window.Rules.fmtNum(extraTotal)}`;

    const grandTotal = securityTotal + extraTotal;
    document.getElementById('grandTotalContract').textContent = window.Rules.fmtNum(grandTotal);

    // Update schemes if calculator is loaded
    if (window.Calculator && window.Calculator.calculateTotal) {
        window.Calculator.calculateTotal();
    }
};

// Add event listeners for formula updates
document.addEventListener('DOMContentLoaded', () => {
    const fields = ['serviceMonths', 'avgRate'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', window.App.updateFormulas);
    });
});
// END_FUNCTION_App_deleteTender

document.addEventListener('DOMContentLoaded', window.App.init);
