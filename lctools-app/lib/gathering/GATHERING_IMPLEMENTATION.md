# Lyrian Gathering Simulator - Implementation Details

This document describes the technical implementation of the data system for the Lyrian Gathering Simulator.

## Architecture Overview

Similar to the crafting system, the gathering simulator follows a declarative data approach with a rules engine architecture:

1. **JSON Data Files** - Store gathering data in a non-programmer-friendly format
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

All gathering data is stored in JSON files:
- `gathering-actions.json` - Basic gathering actions and skills
- `node-variations.json` - Different types of resource node modifiers

### 2. Schema Definitions

The TypeScript interfaces that define the structure of the data:
- `DeclarativeGatheringAction` - Defines gathering actions
- `DeclarativeNodeVariation` - Defines node modifiers
- `Effect` and its subtypes - Defines effects that actions can have
- `Condition` and its subtypes - Defines conditions for action eligibility

### 3. Interpreters

The modules that interpret declarative data:
- `action-interpreter.ts` - Converts declarative actions into executable actions
- `effect-interpreter.ts` - Executes effect logic based on effect definitions
- `condition-interpreter.ts` - Evaluates conditions based on condition definitions
- `node-interpreter.ts` - Handles node variation logic

### 4. Data Loader

The module that loads and processes JSON data:
- `data-loader.ts` - Loads JSON files and converts them to executable structures

## Data Flow

When the application starts:

1. The `data-loader.ts` module loads the JSON files
2. It parses the JSON data and validates its structure
3. The interpreters convert the parsed data into executable objects
4. The resulting objects are used by the gathering system

At runtime:
1. When a player uses a gathering action, the system looks up the action in the parsed data
2. The action's conditions are evaluated to check eligibility
3. If eligible, the action's effects are executed in sequence
4. Each effect updates the gathering state according to its type

## Types of Effects

The gathering system supports these effects:

1. `roll` - Rolls dice (usually d10) and stores the result
2. `modify` - Modifies a value in the gathering state
3. `calculate` - Performs calculations based on formulas and stores the result
4. `log` - Adds a message to the gathering log
5. `end_gathering` - Ends the gathering session
6. `distribute_points` - Distributes points between NP and LP based on conditions
7. `convert_points` - Converts points from one type to another (LP to NP or vice versa)

## Types of Conditions

The gathering system supports these conditions:

1. `has_enough_dice` - Checks if enough strike dice are available
2. `has_enough_np` - Checks if enough node points are available
3. `has_enough_lp` - Checks if enough lucky points are available
4. `has_used_action` - Checks if a specific action has been used already
5. `has_not_used_action` - Checks if a specific action has not been used yet
6. `has_skill_level` - Checks if the gatherer has a specific skill level
7. `node_has_variation` - Checks if the node has a specific variation

## State Management

The gathering system manages these state properties:

1. `nodeHP` - Current hit points of the node
2. `nodePoints` - Current node points that need to be cleared
3. `luckyPoints` - Current lucky points that need to be cleared
4. `currentNP` - Current node points accumulated by the gatherer
5. `currentLP` - Current lucky points accumulated by the gatherer
6. `diceRemaining` - Number of strike dice remaining
7. `gatheringSkill` - The gatherer's skill bonus
8. `expertise` - Additional expertise bonus
9. `usedActions` - Actions that have been used in the current session
10. `variations` - Node variations that modify gathering mechanics
11. `toolBonus` - Bonus from the gathering tool
12. `log` - Log messages for the gathering session
13. `bonuses` - Ongoing bonuses from actions
14. `nodeType` - The type of node being gathered from (ore, herb, etc.)

## Node Variations Implementation

Node variations are implemented as modifier functions that transform the base state or action effects:

1. They are applied when the node is initialized
2. They can modify dice rolls, bonuses, or other state properties
3. They can add special conditions or effects to actions
4. They can modify the rewards gained from gathering

## Actions Implementation

Gathering actions follow the same pattern as crafting actions:

1. Each action has a dice cost and possibly an NP or LP cost
2. Actions can have prerequisites that must be met
3. Actions produce effects that modify the gathering state
4. Some actions are marked as "Rapid" which means they can be used multiple times

### Special Action Implementation Notes

#### Novice's Perseverance
This action rolls two d10 and takes the higher result, but importantly does **not** add the gathering skill bonus to the result. The gathering skill normally includes expertise and tool bonus, but for Novice's Perseverance, only the following are added:

```
result = max(roll1, roll2) + expertise + toolBonus + ironFocusBonus
```

Note that the base gathering skill is excluded, but expertise and tool bonus are still included.

#### Iron Focus
Iron Focus adds a +5 bonus to all subsequent gathering checks. This is implemented by:

1. Adding "Iron Focus" to the state's bonuses array
2. Checking for this bonus in the calculation formulas:
   ```typescript
   const ironFocusBonus = state.bonuses.includes('Iron Focus') ? 5 : 0;
   ```
3. The bonus is consumed together with Lucky Points (5 LP)
4. When testing, it's important to verify that the bonus is correctly applied to all subsequent actions

## Success Conditions

For gathering to be considered successful:
1. The current Node Points (NP) must be greater than or equal to the required Node Points
2. For lucky gathering, the current Lucky Points (LP) must be greater than or equal to the required Lucky Points

The success conditions are checked in the `completeGathering` function:

```typescript
// Check if node points were cleared
newState.success = newState.currentNP >= newState.nodePoints;
  
// Check if lucky points were cleared
newState.luckySuccess = newState.currentLP >= newState.luckyPoints && newState.success;
```

Both conditions must be met at the time gathering is completed. Actions that subtract Node Points (like Lucky Strike) must ensure enough NP remains to maintain the success condition.

## Adding New Features

### Adding a New Effect Type

1. Add the new effect type to the `EffectType` enum in `action-schema.ts`
2. Create a new interface for the effect in `action-schema.ts`
3. Implement the execution logic in `executeEffect` function in `effect-interpreter.ts`

### Adding a New Condition Type

1. Add the new condition type to the `ConditionType` enum in `action-schema.ts`
2. Create a new interface for the condition in `action-schema.ts`
3. Implement the evaluation logic in `evaluateCondition` function in `condition-interpreter.ts`

### Adding New Node Variations

1. Add the new variation to the `node-variations.json` file
2. Update the `node-interpreter.ts` if needed to handle new variation mechanics

## Future Improvements

1. **Class-Specific Actions**
   - Add support for Miner and Forager specific gathering actions
   - Create separate JSON files for each class

2. **Advanced Node Types**
   - Support for more complex node types beyond the basic resource nodes
   - Special nodes with unique mechanics

3. **Tool System**
   - Implement different gathering tools with varied bonuses and special abilities
   - Tool degradation and repair mechanics

4. **Skill Progression**
   - Track gathering experience and skill improvements
   - Unlock new actions as skills improve

5. **Environmental Factors**
   - Weather effects on gathering
   - Time-of-day bonuses and penalties

## Testing Considerations

1. **Mock Dice Rolls**
   - Use jest.spyOn(utils, 'rollD10') to control dice rolls in tests
   - Be aware that mock calls may need to be reset between actions

2. **State Validation**
   - After applying an action, validate the state is as expected
   - Check that points, dice, and bonuses are correctly modified
   
3. **Success Conditions**
   - Verify that success/failure is determined correctly
   - Test edge cases around minimum required points
   
4. **Bonus Application**
   - Verify that bonuses like Iron Focus are applied to all subsequent actions
   - Test that bonuses are correctly calculated in the results
   
5. **Action Order**
   - Test the sequence of actions, as some actions depend on the state from previous actions
   - Some actions (like Lucky Strike) can invalidate success conditions if used in the wrong order