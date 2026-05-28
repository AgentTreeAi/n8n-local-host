# 05 — AI Reputation Manager

## Pitch

"A customer leaves your business. Two hours later, they get a text asking how it went — and a link to leave a review. If someone posts a negative review, you get an alert with an AI-drafted response ready to approve in one tap. Your 4.2 stars become 4.6 in 90 days."

## The Problem

- **90% of consumers** read online reviews before visiting a business (BrightLocal)
- A one-star increase on Yelp leads to a **5-9% increase in revenue** (Harvard Business School)
- Most businesses only get reviews from angry customers — happy ones forget
- Negative reviews sit unanswered for days or get defensive responses that make it worse
- Manually asking every customer for a review is inconsistent — it only happens when someone remembers

## Target Verticals

- **Home Services** (primary) — Reviews are the #1 ranking factor for local service SEO. One bad unanswered review on Google can cost thousands in lost leads.
- **Health & Fitness** — Gym/studio reviews on Google and Yelp heavily influence sign-ups. Class experience reviews help with retention too.

## Flow Architecture

### Flow A: Proactive Review Request

```
[Webhook Trigger] — job/appointment marked complete in CRM
       |
[Wait Node] — delay 2 hours (let the experience settle)
       |
[HTTP Request] — pull customer details from CRM
  - Name, service received, technician/trainer name, contact info
       |
[AI Agent / HTTP Request] — generate personalized review request
  - Reference the specific service they received
  - Mention their technician/trainer by name
  - Keep it short, warm, and easy to act on
       |
[HTTP Request] — send SMS via Twilio
  "Hey {{name}}, how'd everything go with {{tech_name}} today?
   If we nailed it, a quick review helps us a ton: {{review_link}}
   If anything was off, reply here and we'll make it right."
       |
[Wait Node] — wait for reply (or timeout 24h)
       |
[Switch Node] — response type
  |              |              |
  positive       negative       no reply
  |              |              |
  Thank +        Alert owner    Log, no
  review link    + AI draft     further
  reminder       response       action
       |
[HTTP Request] — CRM update: tag "review-requested", log outcome
```

### Flow B: Review Monitoring + Response

```
[Schedule Trigger] — every 4 hours
       |
[HTTP Request] — check Google Business Profile API for new reviews
       |
[HTTP Request] — check Yelp API for new reviews (if available)
       |
[IF Node] — any new reviews since last check?
  |           |
  no          yes
  |           |
  [End]       |
              |
[Loop] — for each new review:
       |
  [Switch Node] — rating
    |         |         |
    5-star    3-4 star  1-2 star
    |         |         |
    Auto      AI draft  AI draft +
    respond   response  URGENT alert
    |         |         to owner
    |         |         |
    |    [AI generate empathetic,    [Execute Sub-workflow:
    |     brand-voice response]       Notification Hub]
    |         |                       severity: "high"
    |         |         |
    |    [Send to owner for          [AI generate response]
    |     approval via Slack]              |
    |         |                      [Send to owner for
    |         |                       approval via Slack
    |         |                       with 1-tap approve]
    |         |
    +--- all paths ---+
              |
[HTTP Request] — post approved response to Google/Yelp
              |
[HTTP Request] — CRM: log review, rating, response status
              |
[Weekly Digest] — summary: new reviews, avg rating, response rate, rating trend
```

## Node Inventory

### Flow A (Review Request)

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.webhook` | Job complete trigger | Path: `/webhook/job-complete` |
| `n8n-nodes-base.wait` | 2-hour delay | Let experience settle |
| `n8n-nodes-base.httpRequest` | Pull customer details | CRM API |
| `@n8n/n8n-nodes-langchain.agent` OR `n8n-nodes-base.httpRequest` | Generate review request | Claude API |
| `n8n-nodes-base.httpRequest` | Send SMS | Twilio |
| `n8n-nodes-base.wait` | Wait for reply | 24h timeout |
| `n8n-nodes-base.switch` | Route response type | 3 outputs |
| `n8n-nodes-base.httpRequest` | CRM update | Tag + log |

### Flow B (Monitor + Respond)

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.scheduleTrigger` | Every 4 hours | Cron |
| `n8n-nodes-base.httpRequest` | Google Business Profile API | Fetch new reviews |
| `n8n-nodes-base.if` | New reviews? | Date comparison |
| `n8n-nodes-base.switch` | Rating tier routing | 5-star, 3-4, 1-2 |
| `@n8n/n8n-nodes-langchain.agent` | AI response drafting | Claude API |
| `n8n-nodes-base.slack` | Owner approval request | With action buttons |
| `n8n-nodes-base.httpRequest` | Post response to review platform | Google API |
| `n8n-nodes-base.httpRequest` | CRM logging | Review data |
| `n8n-nodes-base.executeWorkflow` | Notification Hub | `9MwRgAbGAHLTfThi` |
| `n8n-nodes-base.executeWorkflow` | Error Handler | `RdB2EbQZ71hjMUuE` |

## Sub-Workflow Integration

- **Error Handler** — catches API failures for review platforms (Google API has strict rate limits)
- **Notification Hub** — 1-2 star reviews fire as "high" severity; weekly digest fires as "low"
- **Retry with Backoff** — Google Business Profile API is flaky; retry before alerting on failure

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| Google Business Profile | OAuth2 | Read reviews + post responses |
| Twilio | API Key + Auth Token | Review request SMS |
| Anthropic (Claude) | API Key | Review request copy + response drafting |
| HubSpot or GoHighLevel | API Key / OAuth | CRM tagging and logging |
| Slack | OAuth2 / Webhook | Owner approval flow |

## AI Prompt Design

### Review Request Prompt

```
Write a short SMS asking {{customer_name}} to review their experience.

Context:
- Service: {{service_type}}
- Technician/trainer: {{tech_name}}
- Date: {{service_date}}
- Business: {{business_name}}

Rules:
- Under 200 characters
- Reference the specific service and person by name
- Make it easy: include the review link
- Offer an escape hatch: "reply here if anything was off"
- Warm and genuine, not corporate
```

### Negative Review Response Prompt

```
Draft a response to this negative review of {{business_name}}.

Review ({{rating}} stars): "{{review_text}}"
Reviewer: {{reviewer_name}}

Rules:
- Acknowledge their frustration without being defensive
- Apologize for the specific issue they raised
- Offer a concrete next step (call us, DM us, we'll make it right)
- Keep it under 100 words
- Sound like a real person (the owner), not a PR team
- Never blame the customer, even subtly
- Never offer compensation publicly (do that privately)
- Sign with the owner's first name

Tone: genuinely sorry, take-ownership, solution-oriented
```

### Positive Review Response Prompt

```
Draft a short thank-you response to this positive review.

Review ({{rating}} stars): "{{review_text}}"
Reviewer: {{reviewer_name}}

Rules:
- Thank them specifically for what they mentioned
- Reference the technician/trainer by name if mentioned
- Keep it under 50 words
- Genuine, not templated
- End with something forward-looking ("See you next time" or "We'll be here when you need us")
```

## Demo Script

### Setup

1. Prepare a mock review feed with 3-4 reviews (5-star, 3-star, 1-star)
2. Have AI-drafted responses ready for each
3. Show the Slack approval flow mockup

### Live Demo (2 minutes)

1. **Show their current Google reviews:** "When was the last time you responded to a review? How about a negative one?"
2. **Show Flow A:** "After every completed job, your customer gets this text 2 hours later." Show a sample review request SMS. "It mentions their name, the service, and the technician. It doesn't feel automated."
3. **Show Flow B — the 1-star response:** Read the negative review. Then show the AI-drafted response. "This was generated in 3 seconds. You approve it in Slack with one tap. It's posted within minutes instead of days."
4. **Show the contrast:** "Right now, negative reviews sit for days. That's 50 potential customers who saw it unanswered. This catches it in hours."
5. **Show the weekly digest:** "Every Monday you see: 8 new reviews, average 4.7 stars, all responded to, rating trending up from 4.2 to 4.4."

## ROI Math

| Metric | Without | With | Impact |
|--------|---------|------|--------|
| Reviews requested per month | Sporadic / none | Every completed job | 5-10x more review volume |
| Average rating | 4.0-4.2 (negativity bias) | 4.4-4.7 (balanced) | Happy customers now leave reviews too |
| Review response rate | 10-20% | 95-100% | Every review gets a response |
| Response time (negative) | 3-7 days | Under 4 hours | Damage control before others see it |

**Revenue impact of rating improvement:**
- Moving from 4.0 to 4.5 stars → estimated **12-15% increase in leads** from Google/Yelp
- For a business getting 50 leads/month at $500 avg job → 6-8 additional jobs/month → **$3,000-4,000/month**

**Reputation recovery:** A single well-handled negative review (public response + private resolution) often results in the customer updating their review to 4-5 stars.

## Build Estimate

- **Complexity:** Medium-High (two separate flows, 12-16 nodes total)
- **Dependencies:** Google Business Profile API access (can be tricky to set up), Twilio, CRM, Slack
- **Build time:** 1.5 days for Flow A (review requests), 1.5 days for Flow B (monitoring + response), 0.5 day for weekly digest
- **Hardest part:** Google Business Profile API authentication and review reply posting. Yelp API has limited write access. May need to start with Google only.
- **Alternative approach:** If Google API access is difficult, start with the review request flow only (Flow A) — that alone drives the rating up by getting more happy customers to leave reviews.

## Edge Cases to Handle

- Customer replies to review request with a complaint → do NOT send review link; escalate to owner as service recovery opportunity
- Review platform API rate limits → Retry with Backoff, spread checks across the day
- Duplicate review notifications → track review IDs, skip already-processed reviews
- Owner doesn't approve response within 24h → send reminder, then auto-escalate
- Fake/spam reviews → flag for manual review, don't auto-respond
- Review mentioning legal issues (injury, property damage) → immediate escalation to owner, never respond automatically
