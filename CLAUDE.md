# n8n Local Host — Claude Instructions

## n8n MCP (czlonkowski/n8n-mcp)

This project uses the **n8n MCP server** (`czlonkowski/n8n-mcp`) configured globally.
It connects to the local n8n instance at `http://localhost:5678`.

### When to use the n8n MCP

Use the n8n MCP tools for ANY task involving:
- Creating or designing n8n workflows
- Editing or modifying existing workflows
- Planning workflow architecture or node connections
- Searching n8n node documentation or templates
- Executing or testing workflows
- Debugging workflow errors or execution history

### How to use

The MCP exposes these key capabilities — use them proactively:

| Task | MCP Action |
|------|-----------|
| Look up a node's properties/options | `get_node_info` |
| Search available nodes | `search_nodes` |
| Browse workflow templates | `get_workflow_templates` |
| List existing workflows | `list_workflows` |
| Create a new workflow | `create_workflow` |
| Update an existing workflow | `update_workflow` |
| Execute a workflow | `execute_workflow` |
| Check execution history | `get_executions` |

### Workflow building rules

1. Always call `get_node_info` before placing a node — do not guess at property names or parameter structures.
2. Use `get_workflow_templates` to find proven patterns before building from scratch.
3. When modifying an existing workflow, call `get_workflow` first to read the current state.
4. Validate node connections match expected input/output types.
5. After creating/updating a workflow, confirm it appears in `list_workflows`.

### n8n API key setup

The API key in `~/.claude/settings.json` under `mcpServers.n8n.env.N8N_API_KEY` must be set to a real key.
Generate one in n8n: **Settings → API → Create API Key**.
