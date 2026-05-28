# 01 — Speed-to-Lead Responder

## Pitch

"A lead fills out your form. In 30 seconds they get a personalized text and email — not a template, a message that references exactly what they asked for. By the time your competitor checks their inbox, you've already booked the appointment."

## The Problem

- Average SMB response time to a new lead: **47 minutes** (InsideSales.com)
- Leads contacted within 5 minutes are **21x more likely** to qualify (HBR)
- Most businesses rely on manual follow-up or generic autoresponders that feel robotic
- Every hour of delay loses conversion rate — prospects are filling out 3-4 competitor forms simultaneously

## Target Verticals

- **Home Services** — "I need a plumber" submitted at 9pm, gets a human-feeling text in 30 seconds
- **Health & Fitness** — Gym inquiry gets immediate personalized response + trial booking link
- **Agencies** — RFP or contact form gets a smart reply that shows you already understand their problem

## Flow Architecture

```
[Webhook Trigger] — catches form POST
       |
[Set Node] — normalize fields (name, email, phone, service, message)
       |
[AI Agent / HTTP Request] — Claude classifies:
  - Lead type (new customer, returning, referral)
  - Urgency (emergency, scheduled, browsing)
  - Service category
  - Recommended response tone
       |
[AI Agent / HTTP Request] — Claude generates:
  - Personalized SMS (under 160 chars, references their specific request)
  - Personalized email (3-4 sentences, includes booking link)
  - Internal summary for the owner
       |
[Switch Node] — route by urgency
  |            |              |
  emergency    scheduled      browsing
  |            |              |
  SMS+Email    SMS+Email      Email only
  +Call alert  +Booking link  +Booking link
       |
[HTTP Request] — send SMS via Twilio
       |
[Gmail / SMTP] — send email
       |
[HTTP Request] — create/update CRM contact
  - Add tags: lead source, service type, urgency
  - Set lead score based on AI classification
  - Log the interaction
       |
[Execute Sub-workflow: Notification Hub]
  - Severity "high" for emergency leads
  - Severity "medium" for scheduled
  - Severity "low" for browsing
       |
[Execute Sub-workflow: Error Handler] — on any failure
```

## Node Inventory

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.webhook` | Trigger on form POST | Path: `/webhook/speed-to-lead` |
| `n8n-nodes-base.set` | Normalize incoming fields | Map form fields to standard schema |
| `@n8n/n8n-nodes-langchain.agent` OR `n8n-nodes-base.httpRequest` | AI classification + response generation | Claude API via HTTP if LangChain node unavailable |
| `n8n-nodes-base.switch` | Route by urgency tier | 3 outputs: emergency, scheduled, browsing |
| `n8n-nodes-base.httpRequest` | Twilio SMS API | POST to Twilio Messages endpoint |
| `n8n-nodes-base.gmail` OR `n8n-nodes-base.emailSend` | Send personalized email | OAuth2 for Gmail |
| `n8n-nodes-base.httpRequest` | CRM create/update contact | HubSpot or GHL API |
| `n8n-nodes-base.executeWorkflow` | Notification Hub | Sub-workflow ID: `9MwRgAbGAHLTfThi` |
| `n8n-nodes-base.executeWorkflow` | Error Handler | Sub-workflow ID: `RdB2EbQZ71hjMUuE` |

**Run `get_node` on each before building.** Do not guess typeVersions or parameter names.

## Sub-Workflow Integration

- **Error Handler** (`RdB2EbQZ71hjMUuE`) — wraps the entire flow; catches failures in SMS send, email send, or CRM update
- **Notification Hub** (`9MwRgAbGAHLTfThi`) — alerts the business owner with lead details; severity based on urgency classification
- **Retry with Backoff** (`ouW0VxWj6iDJSIcH`) — wrap the CRM API call and Twilio API call; external APIs flake, retries prevent lost leads

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| Twilio | API Key + Auth Token | Sending SMS |
| Gmail or SMTP | OAuth2 or App Password | Sending email |
| Anthropic (Claude) | API Key | Lead classification + response generation |
| HubSpot or GoHighLevel | API Key / OAuth | CRM contact creation |

## AI Prompt Design

### Classification Prompt

```
You are a lead qualification assistant for a {{business_type}} business.

Analyze this form submission and return JSON:
{
  "lead_type": "new" | "returning" | "referral",
  "urgency": "emergency" | "scheduled" | "browsing",
  "service_category": "<specific service they need>",
  "tone": "urgent_helpful" | "warm_professional" | "casual_informative"
}

Form data:
Name: {{name}}
Message: {{message}}
Service requested: {{service}}
```

### Response Generation Prompt

```
Write a personalized SMS and email for this lead. Rules:
- SMS: Under 160 characters. Reference their specific request. Include booking link.
- Email: 3-4 sentences max. Warm, not corporate. Reference what they asked for.
- Never use "Dear" or "To whom it may concern"
- Sign off with the business owner's first name

Lead context:
{{classification_output}}
Original message: {{message}}
Business name: {{business_name}}
Booking link: {{booking_url}}
```

## Demo Script

### Setup (before the call)

1. Open n8n execution log on one screen
2. Have your phone visible (for the SMS)
3. Have a simple web form ready (can be a Tally form or raw HTML POST)

### Live Demo (90 seconds)

1. **Say:** "I'm going to fill out your contact form right now — pretend I'm a customer who needs [their service]."
2. **Fill out the form** with a realistic message. Hit submit.
3. **Count out loud:** "One... two... three..." — phone buzzes with SMS around 5-10 seconds.
4. **Read the SMS aloud** — point out it references the specific service mentioned in the form, not a generic "thanks for reaching out."
5. **Show email** — personalized, with booking link.
6. **Show n8n execution log** — "Here's everything that happened: classified the lead, generated the response, sent SMS, sent email, updated your CRM, and notified you on Slack. All in under 30 seconds."
7. **Ask:** "How long does it take your team to do this today?"

### Objection Handling

- "What if it says something weird?" → Show the AI prompt constraints. Offer human-in-the-loop approval mode for high-stakes verticals.
- "I already have an autoresponder" → "Does it reference what they actually asked for? Pull up your last 5 auto-replies and compare."
- "What about after hours?" → "That's where this matters most. Your competitors aren't responding at 9pm. This does."

## ROI Math

Present these during or after the demo:

| Metric | Without | With | Impact |
|--------|---------|------|--------|
| Average response time | 47 min | 30 sec | 94x faster |
| Lead contact rate (within 5 min) | ~25% | 100% | 4x improvement |
| Conversion rate lift | Baseline | +30-50% | Based on speed-to-lead research |
| Missed after-hours leads | Lost | Captured | ~40% of form fills happen outside business hours |

**Example for a home services company:**
- 100 leads/month, 20% close rate = 20 jobs
- With Speed-to-Lead at 30% conversion lift = 26 jobs
- At $500 avg job value = **$3,000/month additional revenue**
- Workflow cost: $0/month after build (API costs ~$5-20/month)

## Build Estimate

- **Complexity:** Medium (8-12 nodes)
- **Dependencies:** Twilio account, CRM API access, Claude API key
- **Build time:** 1 day for core flow, 1 day for testing + edge cases
- **Testing:** Submit 10 varied form inputs, verify classification accuracy, check SMS delivery, confirm CRM records created correctly

## Edge Cases to Handle

- Missing phone number → email-only path, skip SMS
- Missing email → SMS-only path
- Duplicate leads → check CRM before creating, update existing contact instead
- AI classification failure → default to "scheduled" urgency, send generic-but-warm response
- Twilio rate limits → Retry with Backoff sub-workflow handles this
- Form spam → basic validation (honeypot field, rate limiting by IP)
