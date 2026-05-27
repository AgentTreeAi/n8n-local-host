# Algorithmic Art Generation Framework

This comprehensive guide establishes a system for creating generative art using p5.js, organized in three core phases:

## Core Process

**Phase 1: Philosophical Foundation**
Create an algorithmic philosophy (4-6 paragraphs) articulating a computational aesthetic movement. The philosophy should emphasize: emergent behavior, mathematical beauty, seeded variation, and processes rather than static output. Critically, it must repeatedly stress "meticulously crafted algorithm" and "master-level implementation" to frame the work as professionally refined.

**Phase 2: Conceptual Delineation**
Identify a "subtle, niche reference embedded within the algorithm itself"—sophisticated enough that familiar audiences catch it intuitively while others simply appreciate the generative composition. Think of this as "algorithmic harmony" where the reference enhances depth without announcing itself.

**Phase 3: Code Expression**
Implement the philosophy through p5.js using the `templates/viewer.html` file as the foundational starting point. The template provides fixed UI structure (header, sidebar, Anthropic branding) while the algorithm and parameters remain variable.

## Technical Requirements

- **Seeded randomness**: Always include `randomSeed()` and `noiseSeed()` for reproducibility
- **Parameter design**: Focus on tuneable system properties (quantities, scales, probabilities, ratios) rather than preset patterns
- **Self-contained artifact**: Single HTML file with p5.js (CDN), all code inline, no external dependencies
- **Fixed elements**: Seed navigation (prev/next/random), regenerate/reset buttons, Anthropic UI styling
- **Variable elements**: Algorithm, parameters, color controls, implementation specifics

## Parameter Philosophy

Rather than selecting from a pattern menu, design parameters by asking "what qualities should be adjustable?" Parameters should emerge naturally from the algorithmic philosophy itself.

## Implementation Hierarchy

Fixed components (maintain exactly): Layout structure, sidebar organization, seed controls, action buttons, Anthropic colors/fonts.

Variable components (customize fully): The p5.js algorithm, parameters object, UI controls in Parameters section, optional Colors section.

The artifact works immediately in browsers or claude.ai—no setup required.
