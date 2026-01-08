// FILE: app.js
// VERSION: 2.2.1
// PURPOSE: Popup initialization, settings, export, and parsing.

window.App = window.App || {};
window.App.isDirty = false;

const STORAGE_SCHEMA_VERSION = '2026-01-08';

window.App.hardResetIfNeeded = async () => {
  const all = await chrome.storage.local.get(null);
  if (all.storageSchemaVersion === STORAGE_SCHEMA_VERSION) return;

  // Safe migration: do NOT wipe CRM drafts (tenderCalc_*) or price lists.
  // Only remove legacy keys from old versions.
  const legacyKeys = [
    // old telegram settings
    'tguser',
    'tgtoken',

    // old tax variables block
    'var_mrot',
    'var_ndfl',
    'var_usn',
    'var_osn',
    'var_profit_tax',
    'var_dividend',

    // old spec storage keys
    'calcSpecArea',
    'calc_spec_yaml',
    'calcSpecYaml',
    'calcSpec'
  ];

  const existingLegacy = legacyKeys.filter(k => Object.prototype.hasOwnProperty.call(all, k));
  if (existingLegacy.length) {
    await chrome.storage.local.remove(existingLegacy);
  }

  // Ensure defaults exist
  const toSet = { storageSchemaVersion: STORAGE_SCHEMA_VERSION };
  if (all.parserminprice === undefined) toSet.parserminprice = 350;
  if (all.tgChatId === undefined) toSet.tgChatId = '';
  if (all.theme === undefined) toSet.theme = 'light';
  if (all.vatModeDefault === undefined) toSet.vatModeDefault = 'outside';

  await chrome.storage.local.set(toSet);
};

window.App.applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme || 'light');
};

window.App.init = async () => {
  await window.App.hardResetIfNeeded();

  // 1) Load constants
  if (window.Rules?.loadConstants) await window.Rules.loadConstants();

  // 2) Tabs
  const tabs = document.querySelectorAll('.tab-btn[data-tab]');
  const contents = document.querySelectorAll('.tab-content');
  const switchTab = (target) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    contents.forEach(c => c.style.display = (c.id === `tab-${target}`) ? 'block' : 'none');
    if (target === 'crm') window.App.renderCRM();
  };
  tabs.forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));

  // 2.1 CRM subtabs
  const subtabs = document.querySelectorAll('[data-subtab]');
  const subtabContents = document.querySelectorAll('.crm-subtab');
  subtabs.forEach(btn => btn.onclick = () => {
    subtabs.forEach(t => t.classList.toggle('active', t.dataset.subtab === btn.dataset.subtab));
    subtabContents.forEach(c => c.style.display = (c.id === `crm-${btn.dataset.subtab}`) ? 'block' : 'none');
  });

  // 3) Calculator init
  if (window.Calculator) await window.Calculator.init();

  // 4) Restore settings
  const s = await chrome.storage.local.get(['parserminprice', 'tgChatId', 'calcspecText', 'theme', 'vatModeDefault']);

  if (document.getElementById('minPriceVal')) document.getElementById('minPriceVal').value = s.parserminprice ?? 350;
  if (document.getElementById('tgChatId')) document.getElementById('tgChatId').value = s.tgChatId ?? '';

  const theme = s.theme || window.Rules.constants.themeDefault || 'light';
  window.App.applyTheme(theme);
  if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = theme;

  const vatMode = s.vatModeDefault || window.Rules.constants.vatModeDefault || 'outside';
  if (document.getElementById('vatModeDefault')) document.getElementById('vatModeDefault').value = vatMode;

  // Calcspec editor
  const specTextArea = document.getElementById('calcspecTextArea');
  if (specTextArea) {
    if (s.calcspecText) specTextArea.value = s.calcspecText;
    else specTextArea.value = JSON.stringify(window.Rules.calcspec || {}, null, 2);
  }

  // 5) Wire calculator buttons
  document.getElementById('addCalcRowBtn')?.addEventListener('click', () => window.Calculator.addRow());
  document.getElementById('addExtraRowBtn')?.addEventListener('click', () => window.Calculator.addExtraRow());
  document.getElementById('toggleSchemesBtn')?.addEventListener('click', () => window.Calculator.toggleSchemesExpanded());

  // Comments
  document.getElementById('addCommentBtn')?.addEventListener('click', () => window.Calculator.addComment());

  // Price
  document.getElementById('addPriceRowBtn')?.addEventListener('click', () => {
    const newId = Date.now();
    window.Calculator.state.priceList.push({ id: newId, name: 'Новый тип', region: 'Москва', weapon: false, shiftHours: 12, hoursMonth: 365, rateHour: 500, shiftRate: 4000 });
    window.Calculator.renderPriceTable();
    window.App.markDirty();
  });

  document.getElementById('addExtraPriceRowBtn')?.addEventListener('click', () => {
    const newId = Date.now();
    window.Calculator.state.extraPriceList.push({ id: newId, name: 'Новый расход', price: 0, unit: 'шт', vatType: 'без ндс', periodicity: 'once' });
    window.Calculator.renderExtraPriceTable();
    window.App.markDirty();
  });

  document.getElementById('saveAllBtn')?.addEventListener('click', () => window.App.saveAll());
  document.getElementById('savePriceBtn')?.addEventListener('click', async () => {
    await window.Calculator.handleSavePrice();
    alert('✅ Прайс сохранён');
  });

  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const themeVal = document.getElementById('themeSelect')?.value || 'light';
    const vatModeVal = document.getElementById('vatModeDefault')?.value || 'outside';
    const calcspecText = document.getElementById('calcspecTextArea')?.value || '';

    // Validate JSON before saving
    if (String(calcspecText).trim()) {
      try {
        JSON.parse(calcspecText);
      } catch (e) {
        alert('❌ calcspec.json: неверный JSON. Исправьте и попробуйте снова.');
        return;
      }
    }

    await chrome.storage.local.set({
      parserminprice: parseFloat(document.getElementById('minPriceVal')?.value) || 350,
      tgChatId: document.getElementById('tgChatId')?.value || '',
      theme: themeVal,
      vatModeDefault: vatModeVal,
      calcspecText
    });

    window.App.applyTheme(themeVal);

    await window.Rules.loadConstants();
    window.Calculator.renderAll();

    alert('✅ Настройки сохранены');
  });

  document.getElementById('reParseBtn')?.addEventListener('click', () => window.App.runAutoParsing(true));

  document.getElementById('exportBtn')?.addEventListener('click', async () => {
    try {
      const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
      const schemeKeys = ['BELUSN', 'SERUSN', 'BELNDS', 'SERNDS', 'IPNDS'];
      const schemes = {};
      schemeKeys.forEach(k => { schemes[k] = window.Calculator.calculateScenario(k, base); });

      const dump = {
        timestamp: new Date().toISOString(),
        tenderId: window.Calculator.state.currentTenderId || 'manual',
        header: {
          tenderUrl: document.getElementById('tenderUrl')?.value || '',
          customerName: document.getElementById('customerName')?.value || '',
          customerInn: document.getElementById('customerInn')?.value || '',
          customerKpp: document.getElementById('customerKpp')?.value || '',
          nmcValue: parseFloat(document.getElementById('nmcValue')?.value) || 0,
          serviceMonths: window.Calculator.getServiceMonths()
        },
        rows: window.Calculator.state.rows,
        extraRows: window.Calculator.state.extraRows,
        totals: base,
        schemes
      };

      const text = JSON.stringify(dump, null, 2);
      await navigator.clipboard.writeText(text);
      alert('✅ Экспорт скопирован в буфер (JSON)');
    } catch (e) {
      console.error(e);
      alert('❌ Экспорт не удался (проверь доступ к буферу)');
    }
  });

  // Header fields that affect calc
  ['bidSecurity', 'contractSecurity', 'serviceMonths'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => window.Calculator.renderAll());
  });

  // Dates → months
  const recomputeMonths = () => {
    const sEl = document.getElementById('serviceStart');
    const eEl = document.getElementById('serviceEnd');
    const mEl = document.getElementById('serviceMonths');
    if (!sEl || !eEl || !mEl) return;
    if (!sEl.value || !eEl.value) return;

    const sDate = new Date(sEl.value);
    const eDate = new Date(eEl.value);
    if (isNaN(sDate) || isNaN(eDate) || eDate < sDate) return;

    const months = Math.max(1, (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth()) + 1);
    mEl.value = String(months);
    window.Calculator.renderAll();
  };

  document.getElementById('serviceStart')?.addEventListener('change', recomputeMonths);
  document.getElementById('serviceEnd')?.addEventListener('change', recomputeMonths);

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
  alert('✅ Сохранено');
};

window.App.getTenderId = (url) => {
  if (!url) return '';
  if (url.includes('zakupki.kontur.ru/')) {
    const m = url.match(/zakupki\.kontur\.ru\/(\d+)/);
    return m?.[1] ? `kontur_${m[1]}` : '';
  }
  if (url.includes('bidzaar.com/tender/')) {
    const m = url.match(/bidzaar\.com\/tender\/([\w-]+)/);
    return m?.[1] ? `bidzaar_${m[1]}` : '';
  }
  return '';
};

window.App.runAutoParsing = async (force = false) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const isTender = tab.url.match(/zakupki\.kontur\.ru\/\d+/) || tab.url.includes('bidzaar.com/tender/');
  if (!isTender) return;

  const tid = window.App.getTenderId(tab.url);

  if (!force && tid) {
    const saved = await chrome.storage.local.get([`tenderCalc_${tid}`]);
    if (saved[`tenderCalc_${tid}`]) return;
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/parser.js'] });
    const s = await chrome.storage.local.get(['parserminprice']);
    const min = s.parserminprice || 350;

    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t) => window.Parser.extractData(t, false),
      args: [min]
    });

    const tenderData = res?.[0]?.result?.dataArray?.[0];
    if (!tenderData) return;

    document.getElementById('tenderUrl').value = tenderData.url || '';
    document.getElementById('customerName').value = tenderData.organizer || '';
    document.getElementById('customerInn').value = tenderData.customerInn || '';
    document.getElementById('customerKpp').value = tenderData.customerKpp || '';
    document.getElementById('contactName').value = tenderData.contactName || '';
    document.getElementById('contactPhone').value = tenderData.contactPhone || '';
    document.getElementById('contactEmail').value = tenderData.contactEmail || '';
    document.getElementById('nmcValue').value = tenderData.priceValue || 0;

    if (window.Parser?.checkCounterparty) {
      await window.Parser.checkCounterparty(tenderData.customerInn, tenderData.customerKpp, tenderData.organizer);
    }

    window.Calculator.renderAll();
  } catch (e) {
    console.error('[App] Parser error:', e);
  }
};

window.App.renderCRM = async () => {
  const container = document.getElementById('dealsContainer');
  if (!container) return;
  container.innerHTML = '';

  const store = await chrome.storage.local.get(null);
  const tenderKeys = Object.keys(store).filter(k => k.startsWith('tenderCalc_'));

  if (!tenderKeys.length) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет сохраненных тендеров</div>';
    return;
  }

  tenderKeys.forEach(k => {
    const d = store[k];
    const tid = k.replace('tenderCalc_', '');
    container.innerHTML += `
      <div class="crm-card">
        <div class="crm-header">
          <div class="crm-title">${(d.customerName || 'Сделка') + ' (' + tid + ')'}</div>
          <div class="crm-status">saved</div>
        </div>
        <div class="crm-body">
          <div><strong>НМЦ:</strong> ${window.Rules.fmtNum(d.nmcValue || 0)}</div>
          <div><strong>Мес.:</strong> ${d.serviceMonths || '-'}</div>
        </div>
        <div class="crm-footer">
          <button class="btn-secondary" onclick="chrome.storage.local.remove('${k}').then(()=>window.App.renderCRM())">Удалить</button>
        </div>
      </div>
    `;
  });
};

document.addEventListener('DOMContentLoaded', window.App.init);
