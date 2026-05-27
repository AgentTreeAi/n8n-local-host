# n8n MCP Deep Dive — Test Results

**Date:** 2026-05-27  
**Instance:** https://n8n.workflowsolution.org (local mirror at localhost:5678)  
**MCP Server:** czlonkowski/n8n-mcp (local build)  
**Tester:** Claude Opus 4.6 via Claude Code

---

## Executive Summary

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| System Health | 2 | 2 | 0 | Both localhost and remote healthy |
| Node Search (`search_nodes`) | 4 | 4 | 0 | OR, AND, FUZZY, source filter all work |
| Node Inspection (`get_node`) | 4 | 4 | 0 | info, docs, search_properties, versions modes |
| Node Validation (`validate_node`) | 3 | 3 | 0 | full/strict, full/ai-friendly, minimal modes |
| Template Search (`search_templates`) | 5 | 4 | 1 | keyword mode returned 0 results (possible index gap) |
| Template Retrieval (`get_template`) | 2 | 2 | 0 | nodes_only and structure modes |
| Workflow Validation (`validate_workflow`) | 2 | 2 | 0 | 3-node and 4-node workflows, strict profile |
| REST API CRUD | 4 | 4 | 0 | Create, Read, Update, Delete all confirmed |
| **TOTAL** | **26** | **25** | **1** | **96% pass rate** |

---

## 1. System Health & Connectivity

### Local Instance (localhost:5678)
- **Endpoint:** `GET /healthz`
- **Result:** `{"status":"ok"}`
- **Verdict:** PASS

### Remote Instance (n8n.workflowsolution.org)
- **Endpoint:** `GET /api/v1/workflows`
- **Result:** Returned 2 existing workflows ("Hi Gemini", "Testing Workspace")
- **API Key:** Valid, authenticated successfully
- **Verdict:** PASS

### Pre-existing Workflows Found
| ID | Name | Nodes | Active |
|----|------|-------|--------|
| `UtnA9izHgsTZmi1F` | Hi Gemini | Manual Trigger → Code | No |
| `p8ap46eG8e9d8bkk` | Testing Workspace | Manual Trigger (empty) | No |

---

## 2. MCP Tool Inventory

### Available Tools (7 loaded)
| Tool | Purpose | Status |
|------|---------|--------|
| `tools_documentation` | Meta-docs for all MCP tools | Working |
| `search_nodes` | Search 800+ n8n nodes | Working |
| `get_node` | Node schema, docs, property search, versions | Working |
| `validate_node` | Validate node configuration | Working |
| `validate_workflow` | Validate full workflow JSON | Working |
| `search_templates` | Search 2,737+ templates (5 modes) | Working |
| `get_template` | Retrieve template by ID | Working |

### Not Available (require API tools in MCP build)
The following tools are documented in the MCP but NOT exposed in this build:
- `n8n_health_check`, `n8n_audit_instance`
- `n8n_create_workflow`, `n8n_get_workflow`, `n8n_update_full_workflow`, `n8n_update_partial_workflow`
- `n8n_delete_workflow`, `n8n_list_workflows`
- `n8n_test_workflow`, `n8n_executions`
- `n8n_generate_workflow`, `n8n_deploy_template`
- `n8n_autofix_workflow`, `n8n_validate_workflow` (instance version)
- `n8n_workflow_versions`, `n8n_manage_credentials`, `n8n_manage_datatable`
- `ai_agents_guide`

> **Workaround:** All CRUD operations were successfully performed via the n8n REST API directly using `curl` with the configured API key.

---

## 3. Node Discovery Tests (`search_nodes`)

### Test 3a: OR mode (default) — "webhook http request"
- **Results:** 10 nodes returned (HTTP Request, various webhook triggers)
- **Verdict:** PASS

### Test 3b: Core source filter — "webhook" (core only)
- **Results:** 5 core webhook trigger nodes
- **Verdict:** PASS

### Test 3c: FUZZY mode — "opnai" (intentional typo)
- **Results:** Correctly found 5 OpenAI-related nodes despite misspelling
- Found: `nodes-base.openAi`, `nodes-base.openAiTool`, `nodes-langchain.openAi`, `nodes-langchain.openAiTool`, `nodes-langchain.openAiAssistantTool`
- **Verdict:** PASS — fuzzy matching works great

### Test 3d: AND mode — "database postgres mysql"
- **Results:** 5 nodes (CloudBeaver, Firebase, LumifyHub, MySQL)
- **Verdict:** PASS

### Test 3e: With examples — "slack"
- **Results:** 3 nodes (Slack, Slack Trigger, community Slack Socket Mode)
- Community node detection working (shows author, npm downloads, verified status)
- **Verdict:** PASS

---

## 4. Node Deep Inspection (`get_node`)

### Test 4a: Info mode — HTTP Request node
- **Detail level:** standard + examples
- **Key findings:**
  - Latest version: 4.4 (correctly flagged)
  - Required properties: `url`
  - Common properties: `method`, `authentication`, `sendBody`, `contentType`, `sendHeaders`
  - 42 total properties available
  - 3 real-world examples from popular templates included
- **Verdict:** PASS

### Test 4b: Docs mode — Webhook node
- **Result:** Full markdown documentation returned (~4,500 words)
- Covers: HTTP methods, path parameters, auth methods, response modes, CORS, binary data, IP whitelisting
- **Verdict:** PASS

### Test 4c: Property search mode — Slack node, query "auth"
- **Result:** Found 4 matching properties across 127 total:
  - `authentication` (Access Token / OAuth2)
  - `author_name`, `author_link`, `author_icon` (attachment fields)
- **Verdict:** PASS

### Test 4d: Versions mode — Code node
- **Result:** Reports current version 2, isVersioned: true
- Note: Version metadata not fully populated (0 version entries)
- **Verdict:** PASS (with caveat — version history empty)

---

## 5. Node Validation (`validate_node`)

### Test 5a: Full validation, strict profile — HTTP Request
- **Config:** `{method: "POST", url: "https://api.example.com/data", sendBody: true, contentType: "json"}`
- **Result:** Valid, 0 errors, 1 warning, 2 suggestions
  - Warning: "API endpoints typically require authentication"
  - Suggestions: Add `alwaysOutputData`, set explicit `responseFormat`
- **Verdict:** PASS

### Test 5b: Minimal validation — Slack
- **Config:** `{}`
- **Result:** Valid, no missing required fields
- **Verdict:** PASS

### Test 5c: Full validation, ai-friendly — Code node
- **Config:** `{language: "javaScript", jsCode: "return items;"}`
- **Result:** Valid, 0 errors, 0 warnings, 1 suggestion
  - Suggestion: Modify items with `.map()` for transformation
- **Verdict:** PASS

---

## 6. Template Discovery (`search_templates`)

### Test 6a: Keyword mode — "webhook automation"
- **Result:** 0 templates found
- **Note:** May be an index gap; the keyword search seems stricter than other modes
- **Verdict:** FAIL (unexpected empty result)

### Test 6b: By task mode — "ai_automation"
- **Result:** 1,116 templates found! Top 5 returned with full metadata
- Top template: "Generate AI Viral Videos with Seedance" (214,907 views)
- Rich metadata: categories, complexity, setup time, required services, target audience
- **Verdict:** PASS

### Test 6c: Patterns mode — overview of all categories
- **Result:** 2,737 templates across 10 categories:
  - `ai_automation`: 1,480 templates
  - `data_transformation`: 2,150
  - `api_integration`: 1,620
  - `data_sync`: 986
  - `scheduling`: 658
  - `email_automation`: 616
  - `webhook_processing`: 375
  - `file_processing`: 368
  - `slack_integration`: 148
  - `database_operations`: 96
- Each category includes common workflow patterns and top nodes
- **Verdict:** PASS

### Test 6d: By nodes mode — Webhook + HTTP Request
- **Result:** 1,270 templates found using those node types
- **Verdict:** PASS

### Test 6e: By metadata mode — simple complexity, <10min setup
- **Result:** 100 templates found
- Includes RAG starters, secure webhooks, video generators
- **Verdict:** PASS

---

## 7. Template Retrieval (`get_template`)

### Test 7a: nodes_only mode — Template #6270 ("Build Your First AI Agent")
- **Result:** 13 nodes listed with types and names
- Key nodes: AI Agent, Chat Trigger, Google Gemini, RSS Feed Tool, HTTP Request Tool, Memory Buffer
- **Verdict:** PASS

### Test 7b: structure mode — Template #6270
- **Result:** Full node positions + connection graph returned
- Connections include AI-specific types: `ai_tool`, `ai_languageModel`, `ai_memory`
- Shows complete wiring: Chat → Agent ← (Gemini, Memory, Weather Tool, News Tool)
- **Verdict:** PASS

---

## 8. Workflow Validation (`validate_workflow`)

### Test 8a: 3-node workflow (Trigger → HTTP → Code)
- **Profile:** strict
- **Result:** Valid (0 errors, 2 warnings)
  - Warning: Outdated typeVersion 4.2 (latest 4.4)
  - Warning: No error handling on HTTP node
- **Verdict:** PASS

### Test 8b: 4-node workflow (Trigger → HTTP → Set → Code)
- **Profile:** strict
- **Result:** Valid (0 errors, 2 warnings)
  - Expression `={{ $json.title }}` validated successfully
  - 3 valid connections, 0 invalid
- **Verdict:** PASS

---

## 9. REST API CRUD Operations

All operations performed against `https://n8n.workflowsolution.org/api/v1` using the configured API key.

### 9a: CREATE
- **Endpoint:** `POST /workflows`
- **Payload:** 3 nodes (Manual Trigger → HTTP Request → Code)
- **Result:** Created with ID `eEjy0WHdCRYVdgMK`, version `6ac8b86b`
- **Verdict:** PASS

### 9b: READ
- **Endpoint:** `GET /workflows/eEjy0WHdCRYVdgMK`
- **Result:** Full workflow JSON returned, all 3 nodes present, connections intact
- **Verdict:** PASS

### 9c: UPDATE
- **Endpoint:** `PUT /workflows/eEjy0WHdCRYVdgMK`
- **Change:** Added "Extract Title" Set node, updated name to "(Updated)", rewired connections
- **Result:** Now 4 nodes, name updated, new version ID assigned
- **Verdict:** PASS

### 9d: DELETE
- **Endpoint:** `DELETE /workflows/eEjy0WHdCRYVdgMK`
- **Result:** Workflow returned in response (confirmation), subsequent GET returns `{"message":"Not Found"}`
- **Post-check:** Original 2 workflows ("Hi Gemini", "Testing Workspace") confirmed intact
- **Verdict:** PASS

---

## 10. Key Findings & Recommendations

### What Works Well
1. **Node search** is excellent — OR, AND, FUZZY modes all function correctly. Fuzzy search handles typos gracefully.
2. **Template library** is massive (2,737+) with rich AI-generated metadata (complexity, setup time, target audience).
3. **Validation** is thorough — catches version mismatches, missing error handling, security concerns.
4. **Property search** across nodes is very useful for discovering configuration options.
5. **REST API** provides full CRUD capability as a reliable fallback for workflow management.

### What Needs Attention
1. **Missing API management tools** — The MCP documentation lists 20+ workflow management tools (create, update, delete, execute, version history, etc.) but they aren't exposed. This is the biggest gap. The `tools_documentation` says they require `N8N_API_URL` and `N8N_API_KEY` — both ARE configured in `~/.claude/settings.json`, so this may be a build/version issue with the MCP server.
2. **Keyword template search** returned 0 results for "webhook automation" while other modes found thousands of relevant templates. The keyword index may need rebuilding (`npm run fetch:templates`).
3. **Node version history** is empty for tested nodes — the `versions` mode reports `totalVersions: 0` even for versioned nodes like Code v2.

### Recommendations
1. **Rebuild or update the n8n-mcp server** to expose the full tool set (especially `n8n_create_workflow`, `n8n_test_workflow`, `n8n_generate_workflow`).
2. **Run `npm run fetch:templates`** in the MCP server directory to rebuild the template keyword index.
3. **Consider adding error handling** to workflows — the validator consistently flags this as a gap.
4. The n8n instance is running at **version compatible with API v1** — all endpoints respond correctly.

---

## Appendix: Environment Details

| Item | Value |
|------|-------|
| MCP Server Path | `C:\Users\admin\Desktop\n8n-mcp\dist\mcp\stdio-wrapper.js` |
| n8n URL (MCP config) | `https://n8n.workflowsolution.org` |
| Local n8n | `http://localhost:5678` (healthy) |
| API Key Expiry | 2026-07-24 (valid) |
| MCP Tested Version | n8n 2.21.2 compatible |
| Total MCP Tools Available | 7 of ~25 documented |
