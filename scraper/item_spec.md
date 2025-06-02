# Lyrian Chronicles Item Specification

## Overview

Items in Lyrian Chronicles are diverse game objects that players can acquire, craft, and use. They are organized into several main types with distinct properties and use cases.

## Item Types

### 1. Equipment
Equipment items are wearable/usable items that provide stats or abilities.

#### Subtypes:
- **Weapon** - Combat items with damage properties
- **Armor** - Defensive items providing protection
- **Accessory** - Special items providing various bonuses

### 2. Artifice
Artifice items are magical/technological devices with special properties.

#### Subtypes:
- **Airship** - Flying vehicles with modifications
- **Device** - Magical/technological tools
- **Construct** - Automated helpers/companions

### 3. Alchemy
Alchemy items are consumable items created through alchemical processes.

#### Subtypes:
- **Potion** - Consumable liquids with immediate effects
- **Poison** - Harmful substances
- **Bomb** - Throwable explosive items
- **Oil** - Weapon coatings and utility items

### 4. Crafting
Crafting items are materials and components used in item creation.

#### Subtypes:
- **Materials** - Raw materials for crafting (metals, herbs, etc.)
- **Component** - Pre-made parts for complex items
- **Tool** - Items used in crafting processes

### 5. Consumable
General consumable items not created through alchemy.

#### Subtypes:
- **Food** - Edible items providing buffs
- **Scroll** - Single-use spell items
- **Ammunition** - Projectiles for ranged weapons

### 6. Quest
Special items related to quests and storylines.

#### Subtypes:
- **Key Item** - Story-critical items
- **Trophy** - Proof of accomplishments
- **Document** - Books, letters, maps

## Common Fields (All Items)

```yaml
name: String              # Item name
id: String               # Unique identifier (sanitized from name)
type: String             # Main type (Equipment, Artifice, etc.)
sub_type: String         # Subtype (Weapon, Potion, etc.)
cost: String             # Purchase price (e.g., "1000 Clim", "Varies")
burden: Float            # Weight/encumbrance value
description: String      # Main description text
image_url: String        # URL to item image
```

## Type-Specific Fields

### Equipment (Weapons)
```yaml
activation_cost: String   # AP/resource cost to use (e.g., "2 AP", "-")
crafting_points: Integer  # Points needed to craft
crafting_type: String     # Crafting profession (Blacksmithing)
weapon_properties:        # Special weapon traits
  - keen: Boolean         # Critical on 19-20
  - reach: Boolean        # Extended range
  - two_handed: Boolean   # Requires two hands
  - finesse: Boolean      # Can use Dex for attacks
damage_type: String       # Physical, Fire, etc.
damage_dice: String       # e.g., "1d8", "2d6"
```

### Artifice
```yaml
activation_cost: String   # AP/resource cost to activate
shell_size: String        # Size category (S, M, L, XL)
fuel_usage: String        # Resource consumption rate
crafting_points: Integer  # Points needed to craft
crafting_type: String     # Crafting profession (Artificing)
speed: String             # Movement speed (for vehicles)
modifications:            # List of possible upgrades
  - name: String          # Modification name
    tier: String          # A or B tier
    description: String   # What the mod does
    requirements: String  # Prerequisites
```

### Alchemy (Potions)
```yaml
activation_cost: String   # AP/Mana cost to use
crafting_points: Integer  # Points needed to craft
crafting_type: String     # Always "Alchemy"
crafting_recipe:          # Recipe details
  materials: String       # Base material cost
  herbs:                  # Required herb ingredients
    - quantity: Integer
      rarity: String      # Common, Rare, etc.
      element: String     # Water, Earth, etc.
effects:                  # What the item does
  - type: String          # Healing, Buff, etc.
    value: String         # Effect magnitude
    duration: String      # How long it lasts
```

### Crafting (Materials)
```yaml
material_category: String # Base or Special
base_materials:           # For base crafting materials
  - name: String
    clim_per_ingot: Integer
    units_per_ingot: Integer
    effect: String        # Crafting bonus
    usage_notes: String   # How many needed per item
special_materials:        # For special materials
  - name: String
    clim_cost: Integer
    crafting_points: Integer
    units_per_ingot: Integer
    effect: String        # Special property granted
```

## HTML Structure

### Main Items Page
The items list page displays all items in a filterable grid layout.

#### Page Structure:
```
app-items
├── mat-drawer-container
│   ├── mat-drawer (filters sidebar)
│   │   ├── Type filters (checkboxes)
│   │   ├── Subtype filters  
│   │   └── Other filters (crafting type, etc.)
│   └── mat-drawer-content
│       └── div.grid (items grid)
│           └── mat-card (per item)
│               ├── img (item image)
│               ├── mat-card-content
│               │   ├── h3 (item name)
│               │   ├── mat-chip-list (type badges)
│               │   └── div (cost info)
│               └── mat-card-actions
│                   └── a[routerLink] (link to detail)
```

#### CSS Selectors:
- Item cards: `app-items mat-card`
- Item name: `mat-card-content h3`
- Item image: `mat-card img`
- Type badges: `mat-chip-list mat-chip`
- Detail link: `mat-card-actions a`

### Detail Pages
Individual item pages show comprehensive information about a single item.

#### Page Structure:
```
app-item-detail
└── div.item-container
    ├── div.item-image
    │   └── img (item portrait)
    └── div.item-content
        ├── h2 (item name with ∙ prefix)
        ├── div.properties-panel
        │   ├── div.property-row (Type)
        │   ├── div.property-row (Sub type)
        │   ├── div.property-row (Cost)
        │   ├── div.property-row (Activation cost)
        │   ├── div.property-row (Burden)
        │   └── div.property-row (type-specific fields...)
        └── div.description-section
            ├── h3 "Description:"
            └── div.description-content
                ├── p (main description)
                ├── h6 (subsection headers)
                └── ul/ol (lists for recipes, mods, etc.)
```

#### Property Row Structure:
```html
<div class="property-row">
  <span class="property-label">Cost:</span>
  <span class="property-value">1000 Clim</span>
</div>
```

#### URL Patterns:
- List page: `/game/{version}/items`
- Detail page: `/game/{version}/items/{item-id}`
- Version redirects: `/game/latest/items` → `/game/0.10.1/items`

## Parsing Considerations

### ID Generation
- Convert item name to lowercase
- Replace spaces with underscores
- Replace special characters with dashes
- Handle parentheses in names (e.g., "Katana (Heavy)" -> "katana--heavy-")

### Cost Parsing
- Extract numeric value and currency
- Handle "Varies" for materials
- Parse activation costs (AP, Mana, RP)
- Handle "-" for no cost

### Description Parsing
- Main description is plain text
- Sub-sections use headers (h2, h6)
- Lists for modifications, materials, recipes
- Bold text for important keywords
- Nested lists for material properties

### Special Cases
- Materials have complex nested structures
- Artifice modifications have tier classifications
- Alchemy items have detailed recipes
- Some items have multiple cost types

## Data Validation

### Required Fields
- name, id, type, sub_type
- At least one of: cost or "Varies"
- description (can be empty string)

### Type Validation
- type must be one of the defined main types
- sub_type must be valid for the parent type
- crafting_type must match expected values

### Numeric Validation
- burden >= 0
- crafting_points > 0 (if present)
- costs should parse to valid numbers or special values

## Edge Cases

1. **Variable Costs**: Some items show "Varies" instead of a fixed price
2. **No Activation Cost**: Shown as "-" in the UI
3. **Complex Recipes**: Alchemy items with multiple ingredient types
4. **Tiered Materials**: Different qualities of the same material type
5. **Multi-Effect Items**: Items with multiple distinct effects
6. **Conditional Properties**: Effects that only apply in certain situations
7. **Nested Material Lists**: Blacksmithing materials have base and special categories
8. **Modification Tiers**: Artifice items have A and B tier modifications
9. **Dynamic Fields**: Some fields only appear for certain item types
10. **Unit Conversions**: Materials show both unit costs and clim costs

## Implementation Notes

### Fetcher Strategy
1. Navigate to main items page
2. Extract all item card links
3. Visit each detail page to get full item data
4. Handle pagination if implemented
5. Save raw HTML for offline parsing

### Parser Strategy
1. Detect item type from properties panel
2. Extract common fields first
3. Apply type-specific parsing logic
4. Handle nested structures (materials, modifications)
5. Validate against schema before saving

### Schema Design
Consider using Pydantic models with:
- Base `Item` model with common fields
- Type-specific models inheriting from base
- Nested models for complex structures (recipes, modifications)
- Custom validators for special cases

### Data Organization
```
parsed_data/
└── {version}/
    └── items/
        ├── equipment/
        │   ├── weapons/
        │   ├── armor/
        │   └── accessories/
        ├── artifice/
        ├── alchemy/
        ├── crafting/
        ├── consumable/
        ├── quest/
        └── items_index.yaml
```