# Lyrian Chronicles Data Scraper

This module contains web scrapers for extracting game data from the Lyrian Chronicles website.

## Setup

### Prerequisites
- Python 3.10+
- Chrome/Chromium browser (for Selenium)
- [uv](https://github.com/astral-sh/uv) package manager (recommended)

### Installation

1. Create and activate a virtual environment:
```bash
cd scraper
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
uv pip install -r requirements.txt
```

### Chrome WebDriver Setup

Selenium requires a Chrome WebDriver. You have several options:

1. **Automatic** (recommended): Install `webdriver-manager`
   ```bash
   uv pip install webdriver-manager
   ```

2. **Manual**: Download ChromeDriver from https://chromedriver.chromium.org/
   and ensure it's in your PATH.

## Architecture

The scraper is organized into modular components:

```
scraper/
├── core/           # Base classes and utilities
├── fetchers/       # HTML fetching modules
├── parsers/        # HTML parsing modules
├── schemas/        # Data validation schemas
├── scraped_html/   # Raw HTML storage (versioned)
└── parsed_data/    # Structured YAML/JSON output (versioned)
```

### Version-Aware Directory Structure

The scraper uses a clean, version-aware directory structure:

```
scraped_html/           # Raw HTML from fetchers
├── 0.10.1/
│   ├── classes/
│   ├── abilities/
│   ├── monster-abilities/
│   ├── races/
│   ├── items/
│   ├── keywords/
│   ├── breakthroughs/
│   └── monsters/
└── latest -> 0.10.1    # Symlink to newest version

parsed_data/            # Structured YAML/JSON from parsers  
├── 0.10.1/
│   ├── classes/
│   ├── abilities/
│   ├── monster-abilities/  # 252 monster abilities with index
│   ├── races/
│   │   ├── primary/    # 5 primary races
│   │   ├── sub/        # 30 sub-races
│   │   └── races_index.yaml
│   ├── items/          # 166 items with index
│   ├── keywords/       # 57 keywords with index
│   ├── breakthroughs/  # 68 breakthroughs with index
│   └── monsters/       # Individual monster files with index
└── latest -> 0.10.1    # Symlink to newest version
```

### Key Design Principles

1. **Separation of Concerns**: Fetchers retrieve HTML, parsers convert to YAML
2. **Version Support**: Data is organized by game version (e.g., `0.10.1` or `latest`)
3. **Reusability**: Common patterns are extracted into base classes
4. **Offline Processing**: HTML can be saved and parsed later
5. **Version Management**: Automatic symlink updates for latest version
6. **Consistent Data Format**: All optional fields use `null` instead of dashes for consistency

## Usage

### Command Line Interface

Each scraper provides a command-line interface for easy use:

#### Classes
```bash
# Fetch class HTML (latest version)
python -m fetchers.class_fetcher

# Parse class HTML to YAML
python -m parsers.class_parser scraped_html/0.10.1/classes --version 0.10.1
```

#### Abilities
```bash
# Fetch ability HTML (both True and Key ability tabs)
python -m fetchers.ability_fetcher --version latest

# Parse ability HTML to YAML (handles all 4 ability types)
python -m parsers.ability_parser scraped_html/0.10.1/abilities --version 0.10.1
```

#### Monster Abilities
```bash
# Fetch monster ability HTML (both Abilties and Active Actions tabs)
python -m fetchers.ability_fetcher --monster --version latest

# Parse monster ability HTML to YAML
python -m parsers.ability_parser scraped_html/0.10.1/monster-abilities --version 0.10.1 --monster
```

#### Races
```bash
# Fetch race HTML (both primary races and sub-races tabs)
python -m fetchers.race_fetcher --version latest

# Parse race HTML to YAML  
python -m parsers.race_parser --version 0.10.1
```

#### Items
```bash
# Fetch item HTML
python -m fetchers.item_fetcher --version latest

# Parse item HTML to YAML
python -m parsers.item_parser scraped_html/0.10.1/items --version 0.10.1
```

#### Keywords
```bash
# Fetch keyword HTML (single page with all keywords)
python -m fetchers.keyword_fetcher --version latest

# Parse keyword HTML to YAML
python -m parsers.keyword_parser scraped_html/0.10.1/keywords --version 0.10.1
```

#### Breakthroughs
```bash
# Fetch breakthrough HTML (single page with all breakthroughs)
python -m fetchers.breakthrough_fetcher --version latest

# Parse breakthrough HTML to YAML
python -m parsers.breakthrough_parser scraped_html/0.10.1/breakthroughs --version 0.10.1
```

#### Monsters
```bash
# Fetch monster HTML (list page + individual detail pages)
python -m fetchers.monster_fetcher --version latest

# Parse monster HTML to YAML
python -m parsers.monster_parser scraped_html/0.10.1/monsters --version 0.10.1

# Test single monster (for debugging)
python -m fetchers.monster_fetcher --test-monster bandersnatch
```

### Python API

```python
from fetchers.class_fetcher import ClassFetcher
from parsers.class_parser import ClassParser

# Fetch HTML for all classes (latest version)
fetcher = ClassFetcher()
html_files = fetcher.fetch_all()

# Parse HTML to YAML
parser = ClassParser()
for class_id, html_path in html_files.items():
    data = parser.parse_file(html_path)
    parser.to_yaml(data, class_id)
```

### Specifying Version

```python
# Fetch data from a specific version
fetcher = ClassFetcher(version="0.10.1")
fetcher.fetch_all()
```

### Output Formats

```bash
# Output as JSON instead of YAML
python -m parsers.class_parser scraped_html/0.10.1/classes --version 0.10.1 --format json

# Use custom output directory
python -m parsers.class_parser scraped_html/0.10.1/classes --output-dir custom_output --version 0.10.1
```

### Ability Scraper Details

The ability scraper handles the complex two-tab interface and four distinct ability types:

1. **True Abilities** (583) - Standard combat/game abilities
2. **Key Abilities** (112) - Level 1 class features
3. **Crafting Abilities** (55) - Crafting system abilities (with subdivision)
4. **Gathering Abilities** (8) - Resource gathering abilities

Features:
- Automatic type detection based on content
- Crafting ability subdivision (splits complex abilities into sub-abilities)
- Structured cost parsing (mana, AP, RP, variable costs)
- Secret Art ID normalization (`secret_art__name` pattern)
- Comprehensive ability index generation

### Race Scraper Details

The race scraper handles the two-tab interface for races and sub-races:

1. **Primary Races** (5) - Human, Fae, Demon, Chimera, Youkai
2. **Sub-races** (30) - Including Catfolk, Kitsune, Centaur, Phoenix, etc.

Features:
- Tab navigation between primary races and sub-races
- Individual detail page fetching for complete benefit data
- Structured benefit parsing (attributes, skills, abilities, proficiencies)
- Automatic type detection (primary vs sub-race)
- Proper parent race tracking for sub-races
- Comprehensive race index generation
- Skill list cleaning (removes trailing punctuation)

### Item Scraper Details

The item scraper handles the complete item catalog from the LC website:

- **Total Items** (166) - All equipment, crafting materials, mounts, and special items
- **Item Types**: Equipment (54), Artifice (40), Alchemy (40), Adventuring Essentials (16), Mount (6), Crafting (6), Divine Arms (1), Astra Relic (2), Talisman (1)

Features:
- Simplified wait logic for better performance
- Automatic property extraction (cost, burden, activation cost, etc.)
- Optional field handling (shell size, fuel usage, crafting points)
- Consistent null value usage instead of dashes
- HTML tag stripping from descriptions
- Comprehensive item index generation with type/subtype statistics

### Keyword Scraper Details

The keyword scraper handles the game's keyword system from a single comprehensive page:

- **Single Page Design** - All keywords are on one page with expansion panels
- **Keyword Types**: Timing, Element, Status, Combat, Weapon, Movement, Spell, Defense, General

Features:
- Automatic keyword type categorization based on name and description patterns
- Variable value (X) detection and explanation extraction
- Related keyword extraction from description text
- Individual YAML files per keyword with structured data
- Comprehensive keyword index with type statistics
- No tab navigation needed (simpler than abilities)

### Breakthrough Scraper Details

The breakthrough scraper handles character advancement options from a single page:

- **Total Breakthroughs** (68) - Special character advancement options
- **Single Page Design** - All breakthroughs on one page with expansion panels
- **Cost Types**: All currently have numeric costs (100-500 XP range)

Features:
- Structured cost and requirements extraction from HTML lists
- Multi-paragraph description preservation
- Requirements parsing with support for multiple conditions
- Race/class/level requirement detection
- Individual YAML files per breakthrough
- Comprehensive index with cost summary and requirement statistics

### Monster Abilities Scraper Details

The monster abilities scraper extends the existing ability scraper to handle monster-specific abilities:

- **Total Monster Abilities** (252) - All monster passive abilities and active actions
- **Two-Tab Design** - "Abilties" (passive) and "Active Actions" (active) tabs
- **Two Ability Types**: 
  - **monster_ability** (116) - Simple passive abilities with descriptions only
  - **monster_active_action** (136) - Complex active abilities with keywords, costs, requirements

Features:
- Reuses existing ability fetcher/parser architecture with `--monster` flag
- Tab navigation between passive abilities and active actions
- Handles two distinct component types (`app-monster-ability` vs `app-monster-active-action`)
- Structured data extraction for active actions (keywords, range, AP costs, requirements)
- Simple description extraction for passive abilities
- Individual YAML files per ability with comprehensive index
- Type-aware parsing that maintains data consistency

### Monster Scraper Details

The monster scraper handles complete monster stat blocks and ability references from individual monster pages:

- **Navigation Architecture** - Fetches from main monsters list and individual detail pages
- **Complete Stat Blocks** - HP, AP, RP, mana, evasion, guard, movement, attacks, attributes
- **Ability References** - Simple name/ID references to abilities (detailed data parsed separately by monster ability scraper)
- **Rich Metadata** - Danger level, type, lore, strategy, running notes, harvestable materials

Features:
- List page navigation to discover all available monsters
- Detail page fetching with Angular SPA wait logic
- Automatic expansion panel handling for abilities/actions
- Comprehensive stat extraction (25+ different stats and properties)
- Lightweight ability references (avoids duplicating ability data)
- Image URL and descriptive content preservation
- Individual YAML files per monster with summary index
- Pydantic schema validation for data consistency

**Note**: The monster scraper only extracts ability names/IDs as references. The detailed ability data (keywords, costs, descriptions, etc.) is handled by the separate monster ability scraper to avoid duplication.

## Data Quality Improvements

The improved parser fixes 5 critical issues identified in systematic analysis:

1. ✅ **Heart attribute parsing**: Now extracts actual attributes (Fitness, Reason, etc.)
2. ✅ **Secret Art ID normalization**: Consistent `secret_art__name` format  
3. ✅ **Structured skills data**: Includes eligible_skills, conversion rules, etc.
4. ✅ **Structured attribute choices**: Uses `{attribute: "X", value: 1}` objects
5. ✅ **Requirements handling**: Proper empty arrays for Tier 1 classes

All 116 classes parse successfully with zero errors.

## Adding New Data Types

To add support for a new data type (e.g., items):

1. Create a fetcher in `fetchers/item_fetcher.py`:
   - Inherit from `BaseFetcher`
   - Implement required methods

2. Create a parser in `parsers/item_parser.py`:
   - Inherit from `BaseParser`
   - Implement parsing logic

3. (Optional) Define schema in `schemas/item_schema.py`

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
flake8 .
```

### Type Checking
```bash
mypy .
```