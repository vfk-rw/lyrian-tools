# Lyrian Chronicles TTRPG Tools

## Project Overview

This repository contains tools for the Lyrian Chronicles tabletop role-playing game (TTRPG). It consists of two main components:

1. **Web Application** (`lctools-app/`) - A Next.js website providing various game tools
2. **Data Scraper** (`scraper/`) - Python scripts for extracting game data from the official website

## Current State

- The scraper contains more recent game data that hasn't been integrated into the frontend yet
- The backend architecture needs refactoring for better organization and maintainability
- The project is actively used for the Mirane server community

## Tech Stack

### Frontend
- **Framework**: Next.js 15.3.1 with App Router
- **UI**: React 19, TypeScript, Tailwind CSS v4
- **Components**: Radix UI / shadcn/ui component library
- **Data Fetching**: SWR for caching
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Discord OAuth
- **External APIs**: Google Sheets API for character sheets

### Data Processing
- **Scraping**: Python with BeautifulSoup4 and Selenium
- **Data Format**: YAML files for class/ability data
- **Build Tools**: Node.js scripts for data transformation

## Project Structure

```
lc-ttrpg-tools/
├── lctools-app/              # Next.js web application
│   ├── app/                  # App router pages and API routes
│   │   ├── api/             # Backend API endpoints
│   │   ├── classes/         # Class browser pages
│   │   ├── crafting/        # Crafting simulators
│   │   ├── gathering/       # Gathering simulator
│   │   ├── mirane/          # Server-specific tools
│   │   └── npc-tools/       # NPC generation tools
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── classes/        # Class-specific components
│   │   ├── crafting/       # Crafting UI components
│   │   └── gathering/      # Gathering UI components
│   ├── lib/                # Shared utilities and logic
│   │   ├── classes/        # Class data utilities
│   │   ├── crafting/       # Crafting game mechanics
│   │   └── gathering/      # Gathering game mechanics
│   ├── public/             # Static assets
│   │   ├── data/          # Game data files
│   │   └── images/        # Class images and icons
│   └── scripts/           # Build and data processing scripts
├── scraper/               # Python data extraction tools
│   ├── core/             # Base classes and utilities
│   │   ├── fetcher.py    # Base HTML fetcher
│   │   ├── parser.py     # Base data parser
│   │   └── utils.py      # Common utilities
│   ├── fetchers/         # HTML fetching modules
│   ├── parsers/          # HTML parsing modules
│   ├── schemas/          # Data validation schemas
│   ├── scraped_html/     # Raw HTML storage (version-based)
│   ├── class_specs/      # Scraped class YAML files
│   ├── census/           # Census data processing
│   └── version/          # Legacy scraped data
└── notes/               # Documentation and planning

```

## Key Features

### 1. Class Browser
- Browse all game classes with filtering by role and tier
- View detailed class information including abilities
- Search abilities across all classes
- Visual class cards with images

### 2. Crafting System
- **Alchemy Simulator**: Potion crafting with reagent combinations
- **Blacksmithing Simulator**: Equipment crafting with materials
- Interactive crafting mechanics with success/failure states
- Class-specific crafting bonuses

### 3. Gathering System
- Node-based resource gathering simulation
- Class-specific gathering abilities
- Resource quality and rarity mechanics
- Gathering skill progression

### 4. Census Tools
- Player population data for the Mirane server
- Character statistics and demographics
- Class distribution analysis
- Visual data representation with charts

### 5. Additional Tools
- NPC stat calculator
- Interactive world map
- In-game calendar system
- Character sheet integration

## Data Flow

1. **Scraping Phase**:
   - Python scripts fetch data from the official LC website
   - Data is parsed and structured into YAML files
   - Images are downloaded and processed

2. **Build Phase**:
   - `generate-class-list.js` creates an index of all classes
   - YAML files are validated and prepared for serving

3. **Runtime Phase**:
   - API routes serve YAML data as JSON
   - Frontend components fetch data via API or static imports
   - Game mechanics are interpreted from declarative JSON definitions

## Authentication & Permissions

- Discord OAuth integration for user authentication
- Guild membership verification for access control
- Role-based permissions for certain features
- Supabase Row Level Security for data protection

## Game Mechanics Implementation

The project uses a declarative approach for game mechanics:

- **Actions**: Defined in JSON with conditions and effects
- **Interpreters**: TypeScript classes that execute the mechanics
- **State Management**: Custom state machines for simulations
- **Validation**: Zod schemas ensure data integrity

## Development Commands

### Frontend (Next.js)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Generate class list
pnpm run generate-class-list
```

### Scraper (Python)

```bash
# Navigate to scraper directory
cd scraper

# Create virtual environment (using uv)
uv venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt

# Run scrapers (examples)
python -m fetchers.class_fetcher  # Fetch class HTML
python -m parsers.class_parser    # Parse class HTML to YAML
```

## Environment Variables

Required environment variables:
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth encryption key
- `DISCORD_CLIENT_ID` - Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `GOOGLE_SHEETS_API_KEY` - Google Sheets API access

## Known Issues & Refactoring Needs

### Backend Architecture
- API routes lack consistent patterns (mix of REST and custom endpoints)
- Data fetching strategies are inconsistent (static vs. dynamic)
- Error handling needs standardization
- Database queries could be optimized with better indexing

### Type Safety
- Some components use `@ts-nocheck` indicating type issues
- Missing type definitions for some game data structures
- Inconsistent type patterns between frontend and scraper

### Performance
- Large YAML files are loaded entirely into memory
- No pagination for class/ability lists
- Image optimization could be improved

### Code Organization
- Similar interpreter patterns duplicated between crafting and gathering
- Image URL transformations scattered across multiple files
- Authentication checks could be centralized
- Test coverage is limited to game mechanics

### Data Integration
- Scraper data (newer version) not yet integrated into frontend
- Manual process for updating game data
- No automated validation between scraper output and frontend expectations

## Scraper Architecture (In Progress)

### Modular Design

The scraper is being refactored to support multiple data types with a clean separation of concerns:

1. **Fetchers** - Responsible for navigating web pages and saving raw HTML
   - Version-aware (supports `latest` or specific versions like `0.10.1`)
   - Saves HTML to `scraped_html/{version}/{data_type}/`
   - Handles Selenium WebDriver management
   - Expands dynamic content (mat-expansion-panels)

2. **Parsers** - Convert HTML to structured YAML data
   - Work with saved HTML files (offline processing)
   - Use common utility functions for repeated patterns
   - Validate output against schemas
   - Generate consistent IDs and references

3. **Schemas** - Define the structure of output data
   - Ensure consistency across data types
   - Enable validation and type generation
   - Document expected fields and types

### Supported Data Types

- **Classes** ✅ (completed - 116 classes with improved parsing)
- **Abilities** ✅ (completed - 758 abilities with advanced subdivisions)
- **Races/Subraces** ✅ (completed - 35 races: 5 primary, 30 sub-races)
- **Items** ✅ (completed - 166 items with consistent null handling)
- **Keywords** ✅ (completed - 57 keywords with automatic type categorization)
- **Breakthroughs** ✅ (completed - 68 breakthroughs with cost/requirement parsing)
- **Monsters** ✅ (completed - 70+ monsters with stat blocks and ability references)
- **Monster Abilities** ✅ (completed - 252 abilities: 116 passive, 136 active actions)

### Common Patterns

The `core/utils.py` module provides utilities for:
- Extracting from mat-cards and expansion panels
- Parsing keywords from mat-chips
- Extracting costs (MP, AP, RP)
- Parsing requirements
- Sanitizing IDs
- Cleaning text

### Usage Examples

```python
# Classes (Completed)
from fetchers.class_fetcher import ClassFetcher
from parsers.class_parser import ClassParser

# Fetch latest class data
fetcher = ClassFetcher(version="latest")
fetcher.fetch_all()

# Parse classes offline
parser = ClassParser(version="0.10.1")
parser.parse_directory("scraped_html/0.10.1/classes")

# Abilities (Completed)
from fetchers.ability_fetcher import AbilityFetcher
from parsers.ability_parser import AbilityParser

# Fetch abilities from two-tab interface
fetcher = AbilityFetcher(version="latest")
fetcher.fetch_all()  # Handles True/Key ability tabs

# Parse abilities with advanced subdivision
parser = AbilityParser(version="0.10.1")
parser.parse_directory("scraped_html/0.10.1/abilities")

# Races (Completed)
from fetchers.race_fetcher import RaceFetcher
from parsers.race_parser import RaceParser

# Fetch races from two-tab interface
fetcher = RaceFetcher(version="latest")
fetcher.fetch_all()  # Handles Primary/Sub-race tabs + detail pages

# Parse races with benefit extraction
parser = RaceParser(version="0.10.1")
results = parser.parse_and_save_all()  # Creates organized structure

# Keywords (Completed)
from fetchers.keyword_fetcher import KeywordFetcher
from parsers.keyword_parser import KeywordParser

# Fetch keywords from single page
fetcher = KeywordFetcher(version="latest")
fetcher.fetch_all()  # Expands all keyword panels

# Parse keywords with type categorization
parser = KeywordParser(version="0.10.1")
results = parser.parse_and_save_all()  # Creates individual keyword files

# Breakthroughs (Completed)
from fetchers.breakthrough_fetcher import BreakthroughFetcher
from parsers.breakthrough_parser import BreakthroughParser

# Fetch breakthroughs from single page
fetcher = BreakthroughFetcher(version="latest")
fetcher.fetch_all()  # Expands all breakthrough panels

# Parse breakthroughs with cost/requirement extraction
parser = BreakthroughParser(version="0.10.1")
results = parser.parse_and_save_all()  # Creates individual breakthrough files

# Monster Abilities (Completed)
from fetchers.ability_fetcher import AbilityFetcher
from parsers.ability_parser import AbilityParser

# Fetch monster abilities from two-tab interface
fetcher = AbilityFetcher(version="latest", monster=True)
fetcher.fetch_all()  # Handles "Abilties" and "Active Actions" tabs

# Parse monster abilities with two distinct types
parser = AbilityParser(version="0.10.1", monster=True)
results = parser.parse_directory("scraped_html/0.10.1/monster-abilities")
```

## Ability Scraper Implementation ✅ COMPLETED

### Overview
The ability scraper successfully extends the modular architecture to handle the complex ability system with 758 total abilities across 4 distinct types.

### Architecture

```
scraper/
├── fetchers/
│   └── ability_fetcher.py        # Navigate two-tab interface, expand panels
├── parsers/
│   └── ability_parser.py         # Parse with advanced subdivision logic  
├── schemas/
│   └── ability_schema.py         # Pydantic models for 4 ability types
├── scraped_html/
│   └── {version}/
│       └── abilities/
│           ├── true_abilities.html      # ~584 abilities
│           ├── true_abilities.meta.json
│           ├── key_abilities.html       # ~82 abilities  
│           └── key_abilities.meta.json
└── parsed_data/
    └── {version}/
        └── abilities/
            ├── {ability_id}.yaml       # 747 individual files
            └── abilities_index.yaml    # Summary and references
```

### Data Model (Based on Parsed 758 Abilities)

**Four Ability Types:**
1. **true_ability** (583 abilities, 77.0%) - Standard combat/game abilities
   - Fields: `name`, `id`, `type`, `keywords`, `range`, `description`, `costs`, `requirements`
   - Examples: "Absorb Ice", "Accelerando", "Flight"

2. **key_ability** (112 abilities, 14.8%) - Core class features  
   - Fields: `name`, `id`, `type`, `keywords`, `benefits`, `associated_abilities`
   - Examples: "Acolyte's Journey", "Adventurer Essentials"

3. **crafting_ability** (55 abilities, 7.3%) - Crafting mechanics
   - Fields: `name`, `id`, `type`, `description`, `cost`, `parent_ability`, `subdivision_index`
   - Examples: "Masterful Dilution", "Skeleton Welding", "A Small Bit of Creation"

4. **gathering_ability** (8 abilities, 1.1%) - Resource gathering
   - Fields: `name`, `id`, `type`, `description`, `requirements`, `gathering_cost`, `gathering_bonus`
   - Examples: "Divining Petalfall", "Efficient Strike"

### Advanced Features Implemented ✅

**1. Crafting Ability Subdivision**
- **Challenge**: Single abilities containing multiple crafting techniques
- **Detection**: Multiple "Cost:" patterns in description text
- **Logic**: Port `should_parse_as_crafting()` + `parse_crafting_abilities()`
- **Output**: Split into individual sub-abilities with hierarchical IDs
- **Example**: "Transmuter Tricks" → 5 separate crafting abilities

**2. Cost Structure Parsing**
- **Resource Types**: Mana, AP, RP, Crafting Points, Strike Dice
- **Variable Costs**: Handle "X" costs and "NaN RP" patterns
- **Structured Output**: 
  ```yaml
  costs:
    mana: 4
    ap: 2
    rp: "variable"
    other: "30 Crafting Points"
  ```

**3. Keyword System**
- **Material Design**: Extract from `mat-chip` elements
- **Categories**: Combat mechanics, magic types, weapon restrictions, timing
- **Examples**: ["Rapid", "Counter", "Spell", "Fire", "Unarmed Strike"]

**4. Associated Abilities (Key Abilities)**
- **Hierarchical Structure**: Key abilities grant access to true abilities
- **Cross-References**: Maintain ability relationships
- **Example**: 
  ```yaml
  associated_abilities:
  - name: "Presence Concealment"
    id: "presence_concealment"
  ```

### Implementation Results ✅

All implementation phases have been completed successfully:

**Phase 1: Core Infrastructure** ✅
- `AbilityFetcher` was already implemented and working
- Two-tab navigation (True/Key abilities) handled
- All `mat-expansion-panel` elements expanded automatically
- Separate HTML files saved with metadata

**Phase 2: Basic Parsing** ✅
- `AbilityParser` created extending `BaseParser`
- Core HTML structure parsing ported from old code
- Type detection implemented (`app-true-ability` vs `app-key-ability`)
- Individual YAML files generated per ability

**Phase 3: Advanced Logic** ✅
- Crafting subdivision logic ported successfully
- Gathering ability detection patterns implemented
- Structured cost and requirement parsing working
- Keyword extraction and associated abilities handled

**Phase 4: Validation & Integration** ✅
- Validated against existing dataset (758 abilities parsed)
- Comprehensive abilities index generated
- Command-line interface with version support added
- Edge cases handled (variable costs, Secret Arts, etc.)

### Expected Output

**Individual Ability Files:**
```yaml
# absorb_ice.yaml
name: "Absorb Ice" 
id: "absorb_ice"
type: "true_ability"
keywords: ["Rapid"]
range: "Self"
description: "When you take damage from any source..."
costs:
  rp: 1
  mana: 2
  ap: 2
requirements:
  - "Attack Deals Water(Frost) Damage"
```

**Abilities Index:**
```yaml
# abilities_index.yaml
total_count: 758
version: "0.10.1"
generated_at: "2025-01-06T12:00:00Z"
by_type:
  true_ability: 583
  key_ability: 112  
  crafting_ability: 55
  gathering_ability: 8
abilities:
  - id: "absorb_ice"
    name: "Absorb Ice"
    type: "true_ability"
    keywords: ["Rapid"]
  # ... (747 entries)
```

### Command-Line Usage

```bash
# Fetch abilities from latest version  
python -m fetchers.ability_fetcher --version latest

# Parse abilities from saved HTML
python -m parsers.ability_parser scraped_html/0.10.1/abilities --version 0.10.1

# Full pipeline with JSON output
python -m fetchers.ability_fetcher --version 0.10.1
python -m parsers.ability_parser scraped_html/0.10.1/abilities --version 0.10.1 --format json
```

This implementation will preserve all sophisticated parsing logic from the existing 713-line ability parser while modernizing it to fit the new modular architecture and maintaining compatibility with the existing 747-ability dataset.

## Race Scraper Implementation ✅ COMPLETED

### Overview
The race scraper successfully extends the modular architecture to handle races and sub-races with complete benefit extraction.

### Architecture

```
scraper/
├── fetchers/
│   └── race_fetcher.py          # Navigate tabs, fetch detail pages
├── parsers/
│   └── race_parser.py           # Parse benefits, organize by type 
└── parsed_data/
    └── {version}/
        └── races/
            ├── primary/         # 5 primary race files
            ├── sub/            # 30 sub-race files  
            └── races_index.yaml # Complete index
```

### Features Implemented

1. **Tab Navigation**: Handles Primary Races and Sub-races tabs
2. **Detail Page Fetching**: Navigates to individual race pages for complete data
3. **Benefit Parsing**:
   - Attribute choices with structured options
   - Skill points with eligible skill lists
   - Racial abilities by name/ID reference
   - Proficiencies (weapons, languages)
   - Special abilities (e.g., Human's Ambition)
4. **Type Detection**: Automatically determines primary vs sub-race
5. **Parent Race Tracking**: Sub-races maintain primary_race reference
6. **Data Cleaning**: Removes trailing punctuation from skill lists

### Data Summary

- **Total Races**: 35 (5 primary, 30 sub-races)
- **Primary Races**: Human, Fae, Demon, Chimera, Youkai
- **Popular Sub-races**: Catfolk, Kitsune, Phoenix, Centaur, Dullahan
- **Benefit Types**: attribute_choice, skills, ability, proficiency, special

### Command-Line Usage

```bash
# Fetch all races
python -m fetchers.race_fetcher --version latest

# Parse races  
python -m parsers.race_parser --version 0.10.1
```

## Item Scraper Implementation ✅ COMPLETED

### Overview
The item scraper successfully extends the modular architecture to handle all items from the LC website with 166 total items across 9 distinct types.

### Architecture

```
scraper/
├── fetchers/
│   └── item_fetcher.py          # Navigate list and detail pages
├── parsers/
│   └── item_parser.py           # Parse with null value handling
├── schemas/
│   └── item_schema.py           # Pydantic models with optional fields
└── parsed_data/
    └── {version}/
        └── items/
            ├── {item_id}.yaml   # 166 individual files
            └── items_index.yaml # Summary and statistics
```

### Data Model (Based on Parsed 166 Items)

**Nine Item Types:**
1. **Equipment** (54 items, 32.5%) - Weapons, armor, and tools
   - Subtypes: Weapon (21), Specialized Weapon (13), Armor (10), Channeling Weapon (4), Crafting (4), Shield (2)

2. **Artifice** (40 items, 24.1%) - Technological/magical devices
   - Subtypes: Assist (19), Weapon (12), Basic (7), Airship (1), Fuel (1)

3. **Alchemy** (40 items, 24.1%) - Consumable items
   - Subtypes: Elixir (16), Flask (12), Potion (12)

4. **Adventuring Essentials** (16 items, 9.6%) - Basic adventuring gear
   - Subtypes: Kit (9), Storage (4), Basic (3)

5. **Mount** (6 items, 3.6%) - Rideable creatures and vehicles

6. **Crafting** (6 items, 3.6%) - Materials and components
   - Subtypes: Materials (5), (empty) (1)

7. **Divine Arms** (1 item) - Legendary divine weapons
8. **Astra Relic** (2 items) - Ancient powerful weapons  
9. **Talisman** (1 item) - Magical binding items

### Key Implementation Features ✅

**1. Consistent Null Handling**
- All dash values (`"-"`) converted to proper `null`
- Optional fields properly typed in Pydantic schema
- Clean data format throughout

**2. Simplified Wait Logic**  
- Reduced timeout from 40/60/30 seconds to just 10 seconds
- Matches successful pattern from class/ability fetchers
- Proceeds on timeout rather than failing

**3. Robust Property Extraction**
- Handles all item properties (cost, burden, activation cost, etc.)
- Optional fields (shell_size, fuel_usage, crafting_points, crafting_type)
- HTML tag stripping from descriptions

**4. Parser Improvements**
- Fixed `int(None)` error for items without crafting_points
- Proper metadata handling without `_extract_basic_metadata`
- Comprehensive index generation with type/subtype statistics

### Command-Line Usage

```bash
# Fetch items from latest version
python -m fetchers.item_fetcher --version latest

# Parse items from saved HTML
python -m parsers.item_parser scraped_html/0.10.1/items --version 0.10.1

# Test single item (for debugging)
python -m fetchers.item_fetcher --test axe--light-
```

## Angular SPA Scraping - Critical Debugging Guide 🚨

**IMPORTANT**: When implementing new fetchers for Angular single-page applications, you MUST override specific base fetcher methods to handle proper content loading. The default base fetcher methods are insufficient for Angular apps.

### The Problem

The base `BaseFetcher` class has a basic `_wait_for_detail_page()` method that only waits for the `<body>` element to load:

```python
def _wait_for_detail_page(self):
    """Wait for detail page to load. Override in subclasses for specific wait conditions."""
    # Default: wait for body to be present
    WebDriverWait(self.driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
```

This causes fetchers to save **loading pages** instead of actual content because:
1. The `<body>` loads immediately even on loading pages
2. Angular content loads asynchronously after initial page load
3. The main `fetch_all()` loop calls `fetch_detail_page()` → `_wait_for_detail_page()`

### The Solution ✅

For any Angular SPA fetcher, you MUST override both methods:

#### 1. Override `_wait_for_detail_page()` with Angular-specific waits:

```python
def _wait_for_detail_page(self):
    """Override base fetcher method with proper Angular waiting."""
    try:
        # Wait for Angular component to load
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "app-item-detail"))
        )
        
        # Wait for specific content elements 
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.d-flex.justify-content-between"))
        )
        
        # Wait for actual content patterns in page source
        WebDriverWait(self.driver, 10).until(
            lambda driver: (
                'Type: </label>' in driver.page_source and
                'Description:</mat-card-title>' in driver.page_source and
                'linkify' in driver.page_source and
                "Loading: Angel's Sword Studios" not in driver.page_source[:1000] and
                len(driver.page_source) > 60000
            )
        )
        
        time.sleep(2)  # Final rendering wait
        
    except TimeoutException as e:
        logger.warning(f"Timeout waiting for content: {e}")
        time.sleep(10)  # Last ditch effort
```

#### 2. Override `fetch_detail_page()` with validation:

```python
def fetch_detail_page(self, url: str, item_id: str, metadata: Optional[Dict] = None) -> str:
    """Override base fetcher method to add validation."""
    logger.info(f"Fetching detail page for {item_id}: {url}")
    
    try:
        self.driver.get(url)
        self._wait_for_detail_page()
        self._expand_all_panels()
        
        html = self.driver.page_source
        
        # CRITICAL: Validate content before saving
        has_description = 'Description:</mat-card-title>' in html
        has_loading = "Loading: Angel's Sword Studios" in html[:1000]
        has_structure = 'Type: </label>' in html  # Use actual HTML patterns!
        
        if has_loading or not has_description or not has_structure:
            error_msg = f"Failed to load content for {item_id}:"
            if has_loading: error_msg += " Still on loading page."
            if not has_description: error_msg += " Missing Description."
            if not has_structure: error_msg += " Missing structure."
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Save HTML
        html_path = self.output_dir / f"{item_id}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        logger.info(f"Successfully saved {len(html)} chars for {item_id}")
        
        return str(html_path)
        
    except Exception as e:
        logger.error(f"Error fetching detail page for {item_id}: {e}")
        raise
```

### Key Debugging Insights

1. **Check actual HTML patterns**: Use single-item test mode to verify exact HTML structure:
   ```bash
   python -m fetchers.item_fetcher --single-url "/game/0.10.1/items/axe--heavy-"
   ```

2. **File size differences**: 
   - Loading pages: ~74,873 bytes
   - Real content: ~157,000+ bytes

3. **HTML title indicators**:
   - Loading page: `<title>Loading: Angel's Sword Studios</title>`
   - Real content: `<title>Classes/Item Name | The Lyrian Chronicles...</title>`

4. **Angular HTTP wait may fail**: The `angular.element('body').injector().get('$http')` pattern may not work but content still loads properly

5. **Pattern matching**: Use exact HTML patterns from actual content:
   - ❌ `">Type:<"` (wrong)
   - ✅ `"Type: </label>"` (correct)

### Command-Line Testing

Add single-item test mode to all fetchers:

```python
parser.add_argument("--single-url", help="Test mode: fetch single item by URL")

if args.single_url:
    fetcher.test_single_item(args.single_url)
else:
    fetcher.fetch_all()
```

This allows iterative debugging of wait conditions without processing all items.

## Google Sheets Export and Demo Integration ✅ COMPLETED

### Overview
The scraper includes Google Sheets export functionality with a working demo spreadsheet that showcases IMPORTRANGE functionality for end users.

### Demo Spreadsheet Features

The demo system creates and maintains a single demonstration spreadsheet showing how to use IMPORTRANGE to pull data from exported game data:

1. **Config-Based Management**: Uses `.sheets_config.json` to save demo spreadsheet ID, preventing creation of new demos each run
2. **Helper Sheets Pattern**: Uses `_ClassList` and `_AbilityList` hidden sheets containing IMPORTRANGE formulas for dropdown validation
3. **Working Dropdowns**: Class and ability dropdowns that pull live data from the main export spreadsheet
4. **Auto-Population**: Select items from dropdowns and watch related data auto-populate using INDEX/MATCH formulas
5. **IMPORTRANGE Permissions**: Automatically grants necessary permissions using Google's undocumented API endpoint

### Demo Architecture

```
Demo Spreadsheet Structure:
├── Instructions          # How to use and copy patterns
├── Class Lookup         # Class dropdown with auto-populated data
├── Ability Lookup       # Ability dropdown with auto-populated data
├── _ClassList          # Hidden helper sheet with IMPORTRANGE class data
└── _AbilityList        # Hidden helper sheet with IMPORTRANGE ability data
```

### Implementation Details

**Key Technical Solutions:**
- **Helper Sheet Approach**: Avoids direct IMPORTRANGE in data validation by using intermediate sheets
- **Permission Granting**: Uses Stack Overflow solution with undocumented Google API endpoint for IMPORTRANGE permissions
- **Formula Execution**: Writes formulas using Google Sheets API `updateCells` with `formulaValue`
- **Configuration Management**: JSON config file stores spreadsheet IDs for reuse

**Command Usage:**
```bash
# Create/update demo spreadsheet with working dropdowns
python create_demo_sheet.py

# Setup dropdown validation using helper sheets
python setup_demo_dropdowns.py
```

**Configuration File (`.sheets_config.json`):**
```json
{
  "demo": {
    "spreadsheet_id": "1jIgr8ICRJl-jCY_TWvaIbekGFCzWxl3cMkB2C9wnlNU",
    "last_updated": "2025-06-04T03:20:08.935067"
  },
  "0.10.1": {
    "spreadsheet_id": "1l_IhI6LaEW7eqISHoK2bUYLlMvb9a37JbPhoI-vuXq0",
    "last_updated": "2025-06-04T02:02:54.366952"
  }
}
```

### Demo Functionality

**Class Lookup Demo:**
- Dropdown populated from IMPORTRANGE of Classes sheet
- Auto-populates: Tier, Difficulty, Main Role, Secondary Role, Requirements
- Uses INDEX/MATCH formulas to cross-reference selected class

**Ability Lookup Demo:**
- Dropdown populated from IMPORTRANGE of All Abilities sheet  
- Auto-populates: Type, Keywords, Range, Requirements, Mana, AP, RP, Description
- Demonstrates complex cross-sheet lookups with live data

**Instructions Sheet:**
- Explains the technical implementation
- Shows users how to copy the patterns to their own sheets
- Documents the V3 improvements and helper sheet approach

### Problem Solving Journey

The implementation solved several critical Google Sheets API challenges:

1. **IMPORTRANGE Text Display Issue**: Fixed by properly writing formulas instead of text
2. **Data Validation API Structure**: Corrected to use string format `'=_ClassList!A2:A200'` instead of object format
3. **IMPORTRANGE Permissions**: Implemented undocumented API endpoint solution from Stack Overflow
4. **Formula Execution**: Used `updateCells` with `formulaValue` for proper formula writing
5. **Demo Reuse**: Config-based ID storage prevents creating new demos each run

### Integration with Main Export

The demo spreadsheet references the main export spreadsheet created by the class/ability exporters:
- Source spreadsheet contains complete game data in structured sheets
- Demo spreadsheet uses IMPORTRANGE to pull specific columns for dropdowns
- Users can copy the demo patterns to create their own custom tools
- Live data updates when source export is refreshed

This provides a complete end-to-end solution from web scraping to shareable, interactive Google Sheets demos.

## Future Improvements

1. **API Refactoring**:
   - Implement consistent RESTful patterns
   - Add OpenAPI documentation
   - Centralize error handling
   - Implement request validation middleware

2. **Data Pipeline**:
   - Complete scraper modularization
   - Automate scraper to frontend data flow
   - Add data validation and migration tools
   - Implement incremental updates
   - Version control for game data

3. **Performance**:
   - Implement pagination for large datasets
   - Add Redis caching layer
   - Optimize image delivery with CDN
   - Lazy load game mechanics data

4. **Developer Experience**:
   - Increase test coverage
   - Add integration tests
   - Improve TypeScript strictness
   - Create developer documentation

5. **Features**:
   - Real-time collaboration features
   - Mobile app version
   - Offline support with PWA
   - Advanced analytics dashboard

## Contributing

When contributing to this project:

1. Follow the existing code patterns and conventions
2. Add tests for new game mechanics
3. Update relevant documentation
4. Ensure TypeScript types are properly defined
5. Test with both development and production builds

## Notes

- The project serves the Mirane server TTRPG community
- Game data is sourced from the official Lyrian Chronicles website
- The codebase prioritizes extensibility for new game features
- Performance is optimized for desktop browsers
- Python cache files (__pycache__, *.pyc) are already in .gitignore - no need to clean them up before commits

## Angular SPA Scraping Patterns

### Waiting for List Pages
When scraping Angular list pages (classes, monsters, etc.), wait for the specific Angular component rather than generic elements:

```python
# Good - wait for Angular component
WebDriverWait(self.driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "app-monster-card"))
)

# Bad - generic mat-card might appear before content loads
WebDriverWait(self.driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "mat-card"))
)
```

### Component Naming Pattern
The LC website follows a consistent pattern for list page components:
- Classes: `app-class-card`
- Monsters: `app-monster-card`
- Items: Check for `app-item-card` or similar
- Abilities: Different structure (uses mat-expansion-panel)

### Version Detection from URL
When using "latest" version, detect the actual version from URL redirect:

```python
if self.version == "latest":
    current_url = self.driver.current_url
    version_match = re.search(r'/game/([^/]+)/', current_url)
    if version_match:
        actual_version = version_match.group(1)
        # Update version and paths accordingly
```