# Morning Revenue Briefing — Video Script & Shoot Plan

**Workflow file:** `workflows/morning-revenue-briefing-demo.json`
**Deployed in n8n:** `G6Hp93W7MHvvtozy` — "Morning Revenue Briefing — Demo"
**Persona:** Mike's HVAC (home services vertical)
**Demo mode:** ON by default — every take produces identical, polished output.

---

## Pre-shoot checklist (do this once, before any filming)

These three credentials don't exist in n8n yet. Create them in the n8n UI before the first take:

| # | Credential | Type | How |
|---|---|---|---|
| 1 | **Anthropic API key** | `HTTP Header Auth` | Credentials → Create → name=`x-api-key`, value=`<your Anthropic key>`. Bind to **Claude → Briefing** node. |
| 2 | **Slack OAuth** | `Slack OAuth2 API` | Credentials → Create → walk through OAuth. Bind to **Send Slack** node. In Slack, create a `#daily-briefing` channel and invite the n8n bot. |
| 3 | **Google Calendar** *(only if shooting live mode)* | `Google Calendar OAuth2` | Credentials → Create → OAuth flow. Bind to **Calendar: Today's Events** node. Skip this if you only film demo mode. |

**Then activate the workflow** (toggle in top right of the canvas).

Run it once before recording to confirm the briefing arrives in Gmail + Slack. Iterate the AI prompt if needed (edit the **Claude → Briefing** node's `jsonBody`).

---

## Scene-by-scene shoot plan

**Total runtime target: 75–90 seconds.** Three scenes, one B-roll cut, one outro.

### Scene 0 — Title card / hook (0:00–0:05)

**On screen:** Bold text card or your face cam.
**Voiceover (VO):**

> "Every morning, business owners waste 20 minutes opening 4 tabs just to figure out what to do first. Here's how to skip all of that."

**Cut to:** screen recording of the n8n canvas, zoomed out so the whole workflow is visible.

---

### Scene 1 — The canvas reveal (0:05–0:25)

**On screen:** Full n8n canvas. Sticky notes are doing the heavy lifting here — viewers can read along.

**VO (over a slow pan left-to-right across the canvas):**

> "This is one workflow. It runs every morning at 7:30. It pulls your tasks from Todoist, your calendar, and your priority emails — then Claude turns the raw data into a personalized briefing, and it lands in your Gmail and Slack."

**Camera direction:** Slow horizontal pan, ~3 seconds per major section:
1. Triggers (left)
2. Config + Demo branch
3. Live branch (call out the parallel pulls)
4. Claude AI node (pause here)
5. Gmail + Slack outputs (right)

**Optional B-roll cut:** zoom in on the **Pre-Shoot Checklist** sticky for 1 second to show how documented it is.

---

### Scene 2 — Live execution (0:25–0:55)

**On screen:** n8n canvas. Click **Run Manually (Demo)** button.

**VO (as nodes light up):**

> "Watch what happens when I run it. It hits demo mode" — *(node turns green)* — "seeds the morning's data" — *(green cascades through Merge)* — "sends it to Claude" — *(pause on Claude node spinner)* — "and Claude writes the briefing in about three seconds."

**Camera direction:**
- Keep cursor still — don't wiggle
- Let the green progress dots be the action
- When the Claude node spins, hold the shot — it's the suspense beat

---

### Scene 3 — The payoff (0:55–1:20)

**On screen:** Cut to Gmail inbox. New email at the top: *"Daily Briefing — [today's date]"*.

**VO:**

> "Here it is in Gmail."

Open the email. Scroll slowly, top to bottom. Pause at the **Top 3 priorities today** list.

**VO (over the scroll):**

> "Notice it doesn't just dump data — it tells him the Johnson kitchen deal is stale, that Sarah called late last night and needs a callback before 9am, and what to prep for the 11:30 Valley Fitness call. That's the difference between a dashboard and a chief of staff."

**Cut to:** Slack `#daily-briefing` channel. Same briefing already posted.

**VO:**

> "And it's in Slack too. One run, two channels."

---

### Scene 4 — Outro (1:20–1:30)

**On screen:** Back to the canvas, or face cam.

**VO:**

> "Sixty seconds to read, twenty minutes saved every morning. We build these for service businesses at AgentTree — link below if you want one."

---

## Filming checklist

### Setup (before pressing record)

- [ ] Close every browser tab except: n8n canvas, Gmail inbox, Slack channel
- [ ] Gmail filtered to inbox view only (no unread badges from other emails)
- [ ] Slack on the `#daily-briefing` channel, message composer empty
- [ ] Screen recording at **1920×1080** minimum (1440p preferred for YouTube)
- [ ] Mic test — VO should be ducked under any system sounds
- [ ] Cursor highlighter on (e.g., macOS: Cursor Highlight, Windows: Mouse Highlighter)
- [ ] Notifications OFF (system, Slack desktop notifications, calendar pops)
- [ ] Run the workflow ONCE before recording to warm caches and verify it works

### During the take

- [ ] Don't ad-lib jargon. If you say "JSON schema" you've lost half the audience.
- [ ] Read out the priorities list — let the viewer see AND hear it.
- [ ] When clicking Run, **count silently to 2** before talking again. Let the canvas breathe.
- [ ] If you fumble, keep going — easier to cut than to retake.

### After the take

- [ ] Watch it back muted. Does the visual story make sense without sound?
- [ ] Watch it back with eyes closed. Does the VO make sense without visual?
- [ ] Re-run the workflow → record three takes. Demo mode = identical output, so pick the cleanest narration.

---

## Edit notes

- **Cut every dead frame.** If the Claude node spins for 4 seconds, cut to 1.5 seconds with a zoom-in.
- **Add an on-screen counter** for the "20 minutes saved" stat — graphics make stats memorable.
- **Background music:** something subtle and modern, ducked under VO. Epidemic Sound categories: "Minimal Tech" or "Lo-fi Productive."
- **End card:** AgentTree logo, "Want one built? agenttree.ai" — 3 seconds.

---

## What to say in the description / caption

> Morning briefing in your inbox at 7:30 AM. Built in n8n — pulls Todoist, Google Calendar, and Gmail. Claude writes the briefing. Demo persona: home services contractor. Full workflow open-sourced in our repo. Want one for your business? agenttree.ai

---

## Variants for follow-up content

Once this video is live, the same workflow is a Trojan horse for these follow-ups (use the same recording setup):

1. **"How we built it" deep-dive** — 5-min walkthrough of each node. Sticky notes already make this easy.
2. **"Customizing for your business"** — change the Config persona to a gym, lawyer, agency. Same workflow, different vertical.
3. **"Live mode vs. demo mode"** — show the live-mode branch hitting real Todoist/Calendar/Gmail. Use your own data.
4. **"What Claude actually sees"** — open the execution log, click into the Claude node, show the prompt + raw response. Demystifies "AI magic."
