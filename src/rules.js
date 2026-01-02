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
    // Basic Payroll Constants
    averageMonthDays: 30.5,
    averageWorkDays: 29.3, // Used for vacation calculation
    vacationDaysPerYear: 28,
    vacationMonthsInYear: 12,

    // Tax Rates (Defaults, can be overridden by settings)
    ndflRatePercent: 13,
    pfrRatePercent: 30, // Pension Fund
    fssRatePercent: 0.2, // Social Insurance

    // Scheme Specific Rates
    usnRatePercent: 6, // Simplified Tax System (Income)
    osnRatePercent: 22, // VAT (Standard)
    osnLowRatePercent: 7, // VAT (Reduced/Special)
    profitTaxRatePercent: 25, // New 2025 rate
    dividendTaxRatePercent: 15,

    // Calculation Factors
    payrollNetFactor: 0.87, // 1 - 0.13 (NDFL)
    dividendFactor: 0.85, // 1 - 0.15 (Div Tax)

    // Cash Out Commissions (from full_calc_logic)
    cashOutCommissionRate: 0.1765, // ~17.6% (Derived from 1/0.85 * 0.15)
    cashOutRiskCommissionRate: 0.282, // ~28.2% (Aggressive schemes)

    // Business Logic Defaults
    admRate: 0.02, // Administrative expenses %
    officialSalaryDefault: 45000, // Minimal official salary for Grey schemes
    nooCost: 3000, // Cost for NOO/Accountant per unit

    // Fixed Costs (can be loaded dynamically)
    bankCommissionFixed: 0,
    ndsInputFixed: 0
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

    // Recalculate derived factors if needed
    window.Rules.constants.payrollNetFactor = 1 - (window.Rules.constants.ndflRatePercent / 100);
};
