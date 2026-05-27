# MCP Server Development Guide

This document provides a comprehensive framework for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services.

## Four-Phase Development Process

The guide structures development into distinct phases:

**Phase 1: Deep Research and Planning** focuses on understanding MCP design principles, studying protocol documentation, and planning implementation strategy.

**Phase 2: Implementation** covers project setup, core infrastructure development, and tool implementation with proper schemas and error handling.

**Phase 3: Review and Test** emphasizes code quality checks and building/testing procedures using appropriate tools like the MCP Inspector.

**Phase 4: Create Evaluations** involves designing comprehensive test cases to verify LLM effectiveness with your server.

## Key Design Principles

The guide recommends balancing "comprehensive API endpoint coverage with specialized workflow tools," noting that performance varies by client type.

Tool naming should be "clear, descriptive" with consistent prefixes and action-oriented conventions to improve discoverability.

Error messages should be actionable, providing "specific suggestions and next steps" to guide agents toward solutions.

## Technology Recommendations

TypeScript is recommended as the preferred language, valued for its "high-quality SDK support and good compatibility in many execution environments."

Streamable HTTP is suggested for remote servers using stateless JSON, while stdio works better for local implementations.

## Reference Resources

The document points to language-specific guides for Python (FastMCP) and TypeScript implementations, MCP best practices documentation, and a dedicated evaluation guide for testing server effectiveness.
