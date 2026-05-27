---
name: slack-gif-creator
description: Create animated GIFs optimized for Slack with constraints, validation, and animation concepts
type: skill
---

# Slack GIF Creator

A toolkit providing utilities and knowledge for creating animated GIFs optimized for Slack.

## Slack Requirements

**Dimensions:**
- Emoji GIFs: 128x128 (recommended)
- Message GIFs: 480x480

**Parameters:**
- FPS: 10-30 (lower is smaller file size)
- Colors: 48-128 (fewer = smaller file size)
- Duration: Keep under 3 seconds for emoji GIFs

## Core Workflow

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    builder.add_frame(frame)

builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

## Drawing Graphics

### Drawing from Scratch

```python
from PIL import ImageDraw

draw = ImageDraw.Draw(frame)

# Circles/ovals
draw.ellipse([x1, y1, x2, y2], fill=(r, g, b), outline=(r, g, b), width=3)

# Polygons
points = [(x1, y1), (x2, y2), (x3, y3), ...]
draw.polygon(points, fill=(r, g, b), outline=(r, g, b), width=3)

# Lines
draw.line([(x1, y1), (x2, y2)], fill=(r, g, b), width=5)

# Rectangles
draw.rectangle([x1, y1, x2, y2], fill=(r, g, b), outline=(r, g, b), width=3)
```

## Animation Concepts

- **Shake/Vibrate**: Offset position with oscillation
- **Pulse/Heartbeat**: Scale size rhythmically
- **Bounce**: Use easing='bounce_out'
- **Spin/Rotate**: Rotate around center
- **Fade In/Out**: Adjust alpha channel
- **Slide**: Move from off-screen to position
- **Zoom**: Scale and position
- **Explode/Particle Burst**: Radiate outward with gravity

## Available Utilities

### GIFBuilder
```python
builder = GIFBuilder(width=128, height=128, fps=10)
builder.add_frame(frame)
builder.save('out.gif', num_colors=48, optimize_for_emoji=True)
```

### Validators
```python
from core.validators import validate_gif, is_slack_ready
passes, info = validate_gif('my.gif', is_emoji=True, verbose=True)
```

### Easing Functions
```python
from core.easing import interpolate
y = interpolate(start=0, end=400, t=t, easing='ease_out')
```

## Dependencies

```bash
pip install pillow imageio numpy
```
