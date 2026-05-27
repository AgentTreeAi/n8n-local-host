---
name: webapp-testing
description: Test local web applications using Playwright with Python automation
type: skill
---

# Web Application Testing Toolkit

Python-based testing framework for local web applications using Playwright.

## Core Purpose

Test local web applications by verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

## Key Components

**Helper Scripts:**
- `with_server.py` manages server lifecycle for single or multiple concurrent servers

**Recommended Workflow:**

First determine if the application is static HTML (read directly) or dynamic (requires server setup). For dynamic applications, check whether the server is already running, then follow a reconnaissance-then-action pattern.

## Critical Implementation Details

When automating browser interactions:

**Wait for `page.wait_for_load_state('networkidle')` before inspection** on dynamic applications. This prevents attempting to interact with DOM elements before JavaScript execution completes.

**Server Management Example:**
```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

## Best Practices

- Use bundled scripts as black boxes via `--help`
- Implement `sync_playwright()` for synchronous operations
- Apply descriptive selectors (text, role, CSS, IDs)
- Always properly close browser instances

The toolkit prioritizes keeping context windows clean while providing reliable automation capabilities.
