<!--
# FILE: docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Детальное описание модели данных CRM и сценариев редактирования сущностей.
# SCOPE: Атрибуты сущностей, правила валидации, логика редактирования.
# INPUT: Изменения полей сущностей пользователем или системой.
# OUTPUT: Спецификация для реализации CRUD операций и прав доступа.
# KEYWORDS_MODULE: [DOMAIN(10): DataModel; CONCEPT(9): Validation; ENTITY(9): Tender; ENTITY(9): Deal]
# LINKS_TO_MODULE: [docs/01_DOMAIN_AND_ROLES.md, docs/04_CRM_STATES_AND_STATE_MACHINE.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# ENTITY 10 [Модель Тендера и сценарии] => Tender_Model
# ENTITY 10 [Модель Группы Расчетов] => CalculationGroup_Model
# ENTITY 9 [Строки расчета (Охрана/Расходы)] => CalcLines_Model
# ENTITY 10 [Модель Расчета] => Calculation_Model
# ENTITY 9 [Сделка, Компания, Контакт] => Deal_Company_Contact_Model
# ENTITY 8 [Задача и Осмотр объекта] => Task_SiteSurvey_Model
# END_MODULE_MAP
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Определяет правила мутации данных.
# END_CHANGE_SUMMARY
-->
# 03_CRM_MODEL_AND_EDIT_SCENARIOS

## 0. Общие принципы

CRM KAPUSTA строится вокруг связки Tender → CalculationGroup → Calculation → Deal, дополняемой Company, Contact, Task, SiteSurvey и линиями Guard/Expense. [file:8]  
Каждая сущность имеет набор ответственных ролей и допустимых действий в зависимости от стадии сделки (см. `04_CRM_STATES_AND_STATE_MACHINE.md`). [file:8]  

## 1. Сущность Tender

### 1.1. Ключевые поля Tender

- Идентификаторы: `id`, `source`, `internalId`, `sourceTenderId`, `lawType`, ссылка на оригинал тендера. [file:8]  
- Контекст: заказчик, адрес/описание объекта, сроки, объём услуг (количество постов, длительность контракта), бюджет/НМЦК (если есть). [file:8]  
- Связи: `calculationGroupId`, связанные Deal/Company/Contact. [file:8]  

### 1.2. Сценарии редактирования Tender

- Создаёт и первоначально заполняет Tender обычно Tender Lead через расширение/parsing. [file:8]  
- В стадиях `new` и `inwork` Sales Manager может дополнять описание, комментарии и уточнять параметры тендера. [file:8]  
- После стадий `sent`/`won`/`lost` редактирование критичных полей Tender ограничивается, допускаются только комментарии/внутренние заметки. [file:8]  

## 2. Сущность CalculationGroup

### 2.1. Ключевые поля CalculationGroup

- Идентификаторы: `id`, `tenderId`, возможно `dealId` (если есть связанная сделка). [file:8]  
- Структура расчётов: массив `GuardCalcLine[]`, `ExpenseCalcLine[]`, список `Calculation[]`. [file:8]  
- Метаданные: комментарии, ссылка на автора, дата последнего пересчёта/изменения. [file:8]  

### 2.2. Сценарии редактирования CalculationGroup

- На стадиях `new` и `inwork` Sales Manager (или Tender Lead) свободно добавляет/удаляет GuardCalcLine/ExpenseCalcLine, создаёт новые Calculation и меняет параметры. [file:8]  
- На стадии `sent` изменения, влияющие на отправленное клиенту КП (ключевые суммы, ставки), должны либо фиксироваться как новая версия Calculation, либо блокироваться политикой (зависит от настроек). [file:8]  
- На стадиях `won` и `lost` CalculationGroup становится по сути readonly, кроме служебных комментариев и отметок о фактических параметрах исполнения. [file:8]  

## 3. GuardCalcLine и ExpenseCalcLine

### 3.1. GuardCalcLine

GuardCalcLine описывает одну конфигурацию поста охраны в рамках расчёта. [file:8]  
Ключевые поля: `title`, `description`, `hoursPerDay`, `hoursPerMonth`, `months`, `posts`, `customerHourlyRate`, `ourShiftRate`, `address`, `uniformType`, `totalPerMonth`, `total`, `priceItemId`. [file:8]  

**Редактирование:**  
- В `new`/`inwork` менеджер может добавлять/удалять строки, менять количественные параметры и ставки. [file:8]  
- В `sent` изменения допустимы только через создание нового варианта Calculation, чтобы не ломать уже отправленное предложение. [file:8]  
- В `won` GuardCalcLine может быть скорректирован в сторону фактических значений для анализа маржи, но с жёстким трекингом изменений. [file:8]  

### 3.2. ExpenseCalcLine

ExpenseCalcLine описывает отдельный расход (админ, связь, транспорт, прочее). [file:8]  
Ключевые поля: `title`, `unit`, `vatType`, `periodicity` (once/monthly), `price`, `qty`, `total`, `priceItemId`. [file:8]  

**Редактирование:**  
- Аналогично GuardCalcLine: свободное редактирование в `new`/`inwork`, осторожное версионирование в `sent`, ограниченное изменение в `won`. [file:8]  
- Некоторые строки могут быть защищены как «стандартные расходы» (например, админ‑процент), завязанные на глобальные константы из калькулятора. [file:1][file:2][file:8]  

## 4. Сущность Calculation

### 4.1. Ключевые поля Calculation

- Идентификаторы: `id`, `calculationGroupId`, возможно `schemaCode` (BELUSN/SERUSN/BELNDS/SERNDS/IPNDS), `configVersion`/`calcspecVersion`. [file:8][file:2]  
- Итоги: `margin`, `profitCash`, `profitCashless`, `vat`, `avgRate`, `fot`, `taxes`, `envelope`, `otherExpenses`, `total` и прочие агрегаты по схеме. [file:8]  
- Метаданные: дата расчёта, автор, комментарии, выбран ли вариант как «основной» для клиента. [file:8]  

### 4.2. Сценарии редактирования Calculation

- Calculation не редактируется напрямую по полям итогов; он пересчитывается из state (inputs + config + calcspec) через калькулятор. [file:2][file:8]  
- В `new`/`inwork` менеджер может создавать новые Calculation (варианты), удалять неактуальные и переключать «основной» вариант. [file:8]  
- В `sent` связанный с клиентом Calculation должен быть стабилен; изменения делаются через копию/новую версию с комментариями. [file:8]  

## 5. Deal, Company, Contact

### 5.1. Deal

Ключевые поля Deal: `id`, `stage` (new, inwork, sent, won, lost), `amount`, связи с `companyId`, `contactId`, `calculationGroupId`, ответственный менеджер и видимые в UI метки. [file:8]  
Deal — основная точка для работы продаж: именно на нём отображаются стадии, задачи, история писем и связанный расчёт. [file:8]  

### 5.2. Company и Contact

Company содержит реквизиты клиента (название, ИНН, КПП, адрес, телефоны, сайты), которые в примерах берутся из реальных клиентов Excel‑мастера. [file:8]  
Contact хранит ФИО, должность, телефоны и email, используется в письмах и как основное лицо по сделке. [file:8]  

## 6. Task и SiteSurvey

### 6.1. Task

Task содержит: `title`, `description`, `dueDate`, `assignee`, связи с Tender/Deal/Company/Contact, статус и приоритет. [file:8]  
Задачи создаются автоматически по событиям (смена стадии, дедлайны тендера) и вручную менеджером. [file:8]  

### 6.2. SiteSurvey

SiteSurvey хранит структурированные данные по объекту (площади, входы, посты, особенности режима и т.п.), обычно в отдельном `SiteSurvey.data`. [file:8]  
Он привязан к Deal/Tender и используется как дополнение к расчёту для сложных объектов. [file:8]  