<!--
# FILE: docs/06_CALC_SCHEMES_GREY_WHITE_USN.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Описание логики расчета схем УСН (белой и серой), а также базового расчета Gross Up.
# SCOPE: Математические формулы, налоговая оптимизация, расчет зарплат.
# INPUT: Объект состояния (State).
# OUTPUT: Финансовые показатели для схем BELUSN, SERUSN и вариаций.
# KEYWORDS_MODULE: [DOMAIN(10): Calculations; SCHEME(9): USN; SCHEME(9): GreyScheme; CONCEPT(8): GrossUp]
# LINKS_TO_MODULE: [docs/05_CALC_INPUTS_CONSTANTS_AND_STATE.md, docs/08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# LOGIC 10 [Базовый расчет зарплаты (Gross Up)] => BaseCalculation
# SCHEME 10 [Белая схема УСН] => WhiteUSN
# SCHEME 10 [Серая схема УСН] => GreyUSN
# FUNC 8 [Расчет серой зарплаты] => calculateGreySalary
# SCHEME 9 [Серая схема с НДС (поздний)] => GreyVAT
# END_MODULE_MAP
# START_USE_CASES:
# - [CalcWhite]: User (Inputs) -> CalcScheme(BELUSN) -> FullTaxesPaid
# - [CalcGrey]: User (Inputs) -> CalcScheme(SERUSN) -> SplitPayment(Official+Cash)
# END_USE_CASES
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Описывает чувствительные схемы оптимизации.
# END_CHANGE_SUMMARY
-->
# 06_CALC_SCHEMES_GREY_WHITE_USN

## 0. Обзор листов и схем

Этот файл описывает схемы из листов `01_SHEET_DANO_WHITE_USN.md` и `02_SHEET_GREY_SCHEMES.md` при УСН (6 % + НДС 7 %), без НДС‑режимов IP. [file:4][file:3]  
Схемы опираются на логики: base net → gross up → налоги на ФОТ → УСН/НДС → cashout и маржа. [file:4][file:3]  

## 1. Base Calculation и White USN

### 1.1. Base Calculation (Gross Up Net)

Base Calculation показывает, как из нетто‑цели по зарплате вывести нужный gross с учётом НДФЛ и отпусков. [file:4][file:1][file:2]  

Ключевые элементы:  
- `INREV` / `INREV HEAD` — выручка от клиента по базовому сценарию (например, 474 500). [file:4]  
- `INRATE` / `INDAILYRATE` — дневная ставка (247 или 4 500, в примерах) и `INDAYSINMONTH = 30.5`. [file:4][file:1]  
- `INHC` — headcount (1 пост в примерах). [file:4][file:2]  
- `SALARYNET` — целевая нетто‑зарплата за период, `137 250` в примере. [file:4]  
- `VACNET` — отпускной резерв `= SALARYNET * 0.08 = 10 930`. [file:4][file:1]  
- `NOOCOST` — NOO‑затраты (например, 3 000). [file:4][file:1]  
- `VACNOONET` — отпуск на NOO `= NOOCOST * 0.08 ≈ 239`. [file:4][file:1]  

Gross up для белой зарплаты: [file:4][file:1]  

\[
\text{SALGROSSWHITE} = \frac{\text{SALARYNET} + \text{VACNET} + \text{NOOCOST} + \text{VACNOONET}}{1 - \text{TAXNDFL}}
\]

Далее считаются налоги ФОТ: [file:4]  

- `TAXNDFL = SALGROSSWHITE * 0.13`  
- `TAXPFR = SALGROSSWHITE * 0.30`  
- `TAXFSS = SALGROSSWHITE * 0.002`  
- `SUMTAXFOT = TAXNDFL + TAXPFR + TAXFSS`  

### 1.2. Белая УСН‑схема (White USN Scheme)

White USN Scheme использует Base Calculation, но делает ряд допущений (например, NOO = 0, чтобы получить чистую белую схему). [file:4]  

Ключевые Excel/JS‑поля: [file:4]  

- `INREVW` — выручка.  
- `EXPCONNW`, `EXPADMINW` — расходы на подключение и админ‑процент.  
- `SALNETW`, `VACNETW`, `NOOCOSTW`, `VACNOOW`, `SUMNETW` — нетто‑зарплата + отпускной резерв.  
- `SALGROSSW` — gross up по аналогичной формуле, но с SUMNETW.  
- Налоги ФОТ: `TAXNDFLW`, `TAXPFRW`, `TAXFSSW`, `SUMTAXFOTW`.  
- Налоги бизнеса:  
  - `TAXVATW = INREVW * TAXVATUSN` (7 %).  
  - `TAXUSNW = (INREVW - TAXVATW) * TAXUSNRATE` (6 % от базы без НДС).  

Итоги: [file:4]  

- `WITHDRAWSALW = SUMNETW` — сколько денег выводится как официальная белая зарплата.  
- `TOTALEXPW` — сумма всех расходов (подключение, админ, gross‑зарплата, налоги ФОТ, VAT, УСН, вывод зарплаты).  
- `PROFITBANKW = INREVW - TOTALEXPW`.  
- `PROFITCASHW = PROFITBANKW * 0.85` (предполагается 15 % кэшаут‑комиссия).  
- `MARGINW = PROFITCASHW / INREVW`.  

## 2. Grey USN Scheme

### 2.1. Концепция серой схемы

Grey USN Scheme разделяет выплаты на: [file:3]  

- официальную белую часть (`OFFICIALSALARYGRAY = 45 000` брутто, дающую `NETOFFICIAL ≈ 39 150`), [file:3][file:6]  
- дивиденды/серую часть, чтобы достичь целевой нетто‑суммы (`SUMNETGUSN`). [file:3]  

### 2.2. Основные поля

Из `02_SHEET_GREY_SCHEMES.md`: [file:3]  

- `INREVGUSN` — выручка УСН‑серой схемы.  
- `EXPCONNGUSN`, `EXPADMINGUSN` — подключения и админ.  
- `SALNETGUSN`, `VACNETGUSN`, `NOOCOSTGUSN`, `SUMNETGUSN` — целевая нетто‑нагрузка (как в белой схеме).  
- `SALGROSSGUSN` — фиксированный официальный gross (45 000).  
- `NETOFFICIALGUSN = SALGROSSGUSN * (1 - TAXNDFL) ≈ 39 150`.  
- Налоги ФОТ: `TAXNDFLGUSN`, `TAXPFRGUSN`, `TAXFSSGUSN`, `SUMTAXFOTGUSN`.  
- Налоги бизнеса: `TAXVATGUSN`, `TAXUSNGUSN` по тем же формулам, что в белой схеме, но от `INREVGUSN`.  

Серая часть: [file:3]  

- `WITHDRAWSALGUSN = NETOFFICIALGUSN`.  
- `DIVNETGUSN = SUMNETGUSN - WITHDRAWSALGUSN` — сколько нужно добрать дивидендами/серой схемой.  
- `TAXDIVGUSN = DIVNETGUSN * 0.15 / 0.85` (пересчёт с 15 % налога на дивиденды).  

Итоги: [file:3]  

- `TOTALEXPGUSN` — сумма всех расходов (EXPCONN, EXPADMIN, SALGROSS, SUMTAXFOT, TAXVATGUSN, TAXUSNGUSN, WITHDRAWSALGUSN, DIVNETGUSN, TAXDIVGUSN).  
- `PROFITBANKGUSN = INREVGUSN - TOTALEXPGUSN`.  
- `PROFITCASHGUSN = PROFITBANKGUSN * 0.85`.  
- `MARGINGUSN = PROFITCASHGUSN / INREVGUSN`.  

### 2.3. JS helper: calculateGreySalary

В листе описана вспомогательная функция: [file:3]  

```js
function calculateGreySalary(targetNet, officialGrossSalary, ndflRate = 0.13) {
  const officialNet = officialGrossSalary * (1 - ndflRate);
  let dividendNet = targetNet - officialNet;
  if (dividendNet < 0) dividendNet = 0;

  const dividendTaxRate = 0.15;
  const dividendTax = dividendNet * dividendTaxRate / (1 - dividendTaxRate);
  const totalWithdrawal = dividendNet + dividendTax;

  return {
    officialNet,
    dividendNet,
    dividendTax,
    totalWithdrawal
  };
}
```

На примере `targetNet = 148 180`, `officialGrossSalary = 45 000` функция даёт ту же разбивку, что и Excel‑строки по `NETOFFICIALGUSN`, `DIVNETGUSN`, `TAXDIVGUSN`, `WITHDRAWCASH`. [file:3]

## 3. Grey VAT Scheme (серый с НДС)

Вторая схема листа — позднее использование НДС (ВАТ) совместно с серой зарплатой. [file:3]

Ключевые особенности:

- Цена с НДС: `TAXVATOUT = INREVGVAT * 0.22`, `TOTALREVINCVAT = INREVGVAT + TAXVATOUT`. [file:3]
- Входящий НДС и возвраты: `TAXVATIN`, `TAXVATREFUND`, `TAXVATPAY = TAXVATOUT - TAXVATIN + ADJUSTMENT`. [file:3]
- Серый блок зарплаты идентичен USN‑серой схеме (45 000 gross и дивиденды). [file:3]
- Комиссия на вывод наличных: `FEEWITHDRAWAL = WITHDRAWCASHGVAT * 0.28` (28 %). [file:3]
- Налог на прибыль: `TAXPROFIT = (TOTALREVINCVAT - ExpensesExceptProfitTax) * 0.20`. [file:3]

Итоговые показатели: `TOTALEXPGVAT`, `PROFITBANKGVAT`, `PROFITCASHGVAT`, `MARGINGVAT`, полностью совпадают с Excel‑листом. [file:3]