// FILE: src/rules.js
// VERSION: 2.3.0
// START_MODULE_CONTRACT:
// PURPOSE: Загрузка конфигурации (calcspec.json), определение констант и функций форматирования.
// SCOPE: Конфигурация, Форматирование.
// INPUT: src/calcspec.json (через fetch или chrome.storage).
// OUTPUT: window.Rules.constants (глобальный объект с настройками), window.Rules.calcspec.
// KEYWORDS: [DOMAIN(10): Configuration; TECH(9): JSON_Loader; CONCEPT(8): Constants]
// LINKS: [READS_DATA_FROM(9): src/calcspec.json; USES_API(7): chrome.storage.local]
// LINKS_TO_SPECIFICATION: [docs/09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md]
// END_MODULE_CONTRACT
// START_MODULE_MAP:
// FUNC 10 [Загружает calcspec.json из storage или пакета] => loadCalcspec
// FUNC 10 [Парсит calcspec и заполняет Rules.constants] => loadConstants
// FUNC 5 [Форматирует число в валюту RU] => fmtNum
// FUNC 5 [Форматирует число в целое] => fmtInt
// OBJECT 9 [Хранилище плоских констант для калькулятора] => constants
// OBJECT 8 [Сырой объект конфигурации] => calcspec
// END_MODULE_MAP
// START_USE_CASES:
// - [loadConstants]: App (Init) -> LoadConfig -> ReadyForCalculation
// - [fmtNum]: UI (Render) -> FormatValues -> UserFriendlyDisplay
// END_USE_CASES

window.Rules = window.Rules || {};

window.Rules.constants = {};
window.Rules.calcspec = null;

// START_FUNCTION_loadCalcspec
// START_CONTRACT:
// PURPOSE: Загрузка спецификации калькулятора (calcspec).
// OUTPUTS:
// - [Object] - Объект конфигурации calcspec.
// KEYWORDS: [TECH(8): Async/Await; CONCEPT(7): FallbackStrategy]
// END_CONTRACT
window.Rules.loadCalcspec = async () => {
  const s = await chrome.storage.local.get(['calcspecText']);

  // 1) User-edited spec from storage
  // START_BLOCK_TRY_STORAGE: [Попытка загрузки из локального хранилища]
  if (s.calcspecText && String(s.calcspecText).trim()) {
    try {
      window.Rules.calcspec = JSON.parse(s.calcspecText);
      return window.Rules.calcspec;
    } catch (e) {
      console.error('[Rules] Invalid calcspecText JSON:', e);
    }
  }
  // END_BLOCK_TRY_STORAGE

  // 2) Packaged default
  // START_BLOCK_LOAD_DEFAULT: [Загрузка дефолтного файла из пакета]
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
  // END_BLOCK_LOAD_DEFAULT
};
// END_FUNCTION_loadCalcspec

// START_FUNCTION_loadConstants
// START_CONTRACT:
// PURPOSE: Преобразование иерархического calcspec в плоский список констант для калькулятора.
// INPUTS: Нет (использует window.Rules.loadCalcspec).
// SIDE_EFFECTS:
// - Обновляет window.Rules.constants.
// KEYWORDS: [DOMAIN(9): BusinessLogic; PATTERN(8): Mapping]
// END_CONTRACT
window.Rules.loadConstants = async () => {
  const spec = await window.Rules.loadCalcspec();
  
  // Fallback values if spec is missing
  const fallback = {
    constants: { daysInMonth: 30.5, avgDaysInMonth: 29.3, vacationDaysPerYear: 28, monthsInYear: 12 },
    rates: { 
      ndfl: 0.13, usn: 0.06, vatUsn: 0.07, vat: 0.22, profitTax: 0.25, 
      pfr: 0.30, fss: 0.002,
      envelope: { whitePart: 0.85, cashoutCommission: 0.15 },
      dividends: { taxRate: 0.15 }
    },
    cashout: { defaultFeeRate: 0.28, whiteToCashShare: 0.78, cashShare: 0.22 },
    defaults: { mrot: 27093, officialSalary: 27093, admRate: 0 }
  };

  const cfg = spec || fallback;
  const c = window.Rules.constants;

  // START_BLOCK_MAP_CORE: [Маппинг основных констант]
  // Core
  c.daysInMonth = cfg.constants?.daysInMonth ?? 30.5;
  c.vacationAvgDaysInMonth = cfg.constants?.avgDaysInMonth ?? 29.3;
  c.vacationDaysPerYear = cfg.constants?.vacationDaysPerYear ?? 28;
  c.vacationMonthsInYear = cfg.constants?.monthsInYear ?? 12;
  // END_BLOCK_MAP_CORE

  // START_BLOCK_MAP_RATES: [Маппинг налоговых ставок]
  // Rates
  const r = cfg.rates || {};
  c.ndflRatePercent = (r.ndfl ?? 0.13) * 100;
  c.usnRatePercent = (r.usn ?? 0.06) * 100;
  c.osnLowRatePercent = (r.vatUsn ?? 0.07) * 100;
  c.osnRatePercent = (r.vat ?? 0.22) * 100;
  c.profitTaxRatePercent = (r.profitTax ?? 0.25) * 100;

  // Payroll
  c.pfrRatePercent = (r.pfr ?? 0.30) * 100;
  c.fssRatePercent = (r.fss ?? 0.002) * 100;
  c.fomsRatePercent = 0; // Assuming included in PFR or 0 in new spec
  c.payrollTaxRatePercent = c.pfrRatePercent + c.fssRatePercent + c.fomsRatePercent;
  // END_BLOCK_MAP_RATES

  // START_BLOCK_MAP_CASHOUT: [Маппинг параметров кэшаута и дивидендов]
  // Dividend/cashout
  c.dividendFactor = r.envelope?.whitePart ?? 0.85;
  c.dividendTaxRatePercent = (r.dividends?.taxRate ?? 0.15) * 100;
  c.cashOutCommissionRate = r.envelope?.cashoutCommission ?? 0.15;

  // Cashout block from calcspec
  const cashout = cfg.cashout || {};
  c.cashoutDefaultFeeRate = cashout.defaultFeeRate ?? 0.28;
  c.cashoutWhiteToCashShare = cashout.whiteToCashShare ?? 0.78;
  c.cashoutCashShare = cashout.cashShare ?? 0.22;
  
  // Risk commission - not explicitly in calcspec, keeping logical default or inferring
  // Using 0.12 as a safe default for now, as it was in previous versions
  c.cashOutRiskCommissionRate = 0.12;
  // END_BLOCK_MAP_CASHOUT

  // START_BLOCK_MAP_DEFAULTS: [Маппинг дефолтных значений зарплаты и МРОТ]
  // Defaults
  const d = cfg.defaults || {};
  c.mrot = d.mrot ?? 27093;
  c.officialSalaryDefault = d.officialSalary ?? c.mrot;
  c.admRate = d.admRate ?? 0;
  // END_BLOCK_MAP_DEFAULTS

  // START_BLOCK_CALC_DERIVED: [Расчет производных коэффициентов]
  // Derived
  c.payrollNetFactor = 1 - (c.ndflRatePercent / 100);
  
  // UI Defaults (backward compatibility)
  c.themeDefault = 'light';
  c.vatModeDefault = 'outside';
  // END_BLOCK_CALC_DERIVED
};
// END_FUNCTION_loadConstants

// START_FUNCTION_fmtNum
// START_CONTRACT:
// PURPOSE: Форматирование числа в строку с 2 знаками после запятой (RU локаль).
// INPUTS:
// - val: [Number|String] - Число для форматирования.
// OUTPUTS:
// - [String] - Отформатированная строка (например, "1 234,56").
// END_CONTRACT
window.Rules.fmtNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};
// END_FUNCTION_fmtNum

// START_FUNCTION_fmtInt
// START_CONTRACT:
// PURPOSE: Форматирование числа в целое (RU локаль).
// INPUTS:
// - val: [Number|String] - Число для форматирования.
// OUTPUTS:
// - [String] - Отформатированная строка (например, "1 234").
// END_CONTRACT
window.Rules.fmtInt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val);
};
// END_FUNCTION_fmtInt
