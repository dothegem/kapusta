// FILE: rules.js
// PURPOSE: Unified business rules and formatting

window.Rules = window.Rules || {};

window.Rules.fmtNum = (num) => {
    if (typeof num !== 'number') return '0';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

window.Rules.fmtFloat = (num) => {
    if (typeof num !== 'number') return '0.00';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

window.Rules.constants = {
    mrot: 27093,
    ndflRatePercent: 13,
    usnRatePercent: 6,
    osnRatePercent: 22,
    profitTaxRatePercent: 25,
    dividendFactor: 0.85,
    averageMonthDays: 29.3,
    vacationDaysPerYear: 28,
    vacationMonthsInYear: 12,
    payrollNetFactor: 0.87,
    cashOutFactor: 0.85,
    admRate: 0.02,
    officialSalaryDefault: 45000,
    nooCost: 3000
};

window.Rules.loadConstants = async () => {
    const stored = await chrome.storage.local.get([
        'var_mrot', 'var_ndfl', 'var_usn', 'var_osn', 
        'var_profit_tax', 'var_dividend'
    ]);
    
    if (stored.var_mrot) window.Rules.constants.mrot = parseFloat(stored.var_mrot);
    if (stored.var_ndfl) window.Rules.constants.ndflRatePercent = parseFloat(stored.var_ndfl);
    if (stored.var_usn) window.Rules.constants.usnRatePercent = parseFloat(stored.var_usn);
    if (stored.var_osn) window.Rules.constants.osnRatePercent = parseFloat(stored.var_osn);
    if (stored.var_profit_tax) window.Rules.constants.profitTaxRatePercent = parseFloat(stored.var_profit_tax);
    if (stored.var_dividend) window.Rules.constants.dividendFactor = parseFloat(stored.var_dividend);
};
