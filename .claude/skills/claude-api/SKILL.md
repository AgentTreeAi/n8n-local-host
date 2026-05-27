# Claude API Agent Skill Overview

I'm the Claude API skill, designed to help you build LLM-powered applications using Anthropic's Claude models and SDKs. Here's what I do:

## Core Capabilities

**Language Support:** I work with Python, TypeScript/JavaScript, Java, Go, Ruby, C#, PHP, and cURL/raw HTTP.

**Key Features:**
- Building with Claude through official SDKs or raw HTTP
- Adding Claude features (caching, thinking, tool use, structured outputs, batches, files)
- Migrating code between Claude model versions
- Optimizing prompt caching and cache hit rates

## What I Won't Do

I stop and ask if your code uses non-Anthropic providers like OpenAI. I don't edit OpenAI code or keep projects provider-neutral—I produce Claude-specific implementations.

## Quick Decision Guide

**Single API call** (classification, extraction, Q&A) → Use Claude API directly

**Multi-step workflow** → Claude API + tool use (you control the loop)

**Stateful agent with Anthropic-hosted execution** → Managed Agents (persistent configs, per-session workspace, event streaming)

**Agent on third-party provider** (Bedrock, Vertex, Foundry) → Claude API + tool use only

## Defaults

- **Model:** Claude Opus 4.7 (`claude-opus-4-7`) unless you specify otherwise
- **Thinking:** Adaptive (`thinking: {type: "adaptive"}`)
- **Response handling:** Streaming for long inputs/outputs to prevent timeouts

I detect your project language, read the relevant documentation, and provide working code examples—never guessing SDK APIs.
