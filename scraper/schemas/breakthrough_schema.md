# Lyrian Chronicles Breakthrough Schema

This document provides a specification for representing breakthrough data from the Lyrian Chronicles TTRPG in a structured YAML format.

## Overview

Breakthroughs are special character advancement options that provide unique abilities, features, or modifications beyond standard class progression. They typically require XP investment and may have specific prerequisites.

## Breakthrough Structure

```yaml
name: string              # Display name (e.g., "Powerful Ki", "Blend In")
id: string                # Unique identifier (sanitized name)
cost: integer             # XP cost (typically 0-600)
requirements: list[string] | empty  # List of prerequisites (can be empty list)
description: string       # Full description of the breakthrough's effects
```

## Fields

### Name
The display name of the breakthrough as shown in the game.

Examples:
- "Powerful Ki"
- "Blend In"
- "8 Eyes"
- "Angelblooded"

### ID
A sanitized version of the name suitable for file names and references.
- Lowercase
- Spaces replaced with underscores
- Special characters removed

Examples:
- `powerful_ki`
- `blend_in`
- `8_eyes`
- `angelblooded`

### Cost
The XP cost required to purchase the breakthrough. All costs are integers.

Common cost ranges:
- **0**: Free breakthroughs (e.g., "Angelblooded", "Elixir Addict")
- **25-100**: Low-cost training breakthroughs
- **150-300**: Mid-range breakthroughs
- **400-600**: High-cost powerful breakthroughs

```yaml
# Free breakthrough
cost: 0

# Low cost training
cost: 25

# High cost powerful ability
cost: 600
```

### Requirements
Prerequisites that must be met before taking the breakthrough. Can be an empty list.

Common requirement types:
- **Race Requirements**: "Must be an Oni", "Must be a Demon."
- **Class Requirements**: "Must have levels in Mage."
- **Other Requirements**: Various specific conditions

```yaml
# Single requirement
requirements:
- Must be an Oni

# Multiple requirements
requirements:
- Must be level 5 or higher
- Must have the Spellcasting feature

# No requirements
requirements: []
```

### Description
The full text describing what the breakthrough does.

Descriptions typically include:
- Mechanical effects and benefits
- Flavor text explaining the nature of the ability
- Specific rules or limitations
- Interaction with other game mechanics

## Index File Structure

The breakthrough index provides a summary of all breakthroughs:

```yaml
# breakthroughs_index.yaml
total_count: 68
version: "0.10.1"
generated_at: "2025-06-02T15:38:03.207196"
cost_summary:
  numeric: 68       # All breakthroughs have numeric costs
  variable: 0       # No variable costs
  none: 0           # No missing costs
with_requirements: 49
without_requirements: 19
breakthroughs:
  - id: "8_eyes"
    name: "8 Eyes"
    cost: 100
    has_requirements: true
  - id: "powerful_ki"
    name: "Powerful Ki"
    cost: 200
    has_requirements: true
  # ... more breakthroughs
```

## Usage Examples

### Simple Breakthrough (No Requirements)
```yaml
name: Bully
id: bully
cost: 100
requirements: []
description: You gain +2 to intimidation rolls and can intimidate as a free action once per turn.
```

### Breakthrough with Race Requirement
```yaml
name: Powerful Ki
id: powerful_ki
cost: 200
requirements:
- Must be an Oni
description: When using Gravitational Ki, the range increases by 30ft. The push and pull distance increases by up to 10ft.
```

### Free Breakthrough
```yaml
name: Angelblooded
id: angelblooded
cost: 0
requirements:
- Must be descended from an angel
description: You gain resistance to radiant damage and can cast light as a cantrip.
```

## Implementation Notes

1. **Cost Parsing**: All costs are numeric integers (0-600 range)
2. **Requirement Parsing**: Requirements are split by newlines and cleaned
3. **Description Formatting**: Preserves paragraph breaks from the original HTML
4. **ID Generation**: Automatically generated from names using standard sanitization
5. **Actual Data**: Currently 68 breakthroughs total, with 49 having requirements and 19 without