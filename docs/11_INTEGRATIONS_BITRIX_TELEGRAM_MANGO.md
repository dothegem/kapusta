<!--
# FILE: docs/11_INTEGRATIONS_BITRIX_TELEGRAM_MANGO.md
# VERSION: 1.0.0
# START_MODULE_CONTRACT:
# PURPOSE: Описание интеграций с внешними системами: Bitrix24, Telegram, Mango.
# SCOPE: API, синхронизация данных, уведомления.
# INPUT: События CRM, действия пользователя.
# OUTPUT: API-запросы к внешним сервисам.
# KEYWORDS_MODULE: [DOMAIN(10): Integrations; SYSTEM(9): Bitrix24; SYSTEM(9): Telegram; SYSTEM(9): Mango]
# LINKS_TO_MODULE: [docs/02_USER_FLOW_CRM.md, docs/03_CRM_MODEL_AND_EDIT_SCENARIOS.md]
# LINKS_TO_SPECIFICATION: [Весь проект]
# END_MODULE_CONTRACT
# START_MODULE_MAP:
# SYSTEM 10 [Bitrix24 Integration] => Bitrix24_Sync
# SYSTEM 9 [Telegram Integration] => Telegram_Notifications
# SYSTEM 9 [Mango Integration] => Mango_Telephony
# SECURITY 10 [Безопасность и токены] => Security_Tokens
# END_MODULE_MAP
# START_USE_CASES:
# - [SyncDeal]: Deal (Updated) -> SyncToBitrix -> ExternalDealUpdated
# - [NotifyLead]: NewLead -> SendTelegram -> ManagerNotified
# END_USE_CASES
# START_CHANGE_SUMMARY
# LAST_CHANGE: Добавлена семантическая разметка для AI-агентов.
# IMPORTANT_NOTICE: Описывает взаимодействие с внешним миром.
# END_CHANGE_SUMMARY
-->
# 11_INTEGRATIONS_BITRIX_TELEGRAM_MANGO

## 0. Обзор интеграций

KAPUSTA интегрируется с Bitrix24 как с основной CRM‑системой клиента, а также использует Telegram и Mango для уведомлений и коммуникаций. [file:8]  
Задача этих интеграций — не дублировать CRM‑функционал, а связать расчёты и тендеры с уже существующей инфраструктурой. [file:8]  

## 1. Интеграция с Bitrix24

### 1.1. Маппинг сущностей

Взаимосвязи KAPUSTA ↔ Bitrix24: [file:8]  

- KAPUSTA `Deal` ↔ Bitrix24 `Deal` (основная сущность сделки: стадия, сумма, ответственный).  
- KAPUSTA `Company` ↔ Bitrix24 `Company` (юрлицо клиента, реквизиты, ИНН/КПП, телефоны, сайты).  
- KAPUSTA `Contact` ↔ Bitrix24 `Contact` (контактные лица, ФИО, должность, email, телефоны).  
- KAPUSTA `Task` ↔ Bitrix24 `Task` (дела/напоминания, связанные с конкретной сделкой).  
- KAPUSTA `UserManager` ↔ Bitrix24 `User` (пользователи‑менеджеры, привязка по email/Telegram ID).  

ID внешних сущностей Bitrix24 (dealId, companyId, contactId, taskId, userId) хранятся в CRM KAPUSTA рядом с локальными ID, чтобы обеспечивать двустороннюю синхронизацию. [file:8]  

### 1.2. События синхронизации

Основные моменты, когда KAPUSTA обращается к Bitrix24 API: [file:8]  

- создание нового Tender/CalculationGroup → опционально создаётся Bitrix24 Deal + связанная Company/Contact;  
- изменение стадии `Deal.stage` (new/inwork/sent/won/lost) → обновляется стадия сделки в Bitrix24;  
- создание/изменение Task в KAPUSTA → создаётся или обновляется задача в Bitrix24, привязанная к соответствующей сделке;  
- обновление контактных данных Company/Contact → синхронизируется с Bitrix24, чтобы не было расхождений.  

KAPUSTA стремится быть «тонким клиентом» к Bitrix24, а не отдельной CRM — приоритет за данными в Bitrix24, но расчёты и специфические сущности (CalculationGroup, GuardCalcLine и др.) остаются в KAPUSTA. [file:8]  

## 2. Интеграция с Telegram

### 2.1. Основные сценарии

Telegram используется как канал уведомлений и точка входа VIP‑лидов. [file:8]  

Например:  
- уведомления о новых тендерах или важных изменениях (новый Tender, переход Deal в `sent` или `won`);  
- быстрые алерты о VIP‑лидах или запросах с сайта;  
- ссылки на карточки Deal/Tender в KAPUSTA/Bitrix24 для быстрого перехода.  

Для этого в настройках KAPUSTA хранятся `Telegram token` и `chatId`, используемые для отправки сообщений в соответствующие чаты/бота. [file:8]  

### 2.2. Идентификация пользователей

В master‑данных есть таблица Email/Phone, где указываются контактные данные менеджеров, которые могут быть связаны с Telegram ID и Bitrix24‑аккаунтом. [file:8]  
Это позволяет слать уведомления ответственному менеджеру, не хардкодя его логины в коде. [file:8]  

## 3. Интеграция с Mango

### 3.1. Роль Mango

Mango‑телефония используется для входящих/исходящих звонков и логирования активности по сделке. [file:8]  
В настройках KAPUSTA хранится `Mango API key`, который позволяет вызывать API Mango для: регистрации звонков, отображения истории звонков в CRM, возможно прокидывания pop‑up при звонке. [file:8]  

### 3.2. Связь с Deal и Contact

По номеру телефона из Mango можно мачить вызовы на Contact/Company в KAPUSTA и Bitrix24, показывая менеджеру, по какой сделке звонит клиент. [file:8]  
Информация о звонках может записываться в историю Deal и, опционально, создавать Task (например, перезвонить, выслать КП). [file:8]  

## 4. Безопасность и хранение токенов

### 4.1. Хранение ключей интеграций

Telegram token, Mango API key и ключи для Bitrix24 хранятся в зашифрованном виде или как минимум отдельно в настройках расширения, недоступных напрямую из контент‑скриптов. [file:8]  
При необходимости можно вынести токены на бекенд и общаться с внешними сервисами через прокси‑API. [file:8]  

### 4.2. Ограничение доступа

Только авторизованные пользователи (UserManager, привязанные к данным CRM) должны иметь возможность изменять настройки интеграций и использовать их в прод‑режиме. [file:8]  

Подробности по событиям CRM и задачам см. в `02_USER_FLOW_CRM.md` и `03_CRM_MODEL_AND_EDIT_SCENARIOS.md`. [file:8]  