# Lyrian Chronicles Item Schema

This document provides a specification for representing item data from the Lyrian Chronicles TTRPG in a structured YAML format.

Based on analysis of 107 parsed items from version 0.10.1, the following item types and subtypes have been identified:

## Item Types

### Main Types and Subtypes (Based on Actual Data)

1. **Equipment** (33 items, 30.8%)
   - Weapon - Standard combat weapons (13 items)
   - Specialized Weapon - Special-purpose weapons (6 items) 
   - Armor - Defensive equipment (10 items)
   - Crafting - Equipment for crafting professions (4 items)

2. **Artifice** (21 items, 19.6%)
   - Assist - Support devices and tools (9 items)
   - Weapon - Artifice-based combat items (6 items)
   - Basic - Basic artifice devices (4 items)
   - Airship - Flying vehicles (1 item)
   - Fuel - Power sources for artifice (1 item)

3. **Alchemy** (27 items, 25.2%)
   - Flask - Throwable alchemical items (8 items)
   - Potion - Consumable healing/buff liquids (9 items)
   - Elixir - Transformation/enhancement drinks (10 items)

4. **Adventuring Essentials** (13 items, 12.1%)
   - Storage - Containers and carrying equipment (4 items)
   - Kit - Professional tool sets (7 items)
   - Basic - Basic adventuring supplies (2 items)

5. **Crafting** (6 items, 5.6%)
   - Materials - Raw crafting materials (5 items)
   - (empty subtype) - Miscellaneous crafting items (1 item)

6. **Mount** (4 items, 3.7%)
   - (empty subtype) - Rideable creatures and vehicles

7. **Divine Arms** (1 item, 0.9%)
   - Main - Legendary divine weapons

8. **Astra Relic** (1 item, 0.9%)
   - Weapon - Ancient powerful weapons

9. **Talisman** (1 item, 0.9%)
   - (empty subtype) - Magical binding items

## Common Fields (All Items)

```yaml
item:
  id: string                 # Unique identifier (sanitized from name)
  name: string               # Display name
  type: string               # Main type (Equipment, Artifice, etc.)
  sub_type: string           # Subtype (Weapon, Potion, etc.)
  cost: string               # Purchase price (e.g., "1000 Clim", "Varies", never null)
  activation_cost: string?   # AP/resource cost to use (null if no cost, not "-")
  burden: string             # Weight/encumbrance value (can be formula)
  description: string        # Main description text
  image_url: string?         # URL to item image (null if no image)
```

## Type-Specific Fields

### Equipment (Weapons)

```yaml
weapon:
  activation_cost: string    # AP/resource cost to use (e.g., "2 AP", "-")
  crafting_points: integer   # Points needed to craft
  crafting_type: string      # Crafting profession (Blacksmithing)
  weapon_properties: list    # Special weapon traits
    # Examples: ["keen", "reach", "two_handed", "finesse", "heavy", "light"]
  damage_type: string        # Physical, Fire, Water, etc.
  damage_dice: string        # e.g., "1d8", "2d6"
  weapon_category: string    # e.g., "Heavy Melee", "Light Blade", "Ranged"
```

### Equipment (Armor)

```yaml
armor:
  armor_value: integer       # Defense bonus provided
  armor_type: string         # Light, Medium, Heavy, Shield
  crafting_points: integer   # Points needed to craft
  crafting_type: string      # Crafting profession (Blacksmithing)
  special_properties: list   # Any special effects
```

### Equipment (Accessory)

```yaml
accessory:
  slot: string               # Where it's equipped (Ring, Necklace, etc.)
  effects: list              # Bonuses or abilities granted
    - type: string           # Attribute bonus, skill bonus, etc.
      value: string          # Amount or description
```

### Artifice

```yaml
artifice:
  activation_cost: string    # AP/resource cost to activate
  shell_size: string         # Size category (S, M, L, XL)
  fuel_usage: string         # Resource consumption rate
  crafting_points: integer   # Points needed to craft
  crafting_type: string      # Crafting profession (Artificing)
  speed: string              # Movement speed (for vehicles)
  modifications: list        # List of possible upgrades
    - name: string           # Modification name
      tier: string           # A or B tier
      description: string    # What the mod does
      prerequisites: list    # Required mods before this one
      cost: string           # Additional cost for the mod
```

### Alchemy (Potions/Poisons/Bombs/Oils)

```yaml
alchemy:
  activation_cost: string    # AP/Mana cost to use
  crafting_points: integer   # Points needed to craft
  crafting_type: string      # Always "Alchemy"
  crafting_recipe:           # Recipe details
    materials: string        # Base material cost (e.g., "5 Clim worth")
    herbs: list              # Required herb ingredients
      - quantity: integer
        rarity: string       # Common, Rare, Very Rare, Legendary
        element: string      # Water, Earth, Fire, Wind, None
        specific_herb: string? # If a specific herb is required
  effects: list              # What the item does
    - type: string           # Healing, Damage, Buff, Debuff, etc.
      value: string          # Effect magnitude
      duration: string       # How long it lasts (if applicable)
  range: string              # Thrown range (for bombs)
  area: string               # Effect area (for bombs/oils)
```

### Crafting (Materials)

```yaml
material:
  material_category: string  # "base" or "special"
  
  # For base materials (used as primary crafting component)
  base_materials: list       # List of material variants
    - name: string           # Material name (e.g., "Iron", "Steel")
      clim_per_ingot: integer
      units_per_ingot: integer
      crafting_dice: string  # Bonus to crafting rolls (e.g., "+1d4", "+1d6")
      description: string    # Flavor text or special notes
      usage_notes: string    # How many needed per item tier
  
  # For special materials (add properties to items)
  special_materials: list    # List of special material types
    - name: string           # Material name (e.g., "Moonstone", "Adamantine")
      clim_cost: integer     # Cost per unit
      crafting_points: integer # Extra CP needed
      units_per_ingot: integer
      effect: string         # Special property granted
      description: string    # Detailed effect description
      applicable_to: list    # Item types this can enhance
```

### Consumable (Food/Scrolls/Ammunition)

```yaml
consumable:
  uses: integer              # Number of uses (1 for most)
  activation_cost: string    # Cost to use
  effects: list              # What happens when consumed
    - type: string
      value: string
      duration: string
  
  # For scrolls
  spell_level: integer?      # Level of the spell
  spell_school: string?      # School of magic
  
  # For ammunition
  damage_modifier: string?   # Extra damage or effects
  quantity: integer?         # How many per purchase
```

### Quest Items

```yaml
quest:
  quest_related: boolean     # Always true for quest items
  tradeable: boolean         # Can it be traded/sold
  key_item: boolean          # Critical for progression
  lore_text: string          # Extended lore description
```

## ID Generation Rules

```python
def generate_item_id(name: str) -> str:
    """
    Convert item name to ID following these rules:
    - Lowercase all characters
    - Replace spaces with underscores
    - Replace parentheses with double dashes
    - Remove other special characters
    
    Examples:
    - "Katana (Heavy)" -> "katana--heavy-"
    - "Greater Healing Potion" -> "greater_healing_potion"
    - "Blacksmith's Hammer" -> "blacksmiths_hammer"
    """
    id = name.lower()
    # Handle parentheses specially
    id = id.replace('(', '--').replace(')', '-')
    # Replace spaces
    id = id.replace(' ', '_')
    # Remove apostrophes and other special chars
    id = id.replace("'", "")
    # Clean up any remaining special characters
    id = re.sub(r'[^a-z0-9_\-]', '', id)
    return id
```

## Cost Parsing Patterns

```yaml
# Different cost formats found
cost_patterns:
  - "1000 Clim"              # Standard currency
  - "Varies"                 # Variable cost (materials)
  - ""                       # Empty string for some special items
  - "500-2000 Clim"          # Range of costs
  - "Original Weapon + 3000" # Formula-based costs
  
activation_cost_patterns:
  - "2 AP"                   # Action points
  - "0 AP, 4 Mana"           # Multiple costs
  - "1 RP"                   # Reaction points
  - null                     # No activation cost (was "-")
  - "X Mana"                 # Variable cost
```

## HTML Structure Patterns

### List Page Structure
```
app-items > div > div > app-item-card
  mat-card
    img.item-image
    mat-card-content
      h3.item-name
      mat-chip-list (type badges)
      div.cost-info
    mat-card-actions
      a[routerLink] (to detail page)
```

### Detail Page Structure
```
app-item-detail
  div.item-container
    div.item-image > img
    div.item-content
      h2 (name with ∙ prefix)
      div.properties-panel
        div.property-row (multiple)
          span.property-label
          span.property-value
      div.description-section
        h3 "Description:"
        div.description-content
          (nested content varies by type)
```

## Validation Rules

### Required Fields
- `name` - Cannot be empty
- `id` - Must be valid (lowercase, underscores, dashes only)
- `type` - Must be one of the defined main types
- `sub_type` - Must be valid for the parent type
- `cost` - Must be present (can be "-" or "Varies")

### Type Validation
```python
VALID_TYPES = {
    "Equipment": ["Weapon", "Armor", "Accessory"],
    "Artifice": ["Airship", "Device", "Construct"],
    "Alchemy": ["Potion", "Poison", "Bomb", "Oil"],
    "Crafting": ["Materials", "Component", "Tool"],
    "Consumable": ["Food", "Scroll", "Ammunition"],
    "Quest": ["Key Item", "Trophy", "Document"]
}
```

### Numeric Validation
- `burden` >= 0 (can be 0 for weightless items)
- `crafting_points` > 0 (if present)
- `armor_value` >= 0 (for armor)
- All costs should parse to valid numbers or special values

## Special Parsing Considerations

### Complex Material Descriptions
Blacksmithing Materials have nested structures that need careful parsing:
- Base materials section with table of materials
- Special materials section with different structure
- Each material has multiple properties to extract

### Artifice Modifications
- Modifications are tiered (A/B)
- Some have prerequisites
- Parse both name and full description
- Track dependency chains

### Alchemy Recipes
- Herb requirements specify quantity + rarity + element
- Some recipes have alternative ingredients
- Material costs separate from herb costs
- Parse specific herb names when mentioned

### Variable Fields
Some fields only appear for certain item types:
- `damage_dice` - Only for weapons
- `armor_value` - Only for armor
- `modifications` - Only for artifice
- `crafting_recipe` - Only for alchemy

## Example Items

### Weapon Example
```yaml
name: "Katana (Heavy)"
id: "katana--heavy-"
type: "Equipment"
sub_type: "Weapon"
cost: "800 Clim"
burden: 3.0
description: "A curved, single-edged blade. The heavy variant trades speed for power."
image_url: "https://cdn.angelssword.com/items/katana_heavy.webp"
activation_cost: "2 AP"
crafting_points: 25
crafting_type: "Blacksmithing"
weapon_properties: ["two_handed", "keen"]
damage_type: "Physical"
damage_dice: "2d6"
weapon_category: "Heavy Melee"
```

### Potion Example
```yaml
name: "Greater Healing Potion"
id: "greater_healing_potion"
type: "Alchemy"
sub_type: "Potion"
cost: "150 Clim"
burden: 0.5
description: "Restores a significant amount of health when consumed."
image_url: "https://cdn.angelssword.com/items/greater_healing_potion.webp"
activation_cost: "0 AP, 4 Mana"
crafting_points: 20
crafting_type: "Alchemy"
crafting_recipe:
  materials: "5 Clim worth"
  herbs:
    - quantity: 2
      rarity: "Rare"
      element: "Water"
    - quantity: 1
      rarity: "Common"
      element: "Earth"
effects:
  - type: "Healing"
    value: "4d8 HP"
    duration: "Instant"
```

### Artifice Example
```yaml
name: "Aerial Staff (Sparrow Model)"
id: "aerial_staff--sparrow_model-"
type: "Artifice"
sub_type: "Device"
cost: "5000 Clim"
burden: 2.0
description: "A lightweight flying device for personal transportation."
image_url: "https://cdn.angelssword.com/items/aerial_staff_sparrow.webp"
activation_cost: "1 AP"
shell_size: "S"
fuel_usage: "1 unit per hour"
crafting_points: 40
crafting_type: "Artificing"
speed: "60ft flying"
modifications:
  - name: "Enhanced Speed"
    tier: "A"
    description: "Increases flying speed by 20ft"
    prerequisites: []
    cost: "1000 Clim"
  - name: "Cargo Compartment"
    tier: "B"
    description: "Adds storage space for 50 lbs"
    prerequisites: []
    cost: "500 Clim"
```

### Material Example
```yaml
name: "Blacksmithing Materials"
id: "blacksmithing_materials"
type: "Crafting"
sub_type: "Materials"
cost: "Varies"
burden: 1.0  # Per ingot
description: "Various metals and materials used in blacksmithing."
image_url: "https://cdn.angelssword.com/items/blacksmithing_materials.webp"
material_category: "base"
base_materials:
  - name: "Iron"
    clim_per_ingot: 50
    units_per_ingot: 20
    crafting_dice: "+1d4"
    description: "Common metal, easy to work with"
    usage_notes: "4 ingots for Tier 2, 9 for Tier 3"
  - name: "Steel"
    clim_per_ingot: 150
    units_per_ingot: 25
    crafting_dice: "+1d6"
    description: "Refined iron, better quality"
    usage_notes: "4 ingots for Tier 2, 9 for Tier 3"
special_materials:
  - name: "Moonstone"
    clim_cost: 500
    crafting_points: 10
    units_per_ingot: 15
    effect: "Keen property"
    description: "Weapon crits on 19-20"
    applicable_to: ["Weapon"]
  - name: "Adamantine"
    clim_cost: 1000
    crafting_points: 20
    units_per_ingot: 30
    effect: "Indestructible"
    description: "Item cannot be broken"
    applicable_to: ["Weapon", "Armor"]
```