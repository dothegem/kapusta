# Architectural Guidelines & Standards
> **Version:** 1.0.0
> **Target:** AI Agents & Developers

## 1. Core Principles
The project follows a **Plugin-based Architecture** aiming for high modularity and low coupling.
- **Single Core:** `App.js` acts as the orchestrator/bootstrapper.
- **Plugins:** All feature logic (Calculator, CRM, Parser) must be encapsulated modules.
- **Unified Protocol:** Plugins expose a standard interface (`init`, `render`, `destroy`).

## 2. Module Constraints
- **Line Limit:** Strict limit of **1000 lines**.
- **Ideal Size:** Target **300-500 lines** per file.
- **Action:** If a module exceeds 600 lines, split it by responsibility (e.g., `calc_logic.js` vs `calc_ui.js`).

## 3. Code Semantics
- **Self-Documenting:** Variable names must be verbose enough to explain purpose (`revenueWithVAT` vs `rev`).
- **No Magic Numbers:** All constants must live in `calcspec.json` or `Data.js`.
- **JSDoc Headers:** Every file must start with:
  ```javascript
  // FILE: [filename]
  // PURPOSE: [Short description]
  // DEPENDENCIES: [List of global objects used]
  ```

## 4. State Management
- **Persistence:** Use `chrome.storage.local`.
- **Schema:** 
  - `settings`: Global config (`parserminprice`, `theme`).
  - `tenderCalc_{id}`: Isolated state for each deal.
- **Migration:** Never use `storage.clear()`. Use targeted removal of legacy keys.

## 5. UI/UX
- **No HTML Strings in Logic:** Use helper functions or templates where possible.
- **Reactive Updates:** UI updates happen via explicit `render*()` calls triggered by state changes.
