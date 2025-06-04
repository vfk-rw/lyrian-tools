# Lyrian Chronicles Keyword Schema

This document provides a specification for representing keyword data from the Lyrian Chronicles TTRPG in a structured YAML format.

## Overview

Keywords are standardized tags that modify ability behavior and provide consistent game mechanics across the system. They appear on abilities, items, and class features to indicate special rules or effects.

## Keyword Structure

```yaml
name: string              # Display name (e.g., "Rapid", "Burning")
id: string                # Unique identifier (sanitized name)
type: string              # Keyword category - see below for types
description: string       # Full description of the keyword's effect
variable_info: string     # Optional: Explanation of X or variable values (only if description contains "X")
```

## Keyword Types

Based on the actual parsed data, keywords are categorized into the following types:

### 1. General (`type: "general"`)
Default category for most keywords that don't fit specialized types. This includes most game mechanics.

Examples: Aid, Artillery, Blinded, Broken, Challenge, Combo, Concentration, Disarm, Enchantment, Esoteric Art, Expose, Full Pierce, Guard Crush, Half Pierce, Immovable, Instant, Killing Blow, Lock On, Miracle, Mystic Eye, Ninjutsu, Overcharge, Pass, Presence Concealment, Prone, Quick, Rage, Root, Secret Art, Setup, Shaken, Sickened, Sidestep, Slow, Song, Sound, Stance, Stun, Summon, Sunder, Sure Hit, Transformation, Unbalanced, Upkeep, Weakened

### 2. Timing (`type: "timing"`)
Keywords that affect when abilities can be used.

Examples: Daze, Rapid, Static

### 3. Status (`type: "status"`)
Conditions and debuffs that affect characters.

Examples: Burning

### 4. Element (`type: "element"`)
Elemental damage types.

Examples: Fire

### 5. Combat (`type: "combat"`)
Combat mechanics and action types.

Examples: Shieldbreaker, Soaked, Trick Attack, Unarmed Strike

### 6. Spell (`type: "spell"`)
Magic and spellcasting keywords.

Examples: Spell

### 7. Movement (`type: "movement"`)
Movement and positioning keywords.

Examples: Teleport

## Variable Values

Some keywords use variable values, typically represented as "X":

```yaml
name: "Burning"
id: "burning"
type: "status"
description: "A Burning character takes X damage at the end of their turn. They may spend 1 AP to remove this effect."
variable_info: "Variable value (context-dependent)"
```

The `variable_info` field is only present when the description contains variable values like "X".

## Index File Structure

The keyword index provides a summary of all keywords:

```yaml
# keywords_index.yaml
total_count: 57
version: "0.10.1"
generated_at: "2025-06-02T14:58:34.352097"
by_type:
  general: 46
  status: 1
  timing: 3
  element: 1
  combat: 4
  spell: 1
  movement: 1
keywords:
  - id: "rapid"
    name: "Rapid"
    type: "timing"
  - id: "burning"
    name: "Burning"
    type: "status"
    has_variable: true
  # ... more keywords
```

## Usage Examples

### Simple Keyword
```yaml
name: Rapid
id: rapid
type: timing
description: This ability can be used more than once per turn.
```

### Status Effect with Variable
```yaml
name: Burning
id: burning
type: status
description: A Burning character takes X damage at the end of their turn. They may spend 1 AP to remove this effect.
variable_info: Variable value (context-dependent)
```

### Element Keyword
```yaml
name: Fire
id: fire
type: element
description: This damage type represents fire-based attacks and is often used for burning or heat-based effects.
```

## Implementation Notes

1. **ID Generation**: IDs are created by converting names to lowercase and replacing spaces/special characters with underscores
2. **Type Detection**: The parser attempts to automatically categorize keywords based on name and description patterns, with most falling into the "general" category
3. **Variable Detection**: The parser looks for "X" in descriptions and adds variable_info field when found
4. **Actual Data**: Currently 57 keywords total, with 46 in "general" category