# Angel's Sword TTRPG Class Specification

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
  image_url: string          # URL to class image

  # Requirements can be complex with AND/OR logic
  requirements:
    type: "and" | "or"       # Whether all requirements must be met (AND) or at least one (OR)
    conditions:              # List of conditions that must be satisfied
      - type: string         # Type of requirement
        # Types include:
        # - class_mastery (specific class or any)
        # - element_mastery
        # - weapon_proficiency (can specify options)
        # - armor_proficiency
        # - race
        # - spell
        # - breakthrough
        # - skill_points (requires points in specific skill)
        # - expertise_points (requires points in specific expertise)
        
        value: string | list # Required value or list of values
        description: string  # Human-readable description
        # Additional fields depending on type:
        options: list        # For weapon/armor proficiency, list of valid options
        points: integer      # For skill/expertise requirements, minimum points needed

  # Progression is a list of level benefits
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
          # - proficiency (grants a proficiency)
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
    # - passive (permanent effects, no activation)
    # - combat_action (used in combat)
    # - crafting_action (used during crafting)
    # - interlude_action (used during interludes)
    # - encounter_start (used at start of encounter)
    # - encounter_conclusion (used at end of encounter)
  
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
    mana: integer | null
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
# Level 3 progression for Adventurer
progression:
  - level: 3
    benefits:
      - type: "skills"
        points: 5
        eligible_skills: ["athletics", "acrobatics", "intimidation", "magic", "history", "flight", "artifice", "common_knowledge", "expert_knowledge"]
        expert_knowledge_needs_approval: true
        can_convert_to_expertise: true
        conversion_ratio: 2
```