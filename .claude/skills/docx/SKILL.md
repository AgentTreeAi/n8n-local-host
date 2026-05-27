# DOCX Skill Documentation

This guide covers creating, reading, editing, and manipulating Word documents (.docx files). It includes:

## Key Capabilities

**Creation**: Use `docx-js` library to generate new documents with formatting, tables, images, headers/footers, and table of contents.

**Reading**: Extract text via `pandoc` or unpack XML for raw analysis.

**Editing**: Unpack XML → modify → repack with validation and auto-repair.

## Critical Technical Rules

- **Page size**: Always set explicitly; defaults to A4, not US Letter (12,240 × 15,840 DXA)
- **Tables**: Require dual widths—both `columnWidths` array and cell `width`, using DXA units only
- **Bullets**: Use `LevelFormat.BULLET` via numbering config; never insert unicode characters manually
- **Images**: Specify `type` parameter (png, jpg, gif, etc.); include `altText` with title, description, and name
- **Smart quotes**: Use XML entities (`&#x201C;`, `&#x201D;`, `&#x2019;`) for professional typography
- **Tracked changes**: Use `<w:ins>` and `<w:del>` tags; mark paragraph marks when deleting entire paragraphs
- **PageBreak**: Must nest inside a Paragraph element
- **TOC**: Requires HeadingLevel only; no custom styles on heading paragraphs

## Workflow

1. **Create**: Write JavaScript with docx library; validate with `validate.py`
2. **Edit**: Unpack → modify XML → pack with auto-repair
3. **Convert**: Use LibreOffice for legacy `.doc` files or PDF export

All dimensions use DXA units (1,440 DXA = 1 inch).
