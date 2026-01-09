<!--
# FILE: docs/09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Документация структуры calcspec.json (Data Dictionary) для конфигурации калькулятора.
# SCOPE: Схемы данных, ключи конфигурации, валидация полей.
# INPUT: calcspec.json.
# OUTPUT: Спецификация для парсинга и использования конфигурации.
# KEYWORDS_MODULE: [DOMAIN(10): Configuration; FORMAT(9): JSON; CONCEPT(9): DataDictionary; TECH(8): Validation]
# LINKS_TO_MODULE: [docs/08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md, docs/10_TECH_ARCHITECTURE_EXTENSION.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# OBJECT 10 [Блок констант] => Constants_Block
# OBJECT 10 [Блок ставок (налоги/финансы)] => Rates_Block
# OBJECT 9 [Блок Cashout] => Cashout_Block
# OBJECT 10 [Определение схем] => Schemes_Block
# OBJECT 9 [Определение полей (Guard/Expense)] => PriceFields_Block
# END_MODULE_MAP
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Определяет структуру мета-конфигурации системы.
# END_CHANGE_SUMMARY
-->
# 09_CALCSPEC_JSON_AND_DATA_DICTIONARY

## 0. Общая структура calcspec.json

Вместо YAML используется JSON‑структура `calcspec.json`, которую подхватывает `rules.js` и калькулятор. [file:8][file:2]  
calcspec описывает: константы, налоговые ставки, cashout‑коэффициенты, схемы и наборы полей для GuardPriceItem/ExpensePriceItem. [file:8]  

Упрощённый каркас:  

```json
{
  "version": "1.0.0",
  "constants": { ... },
  "rates": { ... },
  "cashout": { ... },
  "schemes": { ... },
  "guardPrice": { ... },
  "expensePrice": { ... }
}
```

`version` синхронизируется с `configVersion`/`calcspecVersion` в JS и CRM. [file:8]

## 1. Блок constants

### 1.1. Поля constants

Пример: [file:8][file:1][file:2]

```json
"constants": {
  "daysInMonth": 30.5,
  "avgDaysInMonth": 30.5,
  "vacationDaysPerYear": 20,
  "monthsInYear": 12
}
```

- `daysInMonth` — количество дней для расчёта сменности (может совпадать с `INDAYSINMONTH`). [file:8][file:1]
- `avgDaysInMonth` — усреднённое значение для переходов «год ↔ месяц». [file:8]
- `vacationDaysPerYear` — используется при планировании отпускного резерва. [file:8]
- `monthsInYear = 12` — базовое значение для годовых пересчётов. [file:8]


## 2. Блок rates

### 2.1. Налоговые и финансовые ставки

```json
"rates": {
  "vat": 0.22,
  "vatUsn": 0.07,
  "usn": 0.06,
  "ndfl": 0.13,
  "pfr": 0.30,
  "fss": 0.002,
  "profitTax": 0.20,
  "envelope": {
    "whitePart": 0.85,
    "cashoutCommission": 0.15
  },
  "dividends": {
    "taxRate": 0.15
  }
}
```

- `vat` — ставка НДС на ОСН (22 %). [file:1][file:2][file:3]
- `vatUsn` — ставка НДС, применяемая в УСН‑сценариях (7 %). [file:1][file:2]
- `usn` — ставка УСН (6 %). [file:1][file:2][file:3]
- `ndfl`, `pfr`, `fss`, `profitTax` — НДФЛ, ФОТ‑налоги и налог на прибыль, как в глобальной конфигурации. [file:1][file:2][file:4]
- `envelope.whitePart` и `envelope.cashoutCommission` описывают стандартную разбивку прибыли (78/22 или 85/15 в разных местах Excel, детальное значение задаётся по факту). [file:8][file:3]
- `dividends.taxRate` — 15 % для дивидендов. [file:3]

Дополнительно могут быть поля `insideDivider` для разных НДС‑режимов (1.07, 1.22 и т.п.). [file:8][file:2]

## 3. Блок cashout

### 3.1. Описание кэш‑аут логики

```json
"cashout": {
  "defaultFeeRate": 0.28,
  "whiteToCashShare": 0.78,
  "cashShare": 0.22
}
```

- `defaultFeeRate` — типичная ставка комиссии на вывод наличных (28 % во второй серой VAT‑схеме). [file:3][file:8]
- `whiteToCashShare`, `cashShare` — доли белой и наличной компоненты прибыли (например, 78/22). [file:8]

Конкретные значения должны совпадать с мастер‑Excel и использоваться в схемах через ссылки из блока `schemes`. [file:8][file:3]

## 4. Блок schemes

### 4.1. Структура схем

```json
"schemes": {
  "BELUSN": {
    "vatMode": "outside",
    "usnRateKey": "usn",
    "vatRateKey": "vatUsn",
    "usesGrossUp": true
  },
  "SERUSN": {
    "vatMode": "outside",
    "usnRateKey": "usn",
    "vatRateKey": "vatUsn",
    "usesGrossUp": true,
    "usesGreySalary": true
  },
  "BELNDS": {
    "vatMode": "inside",
    "vatRateKey": "vat",
    "usesGrossUp": true
  },
  "SERNDS": {
    "vatMode": "inside",
    "vatRateKey": "vat",
    "usesGrossUp": true,
    "usesGreySalary": true
  },
  "IPNDS": {
    "vatMode": "inside",
    "vatRateKey": "vat",
    "usesIpFlow": true
  }
}
```

- `vatMode` — внутри/снаружи (`inside`/`outside`), соответствует UI‑переключателю. [file:2][file:6][file:8]
- `usnRateKey`, `vatRateKey` — ссылки на значения в блоке `rates`. [file:8]
- `usesGrossUp` — нужно ли применять gross up для расчёта зарплаты в рамках схемы (белые/серые). [file:1][file:4][file:3]
- `usesGreySalary` — флаг, что схема использует фиксированную официальную зарплату и дивиденды (как в `calculateGreySalary`). [file:3][file:6]
- `usesIpFlow` — флаг, что схема работает через ИП (см. `07_CALC_SCHEMES_IP_VAT.md`). [file:7]


## 5. GuardPrice и ExpensePrice

### 5.1. GuardPrice

calcspec описывает, какие поля есть у GuardPriceItem и как они должны выглядеть: [file:8]

```json
"guardPrice": {
  "fields": [
    { "id": "title", "type": "text" },
    { "id": "description", "type": "text" },
    { "id": "hoursPerDay", "type": "number" },
    { "id": "hoursPerMonth", "type": "number" },
    { "id": "months", "type": "number" },
    { "id": "posts", "type": "number" },
    { "id": "customerHourlyRate", "type": "number" },
    { "id": "ourShiftRate", "type": "number" },
    { "id": "address", "type": "text" },
    { "id": "uniformType", "type": "enum", "options": ["summer", "winter", "mixed"] },
    { "id": "totalPerMonth", "type": "number" },
    { "id": "total", "type": "number" }
  ]
}
```

Типы и набор полей должны совпадать с описанием в context‑kimi (раздел 13.x) и листах Excel. [file:8]

### 5.2. ExpensePrice

Аналогично для ExpensePriceItem: [file:8]

```json
"expensePrice": {
  "fields": [
    { "id": "title", "type": "text" },
    { "id": "unit", "type": "enum", "options": ["unit", "month", "year", "percent"] },
    { "id": "vatType", "type": "enum", "options": ["none", "vatUsn", "vatOsn"] },
    { "id": "periodicity", "type": "enum", "options": ["once", "monthly"] },
    { "id": "price", "type": "number" },
    { "id": "qty", "type": "number" },
    { "id": "total", "type": "number" },
    { "id": "priceItemId", "type": "text" }
  ]
}
```

Эти определения используются `data.js` и UI для валидации и построения форм ввода, а также для генерации строк GuardCalcLine/ExpenseCalcLine. [file:8]

## 6. Связь calcspec.json с JS и CRM

### 6.1. Версионирование

`calcspec.version` и соответствующий `configVersion` должны сохраняться в Calculation и в CRM, чтобы всегда можно было восстановить точный набор коэффициентов, по которым был сделан расчёт. [file:8]
При обновлении calcspec создаётся новая версия; старые расчёты не пересчитываются автоматически, чтобы не ломать историю. [file:8]

### 6.2. Хранение и загрузка

calcspec.json поставляется вместе с расширением (или загружается по API) и кэшируется в `chrome.storage.local`. [file:8]
`rules.js` использует calcspec как единственный источник правды по схемам, ставкам и структуре Guard/Expense‑полей. [file:8]