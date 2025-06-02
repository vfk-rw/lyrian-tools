# Lyrian Chronicles Keyword Schema

This document provides a specification for representing keyword data from the Lyrian Chronicles TTRPG in a structured YAML format.

## Overview

Keywords are standardized tags that modify ability behavior and provide consistent game mechanics across the system. They appear on abilities, items, and class features to indicate special rules or effects.

## Keyword Structure

```yaml
keyword:
  name: string              # Display name (e.g., "Rapid", "Burning")
  id: string                # Unique identifier (sanitized name)
  type: string              # Keyword category - see below for types
  description: string       # Full description of the keyword's effect
  variable_info: string     # Optional: Explanation of X or variable values
  related_keywords: list    # Optional: List of related keyword names
```

## Keyword Types

Keywords are categorized into the following types:

### 1. Timing (`type: "timing"`)
Keywords that affect when abilities can be used.

Examples:
- **Rapid**: Can be used as a reaction
- **Counter**: Triggered in response to attacks
- **Encounter Start**: Activates at beginning of combat
- **Turn End**: Triggers at end of turn

### 2. Element (`type: "element"`)
Elemental damage types and resistances.

Examples:
- **Fire**: Fire damage/resistance
- **Water**: Water damage/resistance
- **Frost**: Ice/cold subtype of Water
- **Lightning**: Electrical damage
- **Holy**: Divine/radiant damage
- **Dark**: Shadow/necrotic damage

### 3. Status (`type: "status"`)
Conditions and debuffs that affect characters.

Examples:
- **Burning**: Takes X damage per turn
- **Bleeding**: Ongoing physical damage
- **Stunned**: Cannot act
- **Frozen**: Movement restricted
- **Poisoned**: Various negative effects
- **Cursed**: Magical affliction

### 4. Combat (`type: "combat"`)
Combat mechanics and action types.

Examples:
- **Strike**: Physical attack modifier
- **Attack**: General attack keyword
- **Shield**: Defensive action
- **Parry**: Counter-attack defense
- **Aid**: Support action

### 5. Weapon (`type: "weapon"`)
Weapon categories and restrictions.

Examples:
- **Light Blade**: Daggers, shortswords
- **Heavy Blade**: Longswords, greatswords
- **Bow**: Ranged weapons
- **Unarmed Strike**: Natural weapons
- **Staff**: Magical implements

### 6. Movement (`type: "movement"`)
Movement and positioning keywords.

Examples:
- **Teleport**: Instant movement
- **Flight**: Aerial movement
- **Speed**: Movement distance modifier

### 7. Spell (`type: "spell"`)
Magic and spellcasting keywords.

Examples:
- **Spell**: Indicates magical ability
- **Arcane**: Wizard-type magic
- **Bounded Field**: Area effect magic
- **Concentration**: Requires focus

### 8. Defense (`type: "defense"`)
Defensive and resistance keywords.

Examples:
- **Resistance**: Damage reduction
- **Immunity**: Complete protection
- **Absorb**: Convert damage to healing

### 9. General (`type: "general"`)
Default category for keywords that don't fit other types.

## Variable Values

Some keywords use variable values, typically represented as "X":

```yaml
keyword:
  name: "Burning"
  description: "A Burning character takes X damage at the end of their turn..."
  variable_info: "Variable value (context-dependent)"
```

Common variable patterns:
- **X damage**: Variable damage amount
- **X rounds**: Variable duration
- **X feet**: Variable distance
- **X targets**: Variable number of targets

## Related Keywords

Keywords can reference other related keywords:

```yaml
keyword:
  name: "Rapid"
  related_keywords:
    - "Counter"
    - "Encounter Start"
```

This helps players understand keyword interactions and find similar mechanics.

## Index File Structure

The keyword index provides a summary of all keywords:

```yaml
# keywords_index.yaml
total_count: 150
version: "0.10.1"
generated_at: "2025-01-06T12:00:00Z"
by_type:
  timing: 12
  element: 15
  status: 20
  combat: 25
  weapon: 18
  movement: 8
  spell: 22
  defense: 10
  general: 20
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
name: "Rapid"
id: "rapid"
type: "timing"
description: "This ability can be used as a reaction when its requirements are met."
```

### Status Effect with Variable
```yaml
name: "Burning"
id: "burning"
type: "status"
description: "A Burning character takes X damage at the end of their turn. They may spend 1 AP to remove this effect."
variable_info: "Variable value (context-dependent)"
```

### Element with Related Keywords
```yaml
name: "Fire"
id: "fire"
type: "element"
description: "This ability deals fire damage. Fire damage is super effective against ice-based enemies."
related_keywords: ["Burning", "Heat", "Flame"]
```

## Implementation Notes

1. **ID Generation**: IDs are created by converting names to lowercase and replacing spaces/special characters with underscores
2. **Type Detection**: The parser attempts to automatically categorize keywords based on name and description patterns
3. **Variable Detection**: The parser looks for "X" in descriptions and attempts to extract explanations
4. **Related Keywords**: Extracted from description text using patterns like "similar to", "like", "see also"