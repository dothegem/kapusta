<!--
# FILE: docs/README.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Служит главной точкой входа и навигационным индексом для документации проекта KAPUSTA MASTER PROJECT CONTEXT.
# SCOPE: Навигация по документации, обзор структуры проекта, описание назначения файлов.
# INPUT: Нет.
# OUTPUT: Структурированный обзор документации и ссылки на модульные файлы.
# KEYWORDS_MODULE: [Documentation, Index, Navigation, ProjectStructure]
# LINKS_TO_MODULE: [docs/00_OVERVIEW.md, docs/01_DOMAIN_AND_ROLES.md, docs/02_USER_FLOW_CRM.md, docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md, docs/04_CRM_STATES_AND_STATE_MACHINE.md, docs/05_CALC_INPUTS_CONSTANTS_AND_STATE.md, docs/06_CALC_SCHEMES_GREY_WHITE_USN.md, docs/07_CALC_SCHEMES_IP_VAT.md, docs/08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md, docs/09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md, docs/10_TECH_ARCHITECTURE_EXTENSION.md, docs/11_INTEGRATIONS_BITRIX_TELEGRAM_MANGO.md, docs/12_REAL_EXAMPLES_AND_TESTDATA.md]
# LINKS_TO_SPECIFICATION: [Context Kimi v4]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# DOC 10 [Обзор структуры файлов документации] => FileStructure
# DOC 8 [Инструкция по использованию документации для разных ролей] => UsageGuide
# DOC 9 [Принципы ведения документации и источники правды] => DocumentationPrinciples
# END_MODULE_MAP
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# PREV_CHANGE_SUMMARY: Создание модульной версии документации.
# IMPORTANT_NOTICE: Этот файл является корнем навигации для AI.
# END_CHANGE_SUMMARY
-->
# KAPUSTA MASTER PROJECT CONTEXT (modular)

Этот репозиторий — модульная версия контекста «KAPUSTA MASTER PROJECT CONTEXT v4», разбитая на компактные файлы по ~500 строк, чтобы с ними было удобно работать человеку и ИИ. [file:8]

## Структура файлов

- `00_OVERVIEW.md` — обзор проекта, ключевые компоненты (расширение, калькулятор, CRM, Bitrix24/Telegram/Mango), общий бизнес‑флоу. [file:8]  
- `01_DOMAIN_AND_ROLES.md` — доменные сущности (Tender, Deal, CalculationGroup, Calculation, Company, Contact, Task, SiteSurvey, UserManager) и роли (Tender Lead, Sales Manager, HR, финансы, VIP‑лиды). [file:8]  
- `02_USER_FLOW_CRM.md` — пользовательский флоу от парсинга тендера на площадке (Bidzaar/Контур) до создания Tender/CalculationGroup/Deal, задач и коммуникаций. [file:8]  
- `03_CRM_MODEL_AND_EDIT_SCENARIOS.md` — модель CRM (поля Tender/Deal/CalculationGroup/GuardCalcLine/ExpenseCalcLine и др.) и сценарии редактирования по стадиям. [file:8]  
- `04_CRM_STATES_AND_STATE_MACHINE.md` — машина состояний Deal (`new → inwork → sent → won/lost`), разрешённые переходы, роли и side‑effects (задачи, уведомления, синхронизация). [file:8]  

- `05_CALC_INPUTS_CONSTANTS_AND_STATE.md` — пользовательские инпуты (`createUserInputs`), глобальные константы (`createGlobalConfig`), переключатель `vatMode` и объект `state`. [file:2][file:1][file:6]  
- `06_CALC_SCHEMES_GREY_WHITE_USN.md` — подробное описание белых и серых схем при УСН (Base Calculation, White USN, Grey USN, Grey VAT), включая helper `calculateGreySalary`. [file:4][file:3]  
- `07_CALC_SCHEMES_IP_VAT.md` — схемы через ИП с НДС (IPNDS и родственники), логика налогов/НДС/cashout на стороне ИП и ООО. [file:7][file:8]  
- `08_CALC_SCHEMES_IMPL_AND_SCHEMASET.md` — SchemeSet: схемы BELUSN/SERUSN/BELNDS/SERNDS/IPNDS, набор выходных полей (margin, profitCash, vat, fot и др.), связь с JS‑реализацией. [file:5][file:8]  
- `09_CALCSPEC_JSON_AND_DATA_DICTIONARY.md` — структура `calcspec.json` (constants, rates, cashout, schemes, guardPrice, expensePrice) и полный data dictionary для полей. [file:8][file:2]  

- `10_TECH_ARCHITECTURE_EXTENSION.md` — техархитектура расширения: Manifest V3, `manifest.json`, модули `app.js`, `calculator.js`, `parser.js`, `rules.js`, `data.js`, chrome.storage.local. [file:8]  
- `11_INTEGRATIONS_BITRIX_TELEGRAM_MANGO.md` — интеграции: маппинг сущностей KAPUSTA ↔ Bitrix24, сценарии нотификаций в Telegram, роль Mango‑телефонии, хранение токенов. [file:8]  
- `12_REAL_EXAMPLES_AND_TESTDATA.md` — реальные примеры клиентов/реквизитов из master‑Excel и context‑kimi + эталонные расчёты по схемам для автотестов и обучения. [file:8]  

## Как этим пользоваться

- Для понимания концепции и быстрой ориентации читай `00_OVERVIEW.md` и `01_DOMAIN_AND_ROLES.md`. [file:8]  
- Если ты продукт/аналитик — смотри CRM‑часть: `02_USER_FLOW_CRM.md`, `03_CRM_MODEL_AND_EDIT_SCENARIOS.md`, `04_CRM_STATES_AND_STATE_MACHINE.md`. [file:8]  
- Если ты разработчик калькулятора — основной блок это `05`–`09`, который жёстко синхронизирован с Excel‑листами и MD `0000___ALL_CALC_v2 + 00…05`. [file:2][file:1][file:3][file:4][file:5][file:6][file:7]  
- Если тебя интересуют интеграции и деплой — смотри `10_TECH_ARCHITECTURE_EXTENSION.md` и `11_INTEGRATIONS_BITRIX_TELEGRAM_MANGO.md`. [file:8]  
- Для проверки корректности чисел и демонстрации живых кейсов используй `12_REAL_EXAMPLES_AND_TESTDATA.md`. [file:8]  

## Принципы

- **Источник правды по бизнес‑части** — context‑kimi v4, отражённый и структурированный в этих файлах. [file:8]  
- **Источник правды по формулам и схемам** — Excel‑мастер и MD‑файлы `0000___ALL_CALC_v2.md` + `00_GLOBAL_CONFIG.md` + `01…05` (схемы не меняются, только документируются). [file:2][file:1][file:3][file:4][file:5][file:6][file:7]  
- Все новые изменения в бизнес‑логике или мозгах калькулятора сначала вносятся в эти модульные файлы, затем синхронизируются с кодом и, при необходимости, с Excel. [file:8]  