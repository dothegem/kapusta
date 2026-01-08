# AI Session Context & Summary
> **Instructions:** Append the summary of each major interaction block here. Use this to restore context in future sessions.

## Session: 2026-01-08 (Init v2.2)

### ✅ Accomplishments
1. **Refactored UI:** Implemented 4-tab layout (Calculator, CRM, Price, Settings).
2. **Schemes Matrix:** Added 5-column financial comparison (BEL/SER USN/NDS + IP).
3. **BG Logic:** Implemented auto-calculation of Bank Guarantees in Extra rows.
4. **Data Persistence:** Fixed "Hard Reset" to be non-destructive for CRM data.
5. **Configuration:** Extracted logic to `calcspec.json` with UI editor and validation.
6. **Architecture:** Established `docs/` with Taxonomy and Guidelines.
7. **Docs migration:** Migrated `.info/*` specs into `docs/` and deprecated `.info/`.

### 🚧 Current State
- **Version:** v2.2.1
- **Architecture:** Modular Monolith (App -> Calculator/Parser).
- **Code Quality:**
  - `calculator.js` is nearing size limit (~600 lines).
  - `app.js` is clean (~400 lines).

### 📋 Next Steps (Backlog)
- [ ] **Refactor:** Split `calculator.js` into `calc_core.js` and `calc_ui.js`.
- [ ] **Tech:** Implement a true plugin protocol + event bus (Core.registerPlugin).
- [ ] **Feature:** Expand CRM tab (tasks, managers) beyond stubs.
