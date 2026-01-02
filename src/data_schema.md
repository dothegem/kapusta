# Data Schema Definition

Based on `.info/fields.txt` and `.info/main_data.txt`.

## 1. Price List Item (`window.Data.priceList`)
Used for pre-defined calculation rows.

| Field | Type | Description | Mapping in logic |
|---|---|---|---|
| `id` | number | Unique ID | |
| `name` | string | Short description | `Краткое описание` |
| `region` | string | Region | `Регион` |
| `weapon` | boolean | Has weapon? | `Оружие` (Да/—) |
| `shift` | string | Shift type (object, hostel, no) | `Вахта` |
| `hours` | number | Daily hours (e.g. 12, 24) | `Режим, часы` |
| `hoursMonth` | number | Hours per month | `ч.ч в мес` |
| `rateHour` | number | Rate per hour | `В час` |
| `rateMonth` | number | Rate per month | `В месяц` |
| `salary` | number | Guard salary/rate | `Ставка` |
| `desc` | string | Full description | `Описание` |

## 2. Calculation Row (`window.Calculator.state.rows`)
Represents a line item in the "Security Calculation" table.

| Field | Type | Description |
|---|---|---|
| `priceId` | number | Link to Price List Item |
| `description` | string | Short description (editable) |
| `hours` | number | Mode (12/24) |
| `hoursMonth` | number | Hours per month |
| `rateHour` | number | Rate per hour |
| `months` | number | Duration in months |
| `count` | number | Number of posts/guards |
| `salary` | number | Guard salary (cost base) |
| `address` | string | **NEW** Address of the object |
| `uniform` | string | **NEW** Uniform type |

## 3. Extra Expense Item (`window.Calculator.state.extraRows`)
Represents additional costs.

| Field | Type | Description |
|---|---|---|
| `name` | string | Expense name |
| `unit` | string | **NEW** Unit (pcs, day, month) |
| `vatType` | string | **NEW** VAT Type (vat, no_vat, cash) |
| `price` | number | Price per unit |
| `quantity` | number | Quantity |
| `type` | string | Frequency ('monthly', 'once') - Derived from unit logic? |

*Note: `fields.txt` mentions `unit` (sht, den, mes) and `vat type` (nds, bez nds, nal). Current calculator uses `type` ('monthly', 'once'). We should map `unit` to frequency logic or keep them separate.*

## 4. Constants (`window.Rules.constants`)
Extracted from `full_calc_logic`.

| Constant | Value | Description |
|---|---|---|
| `avgDaysMonth` | 30.5 | Used for daily rate -> monthly salary |
| `avgWorkDays` | 29.3 | Used for vacation calc |
| `ndflRate` | 0.13 | 13% |
| `pfrRate` | 0.30 | 30% (Pension) |
| `fssRate` | 0.002 | 0.2% (Social) |
| `vatRateLow` | 0.07 | 7% |
| `vatRateHigh` | 0.22 | 22% (As per calc logic, usually 20%) |
| `usnRate` | 0.06 | 6% |
| `profitTaxRate` | 0.25 | 25% (2025 rate) |
| `dividendTaxRate` | 0.15 | 15% |
| `cashOutComission`| 0.1765 | ~17.6% (1/0.85 * 0.15) |
| `cashOutRiskCom` | 0.282 | ~28.2% (1/78 * 22) |
