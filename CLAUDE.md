# n8n Local Host — Claude Instructions

## n8n MCP (czlonkowski/n8n-mcp)

MCP server connects to n8n at `https://n8n.workflowsolution.org`.

**Available MCP tools:** `get_node`, `search_nodes`, `search_templates`, `get_template`, `validate_node`, `validate_workflow`, `tools_documentation`.

**Write operations** (create/update/delete workflows) are NOT exposed via MCP. Use the n8n REST API directly via curl with the API key from `.mcp.json`.

### Workflow building rules

1. Always `get_node` before placing a node — never guess parameter names or typeVersions.
2. `search_templates` first to find proven patterns before building from scratch.
3. `validate_workflow` with `profile: "strict"` before deploying anything.
4. **Deploy (create-or-update) protocol — NEVER blindly POST:**
   - First, `GET /api/v1/workflows` and check if a workflow with the same name already exists.
   - If it **does not exist**: `POST /api/v1/workflows` to create it. Capture the returned `id` immediately.
   - If it **already exists**: `PUT /api/v1/workflows/{id}` to update in place. Never create a duplicate.
   - For all subsequent changes in the same session, always use `PUT` with the captured `id`.
   - Use `-H "X-N8N-API-KEY: <key>"` and `-H "Content-Type: application/json"`. API key is in `.mcp.json`.
5. All workflows require a `"settings": {"executionOrder": "v1"}` field.
6. **One workflow per intent.** Never create multiple workflows for the same purpose. If a deploy fails, fix and retry the update — do not create a new workflow.

## Workflow Templates Library

The project uses an agent skill architecture — not stored template files. See `.agents/skills/workflow-builder/SKILL.md` for the full decision flow.

### Sub-workflows (deployed to n8n)

Wire these into any workflow via Execute Sub-workflow nodes. IDs and input/output contracts in `.agents/skills/workflow-builder/registry.json`.

| Sub-workflow | ID | Purpose |
|---|---|---|
| Error Handler | `RdB2EbQZ71hjMUuE` | Auto-severity error reports. Input: `{ error, workflowName, nodeName }` |
| Notification Hub | `9MwRgAbGAHLTfThi` | Multi-channel routing by severity. Input: `{ message, severity }` |
| Retry with Backoff | `ouW0VxWj6iDJSIcH` | Exponential backoff HTTP calls. Input: `{ url, method?, maxRetries? }` |

### Validation Pipeline (Quality Gate)

| | |
|---|---|
| ID | `8Trx7SSW7AqXmAkv` |
| Webhook | `POST /webhook/validate-workflow` |
| What it does | Structure check, security scan, complexity score → PASS/FAIL/REVIEW |
| Requirement | Must be **activated** in n8n UI before webhook accepts requests |

POST raw workflow JSON to the webhook. Use this before activating any new workflow in production.

## OpenRouter Model Selection

Any workflow using OpenRouter (AI Agent + `lmChatOpenRouter` sub-node OR raw HTTP) **must** pick a model from `.agents/skills/openrouter-model-selector/registry.json`. Never invent a slug; never call OpenRouter without provider routing.

See `.agents/skills/openrouter-model-selector/SKILL.md` for the decision flow. Quick defaults:

| Need | Slug |
|---|---|
| Complex agent | `anthropic/claude-opus-4.7:exacto` |
| Standard agent | `anthropic/claude-sonnet-4.6:exacto` |
| Fast/cheap, vision | `google/gemini-3.5-flash:exacto` |
| Open-weight | `deepseek/deepseek-v4-pro:exacto` |
| Code | `openai/gpt-5.3-codex:exacto` |
| Long context (2M) | `x-ai/grok-4.20` |

**Hard rules:** never use `x-ai/grok-4.20-multi-agent` in an AI Agent (no tool support); DeepSeek slugs without `:exacto` route to fp4-quantized hosts.
