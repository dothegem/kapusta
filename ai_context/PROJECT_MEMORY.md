# PROJECT MEMORY & CONTEXT CHECKSUM

## 1. Project Overview
**Name:** КАПУСТА (Chrome Extension)
**Version:** 5.0
**Purpose:** Parsing tender data from Zakupki.Kontur, Bidzaar, etc.
**Core Components:**
- `background.js`: Service worker, handles the queue, tab management, and injection of parsing scripts.
- `popup.js`: UI logic, single-page parsing, mass parsing trigger, Excel export.
- `popup.html`: The interface.

## 2. Key Technical Decisions & "What Works"
- **Parsing Logic:** The parsing logic (`extractDataOnPage`) is duplicated in `background.js` and `popup.js` (renamed `extractData`). *Reason:* `popup.js` cannot directly call background functions during `executeScript`.
- **Wait Strategy:** Fixed timeouts (e.g., `setTimeout(2500)`) failed due to race conditions. **Solution:** Implemented a polling mechanism (`waitForSelector` style) in `background.js` that checks for DOM elements every 500ms up to 10s.
- **Data Storage:** `chrome.storage.local` is the single source of truth for the queue (`linkQueue`), results (`parsingResults`), and state (`parsingState`).
- **Formatted Text:** The UI expects a `formattedText` field in the result object. The parser must explicitly generate and return this.

## 3. "What Doesn't Work" / Known Issues
- **Direct DOM Access:** The background script cannot access the DOM directly; it *must* use `chrome.scripting.executeScript`.
- **Popup Context:** The popup closes when focus is lost. Long-running tasks must be delegated to `background.js`.

## 4. Current Task Context (Resume Capability)
- **Goal:** Implement "Resume" functionality for mass parsing.
- **Mechanism:** Since `linkQueue` is already stored in `local.storage`, "Resume" simply means checking if `parsingState` was 'stopped' or if `linkQueue` is not empty, and calling `processNextLink` without resetting the queue.

## 5. Checksum & State
**Last Action:** Implemented semantic markup and fixed background parsing race condition.
**Next Steps:** Implement UI context switching (Single vs Grid) and Resume button.
**Checksum:** `[SEMANTIC_MARKUP_APPLIED] [BG_POLLING_FIXED] [LOGGING_ENABLED]`