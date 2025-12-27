// FILE: calculator.js
// PURPOSE: Configuration-driven financial calculator with modern UI and CRM integration

window.Calculator = window.Calculator || {
    state: {
        rows: [], extraRows: [], schemes: {}, priceList: [], extraPriceList: [],
        isPriceDirty: false, isSchemesDirty: false, isExtraDirty: false, isCalcDirty: false,
        currentTenderId: null
    }
};

const parseNumRu = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const clean = String(str).replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
};

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

window.Calculator.CONFIG = {
    scenarios: {
        'BELUSN': {
            name: 'Бел УСН',
            steps: [
                { id: 13, label: "ИТОГО контракт", formula: (ctx) => round(ctx.totals.totalContractGross) },
                { id: 16, label: "Средняя ставка", formula: (ctx) => round(ctx.totals.avgRateHour) },
                { id: 12, label: "Рентабельность", format: "percent", formula: (ctx) => 0.15 } // Placeholder
            ]
        },
        'BELNDS': { name: 'Бел НДС', steps: [{ id: 13, label: "ИТОГО контракт", formula: (ctx) => round(ctx.totals.totalContractGross) }, { id: 12, label: "Рентабельность", format: "percent", formula: () => 0.18 }] },
        'SERNDS': { name: 'Сер НДС', steps: [{ id: 13, label: "ИТОГО контракт", formula: (ctx) => round(ctx.totals.totalContractGross) }, { id: 12, label: "Рентабельность", format: "percent", formula: () => 0.22 }] },
        'IPNDS': { name: 'ИП НДС', steps: [{ id: 13, label: "ИТОГО контракт", formula: (ctx) => round(ctx.totals.totalContractGross) }, { id: 12, label: "Рентабельность", format: "percent", formula: () => 0.25 }] },
        'SERUSN': { name: 'Сер УСН', steps: [{ id: 13, label: "ИТОГО контракт", formula: (ctx) => round(ctx.totals.totalContractGross) }, { id: 12, label: "Рентабельность", format: "percent", formula: () => 0.12 }] }
    }
};

window.Calculator.calculateScenario = (scenarioKey, inputs, totals) => {
    const scenario = window.Calculator.CONFIG.scenarios[scenarioKey];
    if (!scenario) return {};
    const context = { inputs, totals, results: {} };
    scenario.steps.forEach(step => {
        context.results[step.id] = step.formula(context, context.results);
    });
    return context.results;
};

window.Calculator.calcBGCost = (amount, type = 'bid') => {
    const rate = type === 'bid' ? 0.015 : 0.03;
    return Math.round(amount * rate);
};

window.Calculator.calcBaseForExcel = (s) => {
    const c = window.Rules.constants;
    const people = s.rows.reduce((sum, r) => sum + (parseNumRu(r.count) || 0), 0);
    const revVmesGuard = s.rows.reduce((sum, r) => sum + ((parseNumRu(r.rateHour) || 0) * (parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0)), 0);
    const revContractGuard = s.rows.reduce((sum, r) => sum + ((parseNumRu(r.rateHour) || 0) * (parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0) * (parseNumRu(r.months) || 1)), 0);
    const extraVmes = s.extraRows.reduce((sum, r) => sum + ((parseNumRu(r.price) || 0) * (parseNumRu(r.quantity) || 1)), 0);
    const totalMonthGross = revVmesGuard + extraVmes;
    const totalContractGross = revContractGuard + (extraVmes * 12);
    const totalHoursMonth = s.rows.reduce((sum, r) => sum + ((parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0)), 0);
    const avgRateHour = totalHoursMonth > 0 ? revVmesGuard / totalHoursMonth : 0;
    
    return { people, totalHoursMonth, avgRateHour, totalSalaryByAvgRateMonth: revVmesGuard, totalMonthGross, totalContractGross, extraVmes, adm: totalMonthGross * c.admRate };
};

window.Calculator.renderCalcTable = () => {
  const tbody = document.getElementById('securityRowsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.Calculator.state.rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const monthSum = (parseNumRu(row.rateHour) || 0) * (parseNumRu(row.hoursMonth) || 0) * (parseNumRu(row.count) || 0);
    const totalSum = monthSum * (parseNumRu(row.months) || 1);
    
    tr.innerHTML = `
      <td><select class="calc-type-select" data-idx="${idx}">
          ${window.Calculator.state.priceList.map(p => `<option value="${p.id}" ${p.id === row.priceId ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select></td>
      <td><input type="text" value="${row.description || ''}" data-idx="${idx}" class="calc-description-input" placeholder="Описание"></td>
      <td><input type="number" value="${row.hoursMonth || 0}" data-idx="${idx}" class="calc-hours-input" style="text-align: center;"></td>
      <td><input type="number" value="${row.months || 1}" data-idx="${idx}" class="calc-months-input" style="text-align: center;"></td>
      <td><input type="number" value="${row.rateHour || 0}" data-idx="${idx}" class="calc-rate-input" style="text-align: right;"></td>
      <td style="text-align: right;">${window.Rules.fmtNum(monthSum)}</td>
      <td style="text-align: right; font-weight: 700;">${window.Rules.fmtNum(totalSum)}</td>
      <td><button class="btn-icon danger calc-remove-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.calc-type-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const p = window.Calculator.state.priceList.find(item => item.id === parseInt(e.target.value));
      if (p) {
        window.Calculator.state.rows[idx] = { ...window.Calculator.state.rows[idx], priceId: p.id, rateHour: p.rateHour, hoursMonth: p.hoursMonth };
        window.Calculator.renderAll();
      }
    });
  });

  tbody.querySelectorAll('.calc-description-input, .calc-months-input, .calc-hours-input, .calc-rate-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.classList.contains('calc-description-input') ? 'description' : (e.target.classList.contains('calc-months-input') ? 'months' : (e.target.classList.contains('calc-hours-input') ? 'hoursMonth' : 'rateHour'));
      window.Calculator.state.rows[idx][field] = (field === 'description') ? e.target.value : parseFloat(e.target.value) || 0;
      window.Calculator.renderAll();
    });
  });

  tbody.querySelectorAll('.calc-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      window.Calculator.state.rows.splice(parseInt(e.currentTarget.dataset.idx), 1);
      window.Calculator.renderAll();
    });
  });
};

window.Calculator.renderExtraTable = () => {
  const tbody = document.getElementById('extraRowsBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  window.Calculator.state.extraRows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const total = (parseNumRu(row.quantity) || 0) * (parseNumRu(row.price) || 0);
    tr.innerHTML = `
      <td><input type="text" value="${row.name || ''}" data-idx="${idx}" class="extra-name-input"></td>
      <td><input type="number" value="${row.quantity || 1}" data-idx="${idx}" class="extra-qty-input" style="text-align: center;"></td>
      <td><input type="number" value="${row.price || 0}" data-idx="${idx}" class="extra-price-input" style="text-align: right;"></td>
      <td><select data-idx="${idx}" class="extra-type-select"><option value="monthly" ${row.type === 'monthly' ? 'selected' : ''}>В месяц</option><option value="once" ${row.type === 'once' ? 'selected' : ''}>Разово</option></select></td>
      <td style="text-align: right; font-weight: 700;">${window.Rules.fmtNum(total)}</td>
      <td><button class="btn-icon danger extra-remove-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.extra-remove-btn').forEach(btn => btn.onclick = (e) => { window.Calculator.state.extraRows.splice(parseInt(e.currentTarget.dataset.idx), 1); window.Calculator.renderAll(); });
};

window.Calculator.renderSchemesWithCollapse = () => {
  const container = document.getElementById('schemesDetailsContainer');
  if (!container) return;
  container.innerHTML = '';
  const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
  const schemes = ['BELUSN', 'SERUSN', 'BELNDS', 'SERNDS', 'IPNDS'];
  schemes.forEach(k => {
    const res = window.Calculator.calculateScenario(k, window.Rules.constants, base);
    const rent = (res[12] * 100).toFixed(1);
    const color = rent > 15 ? 'var(--accent-green)' : (rent > 10 ? 'var(--accent-orange)' : 'var(--accent-red)');
    const group = document.createElement('div');
    group.className = 'collapse-group';
    group.innerHTML = `<div class="collapse-header"><div class="collapse-title"><i class="fas fa-chevron-right collapse-icon"></i><span>${k}</span></div><div style="color:${color};font-weight:700;">${rent}%</div></div><div class="collapse-content">Детализация...</div>`;
    group.querySelector('.collapse-header').onclick = () => group.classList.toggle('expanded');
    container.appendChild(group);
    const rentEl = document.getElementById(`rent${k}`); if (rentEl) { rentEl.textContent = rent + '%'; rentEl.style.color = color; }
  });
};

window.Calculator.calculateTotal = () => {
    const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
    if (document.getElementById('totalHoursCalc')) document.getElementById('totalHoursCalc').textContent = window.Rules.fmtNum(base.totalHoursMonth);
    if (document.getElementById('totalPeopleCalc')) document.getElementById('totalPeopleCalc').textContent = base.people;
    if (document.getElementById('avgRateCalc')) document.getElementById('avgRateCalc').textContent = window.Rules.fmtNum(base.avgRateHour);
    if (document.getElementById('totalAmountCalc')) document.getElementById('totalAmountCalc').textContent = window.Rules.fmtNum(base.totalMonthGross);
    if (document.getElementById('extraTotalCalc')) document.getElementById('extraTotalCalc').textContent = window.Rules.fmtNum(base.extraVmes);
    if (document.getElementById('grandTotalContract')) document.getElementById('grandTotalContract').textContent = window.Rules.fmtNum(base.totalContractGross);
    window.Calculator.renderSchemesWithCollapse();
};

window.Calculator.renderPriceTable = () => {
    const tbody = document.getElementById('priceTableBody'); if (!tbody) return; tbody.innerHTML = '';
    window.Calculator.state.priceList.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input type="text" value="${p.name}" data-f="name"></td><td><input type="text" value="${p.region || 'Москва'}" data-f="region"></td><td style="text-align:center"><input type="checkbox" ${p.weapon?'checked':''} data-f="weapon" style="width:auto"></td><td><input type="text" value="${p.shift}" data-f="shift"></td><td><input type="number" value="${p.hoursMonth}" data-f="hoursMonth"></td><td><input type="number" value="${p.rateHour}" data-f="rateHour"></td><td style="text-align:right">${window.Rules.fmtNum(p.rateHour * p.hoursMonth)}</td><td><button class="btn-icon danger remove-price-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>`;
        tr.querySelector('.remove-price-btn').onclick = () => { window.Calculator.state.priceList.splice(idx, 1); window.Calculator.renderPriceTable(); };
        tbody.appendChild(tr);
    });
};

window.Calculator.renderExtraPriceTable = () => {
    const tbody = document.getElementById('extraPriceTableBody'); if (!tbody) return; tbody.innerHTML = '';
    window.Calculator.state.extraPriceList.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input type="text" value="${p.name}" data-f="name"></td><td><input type="number" value="${p.amount}" data-f="amount"></td><td><input type="text" value="${p.type}" data-f="type"></td><td><button class="btn-icon danger remove-extra-price-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>`;
        tr.querySelector('.remove-extra-price-btn').onclick = () => { window.Calculator.state.extraPriceList.splice(idx, 1); window.Calculator.renderExtraPriceTable(); };
        tbody.appendChild(tr);
    });
};

window.Calculator.renderAll = () => { window.Calculator.renderCalcTable(); window.Calculator.renderExtraTable(); window.Calculator.calculateTotal(); };
window.Calculator.addRow = () => {
    if (!window.Calculator.state.priceList.length) return alert('Создайте прайс!');
    const p = window.Calculator.state.priceList[0];
    window.Calculator.state.rows.push({ priceId: p.id, description: '', hoursMonth: p.hoursMonth, months: 12, rateHour: p.rateHour, count: 1 });
    window.Calculator.renderAll();
};
window.Calculator.addExtraRow = () => { window.Calculator.state.extraRows.push({ name: 'Новый расход', quantity: 1, price: 0, type: 'monthly' }); window.Calculator.renderAll(); };
window.Calculator.handleSaveMain = async () => { await chrome.storage.local.set({ [`tenderCalc_${window.Calculator.state.currentTenderId}`]: { rows: window.Calculator.state.rows, extraRows: window.Calculator.state.extraRows } }); };
window.Calculator.handleSavePrice = async () => { await chrome.storage.local.set({ customPriceList: window.Calculator.state.priceList, customExtraPriceList: window.Calculator.state.extraPriceList }); };
window.Calculator.init = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) window.Calculator.state.currentTenderId = window.App.getTenderId(tab.url);
    const s = await chrome.storage.local.get(['customPriceList', 'customExtraPriceList']);
    window.Calculator.state.priceList = s.customPriceList || [];
    window.Calculator.state.extraPriceList = s.customExtraPriceList || [];
    window.Calculator.renderAll(); window.Calculator.renderPriceTable(); window.Calculator.renderExtraPriceTable();
};
