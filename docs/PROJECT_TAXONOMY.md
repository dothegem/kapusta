# Project Taxonomy & Structure
> **Use this file to understand the codebase topology.**

## Entry points (for humans & LLM)
- `docs/LLM_INDEX.md` — where to start.
- `docs/PROJECT_CONTEXT.md` — canonical product spec (UI, entities, storage).
- `docs/CALC_LOGIC.md` — canonical formulas and verification values.

## 📂 Root
- `manifest.json`: WebExtension definition (MV3). Permissions, host matches.
- `.gitignore`: must include `.info/` (deprecated).

## 📂 src/ (Source Code)

### 🧠 Core & Orchestration
- **`app.js`** (Core):
  - Entry point.
  - Manages Tab navigation (Calculator <-> CRM <-> Settings).
  - Initializes other modules.
  - Handles global Settings IO.

### 🧮 Domain Modules
- **`calculator.js`** (Logic + UI):
  - **Critical Module.**
  - Contains scenario calculations (5 schemes).
  - Renders Input Tables (Guard, Extras, Price).
  - Handles "BG" (Bank Guarantee) auto-calculation logic.
  - Refactor candidate if size grows: split into `calc_core.js` (math) + `calc_ui.js` (DOM).
- **`parser.js`** (Content Script):
  - Injected into active tab (Zakupki/Bidzaar).
  - Scrapes DOM and returns standardized JSON.
- **`rules.js`** (Config):
  - Loads `calcspec.json`.
  - Computes derived constants (tax rates, coefficients).

### 📦 Data & Static Assets
- **`data.js`**:
  - Static lists.
  - Default price lists.
- **`calcspec.json`**:
  - Editable configuration (tax rates, defaults).

### 🎨 UI & Presentation
- **`popup.html`**: Main UI skeleton. 4 Tabs structure.
- **`styles.css`**: CSS Variables, Grid layouts, theme support.

## 📂 docs/ (Documentation)
- `LLM_INDEX.md`: AI entrypoint.
- `ARCH_GUIDELINES.md`: Architecture rules.
- `PROJECT_CONTEXT.md`: Canonical product spec.
- `CALC_LOGIC.md`: Canonical calc formulas.
- `PROJECT_TAXONOMY.md`: This file.
- `context.md`: Append-only session log.

## Deprecated
- `.info/` — deprecated; must not exist in repo.
