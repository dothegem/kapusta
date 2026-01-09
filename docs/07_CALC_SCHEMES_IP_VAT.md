<!--
# FILE: docs/07_CALC_SCHEMES_IP_VAT.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Описание схем работы через ИП с НДС (IP VAT) и распределения налоговой нагрузки.
# SCOPE: Математические модели, оптимизация через ИП, расчет НДС и Cashout.
# INPUT: Объект состояния (State).
# OUTPUT: Финансовые показатели для схем IPNDS.
# KEYWORDS_MODULE: [DOMAIN(10): Calculations; SCHEME(9): IP_VAT; TAX(9): VAT; CONCEPT(8): Optimization]
# LINKS_TO_MODULE: [docs/06_CALC_SCHEMES_GREY_WHITE_USN.md, docs/08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# SCHEME 10 [Схема ИП с НДС] => IP_VAT_Scheme
# LOGIC 9 [Распределение расходов (ИП/ООО)] => ExpenseDistribution
# CONST 8 [Коэффициенты Cashout для ИП] => IP_Cashout_Rates
# END_MODULE_MAP
# START_USE_CASES:
# - [CalcIP]: User (Inputs) -> CalcScheme(IPNDS) -> OptimizedTaxes
# END_USE_CASES
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Сложная логика разделения баз между юрлицами.
# END_CHANGE_SUMMARY
-->
# 07_CALC_SCHEMES_IP_VAT

## 0. Обзор IP + НДС

Лист `03_SHEET_IP_VAT_WHITE_VAT.md` описывает схемы работы через ИП с НДС, где часть нагрузки переносится на расчёты ИП, а ООО получает другую комбинацию налогов и cashout. [file:7][file:2]  
Эти схемы дополняют белые/серые УСН‑схемы и формируют набор IP‑вариантов (например, `IPNDS`), используемых в calcspec. [file:8][file:7]  

## 1. Структура расчёта IP+VAT

### 1.1. Основные элементы

Хотя конкретные цифры отличаются от USN‑схем, общая логика похожа: [file:7][file:2]  

- Выручка и НДС:  
  - `INREV_IP` — выручка, принимаемая в ИП‑схеме.  
  - `TAXVATOUT_IP` и `TOTALREVINCVAT_IP` — цена с НДС.  

- Расходы ИП:  
  - Официальная/белая часть вознаграждения ИП.  
  - Налоги, применимые к ИП (УСН/НПД/НПФ и др. — в рамках текущего Excel‑варианта).  

- Расходы ООО:  
  - Закупка услуг у ИП, перенос части расходов.  
  - Остальные административные расходы, налоги, cashout.  

### 1.2. Связка с BEL*/SER* схемами

В calcspec схема `IPNDS` имеет те же ключевые показатели (margin, profitCash, vat, fot и др.), что и BELUSN/SERUSN/BELNDS/SERNDS, но использует другой набор баз и ставок. [file:8]  
Калькулятор должен относиться к `IPNDS` как к ещё одной схеме в SchemeSet, не меняя общий API, только внутреннюю формулу. [file:8][file:2]  

## 2. НДС и cashout в IP‑сценариях

### 2.1. VAT inside/outside для IP

IP‑схемы учитывают как НДС на стороне ИП, так и на стороне ООО; используются те же принципы `VATMODEOUTSIDE` и `VATMODEINSIDE`, что и для других схем. [file:2][file:7][file:8]  
Значения делителей (1.07, 1.22) и ставки НДС берутся из общих констант calcspec/config, чтобы формулы были единообразными. [file:8][file:1][file:2]  

### 2.2. Cashout и комиссии

IP‑схемы содержат свои коэффициенты cashout и комиссии (по аналогии с 28 % во второй серой схеме), которые закодированы в calcspec и Excel‑листах. [file:3][file:7][file:8]  
Эти коэффициенты не меняются программно; калькулятор только применяет их согласно описанию в SchemeSet и calcspec. [file:5][file:8]  

Полная детализация формул и распределения налогов ИП → ООО берётся из `03_SHEET_IP_VAT_WHITE_VAT.md` и соответствующих полей `IPNDS` в SchemeSet (см. `08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md`). [file:7][file:5][file:8]  