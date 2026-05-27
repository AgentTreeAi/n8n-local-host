---
name: doc-coauthoring
description: Guide users through a structured workflow for co-authoring documentation, proposals, technical specs, and decision docs
type: skill
---

# Doc Co-Authoring Workflow

This skill provides a structured workflow for guiding users through collaborative document creation. Act as an active guide, walking users through three stages: Context Gathering, Refinement & Structure, and Reader Testing.

## When to Offer This Workflow

**Trigger conditions:**
- User mentions writing documentation: "write a doc", "draft a proposal", "create a spec", "write up"
- User mentions specific doc types: "PRD", "design doc", "decision doc", "RFC"
- User seems to be starting a substantial writing task

**Initial offer:**
Offer the user a structured workflow for co-authoring the document. Explain the three stages:

1. **Context Gathering**: User provides all relevant context while Claude asks clarifying questions
2. **Refinement & Structure**: Iteratively build each section through brainstorming and editing
3. **Reader Testing**: Test the doc with a fresh Claude (no context) to catch blind spots before others read it

Explain that this approach helps ensure the doc works well when others read it (including when they paste it into Claude). Ask if they want to try this workflow or prefer to work freeform.

## Stage 1: Context Gathering

**Goal:** "Close the gap between what the user knows and what Claude knows, enabling smart guidance later."

### Initial Questions

Start by asking the user for meta-context about the document:

1. What type of document is this? (e.g., technical spec, decision doc, proposal)
2. Who's the primary audience?
3. What's the desired impact when someone reads this?
4. Is there a template or specific format to follow?
5. Any other constraints or context to know?

Inform them they can answer in shorthand or dump information however works best for them.

### Info Dumping

Once initial questions are answered, encourage the user to dump all the context they have. Request information such as:
- Background on the project/problem
- Related team discussions or shared documents
- Why alternative solutions aren't being used
- Organizational context (team dynamics, past incidents, politics)
- Timeline pressures or constraints
- Technical architecture or dependencies
- Stakeholder concerns

Advise them not to worry about organizing it - just get it all out.

**Asking clarifying questions:**

When user signals they've done their initial dump, ask clarifying questions to ensure understanding. Generate 5-10 numbered questions based on gaps in the context.

**Exit condition:**
Sufficient context has been gathered when questions show understanding.

## Stage 2: Refinement & Structure

**Goal:** "Build the document section by section through brainstorming, curation, and iterative refinement."

Create the initial document structure with placeholder text for all sections, then work section by section:

1. Ask clarifying questions about what to include
2. Brainstorm 5-20 options
3. User indicates what to keep/remove/combine
4. Draft the section
5. Refine through iterative edits

Continue until user is satisfied with each section.

## Stage 3: Reader Testing

**Goal:** "Test the document with a fresh Claude (no context bleed) to verify it works for readers."

Predict what questions readers might ask, then test the document against those questions to catch blind spots and ensure clarity.

## Tips for Effective Guidance

**Tone:**
- Be direct and procedural
- Explain rationale briefly when it affects user behavior
- Don't try to "sell" the approach - just execute it

**Artifact Management:**
- Use file creation for drafting full sections
- Use str_replace for all edits
- Provide artifact link after every change

**Quality over Speed:**
- Don't rush through stages
- Each iteration should make meaningful improvements
- The goal is a document that actually works for readers
