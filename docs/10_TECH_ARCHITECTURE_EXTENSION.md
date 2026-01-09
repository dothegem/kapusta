<!--
# FILE: docs/10_TECH_ARCHITECTURE_EXTENSION.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Архитектурный обзор Chrome Extension (Manifest V3) и JS-модулей.
# SCOPE: Структура приложения, точки входа, хранение данных.
# INPUT: Нет.
# OUTPUT: Архитектурная карта проекта.
# KEYWORDS_MODULE: [TECH(10): ChromeExtension; TECH(10): JavaScript; ARCH(9): SPA; CONCEPT(9): ManifestV3]
# LINKS_TO_MODULE: [docs/00_OVERVIEW.md, src/manifest.json]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# ARCH 10 [Манифест и точки входа] => Manifest_Architecture
# MODULE 10 [Основной модуль UI] => app_js
# MODULE 10 [Калькулятор] => calculator_js
# MODULE 10 [Парсер] => parser_js
# MODULE 9 [Правила и данные] => rules_data_js
# STORAGE 10 [Локальное хранилище] => chrome_storage_local
# END_MODULE_MAP
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Описывает физическую структуру приложения.
# END_CHANGE_SUMMARY
-->
# 10_TECH_ARCHITECTURE_EXTENSION

## 0. Общий обзор архитектуры

KAPUSTA реализован как расширение Chrome (Manifest V3) с контент‑скриптами для парсинга тендерных площадок и SPA‑UI для работы с калькулятором и CRM. [file:8]  
Логика разделена на модули: `app.js`, `calculator.js`, `parser.js`, `rules.js`, `data.js`, плюс calcspec.json и chrome.storage.local для настроек и кэша. [file:8]  

## 1. manifest.json и точки входа

### 1.1. Manifest V3

manifest.json описывает: [file:8]  

- права доступа к доменам тендерных площадок (например, `https://*.bidzaar.com/*`, `https://*.kontur.zakupki.ru/*`).  
- content‑scripts, которые встраиваются в страницы и инициализируют `parser.js` и UI.  
- background/service worker, если требуется длительное хранение или интеграции (Telegram/Mango/Bitrix24).  

### 1.2. Host permissions и content‑scripts

Для каждой поддерживаемой площадки указываются `host_permissions`, чтобы parser имел доступ к DOM. [file:8]  
content‑scripts загружают минимальный bootstrap‑код, который добавляет контейнер UI и устанавливает связь с остальными модулями расширения. [file:8]  

## 2. Основные JS‑модули

### 2.1. app.js

app.js отвечает за: [file:8]  

- инициализацию SPA‑интерфейса (HTML+CSS Grid, CSS‑стили для калькулятора и CRM);  
- загрузку/сохранение данных в chrome.storage.local (state, настройки, токены, calcspecVersion);  
- навигацию по вкладкам UI (калькулятор, CRM‑карточка, настройки, лог).  

### 2.2. calculator.js

calculator.js инкапсулирует всю логику расчётов: [file:8][file:2]  

- создаёт `state` через `createUserInputs` и `createGlobalConfig` (см. `05_CALC_INPUTS_CONSTANTS_AND_STATE.md`);  
- применяет calcspec.json и SchemeSet из `rules.js` к `state`, получая набор расчётов по схемам (BELUSN, SERUSN, BELNDS, SERNDS, IPNDS);  
- возвращает структуру Calculation для отображения в UI и сохранения в CRM.  

### 2.3. parser.js

parser.js — content‑script, который: [file:8]  

- анализирует DOM страницы тендера (Bidzaar, Контур и т.д.);  
- извлекает номер тендера, закон (44/223), заказчик, параметры объекта, сроки, НМЦК и т.п.;  
- формирует JSON‑структуру Tender и передаёт её в app.js для создания Tender/CalculationGroup.  

### 2.4. rules.js и data.js

rules.js реализует связку между `state`, calcspec.json и SchemeSet: [file:8]  

- загружает calcspec.json;  
- на основе `schemes`, `rates`, `cashout` и описаний полей рассчитывает детальные показатели по схемам.  

data.js содержит справочники и предзаполненные прайс‑элементы: [file:8]  

- шаблоны GuardPriceItem и ExpensePriceItem;  
- преднастроенные наборы GuardCalcLine/ExpenseCalcLine для типовых объектов;  
- вспомогательные данные для CRM (типы задач, статусы и т.п.).  

## 3. Хранение данных и настройки

### 3.1. chrome.storage.local

В chrome.storage.local хранятся: [file:8]  

- `settings`: выбранный `vatMode`, активный `calcspec`/schemaSet, токены Telegram/Mango/Bitrix24;  
- `lastState`: последние введённые пользователем значения в калькуляторе, чтобы не терять данные между сессиями;  
- `calcspecCache`: кешированная версия calcspec.json с версией для проверки обновлений.  

### 3.2. Очистка и миграции

При обновлении расширения может вызываться `storage.clear` и миграционный код, который: [file:8]  

- очищает старые state, если они несовместимы с новой версией calcspec/config;  
- обновляет версии calcspec/config в сохранённых Calculation/Deal (или помечает их как «старые»).  

## 4. Связь расширения и CRM/Bitrix24

### 4.1. HTTP/API‑взаимодействие

Расширение выступает фронтом, который: [file:8]  

- обращается к бекенду KAPUSTA/CRM через HTTP API (создание Tender/Deal/CalculationGroup и т.п.);  
- по необходимости обращается к Bitrix24 API (через токен или веб‑хук), используя сущности Deal/Company/Contact/Task/User.  

### 4.2. Расширение‑only режим

В режиме extension‑only (без внешнего бекенда) CRM‑данные могут храниться прямо в chrome.storage.local или в локальной базе; [file:8]  
интеграции с Telegram и Mango в этом случае работают по токенам/ключам, хранящимся в настройках расширения. [file:8]  