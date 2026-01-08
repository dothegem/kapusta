# Project Taxonomy & Structure
> **Use this file to understand the codebase topology.**

## 📂 Root
- `manifest.json`: WebExtension definition (MV3). Permissions, host matches.

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
  - Contains `CONFIG.scenarios` (5 financial schemes).
  - Renders Input Tables (Security, Extras).
  - Handles "BG" (Bank Guarantee) auto-calculation logic.
  - *Refactor candidate:* Split into Logic/UI if size > 600 lines.
- **`parser.js`** (Content Script):
  - Injected into active tab (Zakupki/Bidzaar).
  - Scrapes DOM and returns standardized JSON.
- **`rules.js`** (Config):
  - Loads `calcspec.json`.
  - Computes derived constants (tax rates, coefficients).

### 📦 Data & Static Assets
- **`data.js`**: 
  - Static lists (Regions, Uniforms).
  - Default Price Lists (Guard, Extras).
- **`calcspec.json`**: 
  - Editable configuration (Tax rates, Vacation days, Defaults).

### 🎨 UI & Presentation
- **`popup.html`**: Main UI skeleton. 4 Tabs structure.
- **`styles.css`**: CSS Variables, Grid layouts, Dark/Light theme support.

## 📂 docs/ (Documentation)
- `ARCH_GUIDELINES.md`: Rules for code style and architecture.
- `context.md`: AI Session Memory log.
