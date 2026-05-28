# Workflow Ideas — AgentTree Demo Library

Reference plans for high-impact demo workflows. Each file is a standalone build spec — pick it up and build when ready.

## Priority Order

| # | Workflow | File | Target Vertical | Demo Impact |
|---|----------|------|------------------|-------------|
| 1 | Speed-to-Lead Responder | [01-speed-to-lead.md](01-speed-to-lead.md) | All | Universal closer — live demo gets "how much?" every time |
| 2 | Missed Call Text-Back | [02-missed-call-textback.md](02-missed-call-textback.md) | Home Services, Fitness | Phone buzzes 5 seconds after missed call — visceral |
| 3 | Lapsed Customer Reactivation | [03-reactivation-engine.md](03-reactivation-engine.md) | Fitness, Home Services | Flagship product deserves a polished demo build |
| 4 | Morning Revenue Briefing | [04-morning-briefing.md](04-morning-briefing.md) | All | Low build complexity, high perceived value |
| 5 | AI Reputation Manager | [05-reputation-manager.md](05-reputation-manager.md) | Home Services, Fitness | Strong ROI story, needs review platform API |
| 6 | Client Onboarding Automator | [06-client-onboarding.md](06-client-onboarding.md) | Agencies + Internal | Proves AgentTree eats its own cooking |

## How to Use These Plans

Each plan follows the same structure:

- **Pitch** — The one-liner that sells it in a Blueprint Session
- **The Problem** — What the prospect is losing today
- **Flow Architecture** — Step-by-step node chain with trigger, logic, and outputs
- **Node Inventory** — Exact n8n nodes needed (run `get_node` before building)
- **Sub-Workflow Integration** — Which existing sub-workflows to wire in
- **Credentials Required** — What needs to be configured before build
- **Demo Script** — How to present it live to a prospect
- **ROI Math** — Numbers to put in front of the prospect
- **Build Estimate** — Rough scope for planning

## Build Rules (from CLAUDE.md)

1. Always `get_node` before placing a node
2. `search_templates` first for proven patterns
3. `validate_workflow` with `profile: "strict"` before deploying
4. All workflows need `"settings": {"executionOrder": "v1"}`
5. Wire in Error Handler + Notification Hub sub-workflows
6. Deploy via REST API with the key from `.mcp.json`
