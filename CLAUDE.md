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

- **Classes** ✓ (existing, to be refactored)
- **Abilities** ✓ (existing, to be refactored)
- **Races/Subraces** (planned)
- **Items** (planned)
- **Monsters** (planned)
- **Monster Abilities** (planned)

### Common Patterns

The `core/utils.py` module provides utilities for:
- Extracting from mat-cards and expansion panels
- Parsing keywords from mat-chips
- Extracting costs (MP, AP, RP)
- Parsing requirements
- Sanitizing IDs
- Cleaning text

### Usage Example

```python
# Fetch latest version data
from fetchers.class_fetcher import ClassFetcher
fetcher = ClassFetcher(version="latest")
fetcher.fetch_all()

# Or fetch specific version
fetcher = ClassFetcher(version="0.10.1")
fetcher.fetch_all()

# Parse offline
from parsers.class_parser import ClassParser
parser = ClassParser()
parser.parse_directory("scraped_html/latest/classes")
```

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