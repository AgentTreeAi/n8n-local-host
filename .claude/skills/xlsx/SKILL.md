---
name: xlsx
description: Create, edit, and analyze Excel spreadsheet files (.xlsx, .xlsm, .csv, .tsv)
type: skill
---

# XLSX Skill Documentation

This guide covers requirements for working with Excel spreadsheet files using the xlsx skill.

## Key Triggers

The skill activates when users want to open, read, edit, create, or convert spreadsheet files—especially when referencing files by name or path.

## Core Requirements

**Professional Standards:**
- Consistent, professional fonts throughout
- Zero formula errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?) required in all deliverables
- Preserve existing template formatting when updating files

**Financial Model Color Coding:**
- Blue text: hardcoded inputs and changeable values
- Black text: formulas and calculations
- Green text: internal worksheet links
- Red text: external file links
- Yellow background: key assumptions requiring attention

**Number Formatting:**
- Years as text ("2024")
- Currency with unit headers ("Revenue ($mm)")
- Zeros displayed as dashes
- Percentages at 0.0% format
- Negative numbers in parentheses

## Critical Implementation Rule

**Always use Excel formulas instead of calculating values in Python and hardcoding them.** This ensures dynamic, updateable spreadsheets. Use tools like openpyxl for formulas and formatting; pandas for data analysis.

**Essential workflow step:** After creating formulas, run `scripts/recalc.py` to calculate values and identify errors before delivery.
