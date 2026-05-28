# 02 — Missed Call Text-Back

## Pitch

"You miss a call. Five seconds later, the caller gets a text: 'Hey, sorry we missed you — what can we help with?' They reply. AI qualifies them, answers their questions, and books the appointment. You never touched your phone."

## The Problem

- **62% of calls** to small businesses go unanswered (Ruby Receptionist data)
- A missed call to a home service company is a **$200-2,000 lost job**
- Callers who hit voicemail rarely leave a message — they call the next company on Google
- Hiring a receptionist costs $3,000-4,000/month; an answering service $500-1,500/month
- After-hours and weekend calls are the highest-intent leads (urgent needs) and the most likely to be missed

## Target Verticals

- **Home Services** (primary) — Plumber, HVAC, electrician, roofer. Caller has an urgent problem and will hire whoever responds first.
- **Health & Fitness** — Gym prospect calls during class time, trainer is busy. Text-back captures the lead before they move on.

## Flow Architecture

```
[Webhook Trigger] — receives missed call event from Twilio/VoIP
       |
[Set Node] — extract caller phone, caller name (if available), timestamp, call duration
       |
[IF Node] — was it a known spam number? (check against blocklist or Twilio lookup)
  |           |
  spam        legit
  |           |
  [NoOp]      |
              |
[HTTP Request] — Twilio SMS: "Hey! Sorry we missed your call.
                 What can we help with today? - {{business_name}}"
       |
[Wait Node] — webhook-based wait for SMS reply (or timeout after 15 min)
       |
[Switch Node] — did they reply?
  |                    |
  replied              no reply
  |                    |
  |              [HTTP Request] — follow-up SMS after 15 min:
  |              "No worries if now's not a good time. Here's our
  |               booking link if you'd like to schedule: {{url}}"
  |                    |
  |              [End / CRM log as "missed, no response"]
  |
[AI Agent] — conversational qualification loop:
  - What service do they need?
  - What's the urgency? (today, this week, just pricing)
  - What's their address/location? (for service area check)
  - AI answers basic questions (pricing ranges, hours, service area)
       |
[Switch Node] — qualification result
  |              |              |
  qualified      info-only      out-of-area
  |              |              |
  Book appt      Send info      Polite decline
  |              |              |
[HTTP Request]   [SMS]          [SMS: "We don't service
 — send booking                  that area, but try {{ref}}"]
 link via SMS
       |
[HTTP Request] — CRM: create contact
  - Tags: "missed-call-textback", service type, urgency
  - Lead score based on qualification
  - Interaction log attached
       |
[Execute Sub-workflow: Notification Hub]
  - "high" if qualified + urgent
  - "medium" if qualified + scheduled
  - "low" if info-only
       |
[Execute Sub-workflow: Error Handler] — on any failure
```

## Node Inventory

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.webhook` | Receive missed call event | Path: `/webhook/missed-call` |
| `n8n-nodes-base.set` | Normalize caller data | Phone, name, timestamp |
| `n8n-nodes-base.if` | Spam filter check | Compare against blocklist or Twilio Lookup API |
| `n8n-nodes-base.httpRequest` | Send initial text-back via Twilio | POST to Twilio Messages |
| `n8n-nodes-base.wait` | Wait for reply (webhook resume) | Timeout: 15 minutes |
| `n8n-nodes-base.switch` | Route: replied vs. no reply | Two outputs |
| `@n8n/n8n-nodes-langchain.agent` OR `n8n-nodes-base.httpRequest` | AI conversational qualification | Multi-turn via Claude |
| `n8n-nodes-base.switch` | Route qualification outcome | 3 outputs: qualified, info-only, out-of-area |
| `n8n-nodes-base.httpRequest` | Send booking link / info / decline via Twilio | SMS responses |
| `n8n-nodes-base.httpRequest` | CRM create/update | HubSpot or GHL |
| `n8n-nodes-base.executeWorkflow` | Notification Hub | `9MwRgAbGAHLTfThi` |
| `n8n-nodes-base.executeWorkflow` | Error Handler | `RdB2EbQZ71hjMUuE` |

## Sub-Workflow Integration

- **Error Handler** — catches SMS delivery failures, CRM API errors
- **Notification Hub** — alerts owner when a qualified lead comes through text-back; severity maps to urgency
- **Retry with Backoff** — wrap Twilio and CRM API calls

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| Twilio | API Key + Auth Token + Phone Number | SMS send/receive |
| Anthropic (Claude) | API Key | Conversational AI qualification |
| HubSpot or GoHighLevel | API Key / OAuth | CRM contact creation |

## AI Conversation Design

### System Prompt

```
You are a friendly, helpful text assistant for {{business_name}}, a {{business_type}} company.

A customer just called and we missed it. You texted them and they replied. Your job:
1. Find out what they need (service type)
2. Assess urgency (today/emergency, this week, just pricing/info)
3. Get their location (for service area verification)
4. Answer basic questions about services, hours, pricing ranges
5. If qualified, send them to booking

Rules:
- Keep texts SHORT (1-2 sentences max per message)
- Sound like a real person, not a bot
- Never say "I'm an AI" unless directly asked — then be honest
- Use the customer's name if you have it
- If they ask something you can't answer, say "Let me have {{owner_name}} get back to you on that"
- Never make up pricing — use ranges from the provided context
- Max 4 exchanges before routing to booking or human handoff

Business context:
- Services: {{services_list}}
- Service area: {{service_area}}
- Hours: {{business_hours}}
- Pricing ranges: {{pricing_info}}
- Booking link: {{booking_url}}
```

### Conversation Flow Example

```
[Auto] "Hey! Sorry we missed your call. What can we help with today? - Mike's Plumbing"
[Customer] "My water heater is leaking"
[AI] "Oh no — is it actively leaking right now or just dripping?"
[Customer] "Yeah it's leaking pretty bad"
[AI] "Got it, that's urgent. What's your zip code? Want to make sure you're in our area."
[Customer] "93010"
[AI] "You're in our area. I can get someone out today. Here's a link to grab the next open slot: {{booking_url}} — or I can have Mike call you back in 10 min?"
```

## Demo Script

### Setup

1. Configure Twilio with a real phone number
2. Set up a simple trigger that simulates a missed call (or use Twilio Studio to forward a test call to voicemail and fire the webhook)
3. Have your personal phone ready to play the "customer"

### Live Demo (60-90 seconds)

1. **Say:** "I'm going to call your business number right now. Nobody's going to answer — just like what happens 10 times a day."
2. **Call the number.** Let it ring. Hang up.
3. **Wait 5 seconds.** Phone buzzes with the text-back.
4. **Show the text to the prospect.** Read it aloud.
5. **Reply as the customer:** "Yeah my AC is making a weird noise"
6. **Show the AI response** arriving in seconds — asking a qualifying question.
7. **Reply once more.** Show booking link arrive.
8. **Say:** "That person just went from a lost lead to a booked appointment in 45 seconds. And nobody on your team did anything."

### Key Moment

The 5-second gap between the missed call and the text arriving is the entire demo. That gap is where money is made or lost.

## ROI Math

| Metric | Current State | With Text-Back | Impact |
|--------|--------------|----------------|--------|
| Missed calls per month | ~30 (typical SMB) | 30 (still miss them) | — |
| Leads recovered from missed calls | 0-5 (voicemails) | 15-20 (text replies) | 3-4x recovery |
| Conversion of recovered leads | — | ~40% (high intent, they called you) | — |
| New jobs from missed calls | 0-2 | 6-8 | +$3,000-16,000/mo |

**Example for HVAC company:**
- 30 missed calls/month
- Text-back captures 18 conversations
- 8 book appointments (44% conversion — they called you, intent is high)
- Average job: $800
- **$6,400/month in recovered revenue**
- Annual: **$76,800** from calls that were previously lost

**Vs. answering service:** $500-1,500/month for a human who reads a script. This is smarter, faster, and $0/month after build.

## Build Estimate

- **Complexity:** Medium-High (10-14 nodes, multi-turn conversation adds complexity)
- **Dependencies:** Twilio account with SMS-enabled number, CRM API, Claude API
- **Build time:** 1.5-2 days for core flow, 1 day for conversation tuning + edge cases
- **Hardest part:** The multi-turn AI conversation loop. Options: n8n Wait node with webhook resume, or manage state externally (Redis/Supabase) and handle each inbound SMS as a separate webhook event that continues the conversation.

## Edge Cases to Handle

- Caller texts "STOP" → respect opt-out, do not send further messages, log in CRM
- Caller sends multiple rapid messages → batch and respond once
- Caller asks to speak to a human → immediate handoff alert to owner, stop AI
- Unknown/blocked number → still send text-back (Twilio handles this)
- After-hours calls → text-back works 24/7, but manage booking availability (only show next-day slots if it's 11pm)
- Repeat callers → check CRM first, don't restart qualification if they're already a customer
