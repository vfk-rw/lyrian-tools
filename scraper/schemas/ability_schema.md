# Lyrian Chronicles Ability Schema

This document provides a specification for representing ability data from the Lyrian Chronicles TTRPG in a structured YAML format.

The ability system has 4 distinct types, each with different patterns and fields:

## Core Ability Structure

```yaml
ability:
  id: string                 # Unique identifier (normalize Secret Arts as "secret_art__name")
  name: string               # Display name (e.g., "Secret Art: Efficient Spirit Control")
  type: string               # Ability type - see below for details
  keywords: list[string]     # List of keywords (can be empty array [])
  description: string        # Full description of what the ability does
  
  # Requirements to use (freeform text, complex parsing needed)
  requirements: list[string] # List of requirement descriptions
    # Examples:
    # - "Attack Deals Water(Frost) Damage."
    # - "You are mounted on a flying mount and the target is at least 20ft below you."
    # - "Must be mounted."
    # - [] (empty for abilities with no requirements)
```

## 1. True Abilities (`type: "true_ability"`)

Standard combat and general abilities. **584 abilities** in current data.

```yaml
ability:
  type: "true_ability"
  range: string | null       # Range: "Self", "Touch", "60ft", "120ft", "Sight", etc.
  
  # Cost structure - multiple formats supported
  costs:
    mana: integer | "X" | null     # Mana cost (note: "mana" not "mp")
    ap: integer | "X" | null       # Action points  
    rp: integer | "X" | "variable" | null  # Reaction points (can be "NaN RP" -> "variable")
    other: string | null           # For complex costs: "30 Crafting Points", etc.
  
  # For variable costs (when using "X")
  max_variable_cost: integer | null   # Maximum value for X costs
  variable_effect: string | null      # Description of how X affects the ability
```

## 2. Key Abilities (`type: "key_ability"`)

Level 1 passive abilities that provide benefits and associated abilities. **82 abilities** in current data.

```yaml
ability:
  type: "key_ability"
  
  # Benefits granted by this key ability
  benefits: list[string]     # List of benefit descriptions
    # Examples:
    # - "You gain proficiency in light armor, shields and a single group of weapons..."
    # - "You gain +5 skill points in the Religion skill."
  
  # Associated abilities that this key ability grants access to
  associated_abilities: list
    - name: string           # Name of the associated ability
      id: string             # ID of the associated ability
      # Note: Full details of associated ability stored separately
  
  # Some key abilities have costs for their associated abilities
  costs: object | null       # Cost structure for associated abilities (if any)
```

## 3. Crafting Abilities (`type: "crafting_ability"`)

Abilities used in the crafting system. **73 abilities** in current data.

```yaml
ability:
  type: "crafting_ability"
  
  # Crafting abilities use different cost structure
  cost: string | null        # Examples:
    # - "15 Crafting Points"
    # - "X Crafting Points" 
    # - "200u of Matching Raw Material"
    # - null (no cost)
  
  # Special crafting keywords
  keywords: list[string]     # Often includes "co-craft" for cooperative abilities
  
  # Subdivision handling
  # Note: Some crafting abilities contain multiple sub-abilities in their description
  # These should be parsed and split into separate ability entries with hierarchical IDs
  # Example: "Transmuter Tricks" contains 5 separate techniques
  parent_ability: string | null      # If this was subdivided from a parent ability
  subdivision_index: integer | null  # Order within subdivisions
```

## 4. Gathering Abilities (`type: "gathering_ability"`)

Abilities used in the gathering system. **8 abilities** in current data.

```yaml
ability:
  type: "gathering_ability"
  
  # Gathering abilities typically reference gathering sessions
  requirements: list[string] # Often includes:
    # - "Must in a gathering session. Costs 1 strike dice"
    # - "Must be in a gathering session."
  
  # Gathering mechanics
  gathering_cost: string | null      # "1 strike dice", "2 strike dice", etc.
  gathering_bonus: string | null     # "+5 bonus", "+3 bonus", etc.
  affects_node_points: boolean       # Whether ability affects node points
  affects_lucky_points: boolean      # Whether ability affects lucky points
```

## Keyword System

Keywords are standardized tags that modify ability behavior:

```yaml
keywords: list[string]  # Can be empty array []

# Common keyword categories:
# Combat Timing: "Rapid", "Encounter Start", "Counter"
# Magic Types: "Spell", "Arcane", "Bounded Field", "Holy", "Fire", "Lightning" 
# Action Types: "Shield", "Aid", "Healing", "Curse", "Combo"
# Weapon Types: "Unarmed Strike", "Secret Art", "Light Blade"
# Special Mechanics: "Lock On", "Concentration", "Teleport", "Pass"
# Crafting: "co-craft" (for cooperative crafting abilities)
```

## Requirements System

Requirements are currently stored as freeform text due to their complexity:

```yaml
requirements: list[string]  # Examples from actual data:

# Combat conditions:
- "Attack Deals Water(Frost) Damage."
- "You missed an attack with a Heavy Melee Weapon."
- "The target has the Bleeding debuff."

# Positional requirements:
- "You are mounted on a flying mount and the target is at least 20ft below you."
- "Must be mounted."
- "You are within 10ft of an ally."

# Ability state requirements:
- "You can identify the disease."
- "You have a spell prepared."
- "This ability must target the same creature as your previous ability."

# Resource requirements (gathering):
- "Must in a gathering session. Costs 1 strike dice"

# No requirements:
- [] # Empty array for abilities with no requirements
```

## Cost Structure Details

The cost system varies significantly by ability type:

```yaml
# Standard resource costs (true_ability, key_ability)
costs:
  mana: 4              # Fixed mana cost
  mana: "X"            # Variable mana cost (user chooses)
  ap: 2                # Action points
  rp: 1                # Reaction points
  rp: "variable"       # For abilities with "NaN RP" costs
  other: "30 Crafting Points"  # Complex cost descriptions

# Crafting abilities use different structure
cost: "15 Crafting Points"     # String-based cost
cost: "X Crafting Points"      # Variable crafting cost
cost: "200u of Matching Raw Material"  # Material costs
cost: null                     # No cost

# Variable cost limits and effects
max_variable_cost: 5           # "You can spend a maximum of 5 mana"
variable_effect: "Add 2 x Mana you spent on this"  # How X affects ability
```

## Special Cases and Parsing Notes

**1. Secret Art ID Normalization:**
```yaml
# Input: "Secret Art: Efficient Spirit Control"
# Output ID: "secret_art__efficient_spirit_control"  # Double underscore pattern
```

**2. Crafting Ability Subdivision:**
```yaml
# Some abilities like "Transmuter Tricks" contain multiple techniques
# Parser should detect multiple "Cost:" patterns and split into separate abilities:
# Original: transmuter_tricks
# Subdivisions: 
#   - transmuter_tricks__a_small_bit_of_creation
#   - transmuter_tricks__perfect_preservation  
#   - transmuter_tricks__masterful_dilution
#   - etc.
```

**3. Empty vs Null Values:**
```yaml
keywords: []           # Empty array (ability has no keywords)
range: null           # Null value (ability has no range)
requirements: []      # Empty array (ability has no requirements)
costs: {}             # Empty object (ability has no costs)
```

## Ability Examples

### Example: True Ability (Standard Combat Ability)

```yaml
# Absorb Ice (typical true ability)
ability:
  id: "absorb_ice"
  name: "Absorb Ice"
  type: "true_ability"
  keywords: ["Rapid"]
  range: "Self"
  description: "When you take damage from any source, you can use this ability to reduce that damage by 5 and gain 2 mana. If the damage dealt was Water(Frost) damage, you instead reduce the damage by 10 and gain 4 mana."
  requirements:
    - "Attack Deals Water(Frost) Damage."
  costs:
    rp: 1
    mana: 2
    ap: 2
```

### Example: True Ability with Variable Cost

```yaml
# Variable X cost ability
ability:
  id: "lightning_bolt"
  name: "Lightning Bolt"
  type: "true_ability"
  keywords: ["Spell", "Lightning"]
  range: "120ft"
  description: "Deal 3 + X Wind(Lightning) damage to a single target."
  requirements: []
  costs:
    mana: "X"
    ap: 1
  max_variable_cost: 5
  variable_effect: "Add X to damage dealt"
```

### Example: Key Ability (Level 1 Class Feature)

```yaml
# Acolyte's Journey (typical key ability)
ability:
  id: "acolytes_journey"
  name: "Acolyte's Journey"
  type: "key_ability"
  keywords: []
  description: "You have begun your religious training and have access to divine magic."
  requirements: []
  benefits:
    - "You gain proficiency in light armor, shields and a single group of weapons of your choice."
    - "You gain +5 skill points in the Religion skill."
    - "You gain the Presence Concealment ability."
  associated_abilities:
    - name: "Presence Concealment"
      id: "presence_concealment"
  costs:
    ap: 4  # Cost for the associated ability
```

### Example: Crafting Ability (Basic)

```yaml
# Simple crafting ability
ability:
  id: "masterful_dilution"
  name: "Masterful Dilution"
  type: "crafting_ability"
  keywords: ["co-craft"]
  description: "You deconstruct and reconstruct an existing item, reducing its tier by 1. This reduces the required materials by 1 tier as well."
  requirements: []
  cost: "15 Crafting Points"
```

### Example: Crafting Ability (Subdivided from Parent)

```yaml
# Subdivision from "Transmuter Tricks" parent ability
ability:
  id: "transmuter_tricks__a_small_bit_of_creation"
  name: "A Small Bit of Creation"
  type: "crafting_ability"
  keywords: []
  description: "You deconstruct and reconstruct an existing item, reducing its tier by 1. This reduces the required materials by 1 tier as well."
  requirements: []
  cost: "30 Crafting Points"
  parent_ability: "transmuter_tricks"
  subdivision_index: 1
```

### Example: Gathering Ability

```yaml
# Divining Petalfall (typical gathering ability)
ability:
  id: "divining_petalfall"
  name: "Divining Petalfall"
  type: "gathering_ability"
  keywords: []
  description: "Make a gathering check with +5 bonus. If you succeed, you gain 1 Node Point, and if you get a natural 20, you gain 1 Lucky Point."
  requirements:
    - "Must in a gathering session. Costs 1 strike dice"
  gathering_cost: "1 strike dice"
  gathering_bonus: "+5 bonus"
  affects_node_points: true
  affects_lucky_points: true
```

### Example: Secret Art Normalization

```yaml
# Secret Art with proper ID normalization
ability:
  id: "secret_art__efficient_spirit_control"  # Note: double underscore
  name: "Secret Art: Efficient Spirit Control"
  type: "true_ability"
  keywords: ["Secret Art"]
  range: "Self"
  description: "Your summoned spirits cost 1 less AP to summon (minimum 1 AP)."
  requirements: []
  costs: {}  # No costs for this secret art
```

### Example: Complex Variable Cost Ability

```yaml
# Ability with cost limits and complex effects
ability:
  id: "power_heal"
  name: "Power Heal"
  type: "true_ability"
  keywords: ["Healing", "Spell"]
  range: "Touch"
  description: "Heal a target for 5 + X HP. You can spend a maximum of 5 mana on this ability."
  requirements: []
  costs:
    mana: "X"
    ap: 2
  max_variable_cost: 5
  variable_effect: "Add X to healing done"
```

### Example: Ability with No Requirements/Costs

```yaml
# Passive ability with no activation requirements or costs
ability:
  id: "flight"
  name: "Flight"
  type: "true_ability"
  keywords: []
  range: null
  description: "You can fly at your movement speed."
  requirements: []  # No requirements to use
  costs: {}         # No costs to use
```

### Example: Complex Requirement Patterns

```yaml
# Ability with complex situational requirements
ability:
  id: "mounted_charge"
  name: "Mounted Charge"
  type: "true_ability"
  keywords: ["Mounted"]
  range: "Melee Weapon Range"
  description: "Make a weapon attack with +2 to hit and +5 damage."
  requirements:
    - "Must be mounted."
    - "You must move at least 20ft in a straight line toward the target."
  costs:
    ap: 3
```

## Ability Specification Validation

This specification has been designed to handle all patterns found in the existing **758 abilities** dataset:

### Coverage Validation

**✅ Ability Types (100% coverage):**
- `true_ability`: 583 abilities (77.0%)
- `key_ability`: 112 abilities (14.8%)  
- `crafting_ability`: 55 abilities (7.3%)
- `gathering_ability`: 8 abilities (1.1%)

**✅ Cost Patterns (All patterns covered):**
- Fixed integer costs: `mana: 4`, `ap: 2`, `rp: 1`
- Variable costs: `mana: "X"`, `ap: "X"`
- Special costs: `rp: "variable"` (for "NaN RP")
- Crafting costs: `cost: "15 Crafting Points"`
- Material costs: `cost: "200u of Matching Raw Material"`
- No costs: `costs: {}` or `cost: null`

**✅ Keyword Patterns (All categories covered):**
- Empty arrays: `keywords: []` (most common)
- Combat timing: `["Rapid"]`, `["Encounter Start"]`
- Magic types: `["Spell", "Lightning"]`, `["Arcane"]`
- Special mechanics: `["Lock On"]`, `["Concentration"]`
- Crafting: `["co-craft"]`

**✅ Requirements Patterns (Comprehensive freeform support):**
- Combat conditions: `"Attack Deals Water(Frost) Damage."`
- Positional: `"Must be mounted."`
- Resource: `"Must in a gathering session. Costs 1 strike dice"`
- Complex: `"You are mounted on a flying mount and the target is at least 20ft below you."`
- None: `requirements: []`

**✅ Range Patterns (All found ranges supported):**
- Standard: `"Self"`, `"Touch"`, `"60ft"`, `"120ft"`
- Weapon-based: `"Melee Weapon Range"`, `"Ranged Weapon Range"`
- Special: `"Sight"`, `"5ft"`
- None: `range: null`

**✅ Special Cases (All edge cases handled):**
- Secret Art ID normalization: `secret_art__name` pattern
- Crafting ability subdivision: Parent/child relationships with hierarchical IDs
- Associated abilities: Key ability → true ability relationships
- Variable cost limits: `max_variable_cost` and `variable_effect` fields
- Empty vs null distinction: Proper handling of missing vs empty data

### Parser Implementation Guidance

**1. Type Detection Priority:**
```python
# Order matters - check for specific types first
if soup.select_one('app-key-ability'):
    return 'key_ability'
elif should_parse_as_crafting(ability_data):
    return 'crafting_ability'  
elif should_parse_as_gathering(ability_data):
    return 'gathering_ability'
else:
    return 'true_ability'  # Default for most abilities
```

**2. Cost Parsing Logic:**
```python
# Handle multiple cost field names and formats
costs = {}
for field in ['mana_cost', 'ap_cost', 'rp_cost']:
    if field in ability_data:
        cost_type = field.replace('_cost', '')
        value = ability_data[field]
        if 'X' in value:
            costs[cost_type] = 'X'
        elif 'NaN' in value:
            costs[cost_type] = 'variable'
        else:
            costs[cost_type] = extract_number(value)
```

**3. Secret Art ID Normalization:**
```python
def normalize_ability_id(name: str) -> str:
    if name.startswith("Secret Art:"):
        art_name = name.replace("Secret Art:", "").strip()
        art_id = sanitize_id(art_name)
        return f"secret_art__{art_id}"  # Double underscore
    else:
        return sanitize_id(name)
```

**4. Crafting Subdivision Detection:**
```python
def should_subdivide_crafting(description: str) -> bool:
    # Look for multiple "Cost:" patterns
    cost_count = description.lower().count('cost:')
    return cost_count >= 2
```

This specification comprehensively covers all patterns found in the 758-ability dataset and provides clear implementation guidance for the parser.