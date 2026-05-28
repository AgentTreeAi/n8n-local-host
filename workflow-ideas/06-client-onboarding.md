# 06 — Client Onboarding Automator

## Pitch

"A deal closes. Within 5 minutes: the client gets a branded welcome email, a project workspace is created, the intake form is sent, kickoff is scheduled, and your team has their tasks assigned. Nobody had to remember anything."

## The Problem

- Client onboarding is the highest-stakes moment in the relationship — first impressions set the tone
- Most agencies/service businesses rely on manual checklists that someone forgets to follow
- The gap between "deal closed" and "kickoff scheduled" is where excitement dies and buyer's remorse creeps in
- New clients slip through the cracks during busy weeks — no one sends the welcome email for 3 days
- Every onboarding is slightly different because there's no enforced process

## Target Verticals

- **Agencies** (primary) — Client onboarding is a core ops process that directly impacts retention
- **AgentTree internal use** — Run this for your own client onboarding to prove you practice what you preach
- **Service businesses scaling** — Any business going from 5 to 50 clients/month needs automated onboarding

## Flow Architecture

```
[Webhook / CRM Trigger] — deal stage changed to "Closed Won"
       |
[HTTP Request] — pull full deal + contact details from CRM
  - Client name, company, email, phone
  - Service package purchased
  - Deal value, payment status
  - Sales notes / special requirements
       |
[Set Node] — build onboarding context object
  - Project name, client slug, package details
  - Assigned team members (based on package type)
  - Timeline milestones
       |
--- parallel paths ---
|          |          |          |
|          |          |          |
v          v          v          v

[Gmail]    [HTTP]     [HTTP]     [HTTP]
Welcome    Create     Create     Assign
email      Slack      project    team
sequence   channel    folder     tasks
|          |          |          |
|          |          |          |
Day 0:     #client-   Google     Based on
Welcome +  {{name}}   Drive or   package
what to    with       Notion     template
expect     pinned     workspace
|          context
|
Day 1:
Intake
form
link
|
Day 3:
Kickoff
scheduling
link

--- merge ---
       |
[IF Node] — intake form completed?
  |              |
  yes            no (after 48h)
  |              |
  Continue       [SMS + Email reminder]
  |              "Hey {{name}}, quick reminder
  |               to fill out the intake form
  |               so we can prep for kickoff: {{link}}"
  |              |
  |         [Wait 24h more]
  |              |
  |         [IF still not done]
  |              |
  |         [Notify assigned team member
  |          to follow up personally]
       |
[Execute Sub-workflow: Notification Hub]
  - "medium": new client onboarded successfully
  - "high": intake form overdue, needs human follow-up
       |
[Execute Sub-workflow: Error Handler]
```

## Node Inventory

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.webhook` | Deal closed trigger | Path: `/webhook/deal-closed` or CRM webhook |
| `n8n-nodes-base.httpRequest` | Pull deal details | CRM API |
| `n8n-nodes-base.set` | Build onboarding context | Normalize all data |
| `n8n-nodes-base.gmail` | Welcome email (Day 0) | Branded HTML template |
| `n8n-nodes-base.gmail` | Intake form email (Day 1) | With form link |
| `n8n-nodes-base.gmail` | Kickoff scheduling (Day 3) | With Calendly/Cal.com link |
| `n8n-nodes-base.slack` | Create Slack channel | Slack API: conversations.create |
| `n8n-nodes-base.slack` | Post pinned context | Client details + project scope |
| `n8n-nodes-base.httpRequest` | Create project workspace | Google Drive / Notion API |
| `n8n-nodes-base.httpRequest` | Create + assign tasks | Todoist / project mgmt API |
| `n8n-nodes-base.wait` | Wait for intake form | Webhook resume or timed check |
| `n8n-nodes-base.if` | Intake form check | Completed or overdue? |
| `n8n-nodes-base.httpRequest` | Reminder SMS | Twilio |
| `n8n-nodes-base.executeWorkflow` | Notification Hub | `9MwRgAbGAHLTfThi` |
| `n8n-nodes-base.executeWorkflow` | Error Handler | `RdB2EbQZ71hjMUuE` |

## Sub-Workflow Integration

- **Error Handler** — onboarding failures are high-stakes; if the welcome email doesn't send, you need to know immediately
- **Notification Hub** — alerts the team when a new client is onboarded (celebration + awareness) and when intake forms are overdue
- **Retry with Backoff** — wrap Slack channel creation and Google Drive/Notion API calls; these can flake

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| HubSpot or GoHighLevel | API Key / OAuth | Deal trigger + contact data |
| Gmail | OAuth2 | Welcome email sequence |
| Slack | OAuth2 | Channel creation + messages |
| Google Drive or Notion | OAuth2 / API Key | Project workspace |
| Todoist or Asana | API Key / OAuth | Task assignment |
| Twilio | API Key | Reminder SMS |
| Calendly or Cal.com | API Key | Kickoff scheduling link |

## Email Sequence Design

### Day 0 — Welcome (send immediately)

```
Subject: Welcome to AgentTree — here's what happens next

Hey {{first_name}},

We're fired up to get started on {{project_description}}.

Here's your quick roadmap:

  Today: You'll get access to your project workspace
  Tomorrow: We'll send over a short intake form (10 min)
  Day 3: We'll schedule your kickoff call

Your team:
  Project lead: {{lead_name}} ({{lead_email}})
  Slack channel: #client-{{slug}} (invite coming shortly)

If you need anything before then, reply here or message us on Slack.

Talk soon,
Connor
AgentTree
```

### Day 1 — Intake Form

```
Subject: Quick intake form — 10 minutes, max

Hey {{first_name}},

Before our kickoff, I need a few details to make sure we build
exactly what you need (and skip the discovery questions on the call).

Fill this out when you get a chance: {{intake_form_url}}

Takes about 10 minutes. The more detail you give us on your current
tools and pain points, the sharper our plan will be on the kickoff.

Connor
```

### Day 3 — Kickoff Scheduling

```
Subject: Let's get your kickoff on the calendar

Hey {{first_name}},

Time to schedule your kickoff call. This is where we walk through
the system architecture, confirm integrations, and set your timeline.

Grab a slot that works: {{calendly_link}}

Calls are typically 45 minutes. Come with questions — this is your
session to shape the build.

Connor
```

## Demo Script

### Setup

1. Set up a test deal in CRM ready to move to "Closed Won"
2. Have Slack open to show channel creation
3. Have email inbox visible

### Live Demo (90 seconds)

1. **Say:** "Watch what happens when I close this deal." Move the deal to Closed Won in the CRM.
2. **Show email arrive** within 30 seconds — branded welcome with the roadmap.
3. **Show Slack** — new channel created, context pinned.
4. **Show task board** — team tasks auto-assigned with due dates.
5. **Say:** "Tomorrow the intake form goes out automatically. If they don't fill it out in 48 hours, they get a reminder. If they still don't, your team gets pinged to follow up personally."
6. **Ask:** "How does your onboarding work today?" (Usually: "Someone sends an email... eventually.")
7. **Close:** "This is the first thing every new client experiences. It sets the tone for the entire engagement. And nobody on your team has to remember a single step."

### For Agency Prospects Specifically

**Say:** "We run this for our own clients. You're about to experience it yourself when we kick off your project. That's why we built it — we know what good onboarding feels like because we live it."

## ROI Math

This workflow's value is **retention and efficiency**, not direct revenue.

| Metric | Without | With | Impact |
|--------|---------|------|--------|
| Time from close to first client contact | 1-3 days | 5 minutes | Eliminates buyer's remorse window |
| Onboarding steps completed on time | ~70% | ~95% | Nothing falls through the cracks |
| Team time per onboarding | 45-60 min | 5-10 min (review only) | 80% time savings |
| Client NPS at kickoff | Neutral | Positive | They feel taken care of from minute one |

**Retention impact:** Clients who have a smooth onboarding are **3x less likely to churn** in the first 90 days (general SaaS/services data). For an agency with $5K/month retainers, preventing one churn per quarter = **$60K/year in retained revenue**.

**For AgentTree specifically:** At scale with 5-10 clients onboarding per month, this saves 5-8 hours/month of admin work and eliminates the "did we send the welcome email?" anxiety entirely.

## Build Estimate

- **Complexity:** Medium (10-14 nodes, but mostly straightforward API calls and timed sends)
- **Dependencies:** CRM deal trigger, Gmail, Slack, project management tool, scheduling tool
- **Build time:** 1.5 days for core flow, 0.5 day for email templates, 0.5 day for intake form follow-up logic
- **Nice-to-have additions:**
  - Branded PDF welcome packet auto-generated with project details
  - Automated NPS survey at kickoff completion
  - Client portal page auto-created (if using a client portal tool)

## Edge Cases to Handle

- Deal re-opened after closing → don't trigger onboarding twice; check for existing onboarding tag
- Multiple contacts on the deal → send welcome to primary contact, CC others
- Slack channel name conflict → append a number or date slug
- Client email bounces → alert team immediately for manual outreach
- Intake form partially filled → still trigger the kickoff scheduling; note incomplete sections for the call
- Weekend/holiday close → still send welcome immediately (it's email, not a phone call); delay kickoff scheduling to next business day
