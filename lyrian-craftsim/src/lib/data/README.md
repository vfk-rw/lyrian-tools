# Lyrian Craftsim Data System

This directory contains the data definitions for the Lyrian crafting simulator. The system has been designed to allow non-programmers to add or modify crafting skills, items, class abilities, and materials using simple JSON files.

## Directory Structure

- `json/`: Contains JSON files that define game data
  - `base-materials.json`: Defines base crafting materials (iron, mithril, etc.)
  - `special-materials.json`: Defines special materials/alloys (silver, cold-iron, etc.)
  - `crafting-actions.json`: Defines crafting actions and skills
- `schemas/`: TypeScript schema definitions (for developer reference)
- `interpreters/`: Code that converts JSON data into executable game logic

## How to Modify Game Data (For Non-Coders)

### Editing Base Materials

To add or modify base materials, edit the `json/base-materials.json` file. Each material follows this format:

```json
{
  "id": "iron",
  "name": "Iron",
  "effect_text": "None",
  "bonus_dice": 0
}
```

- `id`: Unique identifier for the material (use lowercase with hyphens)
- `name`: Display name
- `effect_text`: Description of the material's effect
- `bonus_dice`: Number of additional crafting dice provided

### Editing Special Materials (Alloys)

To add or modify special materials, edit the `json/special-materials.json` file. Each special material follows this format:

```json
{
  "id": "cold-iron",
  "name": "Cold Iron",
  "point_cost": 15,
  "dice_cost": 0,
  "effect": "Strikes cause target to be unable to teleport until end of their next turn."
}
```

- `id`: Unique identifier
- `name`: Display name
- `point_cost`: Crafting points cost to add this material
- `dice_cost`: Crafting dice cost to add this material
- `effect`: Description of the material's effect
- `special_effect`: (Optional) Special identifier for unique effects

### Editing Crafting Actions

To add or modify crafting actions, edit the `json/crafting-actions.json` file. This is more complex because actions have effects and conditions. Here's a basic example:

```json
{
  "id": "basic-craft",
  "name": "Basic Craft",
  "cost_text": "1 Crafting Die",
  "class_name": null,
  "class_level": 0,
  "dice_cost": 1,
  "points_cost": 0,
  "is_rapid": true,
  "requires_prerequisite": false,
  "description": "Perform a standard crafting check (1d10 + Skill + Expertise).",
  "effects": [
    {
      "type": "roll",
      "dice": {
        "sides": 10,
        "count": 1
      },
      "store_as": "roll"
    },
    {
      "type": "calculate",
      "formula": "{roll} + {craftingSkill} + {expertise}",
      "store_as": "pointsAdded"
    },
    {
      "type": "modify",
      "target": "diceRemaining",
      "operation": "subtract",
      "value": 1
    },
    {
      "type": "modify",
      "target": "craftingPoints",
      "operation": "add",
      "value": "{pointsAdded}"
    },
    {
      "type": "log",
      "message": "Used Basic Craft. Rolled {roll}. Added {pointsAdded} points ({initialCraftingPoints} -> {craftingPoints}). {diceRemaining} dice left."
    }
  ]
}
```

#### Action Properties

- `id`: Unique identifier
- `name`: Display name
- `cost_text`: Text description of cost
- `class_name`: Class requirement (`"blacksmith"`, `"forgemaster"`, or `null`)
- `class_level`: Required class level
- `dice_cost`: Crafting dice cost
- `points_cost`: Crafting points cost
- `is_rapid`: Whether the action can be used repeatedly
- `requires_prerequisite`: Whether the action has prerequisites
- `description`: Description text
- `effects`: Array of effects that happen when the action is used
- `conditions`: (Optional) Array of conditions that determine if the action can be used

#### Effect Types

Effects define what happens when an action is used:

1. **roll**: Rolls dice
   ```json
   {
     "type": "roll",
     "dice": {
       "sides": 10,
       "count": 1
     },
     "store_as": "roll"
   }
   ```

2. **calculate**: Performs a calculation
   ```json
   {
     "type": "calculate",
     "formula": "{roll} + {craftingSkill} + {expertise}",
     "store_as": "pointsAdded"
   }
   ```

3. **modify**: Changes a property
   ```json
   {
     "type": "modify",
     "target": "craftingPoints",
     "operation": "add",
     "value": 10
   }
   ```

4. **log**: Adds a message to the log
   ```json
   {
     "type": "log",
     "message": "Used Basic Craft. Rolled {roll}."
   }
   ```

5. **add_bonus**: Adds a crafting bonus
   ```json
   {
     "type": "add_bonus",
     "bonus": "+1 Crafting"
   }
   ```

6. **add_alloy**: Adds an alloy
   ```json
   {
     "type": "add_alloy",
     "alloy": "{selected_alloy}"
   }
   ```

7. **upgrade_bonus**: Upgrades an existing bonus
   ```json
   {
     "type": "upgrade_bonus",
     "from": "+1 Crafting",
     "to": "+2 Crafting"
   }
   ```

8. **end_crafting**: Ends the crafting session
   ```json
   {
     "type": "end_crafting"
   }
   ```

#### Condition Types

Conditions determine if an action can be used:

1. **check_property**: Checks a property value
   ```json
   {
     "type": "check_property",
     "property": "diceRemaining",
     "operation": "greater_than_or_equal",
     "value": 1
   }
   ```

2. **check_contains**: Checks if an array contains a value
   ```json
   {
     "type": "check_contains",
     "array": "bonuses",
     "value": "+1 Crafting"
   }
   ```

3. **check_class_level**: Checks class level
   ```json
   {
     "type": "check_class_level",
     "class": "blacksmith",
     "min_level": 1
   }
   ```

4. **check_action_used**: Checks if an action has been used
   ```json
   {
     "type": "check_action_used",
     "action_id": "steady-craft-2",
     "used": false
   }
   ```

## Tips for Editing JSON Files

1. Always maintain the correct format with proper brackets, commas, and quotes
2. Use a JSON validator if you're unsure about your syntax
3. Make a backup before making major changes
4. For new actions, start by copying an existing similar action
5. Reference variables using curly braces, e.g., `{craftingSkill}`

## Available State Variables

When writing formulas or messages, you can reference these state variables:

- `craftingSkill`: The character's crafting skill
- `expertise`: The character's expertise
- `diceRemaining`: Remaining crafting dice
- `craftingPoints`: Current crafting points
- `blacksmithLevel`: Character's blacksmith level
- `forgemasterLevel`: Character's forgemaster level
- `bonuses`: Array of applied bonuses
- `alloys`: Array of applied alloys

Additionally, any values you store with `store_as` in effects become available for later effects.
