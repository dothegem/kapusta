// FILE: rules.js
// VERSION: 2.2.0
// PURPOSE: Constants/formatting + calcspec loader.

window.Rules = window.Rules || {};

window.Rules.constants = {};
window.Rules.calcspec = null;

window.Rules.loadCalcspec = async () => {
  const s = await chrome.storage.local.get(['calcspecText']);

  // 1) User-edited spec from storage
  if (s.calcspecText && String(s.calcspecText).trim()) {
    try {
      window.Rules.calcspec = JSON.parse(s.calcspecText);
      return window.Rules.calcspec;
    } catch (e) {
      console.error('[Rules] Invalid calcspecText JSON:', e);
    }
  }

  // 2) Packaged default
  try {
    const resp = await fetch(chrome.runtime.getURL('src/calcspec.json'));
    const txt = await resp.text();
    window.Rules.calcspec = JSON.parse(txt);
    return window.Rules.calcspec;
  } catch (e) {
    console.error('[Rules] Failed to load packaged calcspec.json:', e);
    window.Rules.calcspec = null;
    return null;
  }
};

window.Rules.loadConstants = async () => {
  const spec = await window.Rules.loadCalcspec();

  const fallback = {
    ui: { vatModeDefault: 'outside', themeDefault: 'light' },
    constants: { daysInMonth: 30.5, vacation: { avgDaysInMonth: 29.3, vacationDaysPerYear: 28, monthsInYear: 12 } },
    rates: { ndfl: 0.13, usn: 0.06, vatLow: 0.07, vatHigh: 0.22, profitTax: 0.25, pfr: 0.22, fss: 0.029, foms: 0.051 },
    cashout: { dividendNet: 0.85, dividendTax: 0.13, cashoutCommission: 0.15, cashoutRisk: 0.12 },
    defaults: { mrot: 27093, officialSalary: 27093, admRate: 0 }
  };

  const cfg = spec || fallback;
  const c = window.Rules.constants;

  // UI
  c.themeDefault = cfg.ui?.themeDefault || 'light';
  c.vatModeDefault = cfg.ui?.vatModeDefault || 'outside';

  // Core
  c.daysInMonth = cfg.constants?.daysInMonth ?? 30.5;
  c.vacationAvgDaysInMonth = cfg.constants?.vacation?.avgDaysInMonth ?? 29.3;
  c.vacationDaysPerYear = cfg.constants?.vacation?.vacationDaysPerYear ?? 28;
  c.vacationMonthsInYear = cfg.constants?.vacation?.monthsInYear ?? 12;

  // Rates
  c.ndflRatePercent = (cfg.rates?.ndfl ?? 0.13) * 100;
  c.usnRatePercent = (cfg.rates?.usn ?? 0.06) * 100;
  c.osnLowRatePercent = (cfg.rates?.vatLow ?? 0.07) * 100;
  c.osnRatePercent = (cfg.rates?.vatHigh ?? 0.22) * 100;
  c.profitTaxRatePercent = (cfg.rates?.profitTax ?? 0.25) * 100;

  // Payroll
  c.pfrRatePercent = (cfg.rates?.pfr ?? 0.22) * 100;
  c.fssRatePercent = (cfg.rates?.fss ?? 0.029) * 100;
  c.fomsRatePercent = (cfg.rates?.foms ?? 0.051) * 100;
  c.payrollTaxRatePercent = c.pfrRatePercent + c.fssRatePercent + c.fomsRatePercent;

  // Dividend/cashout
  c.dividendFactor = cfg.cashout?.dividendNet ?? 0.85;
  c.dividendTaxRatePercent = (cfg.cashout?.dividendTax ?? 0.13) * 100;
  c.cashOutCommissionRate = cfg.cashout?.cashoutCommission ?? 0.15;
  c.cashOutRiskCommissionRate = cfg.cashout?.cashoutRisk ?? 0.12;

  // Defaults
  c.mrot = cfg.defaults?.mrot ?? 27093;
  c.officialSalaryDefault = cfg.defaults?.officialSalary ?? c.mrot;
  c.admRate = cfg.defaults?.admRate ?? 0;

  // Derived
  c.payrollNetFactor = 1 - (c.ndflRatePercent / 100);
};

window.Rules.fmtNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

window.Rules.fmtInt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val);
};
