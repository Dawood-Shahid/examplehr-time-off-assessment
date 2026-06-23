# Technical Requirements Document (TRD)

## ExampleHR — Time-Off Management Module ("Employee Hub")

| Field | Value |
|-------|-------|
| Document version | 1.1 |
| Status | Baseline + alternatives analysis |
| Date | 2026-06-05 |
| Owner | Frontend Platform |
| Component | `task` (Next.js 14 App Router frontend + mock HCM backend) |
| Source of truth | This repository (`src/`, `tests/`, `stories/`) |

---

## 1. Introduction

### 1.1 Purpose

This document specifies the technical requirements for the **Time-Off Management Module** of ExampleHR ("Employee Hub"). It defines the system's functional behavior, architecture, data contracts, non-functional requirements, failure-handling semantics, and verification strategy.

The module lets employees view per-location leave balances and submit time-off requests with **optimistic UI updates**, and lets managers approve or deny those requests **pessimistically**. Its distinguishing engineering concern is **correctly representing uncertainty** when the system of record (a Human Capital Management / HCM system) is slow, unreliable, or mutates balances out-of-band (work-anniversary grants, year-start resets).

### 1.2 Scope

**In scope**
- Employee dashboard with per-location balance cards and sync status.
- Time-off request submission with optimistic deduction and rollback.
- Manager approval queue and approval history (pessimistic confirmation).
- A **mock HCM backend** implemented as Next.js route handlers backed by an in-memory store, deliberately injecting real-world failure modes (timeout, silent failure, conflict, rate limiting).
- Authentication and role-based authorization (employee vs. manager).
- Mid-session reconciliation of out-of-band balance changes.
- Test, mocking, and component-documentation tooling (Vitest, Playwright, Storybook, MSW).

**Out of scope**
- A real HCM integration (the mock is the only backend).
- A persistent database (state is in-memory and resets on server restart).
- Multi-tenant configuration, payroll, scheduling, or accrual policy engines.
- Production-grade secrets management, observability, or horizontal scaling.

### 1.3 Definitions & Glossary

| Term | Meaning |
|------|---------|
| **HCM** | Human Capital Management system — the external system of record for leave balances. Here, mocked. |
| **Balance cell** | A single `(employeeId, locationId)` balance record. Keyed `"<emp>:<loc>"`. |
| **Optimistic update** | UI applies a mutation's effect locally before the server confirms. |
| **Pessimistic update** | UI waits for server confirmation before reflecting the change. |
| **Silent failure** | HCM returns HTTP `201 Created` but does not actually persist the mutation (no version increment). |
| **Out-of-band change / background bonus** | A balance change originating from HCM (anniversary grant, year-start reset) with no user action. |
| **Reconciliation** | Detecting and surfacing an out-of-band balance change against in-flight local state. |
| **Source of Truth sync** | The "last synced X ago" indicator derived from the batch read timestamp. |
| **Version** | A monotonically increasing integer on each balance cell, incremented on every server-side mutation; the primary signal for change detection. |

### 1.4 References

- `README.md` — operator/developer guide and behavioral catalog.
- Source modules under `src/` cited inline as `path:line`.
- Test suites under `tests/` and `stories/`.

---

## 2. System Overview

### 2.1 Architecture summary

The application is a single Next.js 14 (App Router) deployment that contains **both** the client UI and a **mock HCM backend** (route handlers under `src/app/api/hcm/*`). There is no separate backend service.

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js 14 (App Router)                                       │
│                                                               │
│  ┌──────────────┐   React Query    ┌──────────────────────┐  │
│  │  Client UI    │ ───────────────▶ │  /api/hcm/* route     │  │
│  │  (RSC + CSR)  │ ◀─────────────── │  handlers (mock HCM)  │  │
│  └──────┬───────┘    JSON / HTTP    └─────────┬────────────┘  │
│         │                                      │               │
│   Zustand stores                       in-memory HCM store     │
│   (optimistic +                        (global singleton,      │
│    reconciliation)                      src/lib/hcm-store.ts)  │
│                                                               │
│  NextAuth (JWT, credentials)  +  Edge middleware (RBAC)       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology stack

| Concern | Technology | Version (from `package.json`) |
|---------|-----------|-------------------------------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | ^5 |
| UI runtime | React / React DOM | ^18 |
| Server state / cache | TanStack React Query | ^5.101.0 |
| Client state | Zustand | ^5.0.14 |
| Auth | NextAuth.js (credentials, JWT) | ^4.24.14 |
| Styling | Tailwind CSS | ^3.4.1 |
| Icons | lucide-react | ^1.17.0 |
| Schema validation | ajv | ^8.20.0 |
| API mocking | MSW | ^2.14.6 |
| Component docs | Storybook (Vite builder) | ^8.6.x |
| Unit/component tests | Vitest + Testing Library + jsdom | ^1.6.0 |
| E2E tests | Playwright | ^1.60.0 |

### 2.3 Deployment model

- Single Node.js process (`next dev` / `next start`). Default port 3000.
- HCM state is an **in-memory global singleton** (`globalThis`-attached maps) — it survives hot-reload within a process but is **not** durable across restarts and is **not** shared across instances. The system is therefore single-instance by design.
- Storybook builds to a static bundle (`storybook-static/`) deployable independently (Vercel / Chromatic).

### 2.4 Design decisions & alternatives considered

This section records the main architectural forks evaluated for the assignment's core tensions: **fast UI vs HCM truth**, **optimistic employee submit vs pessimistic manager approve**, and **reconciling background HCM changes with in-flight user actions**.

#### 2.4.1 Optimistic vs pessimistic mutation strategy

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Optimistic everywhere** | Uniform UX; instant feedback for employees and managers | Manager could show "approved" before HCM rejects; violates "never tell approved then denied" for approvals | Rejected for manager flow |
| **Pessimistic everywhere** | Always server-authoritative | Employee submit feels slow; balance does not update until round-trip completes | Rejected for employee submit |
| **Hybrid (chosen)** | Employee gets instant deduct + explicit uncertainty states; manager waits for HCM `PATCH` confirmation | Two mental models in one app; more state-machine surface area | **Selected** — matches persona needs in the PDF |

**Implementation:** `useSubmitRequest` applies optimistic cache writes + Zustand mutation queue; `useManagerApproval` invalidates only after server success with no local balance mutation.

#### 2.4.2 Server state: React Query vs alternatives

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **TanStack React Query (chosen)** | Built-in cache, invalidation, polling, `dataUpdatedAt` for sync line | Learning curve for mutation + optimistic patterns | **Selected** |
| **SWR** | Simpler API, good polling | Less structured mutation/rollback ergonomics for multi-key invalidation | Considered; rejected for mutation complexity |
| **Redux Toolkit Query** | Centralized store | Heavier boilerplate for a focused module | Rejected — scope does not justify global slice |

**Cache invalidation strategy:** On request settle, invalidate the affected single-cell key, batch balances, and employee request list (`useSubmitRequest.onSettled`). Background polling uses `refetchInterval` from `NEXT_PUBLIC_BALANCE_POLL_MS`. Batch reads use `staleTime: 30s`; on `429 rate_limited`, the client returns cached batch data rather than surfacing an error when prior data exists.

#### 2.4.3 Client mutation state: Zustand vs alternatives

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Zustand (chosen)** | Minimal API; separate stores for optimistic mutations vs reconciliation holds | Not time-travel debuggable like Redux DevTools out of the box | **Selected** |
| **React Query mutation state only** | Single source of truth | Hard to represent cross-poll reconciliation holds + silent-failure lifecycle across components | Rejected |
| **React Context** | No extra dependency | Re-render churn; harder to test pure detectors separately | Rejected |

#### 2.4.4 Reconciling background refresh with in-flight user action

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Overwrite with server value immediately** | Simple | Clobbers optimistic deduct mid-submit; confuses user | Rejected |
| **Block all polls during mutation** | Stable display | Misses anniversary bonus detection window | Rejected |
| **Hold + acknowledge (chosen)** | Preserves user intent; surfaces "Balance updated — tap to review"; after ack applies `max(0, incoming + delta)` | Extra UI and Zustand reconciliation store | **Selected** |

**Detection:** `reconciliation-detector.ts` (version up + days changed, no pending mutation) and `conflict-detector.ts` (same signal during pending mutation → hold). **Silent failure:** separate path — `silent-failure-detector.ts` compares post-confirm poll version to `snapshotVersion`; transitions to `unconfirmed` with Retry/re-sync.

#### 2.4.5 Component tree mapping to concerns

```
Pages (route shells)
├── /dashboard          → EmployeeDashboard | ManagerDashboard
├── /request-time-off   → RequestForm + ProjectedBalancePanel
├── /my-requests        → MyRequestsView
└── /approvals          → ManagerQueue (queue + ManagerControls + ApprovalHistory)

Data / state hooks (concern layer)
├── useBalancesBatch / useBalanceQuery     → HCM reads, polling, silent-failure check
├── useSubmitRequest                       → optimistic deduct + rollback
├── useManagerApproval                     → pessimistic PATCH
├── useBalanceReconciliation               → out-of-band bonus detection
└── useDisplayBalance                      → held vs acknowledged display value

Pure logic (unit-tested)
├── balance-state.ts, *-detector.ts        → display state + edge detection

Presentation (Storybook-documented)
├── LocationBalanceCard / StalenessBadge   → per-cell display + badges
├── OptimisticFeedback                     → submit uncertainty feedback
├── BalanceAtApprovalTime                  → frozen manager snapshot
└── ManagerControls                        → test-hook triggers on /approvals
```

---

## 3. Actors & Roles

| Actor | Role | Capabilities |
|-------|------|--------------|
| Employee | `employee` | View own balances; submit time-off requests; view own request history. |
| Manager | `manager` | View pending approval queue; approve/deny requests; view approval history. |
| Test harness / operator | n/a | Invoke trigger endpoints to inject anniversary bonus, year reset, and store reset. |

### 3.1 Seed identities (`src/lib/mock-users.ts`)

| ID | Email | Password | Role | Title | Locations |
|----|-------|----------|------|-------|-----------|
| emp-1 | alice@example.com | password | employee | Senior Engineer | LON, NYC |
| emp-2 | bob@example.com | password | employee | Frontend Developer | NYC, SYD |
| mgr-1 | carol@example.com | password | manager | Engineering Manager | NYC, LON, SYD, SEA |

> Credentials are plaintext mock data for demo/testing only — see §10.

---

## 4. Functional Requirements

Requirements use **MUST / SHOULD / MAY** (RFC 2119). Each carries a stable ID.

### 4.1 Authentication & Authorization

| ID | Requirement |
|----|-------------|
| **FR-AUTH-1** | The system MUST authenticate users via NextAuth credentials provider against the mock user table; invalid credentials MUST yield no session. (`src/lib/auth-options.ts:13`) |
| **FR-AUTH-2** | Sessions MUST use JWT strategy; the token MUST carry `role`, `locationIds`, and `title`, exposed on `session.user`. (`src/lib/auth-options.ts:31`) |
| **FR-AUTH-3** | Unauthenticated access to any protected route (`/dashboard`, `/request-time-off`, `/my-requests`, `/approvals`) MUST redirect to `/login`. (`src/middleware.ts:16`) |
| **FR-AUTH-4** | Authenticated users visiting `/login` MUST be redirected to `/dashboard`. (`src/middleware.ts:20`) |
| **FR-AUTH-5** | Managers MUST be redirected to `/dashboard` if they access `/request-time-off` or `/my-requests`. (`src/middleware.ts:28`) |
| **FR-AUTH-6** | Employees MUST be redirected to `/dashboard` if they access `/approvals`. (`src/middleware.ts:24`) |
| **FR-AUTH-7** | Navigation MUST render role-appropriate tabs only (see §4.2 table). (`src/hooks/useNavItems.ts`) |
| **FR-AUTH-8** | All HCM API routes MUST reject unauthenticated requests with `401 unauthorized`. (e.g. `src/app/api/hcm/request/route.ts:10`) |

### 4.2 Role-based navigation

| Tab | Route | Employee | Manager |
|-----|-------|:-------:|:-------:|
| Dashboard | `/dashboard` | ✓ | ✓ |
| Request Time Off | `/request-time-off` | ✓ | — |
| My Requests | `/my-requests` | ✓ | — |
| Time Off Approvals | `/approvals` | — | ✓ |

### 4.3 Employee — Balance viewing

| ID | Requirement |
|----|-------------|
| **FR-BAL-1** | The dashboard MUST display one balance card per location the employee belongs to (`session.user.locationIds`). (`src/app/api/hcm/balances/route.ts:32`) |
| **FR-BAL-2** | Each card MUST show available days, a progress indicator, and a staleness/sync badge. |
| **FR-BAL-3** | Balances MUST be refreshed by background polling on a configurable interval (`NEXT_PUBLIC_BALANCE_POLL_MS`, default 60000 ms). (`src/lib/poll-interval.ts`, `src/hooks/useBalanceQuery.ts:20`) |
| **FR-BAL-4** | A "Source of Truth" sync line MUST display "Last synced X ago" derived from the batch query `dataUpdatedAt` — it MUST NOT flicker per-poll on `isFetching`. |
| **FR-BAL-5** | An HCM-unavailable badge MUST be shown only when there is **no** cached balance data; if cached data exists, it MUST be displayed instead of an error. |
| **FR-BAL-6** | Each balance card MUST resolve to exactly one display state from the defined set (see §6.3). (`src/lib/balance-state.ts:27`) |
| **FR-BAL-7** | A balance whose `updatedAt` age exceeds 90000 ms MUST render the `stale` state (when no higher-priority state applies). (`src/lib/balance-state.ts:50`) |

### 4.4 Employee — Request submission (optimistic)

| ID | Requirement |
|----|-------------|
| **FR-REQ-1** | The request form MUST capture location, leave type, start/end dates, computed days requested, and optional notes. (`src/components/request/RequestForm.tsx`) |
| **FR-REQ-2** | On submit, the system MUST optimistically deduct `daysRequested` from the cached balance **before** the server responds. (`src/hooks/useSubmitRequest.ts:25`) |
| **FR-REQ-3** | On submit, an optimistic mutation record MUST be enqueued with status `pending`, a client-generated id, the delta, and the snapshot `version` at submit time. (`src/hooks/useSubmitRequest.ts:34`) |
| **FR-REQ-4** | On HTTP success, the mutation MUST transition `pending → confirmed` and store the server `requestId`. (`src/hooks/useSubmitRequest.ts:47`) |
| **FR-REQ-5** | On HTTP error, the cached balance MUST be restored from the pre-mutation snapshot and the mutation MUST transition `pending → rolled_back`. (`src/hooks/useSubmitRequest.ts:51`) |
| **FR-REQ-6** | On settle (success or error), the system MUST invalidate the affected single-cell balance, the batch balances, and the employee's request list. (`src/hooks/useSubmitRequest.ts:61`) |
| **FR-REQ-7** | The UI MUST expose distinct feedback for each terminal/transient state: submitting, pending-approval, rolled-back (with reason), unconfirmed, and HCM-unavailable. (`src/components/request/OptimisticFeedback.tsx`) |
| **FR-REQ-8** | A Projected Balance panel MUST reflect the optimistic deduction and react to reconciliation events. (`src/components/dashboard/ProjectedBalancePanel.tsx`) |

### 4.5 Silent-failure detection

| ID | Requirement |
|----|-------------|
| **FR-SF-1** | After a mutation is `confirmed`, on the next balance poll the system MUST compare the server balance `version` against the mutation's `snapshotVersion`; if they are equal, the mutation MUST transition `confirmed → unconfirmed`. (`src/lib/silent-failure-detector.ts:4`, `src/hooks/useBalanceQuery.ts:32`) |
| **FR-SF-2** | The `unconfirmed` state MUST surface a distinct badge indicating the request may not have been persisted by HCM. (`src/components/balance/StalenessBadge.tsx`) |
| **FR-SF-3** | Silent-failure detection MUST NOT run for non-confirmed mutations or for mutations without a captured `snapshotVersion`. (`src/lib/silent-failure-detector.ts:8`) |
| **FR-SF-4** | An `unconfirmed` request MUST offer a user-facing **Retry / re-sync** recovery action. Invoking it MUST retire the stale unconfirmed mutation and resubmit the original request payload to HCM. (`src/components/request/OptimisticFeedback.tsx`, `src/components/request/RequestForm.tsx` — `handleRetry`) |

### 4.6 Out-of-band reconciliation (anniversary / year-start)

| ID | Requirement |
|----|-------------|
| **FR-RC-1** | The system MUST detect a background bonus when an incoming balance has a **higher version** AND a **different `daysAvailable`** than the previously held balance. (`src/lib/reconciliation-detector.ts:3`) |
| **FR-RC-2** | When a background change is detected and there is **no in-flight (pending) mutation** for that cell, the UI MUST show a "Balance updated" notice with a **Review updated balance** action and MUST continue displaying the previous value until acknowledged. |
| **FR-RC-3** | When a background change is detected **during an in-flight mutation** for that cell, the system MUST hold the bonus, show "Balance updated — tap to review", and MUST NOT overwrite the optimistic deduction until acknowledged. (`src/lib/conflict-detector.ts:5` → `surface_conflict`) |
| **FR-RC-4** | The reconciled display value after acknowledgement MUST equal `max(0, incomingDays + mutationDelta)`. (`src/lib/reconciliation-detector.ts:14`) |
| **FR-RC-5** | Reconciliation notices MUST appear on both balance cards and the Projected Balance panel. |
| **FR-RC-6** | Request form field values (dates, location, leave type) MUST remain intact across a reconciliation event. |

### 4.7 Manager — Approvals (pessimistic)

| ID | Requirement |
|----|-------------|
| **FR-MGR-1** | The approvals page MUST list all `pending` requests in a queue. (`src/app/api/hcm/requests/pending/route.ts`) |
| **FR-MGR-2** | Approve/deny MUST be pessimistic: the UI MUST reflect the decision only after the server confirms via `PATCH /api/hcm/request/:id`. (`src/hooks/useManagerApproval.ts`) |
| **FR-MGR-3** | Each pending row MUST display a balance snapshot **frozen at the moment the approve/deny control is engaged** (not re-read live). (`src/components/manager/BalanceAtApprovalTime.tsx`) |
| **FR-MGR-4** | On approve, the server MUST re-verify balance is non-negative before marking `approved`; otherwise return `409 insufficient_balance`. (`src/app/api/hcm/request/[id]/route.ts:33`) |
| **FR-MGR-5** | On deny, the server MUST refund `daysRequested` to the balance, increment `version`, and mark the request `denied`. (`src/app/api/hcm/request/[id]/route.ts:37`) |
| **FR-MGR-6** | Acting on a non-`pending` request MUST return `409 hcm_conflict`. (`src/app/api/hcm/request/[id]/route.ts:24`) |
| **FR-MGR-7** | Approval history MUST be displayed and refreshed after each manager action via `GET /api/hcm/requests/history`. (`src/components/manager/ApprovalHistory.tsx`) |
| **FR-MGR-8** | Summary stat cards (pending count, team capacity, next holiday) MUST appear above the queue. |
| **FR-MGR-9** | The approvals page MUST provide an **HCM Admin Controls** panel letting a manager trigger, from the portal: an anniversary bonus (employee + location + bonus days), a year-start reset (allocation days), and a full store reset. Each action MUST invalidate balance and request caches so changes surface on the next poll. (`src/components/manager/ManagerControls.tsx`, `src/hooks/useHcmTriggers.ts`) |

### 4.8 Mock HCM backend behavior

| ID | Requirement |
|----|-------------|
| **FR-HCM-1** | `POST /api/hcm/request` MUST enforce, in strict order: auth (401) → role/identity (403) → optional configured delay → timeout branch (504) → silent-failure branch (201, no persistence) → conflict branch (409) → insufficient-balance (409) → success (201, persists + version++). (`src/app/api/hcm/request/route.ts`) |
| **FR-HCM-2** | A submitter MUST only submit for their own `employeeId` and MUST have role `employee`; otherwise `403 forbidden`. (`src/app/api/hcm/request/route.ts:18`) |
| **FR-HCM-3** | `GET /api/hcm/balances` MUST enforce a per-session rate limit (`HCM_BATCH_RATE_LIMIT_MS`, default 30000 ms); a violation MUST return `429 rate_limited`. (`src/app/api/hcm/balances/route.ts:18`) |
| **FR-HCM-4** | The batch read MUST apply an artificial latency (`HCM_SLOW_BATCH_MS`, default 600 ms) and return only the caller's location cells. (`src/app/api/hcm/balances/route.ts:26`) |
| **FR-HCM-5** | On `429 rate_limited`, the client MUST return previously cached balances if available rather than surfacing an error. |
| **FR-HCM-6** | `GET /api/hcm/balance/:emp/:loc` MUST return a single cell with configurable delay (`HCM_REAL_TIME_DELAY_MS`, default 100 ms). |
| **FR-HCM-7** | Every server-side balance mutation MUST increment `version` and update `updatedAt`. (`src/app/api/hcm/request/route.ts:53`) |

### 4.9 Trigger / test-hook endpoints

| ID | Requirement |
|----|-------------|
| **FR-TRG-1** | `POST /api/hcm/trigger/anniversary` MUST increment a cell's `daysAvailable` by `bonusDays` and increment `version`. (`src/app/api/hcm/trigger/anniversary/route.ts`) |
| **FR-TRG-2** | `POST /api/hcm/trigger/year-reset` MUST reset all balances to `allocationDays` and increment versions. (`src/app/api/hcm/trigger/year-reset/route.ts`) |
| **FR-TRG-3** | `POST /api/hcm/trigger/reset` MUST restore the HCM store to seed data. (`src/app/api/hcm/trigger/reset/route.ts`, `src/lib/hcm-store.ts:125`) |
| **FR-TRG-4** | Trigger endpoints are dual-purpose: test hooks (Playwright) and the backing API for the manager **HCM Admin Controls** panel (FR-MGR-9). `anniversary` and `year-reset` require an authenticated session; `reset` currently requires none (see §10 — known risk, acceptable only for non-production). |

---

## 5. API Specification

All HCM routes are JSON over HTTP under `/api/hcm`. Auth is enforced via NextAuth server session unless noted.

### 5.1 Endpoint catalog

| Method | Path | Auth | Role | Purpose |
|--------|------|------|------|---------|
| GET | `/api/hcm/balances` | ✓ | employee | Batch balance read (caller's locations), rate-limited + slow. |
| GET | `/api/hcm/balance/:emp/:loc` | ✓ | any | Single-cell balance read. |
| POST | `/api/hcm/request` | ✓ | employee (self) | Submit time-off request. |
| PATCH | `/api/hcm/request/:id` | ✓ | manager | Approve / deny request. |
| GET | `/api/hcm/requests` | ✓ | employee | Caller's own requests. |
| GET | `/api/hcm/requests/pending` | ✓ | manager | Pending approval queue. |
| GET | `/api/hcm/requests/history` | ✓ | manager | Approval/denial history. |
| POST | `/api/hcm/trigger/anniversary` | ✗ (hook) | — | Inject anniversary bonus. |
| POST | `/api/hcm/trigger/year-reset` | ✗ (hook) | — | Reset all balances to allocation. |
| POST | `/api/hcm/trigger/reset` | ✗ (hook) | — | Reset store to seed. |
| `[...nextauth]` | `/api/auth/*` | — | — | NextAuth handlers. |

### 5.2 Representative contracts

**`POST /api/hcm/request`**

Request body (`SubmitRequestInput`):
```json
{
  "employeeId": "emp-1",
  "locationId": "NYC",
  "leaveType": "annual",
  "daysRequested": 3,
  "startDate": "2026-07-01",
  "endDate": "2026-07-03",
  "notes": "optional"
}
```
Success `201`:
```json
{ "requestId": "<uuid>", "status": "created" }
```
Errors: `401 {error:"unauthorized"}`, `403 {error:"forbidden"}`, `504 {error:"timeout"}`, `409 {error:"hcm_conflict"}`, `409 {error:"insufficient_balance"}`.

> A `201` response is **not** proof of persistence — the silent-failure branch returns `201` without mutating state. Persistence is confirmed only by a subsequent `version` increment (see FR-SF-1).

**`PATCH /api/hcm/request/:id`**

Body: `{ "action": "approve" | "deny" }` → returns the updated `HcmRequest`.
Errors: `401`, `403`, `404 not_found`, `409 hcm_conflict` (non-pending), `409 insufficient_balance` (approve guard).

### 5.3 Error code enumeration (`src/types/hcm.ts:61`)

`unauthorized` (401) · `forbidden` (403) · `not_found` (404) · `insufficient_balance` (409) · `hcm_conflict` (409) · `timeout` (504) · `rate_limited` (429)

---

## 6. Data Model & State

### 6.1 Core entities (`src/types/hcm.ts`)

```ts
Balance      { daysAvailable: number; version: number; updatedAt: string }
BalanceCell  Balance & { employeeId; locationId; locationName; reconciliationPending? }
HcmRequest   { id; employeeId; employeeName; employeeTitle; locationId; locationName;
               leaveType; daysRequested; startDate; endDate; notes?; status; createdAt }
```

- `LeaveType` ∈ `annual | sick | personal | professional_dev | unpaid`
- `RequestStatus` ∈ `pending | approved | denied`
- `Role` ∈ `employee | manager`
- Balance store key: `"<employeeId>:<locationId>"` (`src/lib/hcm-store.ts:131`)

### 6.2 Optimistic mutation model (`src/types/optimistic.ts`)

```ts
OptimisticMutation {
  id: string                 // client-generated
  employeeId, locationId
  delta: number              // negative for a deduction
  status: 'pending' | 'confirmed' | 'rolled_back' | 'unconfirmed'
  submittedAt: number
  serverRequestId?: string
  snapshotVersion?: number   // server version captured at submit time
}
```
Managed by a Zustand store (`src/store/optimistic-store.ts`) plus a reconciliation store (`src/store/reconciliation-store.ts`).

### 6.3 Balance display state machine (`src/lib/balance-state.ts:27`)

Resolved by priority (first match wins):

1. `hcm-unavailable` — query error.
2. `optimistic-pending` — mutation pending.
3. `optimistic-rolled-back` — mutation rolled back.
4. `unconfirmed` — silent failure detected.
5. `optimistic-confirmed` — mutation confirmed.
6. `reconciliation-pending` — held background change.
7. `refreshing` — background fetch in flight.
8. `balance-refreshed` — current > previous (bonus applied).
9. `stale` — age > 90000 ms.
10. `fresh` — default.

### 6.4 Seed data (`src/lib/hcm-store.ts:13`)

Balances: `emp-1:NYC=12`, `emp-1:LON=5`, `emp-2:NYC=8`, `emp-2:SYD=15`, `emp-1:SEA=18.5`, `emp-2:SEA=10`.
Plus seeded pending requests and approval history entries.

> The earlier seed divergence (`emp-1:LON`) has been resolved: code, tests, and this document all use `5`, matching the original specification. (`src/lib/hcm-store.ts:17`, `tests/unit/hcm-store.test.ts:10`)

---

## 7. Non-Functional Requirements

### 7.1 Performance & responsiveness

| ID | Requirement |
|----|-------------|
| **NFR-PERF-1** | Optimistic deduction MUST render without waiting on the network (perceived latency ≈ 0 for the local effect). |
| **NFR-PERF-2** | Background polling MUST be configurable; production default 60000 ms, test default 2000 ms. |
| **NFR-PERF-3** | React Query `staleTime` MUST be 30000 ms and `gcTime` 300000 ms for single-cell balances. (`src/hooks/useBalanceQuery.ts:19`) |
| **NFR-PERF-4** | Batch reads MUST be rate-limited to protect the (simulated) HCM; the client MUST degrade to cached data rather than error on 429. |

### 7.2 Reliability & correctness

| ID | Requirement |
|----|-------------|
| **NFR-REL-1** | Every uncertain state (submitting, unconfirmed, rolled-back, HCM-unavailable, reconciliation-pending) MUST be visually distinct and unambiguous. |
| **NFR-REL-2** | The UI MUST never silently present an optimistic value as confirmed truth; confirmation requires a server version signal. |
| **NFR-REL-3** | Out-of-band changes MUST never clobber in-flight user intent without explicit acknowledgement. |
| **NFR-REL-4** | Manager approval MUST be server-authoritative (pessimistic) — no optimistic approval. |

### 7.3 Security (target posture)

| ID | Requirement |
|----|-------------|
| **NFR-SEC-1** | All data endpoints MUST authenticate and authorize by role and identity. |
| **NFR-SEC-2** | JWT signing secret MUST be supplied via `NEXTAUTH_SECRET` (never hardcoded). |
| **NFR-SEC-3** | Trigger/test-hook endpoints MUST be disabled or authenticated in any non-development environment (currently a gap — see §10). |

### 7.4 Maintainability & testability

| ID | Requirement |
|----|-------------|
| **NFR-MNT-1** | Detection logic (conflict, silent failure, reconciliation, balance state) MUST be pure functions, independently unit-testable. (`src/lib/*-detector.ts`, `src/lib/balance-state.ts`) |
| **NFR-MNT-2** | UI states MUST be documented and visually testable in Storybook with MSW-mocked data. |
| **NFR-MNT-3** | Critical flows MUST be covered by E2E tests with chaos rates disabled for determinism. |

### 7.5 Configurability

All chaos and timing parameters MUST be environment-driven (see §9). Defaults MUST produce a usable demo without configuration.

### 7.6 Compatibility

- Modern evergreen browsers (Chromium baseline; Playwright runs Chromium).
- Node.js runtime compatible with Next.js 14.2.x.

---

## 8. Failure-Mode Specification (Mock HCM Chaos)

The mock deliberately reproduces real HCM pathologies. Branch order in `POST /request` is **normative**.

| Failure | Trigger | HTTP | Client handling |
|---------|---------|------|-----------------|
| Timeout | `Math.random() < HCM_TIMEOUT_RATE` (default 0.05) → 10 s delay | 504 | Rollback + `hcm-unavailable`/timeout feedback. |
| Silent failure | `Math.random() < HCM_SILENT_FAIL_RATE` (default 0.10) → 201, no persist | 201 | Confirmed → later `unconfirmed` when version unchanged (FR-SF-1). |
| Conflict | `Math.random() < HCM_CONFLICT_RATE` (default 0.08) | 409 `hcm_conflict` | Rollback + conflict feedback. |
| Insufficient balance | `balance < daysRequested` | 409 `insufficient_balance` | Rollback + insufficient-balance banner. |
| Rate limited | Batch called within `HCM_BATCH_RATE_LIMIT_MS` | 429 `rate_limited` | Serve cached balances (FR-HCM-5). |

Evaluation order matters: timeout is checked before silent failure, which is checked before conflict, which is checked before the real balance check. Tests pin these rates to 0 (or 1, for the silent-failure suite) for determinism.

---

## 9. Configuration

Environment variables (`.env.local`; example overrides in `.env.local.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXTAUTH_SECRET` | — (required) | JWT signing secret. |
| `NEXTAUTH_URL` | `http://localhost:3000` | App base URL for NextAuth. |
| `HCM_SILENT_FAIL_RATE` | 0.10 | Probability of silent 201 failure. |
| `HCM_TIMEOUT_RATE` | 0.05 | Probability of 10 s timeout. |
| `HCM_CONFLICT_RATE` | 0.08 | Probability of forced 409 conflict. |
| `HCM_SLOW_BATCH_MS` | 600 | Batch endpoint latency. |
| `HCM_REAL_TIME_DELAY_MS` | 100 | Single-cell read latency. |
| `HCM_REQUEST_DELAY_MS` | 0 | Artificial delay on `POST /request`. |
| `HCM_BATCH_RATE_LIMIT_MS` | 30000 | Min interval between batch reads per session (0 disables). |
| `NEXT_PUBLIC_BALANCE_POLL_MS` | 60000 | Balance polling interval (E2E uses 2000). |

The example file sets `NEXT_PUBLIC_BALANCE_POLL_MS=2000` and `HCM_BATCH_RATE_LIMIT_MS=0` to avoid 429s during fast local polling.

---

## 10. Risks, Constraints & Known Gaps

| # | Item | Impact | Disposition |
|---|------|--------|-------------|
| R-1 | Trigger endpoints are not role-gated; `reset` requires no session at all. | Any authenticated user (or, for `reset`, anyone) can mutate/reset balances. Role-gating was deliberately **not** added because the E2E suite drives these triggers from an employee page context. | Acceptable for dev/test only; MUST be role-gated (manager) before any shared deployment (NFR-SEC-3), with the E2E triggers refactored to a manager-authenticated context. |
| R-2 | Plaintext credentials in `mock-users.ts`. | Not production-safe. | Demo fixture; replace with real IdP for production. |
| R-3 | In-memory, single-instance store. | No durability; no horizontal scale; data resets on restart. | By design for the mock; real HCM integration is the productionization path. |
| R-4 | ~~Seed divergence from earlier TRD (`emp-1:LON`: 5 vs 22.5).~~ | Spec/impl mismatch. | **Resolved** — code and tests now seed `emp-1:LON=5` to match the spec. |
| R-5 | Collision E2E asserts review-button disappearance, not exact final balance. | Slightly weaker guarantee on `original + bonus − requested`. | Tracked test-coverage gap. |
| R-6 | ~~Missing `OptimisticConfirmed` Storybook story with play assertion.~~ | Reduced visual coverage of confirmed state. | **Resolved** — `LocationBalanceCard/OptimisticConfirmed` story with play assertion added. |

---

## 11. Verification & Acceptance

### 11.1 Test layers (current state per README/repo)

| Layer | Tooling | Coverage |
|-------|---------|----------|
| Unit | Vitest | Conflict, silent-failure, reconciliation detectors; nav items; balance state; HCM store; HCM trigger hooks (`useHcmTriggers`). |
| Component | RTL (+ MSW where applicable) | Location balance card, request form, snapshot freeze, optimistic feedback, **manager controls** (`ManagerControls`, 6 tests). |
| Storybook interaction | `@storybook/test` `play()` | Anniversary applied / during mutation, optimistic confirmed, request form handlers / insufficient balance / silent-failure retry, approval in flight, **manager controls** (grant / year-reset / reset / error) — 11 total. |
| E2E | Playwright | Core flows + silent-failure suite + **manager controls** (`manager-controls.spec.ts`: grant / year-reset / reset from portal, and a manager-grant → employee-dashboard cross-context check). |

### 11.2 E2E acceptance scenarios

Run against `http://localhost:3005` with chaos disabled and 2 s poll (silent-failure suite runs on port 3006 with `HCM_SILENT_FAIL_RATE=1`).

1. Happy path — submit + manager approve completes.
2. Rejection — insufficient balance shows error banner.
3. Role nav — employee tabs correct.
4. Role nav — manager tabs correct; employee tabs hidden.
5. Role nav — manager blocked from employee routes (redirect).
6. Anniversary bonus — form intact; "Balance updated" notice; review shows updated value.
7. Anniversary bonus — dashboard card shows notice.
8. Anniversary collision — "tap to review" during submit; bonus value not shown until acknowledged.
9. (Silent-failure suite) — confirmed mutation transitions to the unconfirmed badge.

### 11.3 Definition of Done

A change is acceptable when: all Vitest suites pass; relevant Storybook `play()` interactions pass; the E2E core suite + silent-failure suite pass; `npm run lint` is clean; and any new uncertain UI state is represented in both `balance-state.ts` and Storybook.

---

## 12. Project Structure (reference)

```
src/
├── app/
│   ├── (app)/          # dashboard, request-time-off, my-requests, approvals
│   ├── api/hcm/        # mock HCM route handlers
│   └── login/
├── components/         # balance, request, manager, layout, dashboard, auth
├── hooks/              # React Query + reconciliation hooks
├── lib/                # hcm-client, hcm-store, detectors, balance-state, auth-options
├── middleware.ts       # RBAC route guards
├── mocks/handlers.ts   # MSW handlers (Storybook + component tests)
├── store/              # optimistic + reconciliation Zustand stores
└── types/              # hcm, optimistic, next-auth augmentation
stories/                # Storybook stories
tests/{unit,component,integration}
```

---

## 13. Traceability Summary

| Capability | Requirements | Primary source | Verification |
|------------|--------------|----------------|--------------|
| Auth & RBAC | FR-AUTH-1..8 | `auth-options.ts`, `middleware.ts` | E2E 3–5; unit (nav) |
| Balance view | FR-BAL-1..7 | `useBalanceQuery.ts`, `balances/route.ts`, `balance-state.ts` | Storybook (cards); unit (state) |
| Optimistic submit | FR-REQ-1..8 | `useSubmitRequest.ts`, `request/route.ts` | E2E 1–2; component; Storybook |
| Silent failure | FR-SF-1..3 | `silent-failure-detector.ts`, `useBalanceQuery.ts` | unit; silent-failure E2E |
| Reconciliation | FR-RC-1..6 | `reconciliation-detector.ts`, `conflict-detector.ts` | E2E 6–8; unit; Storybook |
| Manager approval | FR-MGR-1..8 | `request/[id]/route.ts`, `useManagerApproval.ts` | E2E 1; Storybook (queue) |
| Manager admin controls | FR-MGR-9 | `ManagerControls.tsx`, `useHcmTriggers.ts` | unit (hooks), component, Storybook (controls), E2E (manager-controls) |
| Silent-failure recovery | FR-SF-4 | `OptimisticFeedback.tsx`, `RequestForm.tsx` | silent-failure E2E; component (feedback) |
| Mock HCM / chaos | FR-HCM-1..7, §8 | `request/route.ts`, `balances/route.ts` | configured-rate tests |
| Triggers | FR-TRG-1..4 | `trigger/*` routes, `hcm-store.ts` | E2E setup hooks + manager-controls |
```
