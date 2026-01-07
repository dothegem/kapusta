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

// Calculation schemes based on .info/full_calc_logic/complete_calculation_breakdown.txt
window.Calculator.CONFIG = {
    scenarios: {
        'BELUSN': {
            name: 'Бел УСН',
            description: 'Полностью легальная схема на УСН (доходы 6%)',
            calculate: (base, c) => {
                const revenue = base.totalContractGross;
                const fotReal = base.totalSalaryByAvgRateMonth * 12; // Annual FOT

                // Official salary calculation (GROSS-AP method)
                const fotOfficial = fotReal / c.payrollNetFactor; // D17
                const ndfl = fotOfficial * c.ndflRatePercent / 100; // D21
                const pfr = fotOfficial * c.pfrRatePercent / 100; // D22
                const fss = fotOfficial * c.fssRatePercent / 100; // D23
                const payrollTaxes = ndfl + pfr + fss; // D24

                // VAT extraction (7%)
                const vatDeduction = revenue / (100 + c.osnLowRatePercent) * c.osnLowRatePercent; // D27
                const usnTax = (revenue - vatDeduction) * c.usnRatePercent / 100; // D28

                // Net salary paid
                const netSalary = fotOfficial - ndfl; // D30

                // Total expenses
                const totalExpenses = vatDeduction + usnTax + payrollTaxes + netSalary; // D40

                // Profit
                const profitBeforeDividends = revenue - totalExpenses; // D42
                const profitNet = profitBeforeDividends * c.dividendFactor; // D44

                // Rentability
                const rentability = profitNet / revenue; // D46

                return {
                    revenue: revenue,
                    fotReal: fotReal,
                    fotOfficial: fotOfficial,
                    payrollTaxes: payrollTaxes,
                    vatDeduction: vatDeduction,
                    usnTax: usnTax,
                    netSalary: netSalary,
                    totalExpenses: totalExpenses,
                    profitBeforeDividends: profitBeforeDividends,
                    profitNet: profitNet,
                    rentability: rentability
                };
            }
        },
        'SERUSN': {
            name: 'Сер УСН',
            description: 'Серая схема с минимальной официальной ЗП, остаток дивидендами',
            calculate: (base, c) => {
                const revenue = base.totalContractGross;
                const fotReal = base.totalSalaryByAvgRateMonth * 12;

                // Minimal official salary
                const fotOfficial = c.officialSalaryDefault * 12; // D17 (fixed minimal)
                const ndfl = fotOfficial * c.ndflRatePercent / 100;
                const pfr = fotOfficial * c.pfrRatePercent / 100;
                const fss = fotOfficial * c.fssRatePercent / 100;
                const payrollTaxes = ndfl + pfr + fss;

                // VAT extraction (7%)
                const vatDeduction = revenue / (100 + c.osnLowRatePercent) * c.osnLowRatePercent;
                const usnTax = (revenue - vatDeduction) * c.usnRatePercent / 100;

                // Net salary paid officially
                const netSalary = fotOfficial - ndfl;

                // Grey part (dividends)
                const greyAmount = fotReal - netSalary; // D32
                const dividendTax = greyAmount / c.dividendFactor * (c.dividendTaxRatePercent / 100); // D33

                // Total expenses
                const totalExpenses = vatDeduction + usnTax + payrollTaxes + netSalary + dividendTax;

                // Profit
                const profitBeforeDividends = revenue - totalExpenses;
                const profitNet = profitBeforeDividends * c.dividendFactor;

                const rentability = profitNet / revenue;

                return {
                    revenue: revenue,
                    fotReal: fotReal,
                    fotOfficial: fotOfficial,
                    payrollTaxes: payrollTaxes,
                    greyAmount: greyAmount,
                    dividendTax: dividendTax,
                    vatDeduction: vatDeduction,
                    usnTax: usnTax,
                    netSalary: netSalary,
                    totalExpenses: totalExpenses,
                    profitBeforeDividends: profitBeforeDividends,
                    profitNet: profitNet,
                    rentability: rentability
                };
            }
        },
        'BELNDS': {
            name: 'Бел НДС',
            description: 'Полностью белая схема на ОСНО с НДС 22% и налогом на прибыль 25%',
            calculate: (base, c) => {
                const revenueBase = base.totalContractGross / (100 + c.osnRatePercent) * 100; // Without VAT
                const revenueWithVAT = base.totalContractGross; // D8
                const fotReal = base.totalSalaryByAvgRateMonth * 12;

                // Official salary (GROSS-AP)
                const fotOfficial = fotReal / c.payrollNetFactor;
                const ndfl = fotOfficial * c.ndflRatePercent / 100;
                const pfr = fotOfficial * c.pfrRatePercent / 100;
                const fss = fotOfficial * c.fssRatePercent / 100;
                const payrollTaxes = ndfl + pfr + fss;

                // VAT calculation
                const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent; // D27
                const vatIn = 0; // Assuming no input VAT for simplicity

                // Profit tax (25%)
                const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl; // Simplified
                const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

                // Net salary
                const netSalary = fotOfficial - ndfl;

                // Total expenses
                const totalExpenses = vatOut + payrollTaxes + netSalary + profitTax;

                // Profit
                const profitBeforeDividends = revenueWithVAT - totalExpenses;
                const profitNet = profitBeforeDividends * c.dividendFactor;

                const rentability = profitNet / revenueWithVAT;

                return {
                    revenue: revenueWithVAT,
                    revenueBase: revenueBase,
                    fotReal: fotReal,
                    fotOfficial: fotOfficial,
                    payrollTaxes: payrollTaxes,
                    vatOut: vatOut,
                    profitTax: profitTax,
                    netSalary: netSalary,
                    totalExpenses: totalExpenses,
                    profitBeforeDividends: profitBeforeDividends,
                    profitNet: profitNet,
                    rentability: rentability
                };
            }
        },
        'SERNDS': {
            name: 'Сер НДС',
            description: 'Серая схема на ОСНО с агрессивной оптимизацией НДС',
            calculate: (base, c) => {
                const revenueBase = base.totalContractGross / (100 + c.osnRatePercent) * 100;
                const revenueWithVAT = base.totalContractGross;
                const fotReal = base.totalSalaryByAvgRateMonth * 12;

                // Minimal official salary
                const fotOfficial = c.officialSalaryDefault * 12;
                const ndfl = fotOfficial * c.ndflRatePercent / 100;
                const pfr = fotOfficial * c.pfrRatePercent / 100;
                const fss = fotOfficial * c.fssRatePercent / 100;
                const payrollTaxes = ndfl + pfr + fss;

                // VAT with risk commission
                const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent;
                const vatIn = vatOut * c.cashOutRiskCommissionRate; // Risky scheme

                // Grey part
                const netSalary = fotOfficial - ndfl;
                const greyAmount = fotReal - netSalary;
                const dividendTax = greyAmount / c.dividendFactor * (c.dividendTaxRatePercent / 100);

                // Profit tax
                const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl;
                const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

                // Total expenses (including risky commission)
                const totalExpenses = vatOut - vatIn + payrollTaxes + netSalary + dividendTax + profitTax;

                const profitBeforeDividends = revenueWithVAT - totalExpenses;
                const profitNet = profitBeforeDividends * c.dividendFactor;

                const rentability = profitNet / revenueWithVAT;

                return {
                    revenue: revenueWithVAT,
                    revenueBase: revenueBase,
                    fotReal: fotReal,
                    fotOfficial: fotOfficial,
                    payrollTaxes: payrollTaxes,
                    greyAmount: greyAmount,
                    dividendTax: dividendTax,
                    vatOut: vatOut,
                    vatIn: vatIn,
                    profitTax: profitTax,
                    netSalary: netSalary,
                    totalExpenses: totalExpenses,
                    profitBeforeDividends: profitBeforeDividends,
                    profitNet: profitNet,
                    rentability: rentability
                };
            }
        },
        'IPNDS': {
            name: 'ИП НДС',
            description: 'ИП на ОСНО с минимальными официальными выплатами',
            calculate: (base, c) => {
                const revenueBase = base.totalContractGross / (100 + c.osnRatePercent) * 100;
                const revenueWithVAT = base.totalContractGross;
                const fotReal = base.totalSalaryByAvgRateMonth * 12;

                // Minimal official salary for IP
                const fotOfficial = c.officialSalaryDefault * 12;
                const ndfl = fotOfficial * c.ndflRatePercent / 100;
                const pfr = fotOfficial * c.pfrRatePercent / 100;
                const fss = fotOfficial * c.fssRatePercent / 100;
                const payrollTaxes = ndfl + pfr + fss;

                // VAT
                const vatOut = revenueWithVAT / (100 + c.osnRatePercent) * c.osnRatePercent;

                // Grey part with commission
                const netSalary = fotOfficial - ndfl;
                const greyAmount = fotReal - netSalary;
                const cashOutCommission = greyAmount * c.cashOutCommissionRate;
                const dividendTax = (greyAmount + cashOutCommission) / c.dividendFactor * (c.dividendTaxRatePercent / 100);

                // Profit tax
                const taxableIncome = revenueBase - payrollTaxes - fotOfficial + ndfl;
                const profitTax = Math.max(0, taxableIncome * c.profitTaxRatePercent / 100);

                // Total expenses
                const totalExpenses = vatOut + payrollTaxes + netSalary + cashOutCommission + dividendTax + profitTax;

                const profitBeforeDividends = revenueWithVAT - totalExpenses;
                const profitNet = profitBeforeDividends * c.dividendFactor;

                const rentability = profitNet / revenueWithVAT;

                return {
                    revenue: revenueWithVAT,
                    revenueBase: revenueBase,
                    fotReal: fotReal,
                    fotOfficial: fotOfficial,
                    payrollTaxes: payrollTaxes,
                    greyAmount: greyAmount,
                    cashOutCommission: cashOutCommission,
                    dividendTax: dividendTax,
                    vatOut: vatOut,
                    profitTax: profitTax,
                    netSalary: netSalary,
                    totalExpenses: totalExpenses,
                    profitBeforeDividends: profitBeforeDividends,
                    profitNet: profitNet,
                    rentability: rentability
                };
            }
        }
    }
};

window.Calculator.calculateScenario = (scenarioKey, base) => {
    const scenario = window.Calculator.CONFIG.scenarios[scenarioKey];
    if (!scenario) return {};
    return scenario.calculate(base, window.Rules.constants);
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
      <td><input type="text" value="${row.address || ''}" data-idx="${idx}" class="calc-address-input" placeholder="Адрес объекта"></td>
      <td><select data-idx="${idx}" class="calc-uniform-select">
          <option value="">Не выбрана</option>
          ${window.Data.uniforms.map(u => `<option value="${u.id}" ${u.id === row.uniform ? 'selected' : ''}>${u.name}</option>`).join('')}
        </select></td>
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

  tbody.querySelectorAll('.calc-description-input, .calc-months-input, .calc-hours-input, .calc-rate-input, .calc-address-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.classList.contains('calc-description-input') ? 'description' :
                   (e.target.classList.contains('calc-months-input') ? 'months' :
                   (e.target.classList.contains('calc-hours-input') ? 'hoursMonth' :
                   (e.target.classList.contains('calc-address-input') ? 'address' : 'rateHour')));
      window.Calculator.state.rows[idx][field] = (field === 'description' || field === 'address') ? e.target.value : parseFloat(e.target.value) || 0;
      window.Calculator.renderAll();
    });
  });

  tbody.querySelectorAll('.calc-uniform-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      window.Calculator.state.rows[idx].uniform = parseInt(e.target.value) || null;
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
      <td><select data-idx="${idx}" class="extra-unit-select">
          <option value="шт" ${row.unit === 'шт' ? 'selected' : ''}>шт</option>
          <option value="день" ${row.unit === 'день' ? 'selected' : ''}>день</option>
          <option value="мес" ${row.unit === 'мес' ? 'selected' : ''}>мес</option>
        </select></td>
      <td><select data-idx="${idx}" class="extra-vat-select">
          <option value="ндс" ${row.vatType === 'ндс' ? 'selected' : ''}>ндс</option>
          <option value="без ндс" ${row.vatType === 'без ндс' ? 'selected' : ''}>без ндс</option>
          <option value="нал" ${row.vatType === 'нал' ? 'selected' : ''}>нал</option>
        </select></td>
      <td><select data-idx="${idx}" class="extra-type-select"><option value="monthly" ${row.type === 'monthly' ? 'selected' : ''}>В месяц</option><option value="once" ${row.type === 'once' ? 'selected' : ''}>Разово</option></select></td>
      <td style="text-align: right; font-weight: 700;">${window.Rules.fmtNum(total)}</td>
      <td><button class="btn-icon danger extra-remove-btn" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.extra-name-input, .extra-qty-input, .extra-price-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.classList.contains('extra-name-input') ? 'name' :
                   (e.target.classList.contains('extra-qty-input') ? 'quantity' : 'price');
      window.Calculator.state.extraRows[idx][field] = (field === 'name') ? e.target.value : parseFloat(e.target.value) || 0;
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

  tbody.querySelectorAll('.extra-remove-btn').forEach(btn => btn.onclick = (e) => { window.Calculator.state.extraRows.splice(parseInt(e.currentTarget.dataset.idx), 1); window.Calculator.renderAll(); });
};

window.Calculator.renderSchemesWithCollapse = () => {
  const container = document.getElementById('schemesDetailsContainer');
  if (!container) return;
  container.innerHTML = '';
  const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
  const schemes = ['BELUSN', 'SERUSN', 'BELNDS', 'SERNDS', 'IPNDS'];
  schemes.forEach(k => {
    const res = window.Calculator.calculateScenario(k, base);
    const rent = (res.rentability * 100).toFixed(1);
    const color = rent > 15 ? 'var(--accent-green)' : (rent > 10 ? 'var(--accent-orange)' : 'var(--accent-red)');
    const scenario = window.Calculator.CONFIG.scenarios[k];

    const group = document.createElement('div');
    group.className = 'collapse-group';
    group.innerHTML = `
      <div class="collapse-header">
        <div class="collapse-title">
          <i class="fas fa-chevron-right collapse-icon"></i>
          <span>${scenario.name}</span>
        </div>
        <div style="color:${color};font-weight:700;">${rent}%</div>
      </div>
      <div class="collapse-content">
        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">${scenario.description}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div><strong>Выручка:</strong> ${window.Rules.fmtNum(res.revenue)}</div>
          <div><strong>ФОТ реальный:</strong> ${window.Rules.fmtNum(res.fotReal)}</div>
          <div><strong>Расходы итого:</strong> ${window.Rules.fmtNum(res.totalExpenses)}</div>
          <div><strong>Прибыль чистая:</strong> ${window.Rules.fmtNum(res.profitNet)}</div>
        </div>
      </div>
    `;
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
    window.Calculator.updateSchemesTable();
};

window.Calculator.updateSchemesTable = () => {
    const base = window.Calculator.calcBaseForExcel(window.Calculator.state);
    const schemes = ['BELUSN', 'SERUSN', 'BELNDS', 'SERNDS', 'IPNDS'];

    schemes.forEach((k, idx) => {
        const res = window.Calculator.calculateScenario(k, base);
        const rent = (res.rentability * 100).toFixed(1);

        // Update rentability in summary
        const rentEl = document.getElementById(`rent${k}`);
        if (rentEl) {
            rentEl.textContent = rent + '%';
            rentEl.style.color = rent > 15 ? 'var(--accent-green)' : (rent > 10 ? 'var(--accent-orange)' : 'var(--accent-red)');
        }

        // Update table row if exists
        const tbody = document.getElementById('schemesTableBody');
        if (tbody && tbody.rows[idx]) {
            const row = tbody.rows[idx];
            // Update cells based on the scheme
            // This is simplified; in real implementation, map all the detailed values
            if (row.cells[1]) row.cells[1].textContent = rent + '%';
            // Add more cell updates as needed
        }
    });
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
    window.Calculator.state.rows.push({
        priceId: p.id,
        description: '',
        hoursMonth: p.hoursMonth,
        months: 12,
        rateHour: p.rateHour,
        count: 1,
        address: '',
        uniform: null
    });
    window.Calculator.renderAll();
};
window.Calculator.addExtraRow = () => {
    window.Calculator.state.extraRows.push({
        name: 'Новый расход',
        quantity: 1,
        price: 0,
        unit: 'шт',
        vatType: 'ндс',
        type: 'monthly'
    });
    window.Calculator.renderAll();
};
window.Calculator.handleSaveMain = async () => { await chrome.storage.local.set({ [`tenderCalc_${window.Calculator.state.currentTenderId}`]: { rows: window.Calculator.state.rows, extraRows: window.Calculator.state.extraRows } }); };
window.Calculator.handleSavePrice = async () => { await chrome.storage.local.set({ customPriceList: window.Calculator.state.priceList, customExtraPriceList: window.Calculator.state.extraPriceList }); };
// START_FUNCTION_Calculator_init
// START_CONTRACT:
// PURPOSE: Инициализирует калькулятор, загружая сохраненные прайс-листы и определяя ID текущего тендера.
// SIDE_EFFECTS: Читает chrome.storage.local, вызывает renderAll.
// END_CONTRACT
window.Calculator.init = async () => {
    // START_BLOCK_INIT_STATE_FROM_STORAGE
    console.log("[Calculator][init][INIT_STATE_FROM_STORAGE][Start] Initializing...");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) window.Calculator.state.currentTenderId = window.App.getTenderId(tab.url);
    
    const s = await chrome.storage.local.get(['customPriceList', 'customExtraPriceList']);
    window.Calculator.state.priceList = s.customPriceList || [];
    window.Calculator.state.extraPriceList = s.customExtraPriceList || [];
    
    window.Calculator.renderAll();
    window.Calculator.renderPriceTable();
    window.Calculator.renderExtraPriceTable();
    console.log("[Calculator][init][INIT_STATE_FROM_STORAGE][Success] Initialized.");
    // END_BLOCK_INIT_STATE_FROM_STORAGE
};
// END_FUNCTION_Calculator_init
