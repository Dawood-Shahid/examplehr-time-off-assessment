# ExampleHR Time-Off Module

Employee Hub — a Next.js 14 time-off management frontend with mock HCM integration, optimistic updates, and role-based admin navigation.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **React Query v5** — server state & cache
- **Zustand** — optimistic mutation queue + reconciliation state
- **NextAuth.js** — credentials auth with JWT roles
- **MSW** — API mocking for Storybook and component tests
- **Storybook 8** — UI state documentation (Vite builder)
- **Vitest** + **Playwright** — unit & E2E tests

## Prerequisites

- **Node.js 18+** and npm

## Getting Started

```bash
npm install
```

Copy environment config (pick one):

```bash
# macOS / Linux / Git Bash
cp .env.local.example .env.local

# Windows PowerShell
Copy-Item .env.local.example .env.local
```

First-time Playwright setup (required before E2E):

```bash
npx playwright install chromium
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`. Use a [demo account](#demo-accounts) below.

Production build (optional):

```bash
npm run build
npm run start
```

## Quick verification

Run these from the repo root after `npm install` and copying `.env.local`:

| Step | Command | Notes |
|------|---------|-------|
| 1 | `npm test` | 34 Vitest tests (unit + component) |
| 2 | `npm run test:coverage` | Same tests + HTML report at `coverage/index.html` |
| 3 | `npm run test:e2e` | 12 core + 1 silent-failure Playwright tests; auto-starts app on **:3005** / **:3006** |
| 4 | `npm run test:storybook` | Builds Storybook, runs 34 story tests (9 `play()` interactions) |
| 5 | `npm run lint` | ESLint |

Manual smoke: `npm run dev` → log in as `alice@example.com` / `password` → dashboard balance cards load.

## Demo Accounts

| Email | Password | Role | Display name |
|-------|----------|------|--------------|
| alice@example.com | password | Employee | Alex Rivera |
| bob@example.com | password | Employee | Bob Smith |
| carol@example.com | password | Manager | Marcus Chen |

## Role-Based Navigation

| Tab | Employee | Manager |
|-----|----------|---------|
| Dashboard | ✓ | ✓ |
| Request Time Off | ✓ | — |
| My Requests | ✓ | — |
| Time Off Approvals | — | ✓ |

Managers are redirected away from `/request-time-off` and `/my-requests`. Employees cannot access `/approvals`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build (run `build` first) |
| `npm test` | Run Vitest unit + component tests (34 tests) |
| `npm run test:coverage` | Vitest with V8 coverage report → `coverage/index.html` |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright integration tests (12 core + 1 silent-failure; ports 3005 + 3006) |
| `npm run test:e2e:silent` | Silent-failure E2E only (port 3006, `HCM_SILENT_FAIL_RATE=1`) |
| `npm run lint` | Next.js ESLint |
| `npm run storybook` | Storybook dev server (port 6006) |
| `npm run build-storybook` | Static Storybook build → `storybook-static/` |
| `npm run test:storybook` | Build static Storybook, serve on :6006, run all story smoke + `play()` tests (34 stories, 9 interaction tests) |
| `npm run test:storybook:live` | Run `play()` tests against an already-running Storybook on port 6006 |

## Storybook Deployment

```bash
npm run build-storybook
```

Deploy the `storybook-static/` folder to Vercel or Chromatic:

```bash
npx chromatic --project-token=<your-token>
```

## HCM Mock Configuration

Environment variables in `.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | — | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | App base URL for NextAuth |
| `HCM_SILENT_FAIL_RATE` | 0.1 | Probability of silent 201 failure |
| `HCM_TIMEOUT_RATE` | 0.05 | Probability of 10s timeout |
| `HCM_CONFLICT_RATE` | 0.08 | Probability of forced 409 conflict |
| `HCM_SLOW_BATCH_MS` | 600 | Batch endpoint delay |
| `HCM_REAL_TIME_DELAY_MS` | 100 | Single-cell read delay |
| `HCM_REQUEST_DELAY_MS` | 0 | Artificial delay on `POST /request` |
| `HCM_BATCH_RATE_LIMIT_MS` | 30000 | Min interval between batch reads per session (0 = disabled) |
| `NEXT_PUBLIC_BALANCE_POLL_MS` | 60000 | Balance polling interval (E2E uses 2000) |

`.env.local.example` overrides two defaults for local dev: `NEXT_PUBLIC_BALANCE_POLL_MS=2000` and `HCM_BATCH_RATE_LIMIT_MS=0` (avoids 429s when polling faster than the batch rate limit). Set `HCM_BATCH_RATE_LIMIT_MS=30000` to exercise rate limiting; the client returns cached balances on `rate_limited` instead of erroring when prior data exists.

## Architecture

- Mock HCM lives in Next.js route handlers under `/api/hcm/*`
- In-memory store in `src/lib/hcm-store.ts` (global singleton)
- Optimistic submit flow with rollback on HCM rejection
- Manager approvals are pessimistic (wait for HCM confirmation)
- Balance snapshots frozen at approval time via `useRef` in `BalanceAtApprovalTime`
- Anniversary/year-start reconciliation via `useBalanceReconciliation` + `useDisplayBalance`
- Employee dashboard **Source of Truth** sync line uses React Query `dataUpdatedAt` (stable relative time, not per-poll `isFetching` toggles)

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/hcm/balances` | Batch balance read (employee's locations) |
| GET | `/api/hcm/balance/:emp/:loc` | Single-cell balance read |
| POST | `/api/hcm/request` | Submit time-off request |
| PATCH | `/api/hcm/request/:id` | Manager approve/deny |
| GET | `/api/hcm/requests` | Employee's own requests |
| GET | `/api/hcm/requests/pending` | Manager pending queue |
| GET | `/api/hcm/requests/history` | Manager approval history |
| POST | `/api/hcm/trigger/anniversary` | Inject anniversary bonus (test hook) |
| POST | `/api/hcm/trigger/year-reset` | Reset all balances (test hook) |
| POST | `/api/hcm/trigger/reset` | Reset HCM store to seed data (test hook) |

---

## Employee View

Key behaviors for the employee-facing experience:

- **Per-location balance cards** with progress bars, staleness badges, and configurable background polling (default 60s; example env uses 2s)
- **Source of Truth sync status** — "Last synced X ago" derived from batch fetch `dataUpdatedAt`; badges only show HCM-unavailable when there is no cached balance data
- **Optimistic request submission** — balance deducts immediately; rolls back on HCM rejection
- **Explicit uncertainty states** — submitting, unconfirmed, rolled-back, and HCM-unavailable each have distinct UI via `StalenessBadge`
- **Work-anniversary and year-start bonus handling:** when HCM grants a balance bonus mid-session (e.g. +5 days on work anniversary or year-start reset), the reconciliation hook detects the version increment on the next poll and surfaces a notice:
  - **No in-flight mutation:** "Balance updated" with a **Review updated balance** button (shows previous value until acknowledged)
  - **During in-flight mutation:** "Balance updated — tap to review" — bonus is held until the user acknowledges; optimistic deduction is not overwritten
  - Notice appears on **balance cards** and the **Projected Balance** panel on the request form
  - Request form fields (dates, location) stay intact during reconciliation

---

## Manager View

Key behaviors on `/approvals`:

- **Pending Approval Queue** — pessimistic approve/deny with `BalanceAtApprovalTime` snapshot frozen at click time
- **Approval History** — table of past approve/deny decisions via `GET /api/hcm/requests/history`, refreshed after each manager action
- Summary stat cards (pending count, team capacity, next holiday) above the queue
- **HCM Admin Controls** — in-portal panel (`ManagerControls`) to trigger an anniversary bonus (employee + location + bonus days), a year-start reset (allocation days), or a full store reset. Backed by the `/api/hcm/trigger/*` endpoints via `useHcmTriggers`; each action invalidates balance/request caches so changes surface on the next employee poll. This is the UI equivalent of the `curl` commands below.

---

## Mock HCM

The in-memory HCM store simulates real external-system behavior:

- **Real-time cell reads** — `GET /api/hcm/balance/:emp/:loc` (configurable delay)
- **Batch corpus reads** — `GET /api/hcm/balances` (slow batch + per-session rate limit)
- **Request submission** — `POST /api/hcm/request` with timeout, silent-failure, conflict, and insufficient-balance branches (evaluated in strict order)
- **Manager approval/denial** — `PATCH /api/hcm/request/:id` (pessimistic; server-side balance re-verification on approve; deny refunds deducted days)
- **Work-anniversary bonus:** `POST /api/hcm/trigger/anniversary` — increments `daysAvailable` and `version`
- **Year-start reset:** `POST /api/hcm/trigger/year-reset` — resets all balances to `allocationDays`

### Seed balances

| Key | Days |
|-----|------|
| emp-1:NYC | 12 |
| emp-1:LON | 5 |
| emp-2:NYC | 8 |
| emp-2:SYD | 15 |
| emp-1:SEA | 18.5 |
| emp-2:SEA | 10 |

`emp-1:LON = 5` matches the TRD specification.

---

## Storybook

**34 stories** across 5 files. **9** stories have `play()` interaction tests (2 anniversary, 2 request form, 1 manager approval, 4 manager controls).

### `Balance/LocationBalanceCard` (11 stories)

| Story | State |
|-------|-------|
| `Default` | Fresh balance |
| `Loading` | Skeleton |
| `Stale` | Data > 90s old |
| `Refreshing` | Background fetch |
| `OptimisticPending` | Deducted + submitting |
| `OptimisticRolledBack` | Restored after rejection |
| `AnniversaryBonusApplied` | Bonus arrived, review flow (**play test**) |
| `AnniversaryBonusDuringMutation` | Bonus during in-flight mutation (**play test**) |
| `ConflictWithPendingMutation` | Reconciliation flag set |
| `HcmUnavailable` | Error / timeout state |
| `AnniversaryBonusLiveRefetch` | MSW-driven refetch |

**Missing vs TRD:** `OptimisticConfirmed` story with play assertion.

### `Balance/StalenessBadge` (3 stories)

`Fresh`, `Stale`, `BalanceDisplayDefault`

### `Request/RequestForm` (9 stories)

`Default`, `Submitting`, `SubmittedPendingApproval`, `HcmRejectedInsufficientBalance`, `HcmRejectedInvalidDimension`, `SilentFailureDetected`, `NetworkTimeout`, `FormWithHandlers` (**play test**), `FormInsufficientBalance` (**play test**)

Stories `Submitting` through `NetworkTimeout` render `OptimisticFeedback` states without `play()` functions.

### `Manager/ManagerQueue` (6 stories)

`Empty`, `WithPendingRequests`, `BalanceSnapshotStale`, `ApprovalInFlight` (**play test**), `DenialInFlight`, `HcmRejectedOnApproval`

### `Manager/ManagerControls` (5 stories)

`Default`, `GrantBonus` (**play test**), `YearReset` (**play test**), `ResetStore` (**play test**), `TriggerError` (**play test**) — exercises the in-portal HCM admin controls against MSW trigger handlers.

---

## Integration Tests (Playwright)

`npm run test:e2e` runs two configs sequentially:

| Config | Port | Specs | Env |
|--------|------|-------|-----|
| `playwright.config.ts` | 3005 | `timeoff.spec.ts`, `manager-controls.spec.ts` | chaos rates off, 2s poll |
| `playwright.silent-failure.config.ts` | 3006 | `silent-failure.spec.ts` | `HCM_SILENT_FAIL_RATE=1` |

No need to start `npm run dev` manually — Playwright boots the app per config.

### Core suite (`timeoff.spec.ts` — 8 tests)

| # | Test | Key assertion |
|---|------|---------------|
| 1 | Happy path — submit + manager approve | Request flow completes |
| 2 | Rejection — insufficient balance | Error banner visible |
| 3 | Role nav — employee tabs | Correct sidebar links |
| 4 | Role nav — manager tabs | Approvals visible, employee tabs hidden |
| 5 | Role nav — manager blocked from employee routes | Redirect to dashboard |
| 6 | Anniversary bonus — form intact | "Balance updated" notice; form fields unchanged; review shows 17.0 |
| 7 | Anniversary bonus — dashboard card | Notice on NYC card |
| 8 | Anniversary collision — in-flight mutation | "tap to review" during submit; 17.0 not shown until acknowledged |

### Manager controls (`manager-controls.spec.ts` — 4 tests)

| # | Test | Key assertion |
|---|------|---------------|
| 9 | Grant bonus from portal | `+5 days granted` confirmation on `/approvals` |
| 10 | Year-start reset from portal | Allocation applied confirmation |
| 11 | Reset store from portal | Seed reset confirmation |
| 12 | Manager grant → employee dashboard | Employee sees balance update after manager trigger |

### Silent failure (`silent-failure.spec.ts` — 1 test)

| # | Test | Key assertion |
|---|------|---------------|
| 13 | Silent 201 failure | Unconfirmed badge; balance restored on next poll |

Run only the silent suite: `npm run test:e2e:silent`

**Collision test note:** Asserts review button disappears after acknowledge; does not assert exact final balance `(original + bonus − daysRequested)`.

---

## Triggering Mid-Session Scenarios

**In the UI (recommended):** Log in as `carol@example.com` → **Time Off Approvals** → scroll to **HCM Admin Controls** to grant a bonus, run a year reset, or reset the store.

**Via API** (against a running dev server; trigger endpoints do not require auth):

```bash
# Reset store to seed data (useful between manual tests)
curl -X POST http://localhost:3000/api/hcm/trigger/reset

# Work-anniversary bonus
curl -X POST http://localhost:3000/api/hcm/trigger/anniversary \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "emp-1", "locationId": "NYC", "bonusDays": 5}'

# Year-start balance reset
curl -X POST http://localhost:3000/api/hcm/trigger/year-reset \
  -H "Content-Type: application/json" \
  -d '{"allocationDays": 20}'
```

With default `NEXT_PUBLIC_BALANCE_POLL_MS=60000`, wait up to 60s (or lower the env var) for the UI to detect the change.

---

## Key Behavioral Notes

**Anniversary and year-start bonuses** are the primary driver of mid-session staleness. Unlike user-initiated mutations, these arrive with no warning — HCM increments the version and balance without employee action. The polling interval is the detection window.

During an in-flight mutation, the reconciliation guard holds the bonus update and shows the pre-bonus display value until the user taps **Review updated balance**. After acknowledge, the display reflects both the bonus and any pending optimistic delta.

**Silent failure detection** runs in `useBalanceQuery`: when a confirmed mutation's `snapshotVersion` matches the server version on the next poll, status transitions to `unconfirmed` and the unconfirmed badge appears. This path is covered by `tests/integration/silent-failure.spec.ts`.

---

## Test Coverage

| Layer | Count | Scope |
|-------|-------|-------|
| **Unit (Vitest)** | 24 | conflict/silent-failure/reconciliation detectors, nav items, balance state, HCM store, `useHcmTriggers` |
| **Component (RTL + MSW)** | 10 | location balance card, request form, snapshot freeze, optimistic feedback, `ManagerControls` |
| **Storybook** | 34 stories / 9 `play()` | anniversary, request form, manager approval, manager controls |
| **E2E (Playwright)** | 13 | 8 time-off flows + 4 manager controls + 1 silent-failure |

**Code coverage proof:** run `npm run test:coverage`, then open `coverage/index.html` in a browser (included in the submission zip).

---

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Dashboard, request, my-requests, approvals pages
│   ├── api/hcm/        # Mock HCM route handlers
│   └── login/
├── components/         # balance, request, manager, layout, dashboard
├── hooks/              # React Query + reconciliation hooks
├── lib/                # hcm-client, hcm-store, detectors, balance-state
├── mocks/handlers.ts   # MSW handlers (Storybook + component tests)
└── store/              # optimistic + reconciliation Zustand stores
stories/                # Storybook stories
tests/
├── unit/               # Vitest unit tests (24)
├── component/          # RTL + MSW component tests (10)
└── integration/        # Playwright E2E (timeoff + manager-controls + silent-failure)
```

---

## Submission notes

- **Zip:** submitted via Google Form per recruiter email (source only; excludes `node_modules`).
- **GitHub:** https://github.com/Dawood-Shahid/examplehr-time-off-assessment
- **TRD:** see [`TRD.md`](TRD.md)
- **Coverage:** `npm run test:coverage` → `coverage/index.html`
- **Storybook:** `npm run storybook` (port 6006)
- **Stack:** TypeScript (Next.js); compiles to JavaScript
