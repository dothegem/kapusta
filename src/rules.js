// FILE: rules.js
// PURPOSE: Business logic constants and formatting utilities

window.Rules = window.Rules || {};

// Default constants (can be overridden by settings)
window.Rules.defaults = {
    mrot: 27093,
    ndflRate: 13,
    usnRate: 6,
    osnRate: 20, // VAT
    profitTaxRate: 20,
    dividendFactor: 0.87, // 100% - 13% tax
    
    // Payroll taxes (approximate for 2024/2025)
    pfrRate: 22,
    fssRate: 2.9,
    fomsRate: 5.1,
    
    // Risk coefficients
    cashOutRisk: 12, // %
    cashOutCommission: 15 // %
};

window.Rules.constants = { ...window.Rules.defaults };

window.Rules.loadConstants = async () => {
    const s = await chrome.storage.local.get([
        'var_mrot', 'var_ndfl', 'var_usn', 'var_osn', 'var_profit_tax', 'var_dividend'
    ]);
    
    window.Rules.constants.mrot = parseFloat(s.var_mrot) || window.Rules.defaults.mrot;
    window.Rules.constants.ndflRatePercent = parseFloat(s.var_ndfl) || window.Rules.defaults.ndflRate;
    window.Rules.constants.usnRatePercent = parseFloat(s.var_usn) || window.Rules.defaults.usnRate;
    window.Rules.constants.osnRatePercent = parseFloat(s.var_osn) || window.Rules.defaults.osnRate;
    window.Rules.constants.profitTaxRatePercent = parseFloat(s.var_profit_tax) || window.Rules.defaults.profitTaxRate;
    window.Rules.constants.dividendFactor = parseFloat(s.var_dividend) || window.Rules.defaults.dividendFactor;
    
    // Derived or fixed constants for calculation logic
    // These align with the "specs" in calculator.js
    const c = window.Rules.constants;
    c.osnLowRatePercent = 7; // Specifically for "VAT Extraction" logic in schemes
    c.dividendTaxRatePercent = 13; // Usually fixed
    
    // Payroll tax total
    c.pfrRatePercent = window.Rules.defaults.pfrRate;
    c.fssRatePercent = window.Rules.defaults.fssRate;
    c.fomsRatePercent = window.Rules.defaults.fomsRate;
    c.payrollTaxRatePercent = c.pfrRatePercent + c.fssRatePercent + c.fomsRatePercent;
    
    // Factor to convert Net Salary to Gross Official
    // Formula: Net = Gross - (Gross * NDFL)  => Net = Gross * (1 - NDFL) => Gross = Net / (1 - NDFL)
    c.payrollNetFactor = 1 - (c.ndflRatePercent / 100); 

    // Scheme specific
    c.officialSalaryDefault = c.mrot; // Minimum official salary
    c.cashOutRiskCommissionRate = window.Rules.defaults.cashOutRisk / 100;
    c.cashOutCommissionRate = window.Rules.defaults.cashOutCommission / 100;
    
    // Administrative overhead (from original logic, seemingly 0 or accounted elsewhere, 
    // but calculator.js uses c.admRate if present. Let's set a default or 0)
    c.admRate = 0; 
};

window.Rules.fmtNum = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

window.Rules.fmtInt = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0
    }).format(val);
};

// Initialize on load
// window.Rules.loadConstants(); // Called by App.init
