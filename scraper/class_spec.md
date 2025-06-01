# Angel's Sword TTRPG Data Specification

This document provides a specification for representing class data from the Angel's Sword TTRPG in a structured YAML format.

## Class Structure

```yaml
class:
  id: string                 # Unique identifier (usually snake_case of name)
  name: string               # Display name of the class
  tier: integer              # 1-3 typically
  difficulty: integer        # 1-5 typically
  main_role: string          # Primary role (striker, controller, artisan, etc.)
  secondary_role: string     # Secondary role (or null)

  # Requirements can be in multiple formats:
  # Format 1: Simple string list (most common in current data)
  requirements: list[string]  # Simple list of requirement descriptions
  
  # Format 2: Structured requirements (for complex logic)
  requirements:
    type: "and" | "or" | "none"  # Whether all requirements must be met (AND), at least one (OR), or none
    conditions:                  # List of conditions that must be satisfied
      - type: string             # Type of requirement
        # Types include:
        # - class_mastery (specific class, tier of class, or any)
        # - element_mastery
        # - weapon_proficiency (can specify options)
        # - armor_proficiency
        # - race
        # - spell
        # - breakthrough
        # - skill_points (requires points in specific skill)
        # - expertise_points (requires points in specific expertise)
        
        value: string | list     # Required value or list of values
        description: string      # Human-readable description
        # Additional fields depending on type:
        options: list            # For weapon/armor proficiency, list of valid options
        points: integer          # For skill/expertise requirements, minimum points needed

  # Progression is a list of level benefits. can have multiple benefits per level (usually with level 1)
  progression:
    - level: integer
      benefits:
        - type: string       # Type of benefit
          # Types include:
          # - ability (grants a specific ability)
          # - skills (grants skill points to distribute)
          # - attribute (grants a fixed attribute bonus)
          # - attribute_choice (choice between attribute bonuses)
          # - expertise_points (grants expertise points)
          # - proficiency (grants a proficiency. can be specific, or a group (common, melee, ranged, specialized, channeling))
          # - element_mastery (grants mastery of an element)
          
          # Fields for specific benefit types:
          value: string      # ID of the ability, element, etc.
          points: integer    # Number of points for skills/expertise
          
          # For fixed attribute bonuses (type: "attribute")
          attribute: string  # One of: Focus, Agility, Toughness, Power, Fitness, Reason, Awareness, Presence, Cunning
          # Note: "heart" is invalid - should be parsed as specific attribute from description
          
          # For skills (type: "skills")
          description: string    # Human-readable description (current format)
          eligible_skills: list  # List of skills that can receive points (structured format)
          can_convert_to_expertise: boolean  # Whether skill points can be converted
          conversion_ratio: integer  # Ratio for conversion to expertise points
          
          # For attribute_choice (type: "attribute_choice")
          choose: integer    # Number of options to choose (default: 1)
          # Format 1: Simple string list (current data format)
          options: list[string]  # List of attribute names as strings
          # Format 2: Structured format (preferred)
          options: list      # List of options
            # Each option is: { attribute: string, value: integer }

  # Additional information
  description: string
  guide: string
```

## Ability Structure

The ability system in Angel's Sword has 4 distinct types, each with different patterns and fields:

### Core Ability Structure

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

### 1. True Abilities (`type: "true_ability"`)

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

### 2. Key Abilities (`type: "key_ability"`)

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

### 3. Crafting Abilities (`type: "crafting_ability"`)

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

### 4. Gathering Abilities (`type: "gathering_ability"`)

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

### Keyword System

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

### Requirements System

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

### Cost Structure Details

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

### Special Cases and Parsing Notes

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

This specification has been designed to handle all patterns found in the existing **747 abilities** dataset:

### Coverage Validation

**✅ Ability Types (100% coverage):**
- `true_ability`: 584 abilities (78.2%)
- `key_ability`: 82 abilities (11.0%)  
- `crafting_ability`: 73 abilities (9.8%)
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

This specification comprehensively covers all patterns found in the 747-ability dataset and provides clear implementation guidance for the parser.

## Element Structure

```yaml
element:
  id: string                 # Element ID (lightning, fire, etc.)
  name: string               # Display name
  type: string               # Parent element type (wind, earth, etc.)
  description: string        # Description of the element
```

## Examples

### Example: Elemental Mastery Requirement

```yaml
# Electromancer class requirements
requirements:
  type: "or"
  conditions:
    - type: "class_mastery"
      value: "any"
      description: "Any class mastered"
    - type: "element_mastery"
      value: "lightning"
      description: "Have Lightning element mastered"
```

### Example: Breakthrough Requirement

```yaml
requirements:
  type: "and"
  conditions:
    - type: "breakthrough"
      value: "mystic_eyes_of_faerie_light"
      description: "Must have the 'Mystic Eyes of Faerie Light' breakthrough."
```

### Example: Class Mastery and Expertise Requirement

```yaml
requirements:
  type: "and"
  conditions:
    - type: "class_mastery"
      value: "lancer"
      description: "Lancer mastered"
    - type: "expertise_points"
      value: "athletics_jumping"
      points: 10
      description: "10 Points in the Athletics (Jumping) expertise skill."
```

### Example: Simple String Requirements (Current Data Format)

```yaml
# Most classes in current data use this format
requirements:
  - "Any class mastered."
  - "Have at least 1 spell"
  - "Be proficient in at least 1 melee weapon."

# Or for classes with no requirements:
requirements:
  - "None."

# Complex examples from current data:
requirements:
  - "Have at least 5 skill points in the Art (Singing) expertise or at least 5 points in an Art expertise of an instrument."
```

### Example: Race and Armor Proficiency Requirement

```yaml
requirements:
  type: "and"
  conditions:
    - type: "race"
      value: "human"
      description: "Human"
    - type: "armor_proficiency"
      value: "medium_armor"
      description: "Proficient with medium armor"
    - type: "armor_proficiency"
      value: "shield"
      description: "Proficient with shields"
```

### Example: Ability That Grants Element Mastery

```yaml
# Superconductor ability (Electromancer key ability)
ability:
  id: "superconductor"
  name: "Superconductor"
  type: "passive"
  keywords: []
  description: "Your attacks that deal Wind(Lightning) Damage gain Lock On and Half Pierce when used against a target in water, with water typing or with the Soaked debuff."
  benefits:
    - type: "element_mastery"
      value: "lightning"
      description: "You gain Elemental Mastery: Lightning."
    - type: "special_effect"
      value: "lightning_water_synergy"
      description: "Attacks dealing Wind(Lightning) Damage gain Lock On and Half Pierce against targets in water, with water typing, or with the Soaked debuff."
```

### Example: Weapon Proficiency Requirements

```yaml
# Flash Star Blade Style requirements
requirements:
  type: "and"
  conditions:
    - type: "class_mastery"
      value: "any"
      description: "Any class mastered"
    - type: "weapon_proficiency"
      value: "light_blades_longsword_katana"
      options: ["light_blades", "longsword", "katana"]
      description: "Proficiency in one of light blades, longsword or katana"
```

### Example: Skill Distribution

```yaml
# Level 3 progression for Adventurer (structured format)
progression:
  - level: 3
    benefits:
      - type: "skills"
        points: 5
        eligible_skills: ["athletics", "acrobatics", "intimidation", "magic", "history", "flight", "artifice", "common_knowledge", "expert_knowledge"]
        expert_knowledge_needs_approval: true
        can_convert_to_expertise: true
        conversion_ratio: 2

# Current data format (description only)
progression:
  - level: 3
    benefits:
      - type: "skills"
        points: 5
        description: "You gain +5 skill points to spend on any non crafting skill. You can exchange any skill point for 2 expertise points, but must spend them in these skills."
```

### Example: Attribute Choices (Multiple Formats)

```yaml
# Current data format - simple string list
progression:
  - level: 7
    benefits:
      - type: "attribute_choice"
        choose: 1
        options: ["Power", "Focus", "Agility", "Toughness"]
        description: "You gain +1 to Focus, Power, Agility or Toughness."

# Structured format (preferred)
progression:
  - level: 7
    benefits:
      - type: "attribute_choice"
        choose: 1
        options:
          - attribute: "Power"
            value: 1
          - attribute: "Focus" 
            value: 1
          - attribute: "Agility"
            value: 1
          - attribute: "Toughness"
            value: 1

# Current data issue - "heart" attribute (needs parsing)
progression:
  - level: 5
    benefits:
      - type: "attribute"
        attribute: "heart"  # INVALID - should be parsed from description
        description: "You gain +1 Reason."
```

### Example: Ability References and Secret Art Naming

```yaml
# Current data shows inconsistent Secret Art ID patterns
ability_references:
  - id: "secret_art_efficient_spirit_control"
    name: "Secret Art: Efficient Spirit Control"
    type: "ability"
  
  # Should be normalized to:
  - id: "secret_art__efficient_spirit_control"  # Note double underscore before ability name
    name: "Secret Art: Efficient Spirit Control"
    type: "ability"

# Other ability types found in current data
ability_references:
  - id: "adventurer_essentials"
    name: "Adventurer Essentials"
    type: "key_ability"    # Key abilities (level 1)
  
  - id: "power_jump"
    name: "Power Jump"
    type: "ability"        # Regular abilities
```

## Current Data Format Issues Found (A-E Classes Analysis)

### Issues to Address in Parser:

1. **"Heart" Attribute Parsing**: All classes show `attribute: "heart"` which is invalid. The actual attribute should be parsed from the description text.

2. **Requirements Format**: 100% of classes use simple string list format instead of structured requirements. This works but limits parsing capabilities.

3. **Skills Benefits**: All skill benefits only have `description` field. Structured data (`eligible_skills`, `can_convert_to_expertise`) should be extracted from description text.

4. **Attribute Choice Options**: All use simple string arrays instead of structured `{attribute, value}` objects.

5. **Secret Art IDs**: Inconsistent underscore patterns in Secret Art ability IDs.

### Classes Needing Special Attention:

- **Abjurer**: `"Arcane Barrier learned"` requirement suggests spell dependency
- **Angelblooded**: `"Must have the Angelblooded breakthrough"` - breakthrough requirement
- **Bard**: Complex expertise requirement with multiple skill options
- **Battle Mage**: Multiple requirements with spell and weapon proficiency
- **Assassin**: Multi-class mastery requirement (`"Rogue mastered", "any tier 2 class mastered"`)

# Angel's Sword TTRPG Race Specification

This document provides a specification for representing race data from the Angel's Sword TTRPG in a structured YAML format.

## Race Structure

```yaml
race:
  id: string                 # Unique identifier (usually snake_case of name)
  name: string               # Display name of the race
  type: string               # "primary" or "subrace"
  primary_race: string?      # Only for subraces, references the primary race
  description: string
  benefits:
    - type: string       # Type of benefit
      # Types include:
      # - ability (grants a specific ability)
      # - skills (grants skill points to distribute)
      # - attribute_choice (choice between attribute bonuses. a single +1 attribute is just attribute_choice with a single option.)
      # - expertise_points (grants expertise points)
      # - proficiency (grants a proficiency. can be specific, or a group (common, melee, ranged, specialized, channeling))
      # - element_mastery (grants mastery of an element)
      
      # Fields for specific benefit types:
      value: string      # ID of the ability, element, etc.
      points: integer    # Number of points for skills/expertise
      attribute: string  # For fixed attribute bonuses - Focus, Agility, Toughness, Power, Fitness, Reason, Awareness, Presence, Cunning
      eligible_skills: list  # List of skills that can receive points
      can_convert_to_expertise: boolean  # Whether skill points can be converted
      conversion_ratio: integer  # Ratio for conversion to expertise points
      
      # For attribute_choice
      choose: integer    # Number of options to choose
      options: list      # List of options
        # Each option is: { attribute: string, value: integer }
```
