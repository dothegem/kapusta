<!--
# FILE: docs/08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Техническая спецификация реализации SchemeSet и архитектуры JS-калькулятора.
# SCOPE: Интерфейсы схем, структура выходных данных, связь с JSON-конфигурацией.
# INPUT: State, Calcspec.
# OUTPUT: Унифицированный результат расчета (Calculation) для любой схемы.
# KEYWORDS_MODULE: [DOMAIN(10): Calculations; PATTERN(9): Strategy; CONCEPT(9): SchemeSet; TECH(8): JS_Implementation]
# LINKS_TO_MODULE: [docs/06_CALC_SCHEMES_GREY_WHITE_USN.md, docs/07_CALC_SCHEMES_IP_VAT.md, docs/09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# CONCEPT 10 [Набор схем (Strategy Pattern)] => SchemeSet
# INTERFACE 10 [Поля результата схемы] => SchemeOutputFields
# FUNC 9 [Функции расчета схем] => calculateSchemeFunctions
# END_MODULE_MAP
# START_USE_CASES:
# - [SelectScheme]: User (UI) -> SelectSchemeCode -> DisplayResult
# - [CompareSchemes]: User (UI) -> RunAllSchemes -> ComparisonTable
# END_USE_CASES
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Определяет единый API для всех математических моделей.
# END_CHANGE_SUMMARY
-->
# 08_CALC_SCHEMES_IMPL_AND_SCHEMASET

## 0. SchemeSet и схема расчёта

SchemeSet — это описание набора схем (BELUSN, SERUSN, BELNDS, SERNDS, IPNDS и др.) и того, как для каждой из них считать итоговые показатели на основе `state` и calcspec. [file:5][file:8]  
SchemeSet лежит на стыке Excel‑мастера, calcspec.json и JS‑кода калькулятора. [file:8][file:2]  

## 1. Перечень схем

### 1.1. Основные схемы

В текущей версии используются как минимум: [file:8][file:5]  

- `BELUSN` — белая зарплата, УСН, без НДС.  
- `SERUSN` — серая схема, УСН.  
- `BELNDS` — белая схема с НДС (аналог белой VAT‑схемы).  
- `SERNDS` — серая схема с НДС.  
- `IPNDS` — схема через ИП с НДС.  

Каждая схема определяет, какие налоги и коэффициенты применять, как считать cashout и какую комбинацию выплат использовать. [file:8][file:3][file:4][file:7]  

### 1.2. Поля схемы

Для каждой схемы в SchemeSet описаны, как минимум, следующие выходные показатели: [file:8][file:5]  

- `schemaCode` — код схемы (BELUSN, SERUSN, …).  
- `margin` — итоговая маржа (в долях от выручки, например 0.323).  
- `profitCash` — прибыль «в кэше» после комиссий (например, 174 044).  
- `profitCashless` — прибыль безналом.  
- `vat` — нагрузка по НДС (или суммарный НДС‑эффект).  
- `avgRate` — средняя ставка охранников.  
- `fot` — фонд оплаты труда (gross‑зарплата плюс налоги ФОТ).  
- `taxes` — совокупные налоги бизнеса (УСН, налог на прибыль и т.п.).  
- `envelope` — «конверт», то есть серая/наличная часть выплат.  
- `otherExpenses` — прочие расходы (админ, подключения, прочее).  
- `total` — итоговые расходы/цена.  

Эти поля должны совпадать с колонками в мастер‑Excel и выводиться в UI/отчётах. [file:8][file:3][file:4]  

## 2. Реализация схем в JS

### 2.1. Общая структура

JS‑калькулятор реализует SchemeSet как набор чистых функций, которые принимают `state` и `calcspec` и возвращают объект с полями схемы. [file:8][file:2]  

Условно:  

```js
function calculateSchemeBELUSN(state, calcspec) { /* ... */ }
function calculateSchemeSERUSN(state, calcspec) { /* ... */ }
function calculateSchemeBELNDS(state, calcspec) { /* ... */ }
function calculateSchemeSERNDS(state, calcspec) { /* ... */ }
function calculateSchemeIPNDS(state, calcspec) { /* ... */ }
```

Эти функции строго повторяют соответствующие Excel‑таблицы (см. `01_SHEET_DANO_WHITE_USN.md`, `02_SHEET_GREY_SCHEMES.md`, `03_SHEET_IP_VAT_WHITE_VAT.md`) и используют константы из `config` и ставки/коэффициенты из calcspec. [file:4][file:3][file:7][file:1][file:2][file:8]

### 2.2. Связь с calcspec.json

В calcspec для каждой схемы могут быть указаны: [file:8]

- какие поля считать обязательными (например, нужны ли NOI/NOO, как трактовать vacation);
- какие коэффициенты cashout/комиссий применять;
- какие налоги включать/исключать (УСН, налог на прибыль, НДС).

JS‑код не знает «жёстко» все коэффициенты; вместо этого он читает их из calcspec и Excel‑производных значений, чтобы легко поддерживать обновления через конфигурацию. [file:8][file:2][file:5]

## 3. Использование SchemeSet калькулятором и CRM

### 3.1. Выбор схемы в UI

UI может показывать пользователю несколько схем одновременно или давать переключатель между ними (например, вкладки BELUSN/SERUSN/BELNDS/SERNDS/IPNDS). [file:8]
Выбранная схема сохраняется в Calculation как `schemaCode` и используется для синхронизации с CRM и отображения итогов. [file:8]

### 3.2. Связь с CalculationGroup и Deal

CalculationGroup может содержать несколько Calculation, каждый из которых соответствует разной схеме/набору параметров. [file:8]
Deal может ссылаться либо на один «основной» Calculation, либо на несколько, если клиенту отправляется несколько вариантов. [file:8]

Технические детали структуры calcspec.json и словаря полей см. в `09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md`. [file:8]