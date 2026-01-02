# Semantic Markup Plan for CAPUSTA Project

**GOAL:** Apply semantic markup (contracts, module maps, logical blocks) to all JavaScript files in `src/` according to the `.kilocode` rules.

## 1. `src/app.js` (UI Controller & Orchestrator)
*   **Module Contract:**
    *   **Purpose:** Central orchestrator for the Popup UI, managing event listeners, tab switching, and state restoration.
    *   **Scope:** UI interaction, settings persistence, inter-module coordination (Calculator, Parser).
*   **Module Map:**
    *   `App.init` (Func): Initialization sequence (load constants, restore settings, bind events).
    *   `App.saveAll` (Func): Persist all calculator and setting data.
    *   `App.renderCRM` (Func): Display stored tenders.
    *   `App.runAutoParsing` (Func): Trigger content script injection and data extraction.
*   **Key Logical Blocks:**
    *   `INIT_CONSTANTS_AND_TABS`
    *   `RESTORE_SETTINGS`
    *   `BIND_EVENTS`
    *   `AUTO_PARSING_LOGIC`

## 2. `src/calculator.js` (Core Logic)
*   **Module Contract:**
    *   **Purpose:** Financial calculation engine implementing specific taxation schemes (USN, NDS).
    *   **Scope:** Data processing, formula execution, table rendering logic.
*   **Module Map:**
    *   `Calculator.init` (Func): Initialize calculator state from storage.
    *   `Calculator.calculateTotal` (Func): Main calculation pipeline.
    *   `Calculator.renderAll` (Func): UI update trigger.
    *   `Calculator.CONFIG` (Const): Scenario definitions.
*   **Key Logical Blocks:**
    *   `CALC_BASE_METRICS` (People, Hours, Revenue)
    *   `SCENARIO_EXECUTION` (Looping through defined schemes)
    *   `RENDER_TABLES`

## 3. `src/parser.js` (Data Extraction)
*   **Module Contract:**
    *   **Purpose:** Content script for extracting tender data from target websites (Zakupki Kontur, Bidzaar).
    *   **Scope:** DOM manipulation, regex extraction, data normalization.
*   **Module Map:**
    *   `Parser.extractData` (Func): Main extraction entry point.
    *   `Parser.helpers` (Obj): Utility functions (formatting, cleaning).
    *   `Parser.checkCounterparty` (Func): CRM integration (deduplication).
*   **Key Logical Blocks:**
    *   `IDENTIFY_PLATFORM`
    *   `EXTRACT_COMMON_FIELDS` (INN, Price, Contacts)
    *   `CRM_CHECK`

## 4. `src/data.js` (Static Data)
*   **Module Contract:**
    *   **Purpose:** Repository for static constants, default formulas, and initial data structures.
    *   **Scope:** Configuration data.
*   **Module Map:**
    *   `Data.schemes` (Const): Detailed tax scheme definitions.
    *   `Data.constants` (Const): Global financial constants (tax rates, fixed costs).

## 5. `src/background.js` (Service Worker)
*   **Status:** Already partially marked up.
*   **Action:** Review for compliance with latest rules (check for missing `BLOCK` tags in smaller functions if any, verify Contract completeness).

## Execution Strategy
1.  **Iterative Application:** Apply markup file by file to ensure correctness.
2.  **Verification:** Ensure code logic remains unchanged, only comments/structure are added.
3.  **Logging:** Add `logger` calls (simulated via `console.log` for Chrome Ext environment, structured as `[Level][Func][Block]`) where appropriate.
