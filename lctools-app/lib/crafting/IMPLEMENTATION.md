# Lyrian Craftsim Data System - Implementation Details

This document describes the technical implementation of the refactored data system for the Lyrian Crafting Simulator.

## Architecture Overview

The system follows a declarative data approach with a rules engine architecture:

1. **JSON Data Files** - Store game data in a non-programmer-friendly format
2. **Schema Definitions** - TypeScript interfaces that define the structure of the data
3. **Interpreters** - Convert declarative data into executable logic
4. **Data Loader** - Loads and processes the JSON files

```
                ┌─────────────────┐
                │   JSON Files    │
                │ (Declarative    │
                │  Game Data)     │
                └────────┬────────┘
                         │
                         ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Schema    │  │   Data Loader   │  │   Validation    │
│ Definitions │◄─┤   & Parsers     ├─►│    Logic        │
└─────────────┘  └────────┬────────┘  └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Interpreters   │
                │ (Rules Engine)  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Executable Game │
                │     Logic       │
                └─────────────────┘
```

## Key Components

### 1. JSON Data Structure

All game data is stored in JSON files:
- `base-materials.json` - Basic crafting materials
- `special-materials.json` - Special materials and alloys
- `crafting-actions.json` - Crafting skills and actions

### 2. Schema Definitions

The TypeScript interfaces that define the structure of the data:
- `DeclarativeAction` - Defines crafting actions
- `DeclarativeBaseMaterial` - Defines base materials
- `DeclarativeSpecialMaterial` - Defines special materials
- `Effect` and its subtypes - Defines effects that actions can have
- `Condition` and its subtypes - Defines conditions for action eligibility

### 3. Interpreters

The modules that interpret declarative data:
- `action-interpreter.ts` - Converts declarative actions into executable actions
- `effect-interpreter.ts` - Executes effect logic based on effect definitions
- `condition-interpreter.ts` - Evaluates conditions based on condition definitions
- `material-interpreter.ts` - Handles material-related logic

### 4. Data Loader

The module that loads and processes JSON data:
- `data-loader.ts` - Loads JSON files and converts them to executable structures
- Provides validation and methods for loading custom data

## Data Flow

When the application starts:

1. The `data-loader.ts` module loads the JSON files
2. It parses the JSON data and validates its structure
3. The interpreters convert the parsed data into executable objects
4. The resulting objects are used by the crafting system

At runtime:
1. When a player uses a crafting action, the system looks up the action in the parsed data
2. The action's conditions are evaluated to check eligibility
3. If eligible, the action's effects are executed in sequence
4. Each effect updates the crafting state according to its type

## Adding New Features

### Adding a New Effect Type

1. Add the new effect type to the `EffectType` enum in `action-schema.ts`
2. Create a new interface for the effect in `action-schema.ts`
3. Implement the execution logic in `executeEffect` function in `effect-interpreter.ts`

### Adding a New Condition Type

1. Add the new condition type to the `ConditionType` enum in `action-schema.ts`
2. Create a new interface for the condition in `action-schema.ts`
3. Implement the evaluation logic in `evaluateCondition` function in `condition-interpreter.ts`

## Benefits of This Architecture

1. **Separation of Data and Logic**
   - Game data is stored in easily editable JSON files
   - Logic for interpreting the data is separated in the interpreters

2. **Extensibility**
   - New effect types can be added by extending the effect interpreter
   - New condition types can be added by extending the condition interpreter
   - New properties can be added to actions or materials without changing the core system

3. **User-Friendly for Non-Programmers**
   - Non-programmers can edit the JSON files without touching code
   - Format is understandable and follows a clear structure
   - Validation prevents most common errors

4. **Maintainability**
   - Clear separation of concerns makes the code easier to maintain
   - Each component has a single responsibility
   - Changes to game rules can often be made in JSON without code changes

## Future Improvements

1. **JSON Schema Validation**
   - Add JSON schema files to validate the JSON data structure
   - Provide better error messages for invalid JSON data

2. **GUI Editor**
   - Build a graphical editor for the JSON files
   - Allow for drag-and-drop creation of actions and effects

3. **Hot Reloading**
   - Allow for reloading of JSON files at runtime
   - Enable live editing of game data during development

4. **Export/Import System**
   - Allow users to export and import custom data
   - Enable sharing of custom actions and materials

5. **Localization Support**
   - Add support for multiple languages
   - Store text strings separately for easy translation

## Crafting from the TTRPG Rulebook

Crafting
When To Craft?
Crafting occurs during the Interlude Phase of the game, when the players are experiencing a break from their adventuring.  To initiate a crafting phase you must pay the item crafting cost which is designated as “Material”.  Examples of Base Material include:  Ore Material, Botany Material etc.  You must spend the amount of Base Material equal to the kind of item you are crafting and might have to spend additional material during crafting to achieve certain effects.

For some equipment crafting, you must choose a material type which affects the cost.  For example Iron or Mithril.


Crafting Time
By default, when you initiate crafting you are give 5 “Crafting Dice”, d10 dice that are used to determine the crafting result.  You may use these dice to initiate a crafting check:

D10 + Crafting Skill (+Expertise) + Modifiers

For example if you are crafting a longsword and you have Blacksmithing 5 and Longsword 10, then your crafting bonus would be +15.  You then add the crafting check result to the crafting points total.

Your final crafting points must be equal to the items crafting HP in order to complete it. Once you are out of crafting dice and have no more actions you wish to perform during crafting, the crafting ends.

When crafting, you may only use each ability once during a craft unless it has the Rapid keyword.
 

Crafting Actions
Basic Craft:  Rapid. 1 Crafting Dice.  You add a crafting check to the item.

Beginners Luck: 1 Crafting Dice.  You do not add your crafting skill to the check, but you roll two d10s and pick the highest one.

Standard Finish: 2 Crafting Dice.  Double the current crafting points and end crafting.  Cannot be used if the item being crafted has been modified beyond it's base form (for example, by adding a +1 power bonus to it via blacksmithing).

Steady Craft: 1 Crafting Dice.  You add a crafting check to the item.  The crafting dice automatically is a 5.


Failed Crafting
If you end your crafting and your crafting points does not equal the items crafting HP, then the craft fails.  You lose all materials used for crafting.


