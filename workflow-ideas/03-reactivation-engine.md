# 03 — Lapsed Customer Reactivation Engine

## Pitch

"You have 200 customers who haven't come back in 60 days. This system finds them, figures out why they left, writes each one a personal message — not a blast — and handles the conversation until they rebook. One gym recovered $14,000 in the first month."

## The Problem

- Acquiring a new customer costs **5-7x more** than retaining an existing one
- Most businesses have hundreds of lapsed customers sitting in their CRM doing nothing
- Generic "We miss you!" email blasts get 2-5% open rates and feel impersonal
- Manually reaching out to lapsed customers is time-prohibitive — nobody does it consistently
- The longer a customer is lapsed, the harder they are to win back — speed matters here too

## Target Verticals

- **Health & Fitness** (primary) — Gyms and studios churn 30-50% of members annually. Most never get a meaningful win-back attempt.
- **Home Services** (secondary) — Past customers who used you once but haven't called back. Seasonal services (HVAC, landscaping) have natural reactivation windows.

## Flow Architecture

```
[Schedule Trigger] — runs daily at 9:00 AM
       |
[HTTP Request] — query CRM for lapsed contacts
  - Filter: last activity > 60 days ago
  - Filter: not tagged "do-not-contact" or "reactivation-sent"
  - Pull: name, email, phone, membership type, last visit date,
          purchase history, lifetime value, preferred channel
       |
[Split In Batches] — process 20-50 contacts per run (avoid rate limits)
       |
[AI Agent / HTTP Request] — Claude analyzes each contact:
  - Likely reason for lapse (seasonal, price, life event, dissatisfaction, forgot)
  - Recommended approach (offer, tone, channel, timing)
  - Personalized message draft using their history
       |
[Switch Node] — route by recommended channel
  |              |
  SMS            Email
  |              |
[HTTP Request]   [Gmail / SMTP]
  Twilio SMS      Personalized email
       |              |
       +----- merge ---+
              |
[HTTP Request] — update CRM contact
  - Add tag: "reactivation-sent"
  - Add tag: lapse-reason classification
  - Log outreach details + timestamp
              |
[Wait Node] — webhook resume on reply (or timeout after 48 hours)
              |
[Switch Node] — response type
  |          |          |          |
  positive   objection  negative   no-reply
  |          |          |          |
  Book       Handle     Respect    Follow-up
  |          |          |          |
  |     [AI Agent]   [Tag:DNC]   [SMS/Email]
  |     objection                 "Just checking —
  |     handling                   no pressure"
  |          |                         |
  |     [Switch]                  [Wait 5 days]
  |     resolved?                      |
  |     |       |                 [Final attempt
  |     yes     no                 or close out]
  |     |       |
  |     Book  Human
  |     |     handoff
  |     |
[HTTP Request] — send booking link
       |
[HTTP Request] — update CRM
  - Result tag: "reactivated", "declined", "no-response"
  - Outcome data for reporting
       |
[Execute Sub-workflow: Notification Hub]
  - "high" for reactivated customers (celebrate wins)
  - "medium" for objections needing human touch
  - "low" for batch completion summaries
       |
[Execute Sub-workflow: Error Handler]
```

## Node Inventory

| Node | Purpose | Notes |
|------|---------|-------|
| `n8n-nodes-base.scheduleTrigger` | Daily 9 AM run | Cron expression |
| `n8n-nodes-base.httpRequest` | Query CRM for lapsed contacts | GET with date filters |
| `n8n-nodes-base.splitInBatches` | Rate-limit processing | 20-50 per batch |
| `@n8n/n8n-nodes-langchain.agent` OR `n8n-nodes-base.httpRequest` | AI analysis + message generation | Claude API |
| `n8n-nodes-base.switch` | Channel routing (SMS vs. email) | Based on AI recommendation |
| `n8n-nodes-base.httpRequest` | Twilio SMS | Outbound messages |
| `n8n-nodes-base.gmail` | Personalized email | OAuth2 |
| `n8n-nodes-base.httpRequest` | CRM update (tagging, logging) | Multiple calls throughout |
| `n8n-nodes-base.wait` | Wait for reply | Webhook resume, 48h timeout |
| `n8n-nodes-base.switch` | Route by response type | 4 outputs |
| `@n8n/n8n-nodes-langchain.agent` | Objection handling conversation | Multi-turn |
| `n8n-nodes-base.executeWorkflow` | Notification Hub | `9MwRgAbGAHLTfThi` |
| `n8n-nodes-base.executeWorkflow` | Error Handler | `RdB2EbQZ71hjMUuE` |

**Note:** This is the most complex workflow in the set. Consider splitting into sub-workflows: (1) Batch query + classify, (2) Outreach send, (3) Reply handler + conversation, (4) Reporting.

## Sub-Workflow Integration

- **Error Handler** — critical here because batch processing can fail mid-run; need to know which contacts were processed vs. skipped
- **Notification Hub** — owner wants to know when someone reactivates (celebrate wins); also alerts on objections that need human touch
- **Retry with Backoff** — CRM queries and Twilio sends; a single API failure shouldn't kill the entire batch

## Credentials Required

| Credential | Type | For |
|------------|------|-----|
| HubSpot or GoHighLevel | API Key / OAuth | CRM query + contact updates |
| Twilio | API Key + Auth Token + Number | SMS outreach + replies |
| Gmail or SMTP | OAuth2 / App Password | Email outreach |
| Anthropic (Claude) | API Key | Lapse analysis + message generation + objection handling |

## AI Prompt Design

### Lapse Analysis Prompt

```
You are a customer retention analyst for {{business_name}} ({{business_type}}).

Analyze this lapsed customer and return JSON:
{
  "lapse_reason": "seasonal" | "price" | "life_event" | "dissatisfaction" | "forgot" | "unknown",
  "confidence": 0.0-1.0,
  "recommended_channel": "sms" | "email",
  "recommended_tone": "warm_casual" | "value_focused" | "urgency" | "curiosity",
  "recommended_offer": "none" | "discount" | "free_session" | "loyalty_perk",
  "message_draft": "<the personalized message>"
}

Customer data:
- Name: {{name}}
- Last visit: {{last_visit_date}} ({{days_since}} days ago)
- Membership/service: {{membership_type}}
- Total visits: {{visit_count}}
- Lifetime value: ${{ltv}}
- Purchase history: {{recent_purchases}}
- How they joined: {{acquisition_source}}

Rules for the message:
- Reference something specific about THEIR history (not generic)
- Keep SMS under 200 characters
- Keep email under 5 sentences
- Never sound desperate or guilt-trippy
- If recommending an offer, make it feel exclusive ("since you've been with us X months...")
- Include a clear, low-friction next step
```

### Message Examples (What Good Looks Like)

**SMS — Gym member, lapsed 75 days, was a 3x/week regular:**
> "Hey Sarah, Coach Mike was asking about you yesterday — haven't seen you at the 6am class in a while. We just added Saturday sessions if mornings got harder. Want me to save you a spot?"

**Email — HVAC customer, lapsed 11 months, seasonal pattern:**
> Subject: Your AC probably needs a checkup before summer
> "Hi David — last June we serviced your Trane unit at your Camarillo place. These systems need annual maintenance to keep running efficiently (and keep your energy bill sane). We're booking June appointments now and I held a slot for existing customers. Want me to lock one in? [Book here]"

**SMS — Gym member, lapsed 90 days, was sporadic:**
> "Hey James — no pitch, just checking in. Still interested in training or did life take over? Either way, no pressure. 🤙"

### Objection Handling Prompt

```
You are handling a reply from a lapsed customer of {{business_name}}.

Their original lapse reason (estimated): {{lapse_reason}}
Their reply: "{{reply_text}}"

Common objections and how to handle:
- "Too expensive" → Acknowledge, mention value (not just price), offer flexible option if available
- "Too busy" → Empathize, suggest lower-commitment option, flexible scheduling
- "Moved" → Thank them, ask if they want a referral to a partner in their new area
- "Had a bad experience" → Apologize sincerely, ask what happened, offer to make it right (escalate to human)
- "Not interested" → Respect it, thank them, mark as do-not-contact

Rules:
- 1-2 sentences max per reply
- If they say no twice, stop and thank them
- If they mention a bad experience, IMMEDIATELY flag for human follow-up
- Never argue or hard-sell
- If they show interest, send booking link
```

## Demo Script

### Setup

1. Seed the demo CRM with 5-10 realistic lapsed customer profiles (varied histories, lapse durations, membership types)
2. Pre-run the classification step so you have AI-generated messages ready to show
3. Have a side-by-side comparison ready: generic blast vs. AI-personalized message

### Live Demo (2-3 minutes)

1. **Show the CRM list:** "Here are your customers who haven't been back in 60+ days. Right now they're just sitting here."
2. **Show the AI classification:** "The system analyzed each one — Sarah was a 3x/week regular who stopped suddenly (likely life event), David is seasonal (hasn't been back since last summer), James was always sporadic."
3. **Show the messages side by side:**
   - Left: Generic "We miss you! Come back for 20% off!"
   - Right: The AI-personalized message for Sarah referencing Coach Mike and the 6am class
4. **Ask:** "Which one would you respond to?"
5. **Show the reply flow:** Demo a simulated reply, show AI handling an objection naturally.
6. **Show the reporting:** "Week 1: contacted 47, replied 19, rebooked 8. That's $X recovered."
7. **Close:** "This runs every morning automatically. Your lapsed list gets smaller every week."

## ROI Math

### Health & Fitness (Gym with 500 members, 30% annual churn)

| Metric | Value |
|--------|-------|
| Lapsed members (60+ days) | ~150 |
| Reactivation outreach response rate | 25-35% (vs. 3-5% for generic blasts) |
| Rebook rate from responders | 30-40% |
| Members reactivated per month | 12-20 |
| Average monthly membership | $75 |
| Monthly recovered revenue | $900-1,500 |
| Annual recovered revenue | **$10,800-18,000** |
| Cost to acquire equivalent new members | $50-100 each = $7,200-24,000 |

### Home Services (HVAC company, 800 past customers)

| Metric | Value |
|--------|-------|
| Lapsed customers (no service in 12+ months) | ~400 |
| Reactivation response rate | 15-25% |
| Rebook rate | 35-50% |
| Reactivated per quarter | 20-50 |
| Average service ticket | $350 |
| Quarterly recovered revenue | $7,000-17,500 |
| Annual recovered revenue | **$28,000-70,000** |

## Build Estimate

- **Complexity:** High (15+ nodes, multi-turn conversation, batch processing, state management)
- **Dependencies:** CRM with queryable lapsed contacts, Twilio, Claude API, email
- **Build time:** 2-3 days for core flow, 1-2 days for conversation tuning, 1 day for reporting
- **Recommendation:** Build as 2-3 linked workflows, not one monolith:
  1. **Batch Processor** — scheduled trigger, CRM query, AI classify, send outreach
  2. **Reply Handler** — webhook for inbound SMS/email replies, AI conversation, booking
  3. **Reporting** — weekly summary of contacts, replies, rebooks, revenue

## Edge Cases to Handle

- Customer replies "STOP" or "unsubscribe" → immediately stop, tag as DNC in CRM, confirm opt-out
- Customer mentions a bad experience → escalate to human immediately, do not let AI continue
- Customer already rebooked through another channel → check CRM for recent activity before sending
- Duplicate contacts in CRM → deduplicate before outreach, use primary phone/email
- Customer replies days later (after timeout) → still handle gracefully, check if offer is still valid
- Batch job fails mid-run → track progress, resume from last processed contact, don't re-send to already-contacted
- Legal: ensure compliance with TCPA (SMS consent), CAN-SPAM (email unsubscribe), and state-specific rules
