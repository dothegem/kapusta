// FILE: data.js
// PURPOSE: Static data definitions for regions, uniforms, and validation rules

window.Data = window.Data || {};

window.Data.regions = [
    { id: 'moscow', name: 'Москва', coefficient: 1.0 },
    { id: 'mo', name: 'Московская область', coefficient: 1.0 },
    { id: 'spb', name: 'Санкт-Петербург', coefficient: 1.0 },
    { id: 'leningrad', name: 'Ленинградская область', coefficient: 1.0 }
    // Add more regions as needed
];

window.Data.uniforms = [
    { id: 1, name: 'Костюм охранника "Классика"', price: 3500, amortizationMonths: 12 },
    { id: 2, name: 'Костюм охранника "Спецназ"', price: 4200, amortizationMonths: 12 },
    { id: 3, name: 'Рубашка охранника (голубая/белая)', price: 950, amortizationMonths: 6 },
    { id: 4, name: 'Брюки классические', price: 1200, amortizationMonths: 12 },
    { id: 5, name: 'Галстук форменный', price: 350, amortizationMonths: 12 },
    { id: 6, name: 'Ботинки с высоким берцем', price: 2800, amortizationMonths: 12 },
    { id: 7, name: 'Туфли классические', price: 2500, amortizationMonths: 12 },
    { id: 8, name: 'Куртка утепленная "Охрана"', price: 4500, amortizationMonths: 24 },
    { id: 9, name: 'Шапка вязаная/кепка', price: 450, amortizationMonths: 12 },
    { id: 10, name: 'Футболка "Охрана"', price: 550, amortizationMonths: 6 },
    { id: 11, name: 'Ремень поясной', price: 400, amortizationMonths: 24 },
    { id: 12, name: 'Шевроны и нашивки (комплект)', price: 300, amortizationMonths: 12 }
];

window.Data.vatTypes = [
    { id: 'nds', name: 'НДС (20%)' },
    { id: 'no_nds', name: 'Без НДС' }
];

window.Data.units = [
    { id: 'pc', name: 'шт' },
    { id: 'month', name: 'мес' },
    { id: 'day', name: 'день' },
    { id: 'hour', name: 'час' }
];

window.Data.defaultPriceList = [
    { id: 1, name: 'Охранник 4 разряд (сутки)', region: 'Москва', weapon: false, shift: '1/3', hoursMonth: 720, rateHour: 240 },
    { id: 2, name: 'Охранник 6 разряд (сутки)', region: 'Москва', weapon: true, shift: '1/3', hoursMonth: 720, rateHour: 280 },
    { id: 3, name: 'Охранник 4 разряд (день)', region: 'Москва', weapon: false, shift: '5/2', hoursMonth: 176, rateHour: 260 },
    { id: 4, name: 'Старший смены', region: 'Москва', weapon: false, shift: '1/1', hoursMonth: 360, rateHour: 300 }
];

window.Data.defaultExtraPriceList = [
    { id: 1, name: 'Расходные материалы', amount: 5000, type: 'monthly' },
    { id: 2, name: 'ГСМ', amount: 10000, type: 'monthly' },
    { id: 3, name: 'Связь', amount: 1000, type: 'monthly' }
];
