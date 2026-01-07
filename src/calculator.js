// FILE: calculator.js
// VERSION: 2.2.0
// PURPOSE: Calculator UI + 5-scheme computations.

window.Calculator = window.Calculator || {
  state: {
    rows: [],
    extraRows: [],
    schemes: {},
    priceList: [],
    extraPriceList: [],
    currentTenderId: null,
    schemesExpanded: false,
    comments: []
  }
};

const parseNumRu = (str) => {
  if (str === undefined || str === null) return 0;
  if (typeof str === 'number') return str;
  const clean = String(str).replace(/\s/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

// =====================
// 5 scenarios
// =====================
window.Calculator.CONFIG = {
  scenarios: {
    BELUSN: {
      name: 'БЕЛ УСН',
      calculate: (base, c) => {
        const revenue = base.totalContractGross;
        const fotReal = base.totalSalaryByAvgRateMonth * 12;

        const fotOfficial = fotReal / c.payrollNetFactor;
        const ndfl = fotOfficial * c.ndflRatePercent / 100;
        const pfr = fotOfficial * c.pfrRatePercent / 100;
        const fss = fotOfficial * c.fssRatePercent / 100;
        const payrollTaxes = ndfl + pfr + fss;

        const vatDeduction = revenue / (100 + c.osnLowRatePercent) * c.osnLowRatePercent;
        const usnTax = (revenue - vatDeduction) * c.usnRatePercent / 100;

        const netSalary = fotOfficial - ndfl;
        const totalExpenses = vatDeduction + usnTax + payrollTaxes + netSalary;
        const profitBeforeDividends = revenue - totalExpenses;
        const profitNet = profitBeforeDividends * c.dividendFactor;
        const rentability = revenue > 0 ? (profitNet / revenue) : 0;

        return { revenue, fotReal, fotOfficial, payrollTaxes, vatDeduction, usnTax, netSalary, totalExpenses, profitBeforeDividends, profitNet, rentability };
      }
    },
    SERUSN: {
      name: 'СЕР УСН',
      calculate: (base, c) => {
        const revenue = base.totalContractGross;
        const fotReal = base.totalSalaryByAvgRateMonth * 12;

        const fotOfficial = c.officialSalaryDefault * 12;
        const ndfl = fotOfficial * c.ndflRatePercent / 100;
        const pfr = fotOfficial * c.pfrRatePercent / 100;
        const fss = fotOfficial * c.fssRatePercent / 100;
        const payrollTaxes = ndfl + pfr + fss;

        const vatDeduction = revenue / (100 + c.osnLowRatePercent) * c.osnLowRatePercent;
        const usnTax = (revenue - vatDeduction) * c.usnRatePercent / 100;

        const netSalary = fotOfficial - ndfl;
        const greyAmount = fotReal - netSalary;
        const dividendTax = greyAmount / c.dividendFactor * (c.dividendTaxRatePercent / 100);

        const totalExpenses = vatDeduction + usnTax + payrollTaxes + netSalary + dividendTax;
        const profitBeforeDividends = revenue - totalExpenses;
        const profitNet = profitBeforeDividends * c.dividendFactor;
        const rentability = revenue > 0 ? (profitNet / revenue) : 0;

        return { revenue, fotReal, fotOfficial, payrollTaxes, greyAmount, dividendTax, vatDeduction, usnTax, netSalary, totalExpenses, profitBeforeDividends, profitNet, rentability };
      }
    },
    BELNDS: {
      name: 'БЕЛ НДС',
      calculate: (base, c) => {
        const revenueWithVAT = base.totalContractGross;
        const revenueBase = revenueWithVAT / (100 + c.osnRatePercent) * 100;
        const fotReal = base.totalSalaryByAvgRateMonth * 12;

        const fotOfficial = fotReal / c.payrollNetFactor;
        const ndfl = fotOfficial * c.ndflRatePercent / 100;
        const pfr = fotOfficial * c.pfrRatePercent / 100;
        const fss = fotOfficial * c.fssRatePercent / 100;
        const payrollTaxes = ndfl + pfr + fss;

        const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent;
        const vatIn = 0;

        const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl;
        const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

        const netSalary = fotOfficial - ndfl;
        const totalExpenses = vatOut + payrollTaxes + netSalary + profitTax;
        const profitBeforeDividends = revenueWithVAT - totalExpenses;
        const profitNet = profitBeforeDividends * c.dividendFactor;
        const rentability = revenueWithVAT > 0 ? (profitNet / revenueWithVAT) : 0;

        return { revenue: revenueWithVAT, revenueBase, fotReal, fotOfficial, payrollTaxes, vatOut, vatIn, profitTax, netSalary, totalExpenses, profitBeforeDividends, profitNet, rentability };
      }
    },
    SERNDS: {
      name: 'СЕР НДС',
      calculate: (base, c) => {
        const revenueWithVAT = base.totalContractGross;
        const revenueBase = revenueWithVAT / (100 + c.osnRatePercent) * 100;
        const fotReal = base.totalSalaryByAvgRateMonth * 12;

        const fotOfficial = c.officialSalaryDefault * 12;
        const ndfl = fotOfficial * c.ndflRatePercent / 100;
        const pfr = fotOfficial * c.pfrRatePercent / 100;
        const fss = fotOfficial * c.fssRatePercent / 100;
        const payrollTaxes = ndfl + pfr + fss;

        const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent;
        const vatIn = vatOut * c.cashOutRiskCommissionRate;

        const netSalary = fotOfficial - ndfl;
        const greyAmount = fotReal - netSalary;
        const dividendTax = greyAmount / c.dividendFactor * (c.dividendTaxRatePercent / 100);

        const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl;
        const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

        const totalExpenses = vatOut - vatIn + payrollTaxes + netSalary + dividendTax + profitTax;
        const profitBeforeDividends = revenueWithVAT - totalExpenses;
        const profitNet = profitBeforeDividends * c.dividendFactor;
        const rentability = revenueWithVAT > 0 ? (profitNet / revenueWithVAT) : 0;

        return { revenue: revenueWithVAT, revenueBase, fotReal, fotOfficial, payrollTaxes, greyAmount, dividendTax, vatOut, vatIn, profitTax, netSalary, totalExpenses, profitBeforeDividends, profitNet, rentability };
      }
    },
    IPNDS: {
      name: 'ИП НДС',
      calculate: (base, c) => {
        const revenueWithVAT = base.totalContractGross;
        const revenueBase = revenueWithVAT / (100 + c.osnRatePercent) * 100;
        const fotReal = base.totalSalaryByAvgRateMonth * 12;

        const fotOfficial = c.officialSalaryDefault * 12;
        const ndfl = fotOfficial * c.ndflRatePercent / 100;
        const pfr = fotOfficial * c.pfrRatePercent / 100;
        const fss = fotOfficial * c.fssRatePercent / 100;
        const payrollTaxes = ndfl + pfr + fss;

        const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent;

        const netSalary = fotOfficial - ndfl;
        const greyAmount = fotReal - netSalary;
        const cashOutCommission = greyAmount * c.cashOutCommissionRate;
        const dividendTax = (greyAmount + cashOutCommission) / c.dividendFactor * (c.dividendTaxRatePercent / 100);

        const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl;
        const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

        const totalExpenses = vatOut + payrollTaxes + netSalary + cashOutCommission + dividendTax + profitTax;
        const profitBeforeDividends = revenueWithVAT - totalExpenses;
        const profitNet = profitBeforeDividends * c.dividendFactor;
        const rentability = revenueWithVAT > 0 ? (profitNet / revenueWithVAT) : 0;

        return { revenue: revenueWithVAT, revenueBase, fotReal, fotOfficial, payrollTaxes, greyAmount, cashOutCommission, dividendTax, vatOut, profitTax, netSalary, totalExpenses, profitBeforeDividends, profitNet, rentability };
      }
    }
  }
};

window.Calculator.calculateScenario = (scenarioKey, base) => {
  const scenario = window.Calculator.CONFIG.scenarios[scenarioKey];
  if (!scenario) return {};
  return scenario.calculate(base, window.Rules.constants);
};

// =====================
// BG formulas (Excel → code)
// =====================
window.Calculator.calcBGCost = (amount, type = 'bid') => {
  const a = parseNumRu(amount);
  if (!a) return 0;
  if (type === 'bid') return Math.max(1000, Math.round(a * 0.0055));
  return Math.round(a * 0.0003);
};

window.Calculator.getServiceMonths = () => {
  const el = document.getElementById('serviceMonths');
  return parseInt(el?.value) || 12;
};

window.Calculator.ensureBGExtraRows = () => {
  const bid = parseNumRu(document.getElementById('bidSecurity')?.value);
  const contract = parseNumRu(document.getElementById('contractSecurity')?.value);

  const bidCost = bid ? window.Calculator.calcBGCost(bid, 'bid') : 0;
  const contractCost = contract ? window.Calculator.calcBGCost(contract, 'contract') : 0;

  const upsert = (bgType, title, cost) => {
    const idx = window.Calculator.state.extraRows.findIndex(r => r.__bg === bgType);
    if (!cost) {
      if (idx >= 0) window.Calculator.state.extraRows.splice(idx, 1);
      return;
    }
    const row = {
      name: title,
      quantity: 1,
      price: cost,
      unit: 'шт',
      vatType: 'без ндс',
      type: 'once',
      __bg: bgType
    };
    if (idx >= 0) window.Calculator.state.extraRows[idx] = { ...window.Calculator.state.extraRows[idx], ...row };
    else window.Calculator.state.extraRows.push(row);
  };

  upsert('bid', 'БГ обеспечение заявки', bidCost);
  upsert('contract', 'БГ обеспечение контракта', contractCost);

  const bidEl = document.getElementById('bidSecurityCalc');
  if (bidEl) bidEl.textContent = bidCost ? ('БГ: ' + window.Rules.fmtNum(bidCost)) : '';
  const cEl = document.getElementById('contractSecurityCalc');
  if (cEl) cEl.textContent = contractCost ? ('БГ: ' + window.Rules.fmtNum(contractCost)) : '';
};

// =====================
// Base aggregation
// =====================
window.Calculator.calcBaseForExcel = (s) => {
  const c = window.Rules.constants;
  const serviceMonths = window.Calculator.getServiceMonths();

  const people = s.rows.reduce((sum, r) => sum + (parseNumRu(r.count) || 0), 0);

  const revMonthGuard = s.rows.reduce((sum, r) => {
    return sum + ((parseNumRu(r.rateHour) || 0) * (parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0));
  }, 0);

  const revContractGuard = s.rows.reduce((sum, r) => {
    const months = parseNumRu(r.months) || serviceMonths;
    return sum + ((parseNumRu(r.rateHour) || 0) * (parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0) * months);
  }, 0);

  const salaryMonth = s.rows.reduce((sum, r) => {
    const shiftHours = parseNumRu(r.shiftHours) || 12;
    const hoursMonth = parseNumRu(r.hoursMonth) || 0;
    const shifts = shiftHours > 0 ? (hoursMonth / shiftHours) : 0;
    return sum + ((parseNumRu(r.shiftRate) || 0) * shifts * (parseNumRu(r.count) || 0));
  }, 0);

  const extraOnce = s.extraRows.reduce((sum, r) => {
    if ((r.type || '').toLowerCase() === 'once') return sum + ((parseNumRu(r.price) || 0) * (parseNumRu(r.quantity) || 1));
    return sum;
  }, 0);

  const extraMonthly = s.extraRows.reduce((sum, r) => {
    if ((r.type || '').toLowerCase() === 'monthly') return sum + ((parseNumRu(r.price) || 0) * (parseNumRu(r.quantity) || 1));
    return sum;
  }, 0);

  const totalMonthGross = revMonthGuard + extraMonthly;
  const totalContractGross = revContractGuard + (extraMonthly * serviceMonths) + extraOnce;

  const totalHoursMonth = s.rows.reduce((sum, r) => sum + ((parseNumRu(r.hoursMonth) || 0) * (parseNumRu(r.count) || 0)), 0);
  const avgRateHour = totalHoursMonth > 0 ? (revMonthGuard / totalHoursMonth) : 0;

  return {
    people,
    totalHoursMonth,
    avgRateHour,
    totalRevenueByAvgRateMonth: revMonthGuard,
    totalSalaryByAvgRateMonth: salaryMonth,
    totalMonthGross,
    totalContractGross,
    extraMonthly,
    extraOnce,
    adm: totalMonthGross * (c.admRate || 0),
    serviceMonths
  };
};

// =====================
// Render: Guard lines
// =====================
window.Calculator.renderCalcTable = () => {
  const tbody = document.getElementById('securityRowsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.Calculator.state.rows.forEach((row, idx) => {
    const count = parseNumRu(row.count) || 0;
    const hoursMonth = parseNumRu(row.hoursMonth) || 0;
    const rateHour = parseNumRu(row.rateHour) || 0;
    const months = parseNumRu(row.months) || window.Calculator.getServiceMonths();

    const revMonth = rateHour * hoursMonth * count;
    const revTotal = revMonth * months;

    const shiftHours = parseNumRu(row.shiftHours) || 12;
    const shifts = shiftHours > 0 ? hoursMonth / shiftHours : 0;
    const shiftRate = parseNumRu(row.shiftRate) || 0;
    const salaryMonth = shiftRate * shifts * count;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="min-width: 140px;">
        <select class="calc-type-select" data-idx="${idx}">
          ${window.Calculator.state.priceList.map(p => `<option value="${p.id}" ${p.id === row.priceId ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </td>
      <td style="width:60px;"><input type="number" value="${row.count || 1}" data-idx="${idx}" class="calc-count-input" style="text-align:center;"></td>
      <td style="width:80px;"><input type="number" value="${row.hoursMonth || 0}" data-idx="${idx}" class="calc-hours-input" style="text-align:center;"></td>
      <td style="width:60px;"><input type="number" value="${row.shiftHours || 12}" data-idx="${idx}" class="calc-shifthours-input" style="text-align:center;"></td>
      <td style="width:60px;"><input type="number" value="${row.months || months}" data-idx="${idx}" class="calc-months-input" style="text-align:center;"></td>
      <td style="width:90px;"><input type="number" value="${row.rateHour || 0}" data-idx="${idx}" class="calc-rate-input" style="text-align:right;"></td>
      <td style="width:110px;"><input type="number" value="${row.shiftRate || 0}" data-idx="${idx}" class="calc-shiftrate-input" style="text-align:right;"></td>
      <td class="text-right font-mono">${window.Rules.fmtNum(revMonth)}</td>
      <td class="text-right font-mono">${window.Rules.fmtNum(salaryMonth)}</td>
      <td class="text-right font-mono" style="font-weight:700;">${window.Rules.fmtNum(revTotal)}</td>
      <td><button class="btn-icon danger calc-remove-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.calc-type-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const p = window.Calculator.state.priceList.find(item => item.id === parseInt(e.target.value));
      if (p) {
        window.Calculator.state.rows[idx] = {
          ...window.Calculator.state.rows[idx],
          priceId: p.id,
          rateHour: p.rateHour,
          hoursMonth: p.hoursMonth,
          shiftHours: p.shiftHours,
          shiftRate: p.shiftRate
        };
        window.Calculator.renderAll();
      }
    });
  });

  const bindNumber = (cls, field) => {
    tbody.querySelectorAll(cls).forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        window.Calculator.state.rows[idx][field] = parseFloat(e.target.value) || 0;
        window.Calculator.renderAll();
      });
    });
  };

  bindNumber('.calc-count-input', 'count');
  bindNumber('.calc-months-input', 'months');
  bindNumber('.calc-hours-input', 'hoursMonth');
  bindNumber('.calc-shifthours-input', 'shiftHours');
  bindNumber('.calc-rate-input', 'rateHour');
  bindNumber('.calc-shiftrate-input', 'shiftRate');

  tbody.querySelectorAll('.calc-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      window.Calculator.state.rows.splice(parseInt(e.currentTarget.dataset.idx), 1);
      window.Calculator.renderAll();
    });
  });
};

// =====================
// Render: Extra lines
// =====================
window.Calculator.renderExtraTable = () => {
  const tbody = document.getElementById('extraRowsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.Calculator.state.extraRows.forEach((row, idx) => {
    const total = (parseNumRu(row.quantity) || 0) * (parseNumRu(row.price) || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${row.name || ''}" data-idx="${idx}" class="extra-name-input"></td>
      <td style="width:60px;"><input type="number" value="${row.quantity || 1}" data-idx="${idx}" class="extra-qty-input" style="text-align:center;"></td>
      <td style="width:100px;"><input type="number" value="${row.price || 0}" data-idx="${idx}" class="extra-price-input" style="text-align:right;"></td>
      <td style="width:70px;"><select data-idx="${idx}" class="extra-unit-select">
          <option value="шт" ${row.unit === 'шт' ? 'selected' : ''}>шт</option>
          <option value="день" ${row.unit === 'день' ? 'selected' : ''}>день</option>
          <option value="мес" ${row.unit === 'мес' ? 'selected' : ''}>мес</option>
        </select></td>
      <td style="width:90px;"><select data-idx="${idx}" class="extra-vat-select">
          <option value="ндс" ${row.vatType === 'ндс' ? 'selected' : ''}>ндс</option>
          <option value="без ндс" ${row.vatType === 'без ндс' ? 'selected' : ''}>без ндс</option>
          <option value="нал" ${row.vatType === 'нал' ? 'selected' : ''}>нал</option>
        </select></td>
      <td style="width:80px;"><select data-idx="${idx}" class="extra-type-select">
          <option value="monthly" ${row.type === 'monthly' ? 'selected' : ''}>ежемес.</option>
          <option value="once" ${row.type === 'once' ? 'selected' : ''}>разово</option>
        </select></td>
      <td class="text-right font-mono" style="font-weight:700;">${window.Rules.fmtNum(total)}</td>
      <td style="width:40px;"><button class="btn-icon danger extra-remove-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.extra-name-input, .extra-qty-input, .extra-price-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.classList.contains('extra-name-input') ? 'name' :
        (e.target.classList.contains('extra-qty-input') ? 'quantity' : 'price');
      window.Calculator.state.extraRows[idx][field] = (field === 'name') ? e.target.value : (parseFloat(e.target.value) || 0);
      window.Calculator.renderAll();
    });
  });

  tbody.querySelectorAll('.extra-unit-select, .extra-vat-select, .extra-type-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.classList.contains('extra-unit-select') ? 'unit' :
        (e.target.classList.contains('extra-vat-select') ? 'vatType' : 'type');
      window.Calculator.state.extraRows[idx][field] = e.target.value;
      window.Calculator.renderAll();
    });
  });

  tbody.querySelectorAll('.extra-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      window.Calculator.state.extraRows.splice(parseInt(e.currentTarget.dataset.idx), 1);
      window.Calculator.renderAll();
    });
  });
};

// =====================
// Schemes matrix (5 columns) + global [v]
// =====================
window.Calculator.applySchemesExpanded = () => {
  const expanded = !!window.Calculator.state.schemesExpanded;
  document.querySelectorAll('.schemes-detail-row').forEach(tr => {
    tr.style.display = expanded ? '' : 'none';
  });

  const btn = document.getElementById('toggleSchemesBtn');
  if (btn) btn.innerHTML = expanded ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
};

window.Calculator.toggleSchemesExpanded = () => {
  window.Calculator.state.schemesExpanded = !window.Calculator.state.schemesExpanded;
  window.Calculator.applySchemesExpanded();
};

window.Calculator.renderSchemesMatrix = () => {
  const tbody = document.getElementById('schemesMatrixBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
  const schemeKeys = ['BELUSN', 'SERUSN', 'BELNDS', 'SERNDS', 'IPNDS'];
  const results = schemeKeys.map(k => ({ key: k, res: window.Calculator.calculateScenario(k, base) }));

  const fmtPct = (x) => (isFinite(x) ? (x * 100).toFixed(2) + '%' : '0.00%');

  const get = (obj, path) => {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return null;
    }
    return cur;
  };

  const metrics = [
    { label: 'Рентабельность', key: 'rentability', type: 'pct', core: true },
    { label: 'Прибыль чистая', key: 'profitNet', type: 'money', core: true },
    { label: 'Прибыль до див.', key: 'profitBeforeDividends', type: 'money', core: true },
    { label: 'Выручка', key: 'revenue', type: 'money', core: true },
    { label: 'ФОТ реальный', key: 'fotReal', type: 'money', core: true },

    { label: 'ФОТ офиц.', key: 'fotOfficial', type: 'money', core: false },
    { label: 'Налоги ФОТ', key: 'payrollTaxes', type: 'money', core: false },

    { label: 'НДС (исх/вычет)', key: 'vatOut|vatDeduction', type: 'money', core: false },
    { label: 'НДС входящий', key: 'vatIn', type: 'money', core: false },

    { label: 'УСН', key: 'usnTax', type: 'money', core: false },
    { label: 'Налог на прибыль', key: 'profitTax', type: 'money', core: false },

    { label: 'ЗП (на руки)', key: 'netSalary', type: 'money', core: false },
    { label: 'Серая часть', key: 'greyAmount', type: 'money', core: false },
    { label: 'Налог дивидендов', key: 'dividendTax', type: 'money', core: false },
    { label: 'Комиссия обнал', key: 'cashOutCommission', type: 'money', core: false }
  ];

  const readMetric = (resObj, metricKey) => {
    if (metricKey.includes('|')) {
      const [a, b] = metricKey.split('|');
      const av = get(resObj, a);
      if (av !== null && av !== undefined) return av;
      return get(resObj, b);
    }
    return get(resObj, metricKey);
  };

  metrics.forEach(m => {
    const tr = document.createElement('tr');
    if (!m.core) tr.classList.add('schemes-detail-row');

    const cells = [];
    cells.push(`<td class="schemes-metric">${m.label}</td>`);

    results.forEach(({ res }) => {
      const v = readMetric(res, m.key);
      let txt = '-';
      if (m.type === 'pct') txt = fmtPct(v || 0);
      else if (m.type === 'money') txt = window.Rules.fmtNum(v || 0);
      else txt = (v ?? '-');
      cells.push(`<td class="text-right font-mono">${txt}</td>`);
    });

    tr.innerHTML = cells.join('');
    tbody.appendChild(tr);
  });

  window.Calculator.applySchemesExpanded();
};

// =====================
// Totals
// =====================
window.Calculator.calculateTotal = () => {
  window.Calculator.ensureBGExtraRows();

  const base = window.Calculator.calcBaseForExcel(window.Calculator.state);

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setText('totalHoursCalc', window.Rules.fmtNum(base.totalHoursMonth));
  setText('totalPeopleCalc', String(base.people));
  setText('avgRateCalc', window.Rules.fmtNum(base.avgRateHour));
  setText('totalAmountCalc', window.Rules.fmtNum(base.totalMonthGross));
  setText('extraTotalCalc', window.Rules.fmtNum(base.extraMonthly));
  setText('extraOnceCalc', window.Rules.fmtNum(base.extraOnce));
  setText('grandTotalContract', window.Rules.fmtNum(base.totalContractGross));

  window.Calculator.renderSchemesMatrix();
};

// =====================
// Price tables
// =====================
window.Calculator.renderPriceTable = () => {
  const tbody = document.getElementById('priceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.Calculator.state.priceList.forEach((p, idx) => {
    const tr = document.createElement('tr');
    const totalMonth = (parseNumRu(p.rateHour) || 0) * (parseNumRu(p.hoursMonth) || 0);

    tr.innerHTML = `
      <td><input type="text" value="${p.name || ''}" data-idx="${idx}" data-f="name"></td>
      <td style="width:100px;"><input type="text" value="${p.region || ''}" data-idx="${idx}" data-f="region"></td>
      <td style="width:45px;text-align:center;"><input type="checkbox" ${p.weapon ? 'checked' : ''} data-idx="${idx}" data-f="weapon" style="width:auto"></td>
      <td style="width:60px;"><input type="number" value="${p.shiftHours || 12}" data-idx="${idx}" data-f="shiftHours"></td>
      <td style="width:70px;"><input type="number" value="${p.hoursMonth || 0}" data-idx="${idx}" data-f="hoursMonth"></td>
      <td style="width:90px;"><input type="number" value="${p.rateHour || 0}" data-idx="${idx}" data-f="rateHour"></td>
      <td style="width:110px;"><input type="number" value="${p.shiftRate || 0}" data-idx="${idx}" data-f="shiftRate"></td>
      <td class="text-right font-mono">${window.Rules.fmtNum(totalMonth)}</td>
      <td style="width:40px;"><button class="btn-icon danger remove-price-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input,select').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const f = e.target.dataset.f;
      if (idx < 0 || !f) return;
      if (e.target.type === 'checkbox') window.Calculator.state.priceList[idx][f] = !!e.target.checked;
      else window.Calculator.state.priceList[idx][f] = (e.target.type === 'number') ? (parseFloat(e.target.value) || 0) : e.target.value;
      window.Calculator.renderPriceTable();
      window.App?.markDirty?.();
    });
  });

  tbody.querySelectorAll('.remove-price-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      window.Calculator.state.priceList.splice(idx, 1);
      window.Calculator.renderPriceTable();
      window.App?.markDirty?.();
    });
  });
};

window.Calculator.renderExtraPriceTable = () => {
  const tbody = document.getElementById('extraPriceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  window.Calculator.state.extraPriceList.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${p.name || ''}" data-idx="${idx}" data-f="name"></td>
      <td style="width:90px;"><input type="number" value="${p.price || 0}" data-idx="${idx}" data-f="price"></td>
      <td style="width:70px;">
        <select data-idx="${idx}" data-f="unit">
          <option value="шт" ${p.unit === 'шт' ? 'selected' : ''}>шт</option>
          <option value="день" ${p.unit === 'день' ? 'selected' : ''}>день</option>
          <option value="мес" ${p.unit === 'мес' ? 'selected' : ''}>мес</option>
        </select>
      </td>
      <td style="width:90px;">
        <select data-idx="${idx}" data-f="vatType">
          <option value="ндс" ${p.vatType === 'ндс' ? 'selected' : ''}>ндс</option>
          <option value="без ндс" ${p.vatType === 'без ндс' ? 'selected' : ''}>без ндс</option>
          <option value="нал" ${p.vatType === 'нал' ? 'selected' : ''}>нал</option>
        </select>
      </td>
      <td style="width:90px;">
        <select data-idx="${idx}" data-f="periodicity">
          <option value="monthly" ${p.periodicity === 'monthly' ? 'selected' : ''}>ежемес.</option>
          <option value="once" ${p.periodicity === 'once' ? 'selected' : ''}>разово</option>
        </select>
      </td>
      <td style="width:40px;"><button class="btn-icon danger remove-extra-price-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input,select').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const f = e.target.dataset.f;
      if (idx < 0 || !f) return;
      window.Calculator.state.extraPriceList[idx][f] = (e.target.type === 'number') ? (parseFloat(e.target.value) || 0) : e.target.value;
      window.Calculator.renderExtraPriceTable();
      window.App?.markDirty?.();
    });
  });

  tbody.querySelectorAll('.remove-extra-price-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      window.Calculator.state.extraPriceList.splice(idx, 1);
      window.Calculator.renderExtraPriceTable();
      window.App?.markDirty?.();
    });
  });
};

// =====================
// Actions
// =====================
window.Calculator.addRow = () => {
  if (!window.Calculator.state.priceList.length) return alert('Сначала заполните прайс охраны');
  const p = window.Calculator.state.priceList[0];
  window.Calculator.state.rows.push({
    priceId: p.id,
    count: 1,
    hoursMonth: p.hoursMonth,
    shiftHours: p.shiftHours || 12,
    months: window.Calculator.getServiceMonths(),
    rateHour: p.rateHour,
    shiftRate: p.shiftRate || 0
  });
  window.Calculator.renderAll();
  window.App?.markDirty?.();
};

window.Calculator.addExtraRow = () => {
  window.Calculator.state.extraRows.push({
    name: 'Новый расход',
    quantity: 1,
    price: 0,
    unit: 'шт',
    vatType: 'без ндс',
    type: 'once'
  });
  window.Calculator.renderAll();
  window.App?.markDirty?.();
};

window.Calculator.renderAll = () => {
  window.Calculator.renderCalcTable();
  window.Calculator.renderExtraTable();
  window.Calculator.calculateTotal();
};

window.Calculator.handleSaveMain = async () => {
  const tid = window.Calculator.state.currentTenderId || 'manual';

  const payload = {
    tenderUrl: document.getElementById('tenderUrl')?.value || '',
    customerName: document.getElementById('customerName')?.value || '',
    customerInn: document.getElementById('customerInn')?.value || '',
    customerKpp: document.getElementById('customerKpp')?.value || '',
    contactName: document.getElementById('contactName')?.value || '',
    contactPhone: document.getElementById('contactPhone')?.value || '',
    contactEmail: document.getElementById('contactEmail')?.value || '',
    nmcValue: parseNumRu(document.getElementById('nmcValue')?.value),
    bidSecurity: parseNumRu(document.getElementById('bidSecurity')?.value),
    contractSecurity: parseNumRu(document.getElementById('contractSecurity')?.value),
    platformTariff: parseNumRu(document.getElementById('platformTariff')?.value),
    serviceStart: document.getElementById('serviceStart')?.value || '',
    serviceEnd: document.getElementById('serviceEnd')?.value || '',
    serviceMonths: window.Calculator.getServiceMonths(),

    rows: window.Calculator.state.rows,
    extraRows: window.Calculator.state.extraRows,

    comments: window.Calculator.state.comments || []
  };

  await chrome.storage.local.set({ [`tenderCalc_${tid}`]: payload });
};

window.Calculator.handleSavePrice = async () => {
  await chrome.storage.local.set({
    customPriceList: window.Calculator.state.priceList,
    customExtraPriceList: window.Calculator.state.extraPriceList
  });
};

window.Calculator.loadTenderDraft = async () => {
  const tid = window.Calculator.state.currentTenderId;
  if (!tid) return;
  const s = await chrome.storage.local.get([`tenderCalc_${tid}`]);
  const d = s[`tenderCalc_${tid}`];
  if (!d) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  setVal('tenderUrl', d.tenderUrl);
  setVal('customerName', d.customerName);
  setVal('customerInn', d.customerInn);
  setVal('customerKpp', d.customerKpp);
  setVal('contactName', d.contactName);
  setVal('contactPhone', d.contactPhone);
  setVal('contactEmail', d.contactEmail);
  setVal('nmcValue', d.nmcValue || '');
  setVal('bidSecurity', d.bidSecurity || '');
  setVal('contractSecurity', d.contractSecurity || '');
  setVal('platformTariff', d.platformTariff || '');
  setVal('serviceStart', d.serviceStart || '');
  setVal('serviceEnd', d.serviceEnd || '');
  setVal('serviceMonths', d.serviceMonths || window.Calculator.getServiceMonths());

  window.Calculator.state.rows = Array.isArray(d.rows) ? d.rows : [];
  window.Calculator.state.extraRows = Array.isArray(d.extraRows) ? d.extraRows : [];
  window.Calculator.state.comments = Array.isArray(d.comments) ? d.comments : [];
};

window.Calculator.renderComments = () => {
  const list = document.getElementById('dealCommentsList');
  if (!list) return;
  list.innerHTML = '';
  const comments = window.Calculator.state.comments || [];
  comments.slice().reverse().forEach(c => {
    const div = document.createElement('div');
    div.className = 'collapse-item';
    const ts = new Date(c.ts).toLocaleString('ru-RU');
    div.innerHTML = `<div class="collapse-item-label">${ts}</div><div class="collapse-item-value" style="color:var(--text-primary);">${c.text}</div>`;
    list.appendChild(div);
  });
};

window.Calculator.addComment = async () => {
  const inp = document.getElementById('dealCommentInput');
  if (!inp) return;
  const text = String(inp.value || '').trim();
  if (!text) return;

  window.Calculator.state.comments = window.Calculator.state.comments || [];
  window.Calculator.state.comments.push({ ts: new Date().toISOString(), author: 'local', text });
  inp.value = '';
  window.Calculator.renderComments();
  window.App?.markDirty?.();
};

// =====================
// Init
// =====================
window.Calculator.init = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) window.Calculator.state.currentTenderId = window.App.getTenderId(tab.url);

  const s = await chrome.storage.local.get(['customPriceList', 'customExtraPriceList']);

  window.Calculator.state.priceList = (s.customPriceList && s.customPriceList.length)
    ? s.customPriceList
    : (window.Data.defaultPriceList || []);

  window.Calculator.state.extraPriceList = (s.customExtraPriceList && s.customExtraPriceList.length)
    ? s.customExtraPriceList
    : (window.Data.defaultExtraPriceList || []);

  await window.Calculator.loadTenderDraft();

  window.Calculator.renderAll();
  window.Calculator.renderPriceTable();
  window.Calculator.renderExtraPriceTable();
  window.Calculator.renderComments();
};
