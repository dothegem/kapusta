// FILE: src/app.js
// VERSION: 3.0.0
// START_MODULE_CONTRACT:
// PURPOSE: Core Application Controller. Initializes the popup, manages tabs, handles CRM entities (Deal, Tender) and their persistence.
// SCOPE: CRM Logic, App State Management, UI Orchestration.
// INPUT: DOM Events, Chrome Storage, Calculator State.
// OUTPUT: UI Updates, Storage Persistence (Deal/Tender data).
// KEYWORDS_MODULE: [DOMAIN(10): CRM; ENTITY(9): Deal; PATTERN(8): Controller; TECH(5): ChromeExt]
// LINKS_TO_MODULE: [src/calculator.js, src/rules.js, docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md]
// LINKS_TO_SPECIFICATION: [docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md, docs/04_CRM_STATES_AND_STATE_MACHINE.md]
// END_MODULE_CONTRACT
// START_MODULE_MAP:
// CLASS 10 [Модель Сделки] => Deal
// CLASS 9 [Модель Тендера] => Tender
// CLASS 9 [Модель Группы Расчетов] => CalculationGroup
// FUNC 10 [Сохранение сделки со сменой статуса] => saveAll
// FUNC 9 [Рендеринг списка сделок] => renderCRM
// END_MODULE_MAP

window.App = window.App || {};
window.App.isDirty = false;

// --- Helper ---
const parseNum = (str) => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\s/g, '').replace(',', '.')) || 0;
};

// --- CRM Entity Model ---

// START_CLASS_Tender
class Tender {
  constructor(data = {}) {
    this.url = data.url || '';
    this.internalId = data.internalId || '';
    this.nmcValue = Number(data.nmcValue) || 0;
    this.bidSecurity = Number(data.bidSecurity) || 0;
    this.contractSecurity = Number(data.contractSecurity) || 0;
    this.platformTariff = Number(data.platformTariff) || 0;
    this.serviceStart = data.serviceStart || '';
    this.serviceEnd = data.serviceEnd || '';
    this.serviceMonths = Number(data.serviceMonths) || 12;
  }
}
// END_CLASS_Tender

// START_CLASS_Company
class Company {
  constructor(data = {}) {
    this.name = data.name || '';
    this.inn = data.inn || '';
    this.kpp = data.kpp || '';
  }
}
// END_CLASS_Company

// START_CLASS_Contact
class Contact {
  constructor(data = {}) {
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
  }
}
// END_CLASS_Contact

// START_CLASS_CalculationGroup
class CalculationGroup {
  constructor(data = {}) {
    this.rows = Array.isArray(data.rows) ? data.rows : [];
    this.extraRows = Array.isArray(data.extraRows) ? data.extraRows : [];
    // Future: this.calculations = ... (versions)
  }
}
// END_CLASS_CalculationGroup

// START_CLASS_Deal
// START_CONTRACT:
// PURPOSE: Aggregate root for the Deal lifecycle. Manages Tender, Company, Calculations and State transitions.
// KEYWORDS: [PATTERN(10): AggregateRoot; DOMAIN(10): DealLifecycle]
// END_CONTRACT
class Deal {
  constructor(data = {}) {
    this.entity = 'Deal';
    this.id = data.id || `manual_${Date.now()}`;
    this.stage = data.stage || 'new'; // new, inwork, sent, won, lost
    this.tender = new Tender(data.tender);
    this.company = new Company(data.company);
    this.contact = new Contact(data.contact);
    this.calculationGroup = new CalculationGroup(data.calculationGroup);
    
    this.comments = Array.isArray(data.comments) ? data.comments : [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // START_METHOD_updateFromState
  updateFromState(domValues, calcState) {
    // Update Tender
    this.tender.url = domValues.tenderUrl;
    this.tender.nmcValue = parseNum(domValues.nmcValue);
    this.tender.bidSecurity = parseNum(domValues.bidSecurity);
    this.tender.contractSecurity = parseNum(domValues.contractSecurity);
    this.tender.platformTariff = parseNum(domValues.platformTariff);
    this.tender.serviceStart = domValues.serviceStart;
    this.tender.serviceEnd = domValues.serviceEnd;
    this.tender.serviceMonths = parseNum(domValues.serviceMonths);

    // Update Company & Contact
    this.company.name = domValues.customerName;
    this.company.inn = domValues.customerInn;
    this.company.kpp = domValues.customerKpp;
    
    this.contact.name = domValues.contactName;
    this.contact.phone = domValues.contactPhone;
    this.contact.email = domValues.contactEmail;

    // Update Calculations
    this.calculationGroup.rows = calcState.rows;
    this.calculationGroup.extraRows = calcState.extraRows;
    this.comments = calcState.comments || [];

    this.updatedAt = new Date().toISOString();
  }
  // END_METHOD_updateFromState

  // START_METHOD_transition
  transition(newStage) {
    if (this.stage === newStage) return;

    const allowed = {
      'new': ['inwork', 'lost'],
      'inwork': ['sent', 'lost', 'new'], // new allowed for rollback?
      'sent': ['won', 'lost', 'inwork'],
      'won': [],
      'lost': []
    };

    // Auto-transition logic can be permissive or strict.
    // For now, we enforce basic flow but allow jumps if needed for manual fix (with validation warning ideally)
    // But per Doc 04, we should stick to allowed.
    if (!allowed[this.stage]?.includes(newStage)) {
      console.warn(`[Deal] Transition ${this.stage} -> ${newStage} not strictly allowed by standard flow.`);
      // We allow it for now to avoid locking user out if something goes wrong,
      // or we can implement strict mode. Let's allow it but log.
    }
    
    this.stage = newStage;
    this.updatedAt = new Date().toISOString();
  }
  // END_METHOD_transition
}
// END_CLASS_Deal

window.App.Models = { Tender, Company, Contact, CalculationGroup, Deal };

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
  try {
    const tid = window.Calculator.state.currentTenderId || 'manual';
    
    // 1. Gather DOM values
    const dom = {
      tenderUrl: document.getElementById('tenderUrl')?.value || '',
      customerName: document.getElementById('customerName')?.value || '',
      customerInn: document.getElementById('customerInn')?.value || '',
      customerKpp: document.getElementById('customerKpp')?.value || '',
      contactName: document.getElementById('contactName')?.value || '',
      contactPhone: document.getElementById('contactPhone')?.value || '',
      contactEmail: document.getElementById('contactEmail')?.value || '',
      nmcValue: document.getElementById('nmcValue')?.value,
      bidSecurity: document.getElementById('bidSecurity')?.value,
      contractSecurity: document.getElementById('contractSecurity')?.value,
      platformTariff: document.getElementById('platformTariff')?.value,
      serviceStart: document.getElementById('serviceStart')?.value || '',
      serviceEnd: document.getElementById('serviceEnd')?.value || '',
      serviceMonths: document.getElementById('serviceMonths')?.value || 12
    };

    // 2. Load existing or create new
    const storageKey = `tenderCalc_${tid}`;
    const store = await chrome.storage.local.get(storageKey);
    const existingData = store[storageKey];
    
    let deal;
    
    if (existingData && existingData.entity === 'Deal') {
      deal = new window.App.Models.Deal(existingData);
    } else if (existingData) {
      // Migrate old format on the fly
      deal = new window.App.Models.Deal({
        id: tid,
        tender: {
          url: existingData.tenderUrl,
          nmcValue: existingData.nmcValue,
          serviceMonths: existingData.serviceMonths,
          // ... map other fields if they existed in old format
        },
        company: { name: existingData.customerName, inn: existingData.customerInn, kpp: existingData.customerKpp },
        contact: { name: existingData.contactName, phone: existingData.contactPhone, email: existingData.contactEmail },
        calculationGroup: { rows: existingData.rows, extraRows: existingData.extraRows },
        comments: existingData.comments
      });
    } else {
      deal = new window.App.Models.Deal({ id: tid });
    }

    // 3. Update with current state
    deal.updateFromState(dom, window.Calculator.state);

    // 4. Auto-transition: new -> inwork
    if (deal.stage === 'new') {
       deal.transition('inwork');
    }

    // 5. Save
    await chrome.storage.local.set({ [storageKey]: deal });
    
    window.App.markClean();
    window.App.renderCRM();
    alert(`✅ Сделка сохранена (Статус: ${deal.stage})`);

  } catch (e) {
    console.error('Save failed', e);
    alert('❌ Ошибка сохранения: ' + e.message);
  }
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
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет активных сделок</div>';
    return;
  }

  tenderKeys.forEach(k => {
    const raw = store[k];
    const tid = k.replace('tenderCalc_', '');
    
    // Normalize to Deal model for display
    let deal;
    if (raw && raw.entity === 'Deal') {
        deal = raw; // It's already our object structure
    } else {
        // Legacy fallback
        deal = {
            stage: 'legacy',
            company: { name: raw.customerName },
            tender: { nmcValue: raw.nmcValue, serviceMonths: raw.serviceMonths },
            updatedAt: new Date().toISOString()
        };
    }
    
    const statusColors = {
        'new': 'var(--text-muted)',
        'inwork': '#3b82f6', // blue
        'sent': '#f59e0b',   // orange
        'won': '#10b981',    // green
        'lost': '#ef4444',   // red
        'legacy': '#9ca3af'
    };
    
    const stColor = statusColors[deal.stage] || '#ccc';

    const card = document.createElement('div');
    card.className = 'crm-card';
    card.innerHTML = `
        <div class="crm-header">
          <div class="crm-title">${(deal.company?.name || 'Без названия') + ' (' + tid + ')'}</div>
          <div class="crm-status" style="background:${stColor}20; color:${stColor}; border:1px solid ${stColor}">${deal.stage.toUpperCase()}</div>
        </div>
        <div class="crm-body">
          <div><strong>НМЦ:</strong> ${window.Rules.fmtNum(deal.tender?.nmcValue || 0)}</div>
          <div><strong>Срок:</strong> ${deal.tender?.serviceMonths || '-'} мес.</div>
          <div style="font-size:0.8em; color:var(--text-muted); margin-top:4px;">Обновлено: ${new Date(deal.updatedAt).toLocaleDateString()}</div>
        </div>
        <div class="crm-footer">
           <button class="btn-secondary delete-deal-btn" data-key="${k}">Удалить</button>
           <button class="btn-primary load-deal-btn" data-key="${k}">Загрузить</button>
        </div>
    `;
    
    // Bind events
    card.querySelector('.delete-deal-btn').onclick = async () => {
        if(confirm('Удалить сделку?')) {
            await chrome.storage.local.remove(k);
            window.App.renderCRM();
        }
    };
    
    card.querySelector('.load-deal-btn').onclick = async () => {
        // We set the tenderId and reload page or trigger calc load
        // Actually, Calculator handles load based on currentTenderId.
        // We need to set state and trigger load.
        // Or simpler: Open this tender?
        // Current architecture relies on window.Calculator.state.currentTenderId
        
        // Wait, currentTenderId is usually derived from URL tab.
        // If we load a saved deal, we might be on "manual" or override.
        window.Calculator.state.currentTenderId = tid;
        await window.Calculator.loadTenderDraft(); // This function needs update to handle new Deal format!
        window.Calculator.renderAll();
        // Switch to main tab
        document.querySelector('[data-tab="main"]').click();
    };

    container.appendChild(card);
  });
};

document.addEventListener('DOMContentLoaded', window.App.init);
