# Lyrian Chronicles Breakthrough Schema

This document provides a specification for representing breakthrough data from the Lyrian Chronicles TTRPG in a structured YAML format.

## Overview

Breakthroughs are special character advancement options that provide unique abilities, features, or modifications beyond standard class progression. They typically require XP investment and may have specific prerequisites.

## Breakthrough Structure

```yaml
breakthrough:
  name: string              # Display name (e.g., "Blend In", "Adamantine Body")
  id: string                # Unique identifier (sanitized name)
  cost: integer | "variable" | null  # XP cost (typically 100-500, or "variable")
  requirements: list[string]         # List of prerequisites (can be empty)
  description: string       # Full description of the breakthrough's effects
```

## Fields

### Name
The display name of the breakthrough as shown in the game.

Examples:
- "Blend In"
- "Adamantine Body"
- "Awakened Spellcasting"
- "Blood of the Progenitor"

### ID
A sanitized version of the name suitable for file names and references.
- Lowercase
- Spaces replaced with underscores
- Special characters removed

Examples:
- `blend_in`
- `adamantine_body`
- `awakened_spellcasting`
- `blood_of_the_progenitor`

### Cost
The XP cost required to purchase the breakthrough.

Types:
- **Numeric**: Most breakthroughs have fixed costs (e.g., 100, 200, 300, 500)
- **Variable**: Some breakthroughs have costs that depend on other factors
- **None/null**: Rare cases where cost is not specified or not applicable

```yaml
# Fixed cost
cost: 300

# Variable cost
cost: "variable"

# No cost specified
cost: null
```

### Requirements
Prerequisites that must be met before taking the breakthrough.

Common requirement types:
- **Race Requirements**: "Must be a Slimefolk.", "Must be a Demon."
- **Class Requirements**: "Must have levels in Mage.", "Must be a Warrior."
- **Ability Requirements**: "Must know at least 3 Fire spells."
- **Level Requirements**: "Must be level 10 or higher."
- **Other Requirements**: Various specific conditions

```yaml
# Single requirement
requirements:
  - "Must be a Slimefolk."

# Multiple requirements
requirements:
  - "Must be level 5 or higher."
  - "Must have the Spellcasting feature."

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
total_count: 150
version: "0.10.1"
generated_at: "2025-01-06T12:00:00Z"
cost_summary:
  numeric: 120      # Breakthroughs with fixed numeric costs
  variable: 10      # Breakthroughs with variable costs
  none: 20          # Breakthroughs with no specified cost
with_requirements: 100
without_requirements: 50
breakthroughs:
  - id: "adamantine_body"
    name: "Adamantine Body"
    cost: 200
    has_requirements: true
  - id: "blend_in"
    name: "Blend In"
    cost: 300
    has_requirements: true
  # ... more breakthroughs
```

## Usage Examples

### Simple Breakthrough
```yaml
name: "Toughness"
id: "toughness"
cost: 100
requirements: []
description: "You gain +10 maximum HP."
```

### Breakthrough with Race Requirement
```yaml
name: "Blend In"
id: "blend_in"
cost: 300
requirements:
  - "Must be a Slimefolk."
description: "You disguise your appearance using magic to be that of another race. This skill does not allow you to change your appearance at will, but instead lets you appear as you would as a different race. You choose this race when this breakthrough is picked up and cannot change it.\n\nIn addition, the first time you're attacked in combat while disguised in this way, you can use Slime Body for 0 RP. This effect does not work if the attacker knows that you are a Slimefolk."
```

### Breakthrough with Variable Cost
```yaml
name: "Extra Training"
id: "extra_training"
cost: "variable"
requirements: []
description: "Gain additional skill points in a skill of your choice. The cost depends on your current skill level."
```

### Breakthrough with Multiple Requirements
```yaml
name: "Arcane Mastery"
id: "arcane_mastery"
cost: 500
requirements:
  - "Must be level 10 or higher."
  - "Must have at least 20 Intelligence."
  - "Must know at least 10 different spells."
description: "Your mastery of the arcane arts grants you exceptional power. All your spells gain +2 to their save DC and you gain +1 spell slot of each level you can cast."
```

## Implementation Notes

1. **Cost Parsing**: The parser attempts to extract numeric values from cost text, but falls back to "variable" for non-numeric costs
2. **Requirement Parsing**: Requirements are split by newlines, semicolons, or "and" keywords
3. **Description Formatting**: Preserves paragraph breaks from the original HTML
4. **ID Generation**: Automatically generated from names using standard sanitization