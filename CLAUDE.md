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
- **Races/Subraces** 📋 (planned)
- **Items** 📋 (planned)
- **Monsters** 📋 (planned)
- **Monster Abilities** 📋 (planned)

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