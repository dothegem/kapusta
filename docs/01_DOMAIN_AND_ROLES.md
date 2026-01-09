<!--
# FILE: docs/01_DOMAIN_AND_ROLES.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Описание предметной области, основных сущностей данных и ролей пользователей в системе.
# SCOPE: Модель данных (Entity), Ролевая модель.
# INPUT: Нет.
# OUTPUT: Определения сущностей Tender, Deal, CalculationGroup и ролей пользователей.
# KEYWORDS_MODULE: [DOMAIN(10): CRMEntities; CONCEPT(9): Roles; ENTITY(9): Tender; ENTITY(9): Deal]
# LINKS_TO_MODULE: [docs/00_OVERVIEW.md, docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# ENTITY 10 [Сырой тендер с площадки] => Tender
# ENTITY 10 [Группа расчетов по тендеру] => CalculationGroup
# ENTITY 10 [Конкретный вариант расчета] => Calculation
# ENTITY 9 [Строка расчета охраны] => GuardCalcLine
# ENTITY 9 [Строка расчета расходов] => ExpenseCalcLine
# ENTITY 10 [Сделка в CRM] => Deal
# ENTITY 8 [Компания/Клиент] => Company
# ENTITY 8 [Контактное лицо] => Contact
# ROLE 9 [Ведущий тендера] => Tender_Lead
# ROLE 9 [Менеджер по продажам] => Sales_Manager
# END_MODULE_MAP
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Этот файл определяет словарь сущностей для всего проекта.
# END_CHANGE_SUMMARY
-->
# 01_DOMAIN_AND_ROLES

## 0. Основные доменные сущности

### 0.1. Tender

Tender — это «сырой» тендер с площадки (Bidzaar, Контур и т.п.), который становится входной точкой в KAPUSTA. [file:8]  
Tender хранит ссылку на оригинальный источник, закон (44/223), номер тендера, базовые параметры объекта охраны и связь с CalculationGroup и Deal. [file:8]  

Связанные файлы: `02_USER_FLOW_CRM.md`, `03_CRM_MODEL_AND_EDIT_SCENARIOS.md`. [file:8]  

### 0.2. CalculationGroup

CalculationGroup — логическая «папка» расчётов по одному тендеру, в которой может быть несколько альтернативных вариантов (разные схемы, ставки, условия). [file:8]  
CalculationGroup связывает Tender, один или несколько Calculation, а также GuardCalcLine и ExpenseCalcLine (строки для охранников и прочих расходов). [file:8]  

### 0.3. Calculation

Calculation — конкретный вариант расчёта (коммерческое предложение) внутри CalculationGroup с выбранными схемами, параметрами и итоговыми цифрами (маржа, налоги, зарплаты и т.п.). [file:8]  
Calculation использует схемы из calcspec (BELUSN, SERUSN, BELNDS, SERNDS, IPNDS и др.) и рассчитывается по заданному набору входных данных. [file:8]  

### 0.4. GuardPriceItem / GuardCalcLine

GuardPriceItem — шаблон/элемент прайса для охранных услуг (тип поста, сменность, ставка и т.п.), который используется для тиражирования строк GuardCalcLine. [file:8]  
GuardCalcLine — конкретная строка расчёта по охране в CalculationGroup: содержит параметры поста (hoursPerDay, hoursPerMonth, months, posts, ставки, адрес, тип формы, totalPerMonth/total и т.п.). [file:8]  

### 0.5. ExpensePriceItem / ExpenseCalcLine

ExpensePriceItem — шаблон для расходов, отличных от зарплаты (административные, связь, транспорт и т.п.), с единицей измерения и базовой ценой. [file:8]  
ExpenseCalcLine — строка конкретного расхода в CalculationGroup: title, unit, vatType, periodicity (once/monthly), price, qty, total и связка с priceItemId. [file:8]  

### 0.6. Deal

Deal — сущность CRM, представляющая коммерческое предложение/сделку, связанную с CalculationGroup и внешней CRM (Bitrix24). [file:8]  
У Deal есть стадии (new, inwork, sent, won, lost), ответственный менеджер, сумма, клиент, а также связь с задачами и SiteSurvey. [file:8]  

### 0.7. Company и Contact

Company — организация‑клиент (или контрагент), к которой относится Deal и Tender. [file:8]  
Contact — конкретное контактное лицо (ФИО, должность, email, телефон), привязанное к Company и используемое для коммуникаций по тендеру. [file:8]  

### 0.8. Task и SiteSurvey

Task — задачка в CRM/KAPUSTA, связанная с Deal/Tender/Company/Contact и описывающая конкретное действие (позвонить, выслать КП, уточнить условия и т.п.). [file:8]  
SiteSurvey — объект/формуляр осмотра объекта (SiteSurvey.data) для сделок, где требуется выезд и уточнение параметров охраны. [file:8]  

### 0.9. UserManager

UserManager — пользователь KAPUSTA (обычно менеджер по тендерам/продажам), связанный с аккаунтом в Bitrix24, Telegram и email. [file:8]  
UserManager управляет Tender, Deal, CalculationGroup, создаёт задачи, запускает расчёты и отвечает за коммуникацию с клиентами. [file:8]  

## 1. Роли и ответственность

### 1.1. Tender Lead

Tender Lead — человек, который первым находит и заводит тендер в KAPUSTA (через парсер расширения или руками). [file:8]  
Он отвечает за корректное создание Tender и первичный запуск CalculationGroup, но не обязательно ведёт сделку до конца. [file:8]  

### 1.2. Sales Manager

Sales Manager — основной владелец Deal, который работает с клиентом, согласовывает условия и закрывает сделку. [file:8]  
Он управляет стадиями Deal, редактирует ключевые поля в CalculationGroup и инициирует обновления в Bitrix24. [file:8]  

### 1.3. VIP‑контакты / Лиды из Telegram

VIP‑лиды и важные входящие обращения могут прилетать через Telegram‑бота и обходить стандартный путь с площадок, сразу создавая Deal/Tender в особом статусе. [file:8]  
Для них могут использоваться упрощённые флоу и отдельные уведомления в Телеграм‑чаты менеджеров. [file:8]  

### 1.4. HR и операционный блок

HR‑роль включается на стадиях, когда сделка переходит к исполнению: подбор охранников, формирование смен, согласование условий с подрядчиками/штатными сотрудниками. [file:8]  
HR использует GuardCalcLine и результаты калькулятора как вход для планирования фактического графика и затрат по ФОТ. [file:8]  

### 1.5. Финансы / бухгалтерия

Финансовая роль использует итоговые схемы (налоги, cashout, НДС, прибыль) для контроля рентабельности сделок и планирования платежей. [file:8]  
Им важно, чтобы все схемы (BELUSN, SERUSN, BELNDS, SERNDS, IPNDS и др.) были формализованы и воспроизводимы через calcspec и калькулятор. [file:8][file:2]  