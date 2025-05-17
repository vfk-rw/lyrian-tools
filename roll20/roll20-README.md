# Roll20 Character Sheet - TTRPG Tools

## Overview

This Roll20 character sheet implementation is designed for a tabletop RPG system that features weapon specialization, different attack types, and special abilities based on weapon groups. The sheet automates calculations and provides an intuitive interface for players to manage their characters during gameplay.

## Current Status

**This is a work-in-progress implementation.** Currently, only the weapons functionality has been implemented as a proof of concept. The weapon system demonstrates the core mechanics of:

- Weapon groups with unique special abilities
- Light, Heavy, and Precise attack types
- Automatic calculation of attack and damage rolls
- Weapon size modifiers

## Weapon System

### Core Mechanics

The weapon system is based on two primary attributes:
- **Power**: Affects damage output
- **Focus**: Affects attack accuracy

Each weapon has:
1. A **name**
2. Individual **Power and Focus bonuses**
3. A **weapon group** that determines special abilities
4. A **size** (Light or Heavy) that affects damage and handling

### Attack Types

Three attack types are available for each weapon:

- **Light Attack**: Standard attack with 1d4+Power damage
- **Heavy Attack**: Powerful attack with 2d6 (or 2d8 for heavy melee weapons) + (Power×2) damage
- **Precise Attack**: Focused attack with doubled Focus but standard damage

### Weapon Groups

Each weapon group provides unique special abilities:

| Weapon Group | Special Ability |
|--------------|-----------------|
| Small | Hidden Weapon: Draw for 0 AP. First attack gains Trick Attack. |
| Polearm | +5ft range, threatened range 5-10ft. |
| Light Sword | Nimble: Move 5ft after light attack. |
| Longsword | Versatile: Treat as light or heavy. |
| Dueling | After 3 attacks on same enemy, get 0 RP Dodge/Block vs. them. |
| Axe | Wild Swing: Deal 2 (light) or 4 (heavy) dmg on miss. |
| Bludgeoning | Hollow Blow: Always deal at least 2 (light) or 4 (heavy) dmg. |
| Katana | Keen: Crit on 19-20. |
| Heavy Blade | Overpower: Basic weapon effects apply. |

Plus ranged and specialty weapons with additional abilities.

## How to Use (Current Implementation)

1. Set your character's base **Power** and **Focus** attributes
2. Add weapons using the repeating section
3. For each weapon:
   - Enter the weapon name
   - Set any Power or Focus bonuses
   - Select the weapon group
   - Choose the weapon size (Light or Heavy)
4. Use the attack buttons to make rolls in chat
5. The special rules will automatically update based on your weapon selections

## Roll Formulas

- **Light Attack**:
  - Attack: `1d20 + Focus + weapon_focus_bonus`
  - Damage: `1d4 + Power + weapon_power_bonus`

- **Heavy Attack**:
  - Attack: `1d20 + Focus + weapon_focus_bonus`
  - Damage: `2d6 (or 2d8) + (Power + weapon_power_bonus) × 2`

- **Precise Attack**:
  - Attack: `1d20 + (Focus + weapon_focus_bonus) × 2`
  - Damage: `1d4 + Power + weapon_power_bonus`

## Technical Implementation

The sheet uses Roll20's sheet worker scripts to:
- Update weapon special rules automatically based on weapon group selection
- Set appropriate dice for heavy attacks based on weapon type
- Manage weapon attributes when the sheet is opened or when attributes change

## Planned Features

Future versions of this character sheet will include:
- Full character attributes and derived stats
- Skills and proficiencies
- Class features and abilities
- Spell/ability management
- Resource tracking (HP, MP, RP)
- Inventory management
- Character advancement and experience
- Condition tracking

## Development Notes

- The sheet uses Roll20's HTML/CSS for layout and styling
- Sheet worker scripts handle the dynamic updates of attributes
- Roll templates will be improved in future versions for better output formatting

## Contributing

This is a work in progress. For questions or contributions, please refer to the main project repository.

---

*This character sheet is part of the lc-ttrpg-tools project.*