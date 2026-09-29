# Finance Tracker

A frontend personal finance workspace built with React, strict TypeScript and Vite. Track income and expenses, manage monthly category budgets, and explore spending trends. The frontend runs independently with fictional data saved in browser localStorage. No backend is required.

## Run locally

Requires Node.js 22.14+ and npm. From `frontend`:

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Navigation uses hash URLs (`#/dashboard`, `#/transactions`, `#/budgets`, `#/analytics`, `#/categories`, `#/settings`), so refresh and browser history work without server rewrite rules.

```sh
npm run build       # strict TypeScript check and production build
npm run lint        # ESLint, TypeScript and React hook checks
npm test            # Vitest domain and local-adapter tests
npm run test:e2e    # Playwright browser workflows, uses installed Chrome
npm run format     # Prettier
```

The browser test configuration starts its own development server on port 5180 when necessary. If Chrome is unavailable, install Playwright Chromium (`npx playwright install chromium`) and remove `channel: "chrome"` from `playwright.config.ts`.

## Features

- Dashboard: available balance through today, selected-month income/expenses/savings, six-month income-versus-expense chart, category breakdown, recent transactions and budget progress.
- Transactions: create/edit/delete with confirmation, inline validation, description search, type/category/date filters, four sort options and incremental list loading.
- Budgets: limits per category per calendar month, remaining amounts, progress, near-limit/over-budget text, and create/edit/delete workflows.
- Analytics: 3/6/12-month views, savings trend, category distribution, top categories and month-over-month comparison. The selected current month may be incomplete.
- Categories: custom names, icons, colors and types. Referenced categories cannot be deleted or change type until their transactions/budgets are reassigned or removed.
- Settings: EUR/USD/GBP display preference, clearly labeled as symbol changes without currency conversion.
- Responsive desktop/sidebar and mobile/menu navigation, keyboard dialogs, chart data tables, empty/error/loading states, local success feedback.

## Architecture

```text
frontend/src/
  app.tsx                 Shell, hash navigation and dialog coordination
  pages/                  Dashboard, Transactions, Budgets, Analytics, Categories, Settings
  components/             Shared UI, dialogs, forms, transaction list, budget progress, charts
  context/FinanceContext  Async loading/mutations, shared data and success feedback
  services/               FinanceService contract and local adapter
  data/seed.ts            Central fictional fixture, 12 months relative to first use
  types/finance.ts        Domain types and money conventions
  utils/                  Financial/date/formatting/filtering/validation functions
```

React Context owns a single `FinanceData` snapshot. Every successful service mutation returns updated data, and all views derive their values from it. No chart contains an independent dataset. The provider accepts an injected service for the next phase. Chart-heavy pages are lazy loaded; Recharts is the only chart library. Fonts ship locally. Icons are small reusable SVGs; no icon dependency was needed.

Money is represented as positive integer cents with an explicit income/expense type. The amount parser rejects exponent notation, non-finite values, zero, negatives and more than two decimals. Current supported currencies all use two decimal places. Dates are ISO calendar strings, grouped/filtered lexically, and formatted at local noon to avoid UTC date shifts. Balance starts at zero and is the net sum of recorded transactions through today; it is not a bank balance. Future-dated entries appear in their selected month but are excluded from available balance.

The local adapter persists one versioned document under `finance-tracker.local.v1`. It validates saved records, preserves invalid storage rather than silently overwriting it, and reports save failures. Separate browser tabs reload shared data on storage events. Local storage is suitable for fictional development data; it is not a secure vault, cloud backup, or multi-user database. Clearing storage removes edits; first use then seeds sample records again.

## Backend integration points (next phase)

Implement the `FinanceService` interface in `frontend/src/services/financeService.ts` with a separate HTTP adapter and inject it into `FinanceProvider` from `app.tsx`. Keep integer-cent domain values and category IDs at this boundary. The UI and derived calculations can remain in place.

| Service operation | Proposed HTTP boundary |
| --- | --- |
| `load()` | GET `/api/transactions`, `/api/budgets`, `/api/categories`, `/api/settings`, assembled into `FinanceData` |
| `saveTransaction(value)` | POST `/api/transactions` or PUT `/api/transactions/:id` |
| `deleteTransaction(id)` | DELETE `/api/transactions/:id` |
| `saveBudget(value)` | POST `/api/budgets` or PUT `/api/budgets/:id` |
| `deleteBudget(id)` | DELETE `/api/budgets/:id` |
| `saveCategory(value)` | POST `/api/categories` or PUT `/api/categories/:id` |
| `deleteCategory(id)` | DELETE `/api/categories/:id` |
| `saveSettings(value)` | PUT `/api/settings` |

Mutation methods must return the authoritative updated `FinanceData` snapshot (or refetch it internally). Replace temporary client IDs with server IDs at the adapter boundary. Map API validation and network failures to rejected promises so existing forms keep user input and show errors. Enforce category references, transaction types and uniqueness of `(categoryId, month)` on the server as well. Add request cancellation/concurrency handling when remote writes are introduced. Define authentication, opening balances, currency conversion and pagination contracts in that phase; none are simulated here.

The existing `backend/finance-tracker` Spring Boot project is preserved unchanged. Its legacy `/api/expenses` model has decimal amounts and free-text categories; it does not yet implement this domain contract. No backend/database/authentication work was added.

## Development report

Original foundation: React + ReactDOM, strict TypeScript, Vite and plain responsive CSS; one expense component with direct fetch calls, component state and an inline Expense model. No router, chart library, reusable component library, frontend test runner or lint script. A Java Spring Boot in-memory expense API and context-load test already existed.

Changes: retained the React/Vite/TypeScript/CSS foundation and backend, extracted domain and service layers, introduced a shared provider, six page modules, a reusable shell, forms/dialogs, local adapter, calculated charts, design tokens, responsive layouts and validation. No Redux, authentication, API simulation or deployment infrastructure was introduced.

Tests cover financial arithmetic and formatting, invalid money/date handling, inclusive filters, category aggregation, month boundaries, budget thresholds and duplicates, validation, storage persistence/failure/corruption, CRUD and category reference protection. Browser workflows cover forms, persistence, confirmations, linked totals, category/budget/settings management, chart periods, empty/error states, mobile navigation, modal keyboard behavior and viewport overflow.

Remaining frontend work: no known blocker in this requested local-demo scope. Before production, perform broader assistive-technology and cross-browser testing, decide on secure data export/import and an explicit opening balance, and adapt the service boundary to the finalized API contract. The current display currency setting deliberately does not convert values.

## Author

Rayen Brigui — Computer Science student at Otto von Guericke University Magdeburg

## Validation results (27 September 2026)

- Production build: passed; chart code is split from the main bundle, with no bundle-size warning.
- ESLint: passed without warnings or errors.
- Vitest: 27 tests passed across 2 files.
- Playwright/Chrome: 5 end-to-end tests passed, including all six pages at 320, 768, 1024 and 1440px with no horizontal page overflow.
- Desktop and 320px mobile dashboard screenshots visually inspected. Browser console/runtime error assertions passed during the transaction workflow.
- npm dependency audit: zero reported vulnerabilities after compatible updates.
- Backend diff: unchanged. Existing untracked `outputs/` files were preserved.

Screenshots are generated at `frontend/test-results/dashboard-desktop.png` and `frontend/test-results/dashboard-mobile.png` by the browser suite. Test artifacts are ignored by Git.

## Budget items and breakdowns

Budgets now support either a simple `limit` or nested `items: BudgetItem[]`. Each item has a stable `id`, `name` and integer-cent `limit`; ownership is defined by nesting within its budget. A detailed budget never stores a second parent limit: `calculateBudgetLimit` derives it from the children. Validation prevents duplicate item names (ignoring case/outer whitespace), duplicate item IDs, empty breakdowns, and invalid or oversized limits.

The Budgets page shows collapsed parent cards by default. **View breakdown** reveals compact child rows with spending, limit, percentage and textual status, plus a separate **Unassigned** row. Disclosure state survives page navigation for the current app session. The Dashboard continues to show only parent summaries.

In Add/Edit Budget, choose **Simple budget** or **Budget with breakdown**. Add/remove/rename items and edit their limits; the total updates while typing and all views update when saved. Existing saved budgets remain unchanged. To add detail to an existing Housing budget, choose Edit budget → Budget with breakdown. New workspaces seed Housing with Rent, Internet, Electricity, Insurance and Other, plus realistic assigned and unassigned expenses. Groceries, Transportation, Entertainment and Shopping remain simple budgets.

Transactions have an optional `budgetItemId`. The transaction form offers items only from the budget matching the expense's category and calendar month. Changing type/category/month clears incompatible selection. Older transactions without this field remain valid. Parent spending includes all expense transactions in the matching category/month exactly once. Child spending includes only matching item IDs; the difference between parent spending and assigned child spending is displayed as Unassigned. The named Other item is an ordinary assignable item, separate from Unassigned.

Saving a budget edit reconciles assignments atomically with the budget snapshot. Removing an item, deleting the budget, converting it to simple, or changing its category/month clears incompatible item IDs while preserving transaction amounts, categories and dates. Renaming an item or changing its limit preserves valid assignments. These rules are explained in the form and delete confirmation. Storage write failures preserve the previous snapshot. The existing version-1 local data format remains readable; no reseeding or destructive migration runs on saved workspaces.

Backend follow-up: persist nested items through `saveBudget`, return their stable IDs, and include optional `budgetItemId` on transaction endpoints. Enforce one budget per category/month, unique item IDs and names, positive integer-cent limits, and valid matching item references. Budget edits/deletions and clearing affected references must commit atomically. Derive parent totals rather than persisting a duplicate limit. The existing injectable `FinanceService` remains the integration boundary; no backend code was changed.
