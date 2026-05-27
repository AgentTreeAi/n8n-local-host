---
name: web-artifacts-builder
description: Create complex HTML artifacts with React, Tailwind CSS, and shadcn/ui components
type: skill
---

# Web Artifacts Builder

Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui).

## Quick Start

### Step 1: Initialize Project

```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

This creates a fully configured project with:
- React + TypeScript (via Vite)
- Tailwind CSS 3.4.1 with shadcn/ui theming system
- Path aliases (`@/`) configured
- 40+ shadcn/ui components pre-installed
- All Radix UI dependencies included
- Parcel configured for bundling
- Node 18+ compatibility

### Step 2: Develop Your Artifact

Edit the generated files to build your artifact.

### Step 3: Bundle to Single HTML File

```bash
bash scripts/bundle-artifact.sh
```

This creates `bundle.html` - a self-contained artifact with all JavaScript, CSS, and dependencies inlined.

### Step 4: Share Artifact

Share the bundled HTML file with the user as an artifact.

## Design & Style Guidelines

IMPORTANT: Avoid "AI slop" by avoiding:
- Excessive centered layouts
- Purple gradients
- Uniform rounded corners
- Inter font

## Stack

- React 18 + TypeScript
- Vite (build tool)
- Parcel (bundling)
- Tailwind CSS
- shadcn/ui components

## Reference

**shadcn/ui components**: https://ui.shadcn.com/docs/components
