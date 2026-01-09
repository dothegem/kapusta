// FILE: src/data.js
// VERSION: 2.3.0
// START_MODULE_CONTRACT:
// PURPOSE: Хранение статических справочных данных и дефолтных прайс-листов.
// SCOPE: Справочники, Начальные данные.
// INPUT: Нет.
// OUTPUT: window.Data (объект с массивами regions, uniforms, priceList, etc.).
// KEYWORDS: [DOMAIN(9): ReferenceData; TECH(8): StaticAssets; CONCEPT(7): Defaults]
// LINKS: [USED_BY(9): Calculator; DEFINED_BY(8): src/calcspec.json]
// LINKS_TO_SPECIFICATION: [docs/09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md]
// END_MODULE_CONTRACT
// START_MODULE_MAP:
// OBJECT 10 [Список регионов] => regions
// OBJECT 9 [Список вариантов формы] => uniforms
// OBJECT 8 [Варианты НДС для UI] => vatTypes
// OBJECT 8 [Единицы измерения] => units
// OBJECT 9 [Дефолтный прайс-лист охраны] => defaultPriceList
// OBJECT 9 [Дефолтный прайс-лист доп. расходов] => defaultExtraPriceList
// END_MODULE_MAP
// START_USE_CASES:
// - [defaultPriceList]: Calculator (Init) -> LoadDefaults -> PrepopulateTable
// - [regions]: UI (Dropdown) -> ShowOptions -> UserSelectsRegion
// END_USE_CASES

window.Data = window.Data || {};

// START_BLOCK_REGIONS: [Справочник регионов]
window.Data.regions = [
  { id: 'moscow', name: 'Москва', coefficient: 1.0 },
  { id: 'mo', name: 'Московская область', coefficient: 1.0 },
  { id: 'spb', name: 'Санкт-Петербург', coefficient: 1.0 },
  { id: 'leningrad', name: 'Ленинградская область', coefficient: 1.0 }
];
// END_BLOCK_REGIONS

// START_BLOCK_UNIFORMS: [Справочник униформы]
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
// END_BLOCK_UNIFORMS

// START_BLOCK_UI_OPTIONS: [Опции для выпадающих списков UI]
// Values aligned with UI labels (lowercase)
window.Data.vatTypes = [
  { id: 'ндс', name: 'ндс' },
  { id: 'без ндс', name: 'без ндс' },
  { id: 'нал', name: 'нал' }
];

window.Data.units = [
  { id: 'шт', name: 'шт' },
  { id: 'мес', name: 'мес' },
  { id: 'день', name: 'день' },
  { id: 'час', name: 'час' }
];
// END_BLOCK_UI_OPTIONS

// START_BLOCK_DEFAULT_PRICES: [Дефолтные прайс-листы]
// Default Guard price list
// Структура соответствует guardPrice из calcspec.json
window.Data.defaultPriceList = [
  { id: 1, name: 'МСК, 12/7', region: 'Москва', weapon: false, shiftHours: 12, hoursMonth: 365, rateHour: 760, shiftRate: 5500 },
  { id: 2, name: 'МСК, 24/7', region: 'Москва', weapon: false, shiftHours: 24, hoursMonth: 730, rateHour: 534.25, shiftRate: 7500 },
  { id: 3, name: 'СПб, 12/7', region: 'СПб', weapon: false, shiftHours: 12, hoursMonth: 365, rateHour: 602.74, shiftRate: 4000 },
  { id: 4, name: 'СПб, 24/7', region: 'СПб', weapon: false, shiftHours: 24, hoursMonth: 730, rateHour: 383.56, shiftRate: 5000 }
];

// Default Extras price list (normalized)
// Структура соответствует expensePrice из calcspec.json
window.Data.defaultExtraPriceList = [
  { id: 1, name: 'Связь', price: 500, unit: 'мес', vatType: 'ндс', periodicity: 'monthly' },
  { id: 2, name: 'Хостел', price: 700, unit: 'день', vatType: 'без ндс', periodicity: 'monthly' },
  { id: 3, name: 'АнтиБПЛА', price: 200000, unit: 'шт', vatType: 'без ндс', periodicity: 'once' }
];
// END_BLOCK_DEFAULT_PRICES
