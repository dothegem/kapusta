# Project Memory (Graph Simulation)

## Ontology Nodes

### User
*   **Observations:** [Waiting for input]

### Projects
*   **Contains:** CAPUSTA

### CAPUSTA (Project)
*   **Type:** Chrome Extension
*   **Description:** Калькулятор охраны с автопарсингом и CRM для тендеров
*   **Observations:**
    *   Artifact: `src/manifest.json` (v2.1.0)
    *   Artifact: `src/calc_spec.yaml` (Configuration as Code for calculations)
    *   Artifact: `src/calculator.js` (Core logic)
*   **Technology:**
    *   JavaScript (Vanilla)
    *   Chrome Extension Manifest V3
    *   YAML (Specification)
*   **Environment:**
    *   Target: Chrome Browser
    *   Permissions: `activeTab`, `scripting`, `storage`, `tabs`
    *   Host Permissions: `zakupki.kontur.ru`, `bidzaar.com`

### ImportantNotice
*   **Memory Guide:** Follow `.kilocode/rules-code/memory_guide.md` for memory updates.
*   **Interaction Protocol:** Strict adherence to `.kilocode/rules/rules.md` regarding role distribution and code generation.