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

```yaml
ability:
  id: string                 # Unique identifier
  name: string               # Display name
  type: string               # Type of ability
    # Types include:
    # - passive (permanent effects, no activation / has no cost)
    # - combat_action (used in combat)
    # - crafting_action (used during crafting)
    # - interlude_action (used during interludes)
  
  keywords: list             # List of keywords
  range: string | null       # Range of the ability
  description: string        # Description of what the ability does
  
  # Requirements to use
  requirements:
    - type: string           # Type of requirement
      description: string    # Human-readable description
      value: string | list   # Required value
  
  # Costs to use
  costs:
    ap: integer | null
    rp: integer | null
    mp: integer | null
    interlude_point: integer | null
  
  # For passive abilities
  benefits:
    - type: string           # Type of benefit
      # Types include:
      # - attribute_bonus
      # - skill_bonus
      # - proficiency
      # - element_mastery
      # - special_effect
      value: string | object # Value of the benefit
```

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
