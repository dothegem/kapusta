<!--
# FILE: docs/05_CALC_INPUTS_CONSTANTS_AND_STATE.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Описание входных данных калькулятора, глобальных констант и структуры состояния (state).
# SCOPE: Конфигурация расчетов, управление состоянием приложения.
# INPUT: Пользовательский ввод (User Inputs), Глобальная конфигурация (Config).
# OUTPUT: Единый объект состояния (State) для расчетов.
# KEYWORDS_MODULE: [DOMAIN(10): Calculations; CONCEPT(9): Configuration; ENTITY(8): State; PATTERN(8): Immutable]
# LINKS_TO_MODULE: [docs/06_CALC_SCHEMES_GREY_WHITE_USN.md, docs/07_CALC_SCHEMES_IP_VAT.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# OBJECT 10 [Пользовательский ввод] => createUserInputs
# OBJECT 10 [Глобальная конфигурация] => createGlobalConfig
# CONST 9 [Режимы НДС] => VatMode
# OBJECT 10 [Объект состояния] => State
# END_MODULE_MAP
# START_USE_CASES:
# - [InitCalculation]: User (UI) -> InputParams -> StateCreated
# - [ConfigUpdate]: Admin (Config) -> UpdateConstants -> NewState
# END_USE_CASES
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Основа для всех математических расчетов.
# END_CHANGE_SUMMARY
-->
# 05_CALC_INPUTS_CONSTANTS_AND_STATE

## 0. Общая идея

Калькулятор KAPUSTA строится вокруг трёх слоёв: пользовательские инпуты, глобальная конфигурация (константы) и объединяющий их объект `state`. [file:2][file:1][file:6]  
UI даёт пользователю ограниченный набор полей и переключателей, а все формулы опираются на значения из `state`, чтобы расчёты были воспроизводимыми и независимыми от конкретного Excel. [file:2][file:6]  

## 1. Пользовательские инпуты (createUserInputs)

### 1.1. Структура user inputs

Функция `createUserInputs()` создаёт объект со всеми значимыми полями, которые вводит или корректирует пользователь в UI: [file:6][file:2]  

- `clientMonthlyPriceInput` — месячная цена/выручка от клиента (INCLIENTREVENUEMONTH, может быть null, если считаем от часовой ставки). [file:1][file:2][file:6]  
- `termMonthsInput` — срок контракта в месяцах (`INTERMMONTHS`), по умолчанию 1. [file:2][file:6]  
- `clientHourlyPriceInput` — часовая ставка для клиента (если считаем цену от ставок, а не от месячной выручки). [file:2][file:6]  
- `totalHoursInput` — общее количество охранных часов в месяц (альтернатива headcount × график). [file:6]  
- `headcountInput` — количество охранников/постов (INHEADCOUNT). [file:2][file:4][file:6]  
- `nooCostInput` — объём «NOO cost» (необлагаемые расходы, например, серые выплаты или прочие выплаты вне налогооблагаемой базы), по умолчанию может быть взят из `NOOCOSTDEFAULT`. [file:1][file:2][file:6]  

Все остальные параметры (налоги, среднее число дней в месяце и т.п.) пользователь напрямую не задаёт — они берутся из `config`. [file:1][file:6]  

### 1.2. Взаимосвязь с Excel‑входами

Эти инпуты мапятся на поля Excel‑листов:  
- `clientMonthlyPriceInput` ↔ `INCLIENTREVENUEMONTH` и производное `TOTALREVENUE = INCLIENTREVENUEMONTH * INTERMMONTHS`. [file:1][file:2]  
- `headcountInput` ↔ `INHEADCOUNT`. [file:2][file:4]  
- `nooCostInput` ↔ `INNOOCOST`. [file:1][file:2]  

Остальные поля Excel (вроде `INRATE`, `INDAYSINMONTH`) подставляются из `config`. [file:1][file:4][file:6]  

## 2. Глобальная конфигурация (createGlobalConfig)

### 2.1. Набор констант

Функция `createGlobalConfig()` формирует объект констант, которые используются во всех схемах: [file:6][file:1][file:2]  

- `INDAYSINMONTH = 30.5` — усреднённое количество дней в месяце. [file:1][file:2]  
- `INCONNECTIONCOSTPERUNIT = 500` — стоимость подключения одного поста (связь и прочее). [file:1][file:2]  
- `INADMINPERCENT = 0.02` — административный процент от выручки. [file:1][file:2]  
- Налоговые ставки:  
  - `TAXVATUSN = 0.07` (7 % — «входной» НДС для УСН). [file:1][file:2]  
  - `TAXUSNRATE = 0.06` (6 % УСН). [file:1][file:2]  
  - `TAXNDFL = 0.13` (НДФЛ). [file:1][file:2][file:4]  
  - `TAXPFR = 0.30` (ПФР, пенсионные, 30 %). [file:1][file:2][file:4]  
  - `TAXFSS = 0.002` (ФСС, 0.2 %). [file:1][file:2][file:4]  
  - `TAXPROFIT = 0.20` (налог на прибыль, 20 %). [file:1][file:2][file:3]  
  - `TAXVATOSN = 0.22` (22 % НДС в режиме ОСН). [file:1][file:2]  

- Отпуска и NOO:  
  - `VACATIONRATE = 0.08` (8 % от годовой зарплаты на отпуск). [file:1][file:2][file:4]  
  - `VACATIONDAYS = 20` — сколько дней отпуска закладывается. [file:6][file:8]  
  - `NOOCOSTDEFAULT = 3000` — дефолтное значение NOO‑расходов. [file:6][file:1]  

- Прочее:  
  - `OFFICIALSALARYGRAY = 45000` — фиксированная официальная «белая» часть зарплаты для серых схем. [file:6][file:3]  
  - `CONNECTIONENABLED = true` — включать ли расчёт подключения. [file:6]  

### 2.2. Производные показатели

На базе этих констант в Excel и JS считаются: [file:1][file:4][file:2]  

- `SALARYTOTALPAY = INDAILYRATE * INDAYSINMONTH * INHEADCOUNT * INTERMMONTHS` — чистая цель по нетто‑зарплате за период. [file:1][file:4][file:2]  
- `SALARYVACATION = SALARYTOTALPAY * VACATIONRATE` — резерв под отпуск. [file:1][file:4]  
- `SALARYNOOVACATION = INNOOCOST * VACATIONRATE` — отпуск на NOO‑часть. [file:1][file:2]  

Эти показатели используются в формулах gross up и расчёте налогов в разных схемах (см. `06_CALC_SCHEMES_GREY_WHITE_USN.md` и `07_CALC_SCHEMES_IP_VAT.md`). [file:2][file:3][file:4]  

## 3. Переключатель vatMode и варианты НДС

### 3.1. VATMODEOUTSIDE / VATMODEINSIDE

UI поддерживает два режима: [file:6][file:2][file:8]  

- `VATMODEOUTSIDE` (`"outside"`) — когда НДС сверху цены (как в базовом Excel), цена без НДС, налог начисляется отдельно. [file:6][file:2][file:3]  
- `VATMODEINSIDE` (`"inside"`) — когда цена клиента уже включает НДС; используются делители `1.07` и `1.22` для вытаскивания базы. [file:2][file:8]  

Переключение `vatMode` влияет на расчёт выручки/баз, но не меняет сами схемы BELUSN/SERUSN/BELNDS/SERNDS/IPNDS. [file:2][file:3][file:8]  

### 3.2. Связь vatMode ↔ calcspec

`vatMode` хранится в `state` и одновременно используется как часть `calcspec` (в `schemes` и `rates`), чтобы схемы могли учитывать разные НДС‑режимы без изменения кода. [file:8][file:2]  
Версия calcspec (`calcspecVersion`) и версия config (`configVersion`) должны совпадать в Calculation, чтобы было понятно, по каким правилам он был посчитан. [file:8]  

## 4. Объект state (createState)

### 4.1. Структура state

`createState()` возвращает объект: [file:6][file:2]  

```js
{
  inputs: createUserInputs(),
  config: createGlobalConfig(),
  vatMode: VATMODEOUTSIDE // или VATMODEINSIDE
}
```

В дальнейшем к этому могут добавляться ссылки на `schemaSet`, `calcspecVersion`, `selectedSchemaCode` и т.п., но базовый слой — именно inputs + config + vatMode. [file:2][file:8]

### 4.2. Использование state в калькуляторе

Калькулятор берёт `state`, применяет к нему calcspec (описание схем, коэффициентов, правил) и выдаёт структуру Calculation с подробным breakdown. [file:2][file:8]
Все расчёты (зарплаты, налоги, cashout, прибыль) должны быть чистыми функциями от `state`, без скрытых глобальных переменных. [file:2][file:3][file:4]