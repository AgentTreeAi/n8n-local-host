# Todoist + n8n Workflow Implementation Plan

> **Created:** 2026-05-27
> **Status:** BUILT — all 7 workflows deployed, awaiting activation
> **Goal:** Transform Todoist from passive task storage into an active productivity system powered by n8n automations

---

## Table of Contents

1. [Current State Audit](#current-state-audit)
2. [Todoist Reorganization](#todoist-reorganization)
3. [n8n Workflow Suite](#n8n-workflow-suite)
4. [Daily Operation Schedule](#daily-operation-schedule)
5. [Todoist Filter Reference](#todoist-filter-reference)
6. [n8n Node Reference](#n8n-node-reference)
7. [Build Order & Dependencies](#build-order--dependencies)

---

## Current State Audit

### What's working
- **21 projects** with clear categories (AgentTree, Grocery Lists, Life Improvement, Prepping, etc.)
- **35 sections** providing good sub-organization
- **17 labels** covering business, personal, and priority domains
- **Recurring tasks** set up for chores, pet care, and routine items

### What needs fixing

| Problem | Evidence | Impact |
|---|---|---|
| P1 is overloaded | 30+ P1 tasks including "Sweep" and "Dust" alongside HRA funding with a hard deadline | Brain ignores priority — everything looks equal |
| Chronic overdue tasks | 9 overdue tasks, some by 36+ days (Find a therapist since Apr 21) | Daily guilt without action; recurring overdue tasks fire every day |
| 50+ undated tasks | Prepping, Bucketlist, 2024 Goals — no dates assigned | These never surface in daily views; they're invisible |
| Inbox as junk drawer | Most active/urgent tasks live in Inbox instead of filed into projects | Projects exist but daily work doesn't flow through them |
| Labels underutilized | Only 6 of hundreds of tasks have any label | Label-based automations have nothing to trigger on |
| URGENT label misuse | Mix of time-sensitive (HRA funding) and non-urgent (Wells Fargo CC due Aug 1) | Dilutes the meaning of URGENT; notifications lose signal |

### Current overdue tasks (as of 2026-05-27)

| Task | Overdue since | Days overdue | Priority | Has deadline? |
|---|---|---|---|---|
| Find a therapist | Apr 21 | 36 days | P2 | No (recurring daily) |
| Renew Business License | May 3 | 24 days | P3 | No |
| DO HRA FUNDING | May 13 | 14 days | P1 | **Yes — May 31** |
| Whiten teeth | May 26 | 1 day | P1 | No (recurring) |
| Call Premier Dental | May 26 | 1 day | P1 | No |
| BalatroBuddy | May 16 | 11 days | P3 | No |
| AgentTree Website | May 22 | 5 days | P3 | No |
| Todays list | May 25 | 2 days | P1 | No |
| Hannah's chair return | May 26 | 1 day | P3 | No |

---

## Todoist Reorganization

### Priority reset rules

Priorities should reflect **consequence of missing**, not importance in the abstract.

| Priority | Criteria | Examples |
|---|---|---|
| **P1** | Hard deadline with real consequences (financial, legal, health) OR blocks other people | HRA Funding (deadline May 31), Renew Business License, Dobby flea meds |
| **P2** | Important this week, affects goals or relationships, no hard deadline | Call Premier Dental, AgentTree website, Find a therapist |
| **P3** | Should happen this month, low consequence if delayed | BalatroBuddy, Hannah's chair return, personal errands |
| **P4** | Someday/reference — wish lists, ideas, prep inventory | Prepping items, Bucketlist ideas, Costa Rica packing, movie lists |

**Rule of thumb:** No more than **5 active P1 tasks** at any time. If you have more, something needs to be downgraded.

### Label strategy — labels as workflow triggers

Labels serve two purposes: **human categorization** and **n8n automation triggers**. Every label should map to a workflow behavior.

| Label | Current count | Workflow behavior |
|---|---|---|
| `🚨 URGENT 🚨` | 6 tasks | Immediate Gmail notification on add |
| `AgentTree` | 6 tasks | Included in weekly business review digest |
| `Financial` | 0 tasks | Surfaces in monthly finance check email |
| `n8n` | 1 task | Included in weekly business review digest |
| `GHL` | 0 tasks | Included in weekly business review digest |
| `BalatroBuddy` | 1 task | Included in weekly business review digest |
| `calendar` | 0 tasks | Candidate for Google Calendar sync workflow |
| `error` | 0 tasks | Pipes into n8n error logging project |
| `☑️ Easily Ignored` | 1 task | Escalation: if still open after 3 days past due, bumps priority + notifies |
| `🎊 Birthdays & Anniversary 🎊` | 14 tasks | Early warning: 7-day and 1-day reminder emails |
| `low priority` | 0 tasks | Excluded from daily briefings; monthly stale check only |
| `Google Calendar` | 0 tasks | Google Calendar sync workflow |
| `NAMES` | 0 tasks | Reference only — no automation |
| `costco` | 0 tasks | Grocery run compiler includes Costco section |
| `Movies to Watch` | 0 tasks | Reference only — no automation |
| `Meal prep` | 0 tasks | Could feed into grocery list workflow |
| `soccer` | 0 tasks | Reference only — no automation |

### Suggested new labels

| Label | Purpose | Workflow trigger |
|---|---|---|
| `waiting-on` | Task is blocked on someone else | Weekly check: "still waiting?" reminder |
| `quick-win` | Takes < 15 minutes | Morning briefing highlights these when you have a light day |
| `deadline` | Has a hard external deadline | Deadline early warning workflow triggers countdown |

### Inbox cleanup protocol

Before building workflows, existing Inbox tasks should be filed:

1. Move business tasks → AgentTree project (with appropriate section)
2. Move financial tasks → tag with `Financial` label, file into relevant project
3. Move recurring personal tasks → Daily Tasks or Life Improvement
4. Move one-off errands → keep in Inbox but add due dates
5. Tasks with no clear project → evaluate if they're still relevant; delete or add to Bucketlist

---

## n8n Workflow Suite

### Workflow 1: Morning Briefing

| | |
|---|---|
| **Trigger** | Cron — daily at 7:00 AM |
| **Filter** | `(today \| overdue) & !##Housework` |
| **Output** | Gmail digest to agenttree.ai@gmail.com |
| **Priority** | Build first |

**What it does:**
- Pulls today's tasks and overdue tasks (excluding Housework project to reduce noise)
- Groups by: overdue (sorted by days overdue), today's tasks (sorted by priority)
- Highlights any tasks with `deadlineDate` approaching within 3 days
- Counts active P1 tasks — if > 5, adds a "priority overload" warning
- Formats as a clean HTML email

**Node chain:**
```
Cron Trigger
  → Todoist: Get All Tasks (filter: "(today | overdue) & !##Housework")
  → Code: Sort & group by status (overdue vs today), then by priority
  → Code: Format HTML email body
  → IF: Has tasks? (skip email on empty days)
    → true: Gmail: Send digest
    → false: No-op
```

**Email format:**
```
Subject: [Daily Briefing] May 28 — 3 overdue, 5 today

OVERDUE (action required)
  P1  DO HRA FUNDING — 15 days overdue, DEADLINE: May 31 (3 days left)
  P2  Find a therapist — 37 days overdue
  P3  Renew Business License — 25 days overdue

TODAY
  P1  Jon is spending the night — 3:00 PM
  P1  Trash Cans — 6:00 PM
  P2  Clip Vons Discount

UPCOMING DEADLINES
  May 31 — DO HRA FUNDING (3 days)
  Sep 02 — DOBBY NEX GUARD AUTOREFILL (98 days)

P1 count: 8 active — consider downgrading 3+ tasks
```

---

### Workflow 2: Overdue Escalator

| | |
|---|---|
| **Trigger** | Cron — daily at 9:00 PM |
| **Filter** | `overdue & !recurring` |
| **Output** | Auto-label + Gmail notifications |
| **Priority** | Build second |

**What it does:**
- Pulls all non-recurring overdue tasks
- Calculates days overdue for each
- Applies escalation tiers:

| Days overdue | Action |
|---|---|
| 3-6 days | Add `🚨 URGENT 🚨` label if not already present |
| 7-13 days | Gmail: "Week overdue: [task name]" |
| 14+ days | Gmail: "Stale alert — reschedule, delegate, or delete: [task name]" |

**Node chain:**
```
Cron Trigger (9 PM daily)
  → Todoist: Get All Tasks (filter: "overdue & !recurring")
  → Code: Calculate days overdue, assign escalation tier
  → Switch: Route by tier
    → 3-6 days: HTTP Request → Todoist REST API: Add URGENT label
    → 7-13 days: Gmail: "Week overdue" email
    → 14+ days: Gmail: "Stale alert" email with action options
```

**Important:** Exclude recurring tasks — a daily recurring task like "Whiten teeth" being 1 day overdue is normal, not an emergency. Only escalate non-recurring tasks that are genuinely slipping.

---

### Workflow 3: Deadline Early Warning

| | |
|---|---|
| **Trigger** | Cron — daily at 10:00 AM |
| **Filter** | Tasks with `deadlineDate` field set |
| **Output** | Countdown Gmail notifications |
| **Priority** | Build third |

**What it does:**
- Pulls all tasks that have a `deadlineDate` (hard external deadline)
- Calculates days remaining
- Sends escalating notifications:

| Days until deadline | Notification |
|---|---|
| 7 days | Single email: "One week until [task] deadline" |
| 3 days | Daily email: "3 DAYS LEFT: [task]" |
| 1 day | Morning + evening email: "TOMORROW: [task]" |
| 0 (deadline day) | "TODAY IS THE DEADLINE: [task]" |
| Past deadline | "MISSED DEADLINE: [task] — [X] days ago" |

**Node chain:**
```
Cron Trigger (10 AM daily)
  → Todoist: Get All Tasks (filter: "all")  // need all tasks to check deadlineDate
  → Code: Filter to tasks with deadlineDate, calculate days remaining
  → Code: Group by urgency tier
  → IF: Any deadlines within 7 days?
    → true: Gmail: Send deadline countdown email
    → false: No-op
```

**Current tasks this would catch:**
- DO HRA FUNDING — deadlineDate: 2026-05-31
- DOBBY NEX GUARD AUTOREFILL — deadlineDate: 2026-09-02

---

### Workflow 4: Weekly Review Prompt

| | |
|---|---|
| **Trigger** | Cron — Sunday at 6:00 PM |
| **Filter** | Multiple pulls (completed this week, overdue, next week) |
| **Output** | Gmail review digest |
| **Priority** | Build fourth |

**What it does:**
- Pulls 3 datasets:
  1. Tasks completed in the last 7 days (via Todoist completed tasks API)
  2. Currently overdue tasks
  3. Tasks due next week
- Compiles into a reflection + planning email

**Email format:**
```
Subject: [Weekly Review] May 25-31 — X completed, Y overdue, Z next week

COMPLETED THIS WEEK
  - Task 1 (Project)
  - Task 2 (Project)
  Total: X tasks completed

STILL OVERDUE
  - Task 1 — X days overdue
  - Task 2 — X days overdue
  Suggest: reschedule, break into subtasks, or delete

NEXT WEEK
  Mon: Task 1, Task 2
  Tue: Task 3
  ...

P1 HEALTH CHECK
  Active P1 count: X
  Recommendation: [OK / Overloaded — downgrade Y tasks]

LABEL COVERAGE
  Tasks with no label: X
  Consider labeling for better automation routing
```

**Node chain:**
```
Cron Trigger (Sunday 6 PM)
  → [Parallel]
    → Todoist: Get completed tasks (last 7 days)
    → Todoist: Get All Tasks (filter: "overdue")
    → Todoist: Get All Tasks (filter: "next 7 days")
  → Merge: Combine datasets
  → Code: Format weekly review HTML
  → Gmail: Send review email
```

---

### Workflow 5: Stale Task Detector

| | |
|---|---|
| **Trigger** | Cron — Monday at 8:00 AM |
| **Filter** | `no date & !##Prepping List & !##School Schedule & !##MOVIES & !##Downloads` |
| **Output** | Gmail "review or archive" report |
| **Priority** | Build fifth |

**What it does:**
- Pulls undated tasks from active projects (excludes reference/inventory projects)
- Flags tasks that have been sitting without updates for 30+ days
- Groups by project
- Sends a "take action or archive" email

**Exclusion list** (projects that are intentionally undated reference material):
- Prepping List (inventory tracking)
- School Schedule (course catalog)
- MOVIES (watch list)
- Downloads (reference)
- Bucketlist (aspirational, no dates expected)

**Node chain:**
```
Cron Trigger (Monday 8 AM)
  → Todoist: Get All Tasks (filter: "no date")
  → Code: Filter out excluded projects, check task age
  → IF: Any stale tasks found?
    → true: Gmail: "Review or archive" report
    → false: No-op
```

---

### Workflow 6: Label-Smart Notifications

| | |
|---|---|
| **Trigger** | Webhook — receives Todoist webhook events |
| **Output** | Routed notifications by label |
| **Priority** | Build sixth (replaces current URGENT workflow) |

**What it does:**
- Receives Todoist webhook payloads when tasks are created or updated
- Routes notifications based on label:

| Label detected | Action |
|---|---|
| `🚨 URGENT 🚨` | Immediate Gmail with task details |
| `Financial` | Add to weekly finance digest (store in n8n data table or variable) |
| `AgentTree` / `n8n` / `GHL` / `BalatroBuddy` | Add to weekly business review digest |
| `☑️ Easily Ignored` | Schedule a follow-up check 3 days after due date |
| `🎊 Birthdays & Anniversary 🎊` | Send reminder 7 days before and 1 day before due date |
| `calendar` / `Google Calendar` | Trigger Google Calendar event creation |

**Node chain:**
```
Webhook Trigger (POST /todoist-webhook)
  → Code: Parse event, extract labels
  → Switch: Route by label
    → URGENT branch: Gmail immediate notification
    → Financial branch: Store for digest
    → Business branch: Store for digest
    → Easily Ignored branch: Schedule delayed check
    → Birthday branch: Calculate reminder dates, schedule
    → Calendar branch: Google Calendar create event
```

**Todoist webhook setup:**
- Register at: https://developer.todoist.com/appconsole.html
- Events to subscribe: `item:added`, `item:updated`
- Webhook URL: `https://n8n.workflowsolution.org/webhook/todoist-webhook`

---

### Workflow 7: Grocery Run Compiler

| | |
|---|---|
| **Trigger** | Webhook — on-demand (button/shortcut) |
| **Filter** | `##Grocery Lists` |
| **Output** | Formatted Gmail with shopping list |
| **Priority** | Build seventh (quality of life) |

**What it does:**
- Pulls all uncompleted tasks from the Grocery Lists project
- Groups by section: Vons, Amazon, Costco, Target
- Sends a clean, phone-friendly email

**Project ID:** `6P4H33XvJ37FrfCH`

**Section IDs:**
| Store | Section ID |
|---|---|
| Vons | `68rmW3xf7G3qppcq` |
| Amazon | `68rpFq5F3Ph6cw8q` |
| Costco | `68vQM5WwjqhCJpmH` |
| Target | `68rpVFvmHVGMg9vq` |

**Email format:**
```
Subject: Shopping List — May 28

VONS
  - Item 1
  - Item 2

COSTCO
  - Item 1

AMAZON
  - Item 1
  - Item 2

TARGET
  - Item 1

Total items: X
```

---

## Daily Operation Schedule

| Time | Workflow | What you see |
|---|---|---|
| 7:00 AM | Morning Briefing | Email: today's tasks, overdue items, approaching deadlines |
| 10:00 AM | Deadline Early Warning | Email: countdown for any tasks with hard deadlines within 7 days |
| Real-time | Label-Smart Notifications | Instant Gmail when URGENT label is added; routed alerts for other labels |
| 9:00 PM | Overdue Escalator | Auto-labels overdue tasks; emails for chronic overdue items |
| **Sunday 6 PM** | Weekly Review Prompt | Reflection email: completed, overdue, next week, P1 health check |
| **Monday 8 AM** | Stale Task Detector | Email: undated tasks in active projects needing review |
| **On demand** | Grocery Run Compiler | Email: formatted shopping list grouped by store |

---

## Todoist Filter Reference

These are the exact filter strings to use in n8n Todoist node's `filters.filter` field.

| Purpose | Filter string |
|---|---|
| Today + overdue (no housework) | `(today \| overdue) & !##Housework` |
| Only overdue, non-recurring | `overdue & !recurring` |
| Next 7 days | `next 7 days` |
| Only P1 tasks | `p1` |
| Only URGENT labeled | `@🚨 URGENT 🚨` |
| Undated tasks | `no date` |
| AgentTree business tasks | `##AgentTree` |
| Grocery list items | `##Grocery Lists` |
| Tasks with a specific label | `@labelname` |
| Overdue P1 tasks | `overdue & p1` |
| Due within 3 days | `3 days` |
| High priority + overdue | `(p1 \| p2) & overdue` |
| All tasks in a section | Use `sectionId` parameter instead of filter |

**Note on the URGENT label:** The label name includes emoji — `🚨 URGENT 🚨`. When using the Todoist REST API or filter strings, use the full name with emoji. When using n8n's `labelId` filter parameter, use ID `2176495198` instead.

---

## n8n Node Reference

### Key node types needed

| Node | Use case | typeVersion |
|---|---|---|
| `n8n-nodes-base.scheduleTrigger` | Cron-based workflows (morning briefing, escalator, etc.) | Check via `get_node` before building |
| `n8n-nodes-base.todoist` | Pull tasks with filters | 2.2 |
| `n8n-nodes-base.gmail` | Send notification emails | 2.2 |
| `n8n-nodes-base.webhook` | Receive Todoist webhooks, on-demand triggers | 2.1 |
| `n8n-nodes-base.if` | Conditional routing | 2.3 |
| `n8n-nodes-base.switch` | Multi-branch label routing | Check via `get_node` |
| `n8n-nodes-base.code` | Formatting, date math, grouping logic | 2 |
| `n8n-nodes-base.merge` | Combine parallel Todoist pulls | Check via `get_node` |
| `n8n-nodes-base.httpRequest` | Todoist REST API calls (update labels, etc.) | Check via `get_node` |

**Always run `get_node` before placing any node** — never guess parameter names or typeVersions.

### Credentials needed

| Credential | Purpose | Status |
|---|---|---|
| Todoist API key | Pull tasks via n8n Todoist node | `9phgu8r8c5dNtDZC` — exists in n8n |
| Gmail OAuth2 | Send notification emails | `tAz2Z1W3R4tplbjc` — exists in n8n |
| Todoist REST API (via HTTP Request) | Update tasks/labels programmatically | Use API token in HTTP Request node headers |

### Deployment rules (from CLAUDE.md)

1. Always `get_node` before placing a node
2. `search_templates` first to find proven patterns
3. `validate_workflow` with `profile: "strict"` before deploying
4. **Check if workflow name exists before creating** — use `GET /api/v1/workflows` first, then `PUT` to update or `POST` to create. Never create duplicates.
5. All workflows need `"settings": {"executionOrder": "v1"}`
6. One workflow per intent — fix and retry, never duplicate

---

## Build Order & Dependencies

```
Phase 1 — Immediate value (build first)
  1. Morning Briefing         — standalone, no dependencies
  2. Overdue Escalator        — standalone, no dependencies

Phase 2 — Deadline protection
  3. Deadline Early Warning   — standalone, no dependencies

Phase 3 — Reflection & hygiene
  4. Weekly Review Prompt     — needs completed tasks API access
  5. Stale Task Detector      — standalone, no dependencies

Phase 4 — Smart routing (replaces current URGENT workflow)
  6. Label-Smart Notifications — needs Todoist webhook registration
  7. Grocery Run Compiler      — standalone, on-demand

Pre-requisite for all:
  - Todoist priority cleanup (reset P1 overload)
  - Label existing tasks so workflows have data to act on
  - Delete/archive the 5 duplicate Todoist URGENT workflows in n8n
```

### What to do before building anything

1. ~~**Reset priorities** on current tasks using the rules above~~ **DONE** — P1 count reduced from 50+ to 6
2. ~~**Add labels** to unlabeled tasks in active projects~~ **DONE** — `deadline`, `Financial`, `waiting-on` applied; 3 new labels created (`waiting-on`, `quick-win`, `deadline`)
3. **Reschedule or delete** chronically overdue tasks — SKIPPED per user request (no date changes)
4. ~~**Move Inbox tasks** into their proper projects~~ **DONE** — 6 AgentTree business tasks moved with proper sections
5. ~~**Archive duplicate workflows** in n8n~~ **DONE** — all 5 duplicates already archived/inactive
6. ~~**Add `deadlineDate`** to tasks with real external deadlines~~ **DONE** — Wells Fargo CC (Aug 1), Business License (Jun 30)

---

## Deployed Workflow Registry

| # | Workflow | n8n ID | Trigger | Webhook URL | Status |
|---|---|---|---|---|---|
| 1 | Todoist Morning Briefing | `XXacpWi4IeE0woNa` | Daily 7:00 AM | — | Inactive |
| 2 | Todoist Overdue Escalator | `d2vg7POcRLC1wnmu` | Daily 9:00 PM | — | Inactive |
| 3 | Todoist Deadline Early Warning | `1R1wBEaCwz0CYTpi` | Daily 10:00 AM | — | Inactive |
| 4 | Todoist Weekly Review | `U1i3kRbrejmxB5yE` | Sunday 6:00 PM | — | Inactive |
| 5 | Todoist Stale Task Detector | `3I8ttHD2ZC3EUwUL` | Monday 8:00 AM | — | Inactive |
| 6 | Todoist Label-Smart Notifications | `q5gn6FypAylSnD9u` | Webhook | `POST /webhook/todoist-label-router` | Inactive |
| 7 | Todoist Grocery Run Compiler | `ldEfAb6LT7eD60uS` | Webhook | `POST /webhook/grocery-run` | Inactive |

**Workflow JSON files:** `workflows/` directory in this repo
