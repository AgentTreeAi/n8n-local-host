# 04 — Morning Revenue Briefing

## Pitch

"Every morning at 7:30, you get a Slack message or email that says: 'You have 3 new leads overnight, 2 overdue follow-ups, $18K in pipeline closing this week, and 4 appointments today. Here's what to do first.' It replaces the 20 minutes you spend opening 4 tabs every morning."

## The Problem

- Business operators start each day context-switching between CRM, calendar, email, and task apps to piece together "what do I need to focus on today?"
- Important follow-ups slip through the cracks because there's no single view
- Pipeline visibility requires logging into the CRM and running reports manually
- After-hours leads sit unseen until someone happens to check
- The feeling of "am I missing something?" is constant and draining

## Target Verticals

- **All verticals** — every operator with a CRM and calendar benefits
- Particularly strong for **operators scaling past solo** who can't hold everything in their head anymore
- Agencies love this because it mirrors what a COO or ops manager would deliver

## Flow Architecture

```
[Schedule Trigger] — 7:30 AM local time, weekdays
       |
[HTTP Request] — pull CRM pipeline snapshot
  - Deals by stage + total value
  - Deals closing this week
  - Stale deals (no activity in 7+ days)
       |
[HTTP Request] — pull new leads since yesterday
  - Count, names, sources, lead scores
  - Any high-priority leads flagged
       |
[HTTP Request] — pull overdue tasks/follow-ups
  - Tasks past due date
  - Follow-ups that were scheduled for yesterday but not completed
       |
[HTTP Request] — pull today's calendar
  - Appointments, calls, meetings
  - Who, what, when
       |
[HTTP Request] — pull key metrics (optional)
  - Leads this week vs. last week
  - Close rate this month
  - Revenue this month vs. target
       |
[Merge Node] — combine all data into single context object
       |
[AI Agent / HTTP Request] — Claude generates the briefing:
  - Plain English summary (not a data dump)
  - Prioritized action items with direct links
  - Callout for anything unusual (spike in leads, stale high-value deal, missed follow-up)
  - Tone: sharp, concise, actionable — like a good chief of staff
       |
[Switch Node] — delivery channel
  |              |
  Slack          Email
  |              |
[Slack Node]    [Gmail / SMTP]
  formatted      formatted HTML
  message        email
       |
[Execute Sub-workflow: Error Handler] — if any data pull fails
```

## Node Inventory

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.scheduleTrigger` | 7:30 AM weekdays | Cron: `30 7 * * 1-5` |
| `n8n-nodes-base.httpRequest` | CRM pipeline data | HubSpot/GHL deals API |
| `n8n-nodes-base.httpRequest` | New leads since yesterday | CRM contacts API with date filter |
| `n8n-nodes-base.httpRequest` | Overdue tasks | CRM tasks API with status filter |
| `n8n-nodes-base.httpRequest` | Today's calendar | Google Calendar API or CRM calendar |
| `n8n-nodes-base.httpRequest` | Key metrics (optional) | CRM reporting API |
| `n8n-nodes-base.merge` | Combine all data sources | Merge by position or append |
| `@n8n/n8n-nodes-langchain.agent` OR `n8n-nodes-base.httpRequest` | AI briefing generation | Claude API |
| `n8n-nodes-base.switch` | Delivery channel routing | Slack vs. email |
| `n8n-nodes-base.slack` | Send Slack message | Formatted blocks |
| `n8n-nodes-base.gmail` | Send email briefing | HTML formatted |
| `n8n-nodes-base.executeWorkflow` | Error Handler | `RdB2EbQZ71hjMUuE` |

## Sub-Workflow Integration

- **Error Handler** — if the CRM API is down or a data pull fails, send an alert instead of a broken briefing. Include which data source failed so it can be investigated.
- **Retry with Backoff** — wrap each HTTP request to the CRM. If HubSpot is briefly down at 7:30 AM, retry 2-3 times before giving up.
- **Notification Hub** — not needed for the briefing itself (it IS the notification), but wire it in for error alerting.

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| HubSpot or GoHighLevel | API Key / OAuth | Pipeline, leads, tasks, metrics |
| Google Calendar | OAuth2 | Today's appointments (if separate from CRM) |
| Slack | OAuth2 / Webhook | Briefing delivery |
| Gmail or SMTP | OAuth2 | Email delivery (alternative channel) |
| Anthropic (Claude) | API Key | Briefing generation |

## AI Prompt Design

### Briefing Generation Prompt

```
You are the chief of staff for {{owner_name}} at {{business_name}}.

Generate a morning briefing from this data. Rules:
- Lead with the single most important thing they need to act on today
- Use plain English, not CRM jargon
- Every item should have a clear action and a direct link
- Call out anything unusual (big spike, big drop, stale high-value deal)
- Be concise — this should take 60 seconds to read
- Use bullet points, not paragraphs
- End with "Top 3 priorities today:" as a numbered list

Data:
Pipeline: {{pipeline_data}}
New leads: {{new_leads}}
Overdue follow-ups: {{overdue_tasks}}
Today's calendar: {{calendar_events}}
Weekly metrics: {{metrics}}

Format for Slack (use markdown):
---
**Morning Briefing — {{date}}**

{{briefing_content}}

**Top 3 priorities today:**
1. {{priority_1}}
2. {{priority_2}}
3. {{priority_3}}
---
```

### Example Output

```
**Morning Briefing — Tuesday, May 27**

**Overnight:** 3 new leads came in — 1 high-value (Sarah M., HVAC replacement, est. $4,200).
She filled out the form at 11:47pm. Speed-to-lead already responded.

**Pipeline:** $18,400 in deals closing this week. The Johnson kitchen remodel ($8,200) has
been in "Proposal Sent" for 9 days with no activity — might need a nudge.

**Overdue:** 2 follow-ups from yesterday didn't happen:
- Mike R. — was supposed to get a callback after his estimate (link)
- Valley Fitness — waiting on your proposal revision (link)

**Today:** 4 appointments
- 9:00 AM — Site visit, 742 Elm St (AC install estimate)
- 11:30 AM — Call with Valley Fitness (proposal review)
- 2:00 PM — Johnson follow-up (kitchen remodel)
- 4:00 PM — New client intro, Camarillo Dental

**Top 3 priorities today:**
1. Call Sarah M. before 9am — high-value lead from last night (link)
2. Nudge the Johnson deal — 9 days stale, $8,200 at risk (link)
3. Send Valley Fitness the revised proposal before your 11:30 call (link)
```

## Demo Script

### Setup

1. Seed demo CRM with realistic pipeline, leads, and tasks
2. Pre-generate a sample briefing for the prospect's industry
3. Have it ready to show as a Slack message or email

### Live Demo (90 seconds)

1. **Say:** "What's the first thing you do when you sit down in the morning?"
2. **Wait for answer** (usually: "check email, check CRM, check calendar, check messages")
3. **Show the briefing:** "What if instead, you got this at 7:30 every morning?"
4. **Walk through each section** — point out the actionable links, the stale deal callout, the prioritized list.
5. **Say:** "This replaces 20 minutes of tab-switching with 60 seconds of reading. And it catches the stuff you'd miss — like that 9-day-old deal that's about to go cold."
6. **Close:** "This is $0/month to run once it's built. It's like hiring a COO who never sleeps."

## ROI Math

This one is harder to quantify in direct revenue — it's an **efficiency and catch-rate** play.

| Metric | Without | With | Impact |
|--------|---------|------|--------|
| Morning orientation time | 15-20 min | 60 sec | 18 min saved daily, 6+ hours/month |
| Missed follow-ups per week | 3-5 | 0-1 | Catches slipped tasks |
| Stale deals noticed | When it's too late | Same day | Saves deals before they die |
| After-hours leads response | Next morning | Highlighted at 7:30am | Faster first action |

**Soft ROI:** One stale deal recovered per month pays for the entire workflow indefinitely. If the Johnson deal ($8,200) would have died without the nudge alert, that's the ROI conversation.

**For agencies pitching this to their clients:** "We'll install a system that gives you a daily briefing of your entire business in 60 seconds. Your competitors are checking spreadsheets."

## Build Estimate

- **Complexity:** Low-Medium (8-10 nodes, mostly HTTP requests + one AI call)
- **Dependencies:** CRM API access, Slack or email, Claude API, Google Calendar (optional)
- **Build time:** 0.5-1 day for core flow, 0.5 day for formatting and testing
- **Easiest workflow in the set** — high impact relative to build effort

## Edge Cases to Handle

- CRM API returns empty data (new account, no pipeline yet) → briefing should say "No deals in pipeline yet" not crash
- No new leads overnight → say "Quiet night — no new leads" not skip the section
- Calendar is empty → "No appointments today — good day for outreach"
- Multiple CRM data sources fail → send a degraded briefing with available data + note which sources are down
- Weekends/holidays → either skip (weekdays only) or send a lighter version
- Multiple recipients → allow config for team briefings (sales team gets pipeline focus, owner gets full view)
