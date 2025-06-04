# Google Sheets Exporters

This module provides tools to export parsed TTRPG data to Google Sheets for easy browsing and sharing.

## Features

- **Comprehensive Export**: All game data types (classes, abilities, items, races, keywords, breakthroughs, monsters)
- **Update Same Spreadsheet**: Automatically reuse the same spreadsheet for ongoing updates
- **Multiple Sheets**: Each data type gets its own tab in the spreadsheet
- **Public Sharing**: Spreadsheets are automatically made publicly viewable
- **Detailed Breakdowns**: Optional detailed sheets (e.g., abilities by type, items by type)
- **Formatted Output**: Headers are bold and frozen, columns auto-resize
- **Summary Sheet**: Overview with counts and export metadata
- **Rate Limiting**: Built-in retry logic and delays to handle Google API limits
- **No Sheet1**: Automatically removes the default empty Sheet1

## Quick Start

```bash
# Export all data to Google Sheets (creates new spreadsheet)
python export_to_sheets.py

# Update the same spreadsheet (automatically uses saved ID)
python export_to_sheets.py --update

# Export specific data types to new spreadsheet
python export_to_sheets.py --data-types classes abilities items

# Update existing spreadsheet with specific ID
python export_to_sheets.py --spreadsheet-id 1ABC123... --data-types classes

# Export with detailed breakdowns
python export_to_sheets.py --detailed

# Export specific version
python export_to_sheets.py --version 0.10.1 --title "LC Data v0.10.1"
```

## Requirements

1. **Google Sheets API Access**: Service account credentials in `../lctools-app/keys/gcp.json`
2. **Python Dependencies**: Install with `uv pip install -r requirements.txt`
3. **Parsed Data**: Run the scrapers first to generate data in `parsed_data/`

## Data Types Exported

### Classes (116 classes)
- Basic info: ID, name, tier, difficulty, roles
- Requirements and progression
- Ability references by level
- Optional: Detailed class abilities breakdown

### Abilities (758+ abilities)
- Four types: true_ability, key_ability, crafting_ability, gathering_ability  
- Costs, keywords, requirements, descriptions
- Optional: Separate sheets by ability type

### Items (166 items)
- Equipment, artifice, alchemy, adventuring essentials, mounts
- Cost, burden, activation cost, crafting info
- Optional: Separate sheets by item type

### Races (35 races)
- Primary races and sub-races
- Benefits, abilities, descriptions

### Keywords (57 keywords)
- Timing, element, status, combat keywords
- Type categorization and descriptions

### Breakthroughs (68 breakthroughs)
- Character advancement options
- Costs and requirements

### Monsters (70+ monsters)
- Stat blocks, danger levels, abilities
- Lore and strategy information

### Monster Abilities (252 abilities)
- Passive abilities and active actions
- Separate from player abilities

## Architecture

```
exporters/
├── sheets/
│   ├── base_sheets_exporter.py     # Common Google Sheets functionality
│   ├── classes_exporter.py         # Class-specific export logic
│   ├── abilities_exporter.py       # Ability-specific export logic  
│   ├── items_exporter.py           # Item-specific export logic
│   └── generic_exporter.py         # Generic export for other types
└── export_to_sheets.py             # Main CLI script
```

## Usage Examples

```bash
# Full export with all bells and whistles (creates new spreadsheet)
python export_to_sheets.py --detailed --title "Complete LC Database"

# Update the same spreadsheet with new data
python export_to_sheets.py --update

# Quick classes and abilities export
python export_to_sheets.py --data-types classes abilities

# Update specific spreadsheet ID with items
python export_to_sheets.py --spreadsheet-id 1ABC123... --data-types items

# Export specific version with custom credentials
python export_to_sheets.py --version 0.9.5 --credentials /path/to/creds.json

# Create private spreadsheet (not publicly viewable)
python export_to_sheets.py --private
```

## Workflow Recommendations

**For Regular Updates:**
1. First export: `python export_to_sheets.py` (creates new public spreadsheet)
2. Future updates: `python export_to_sheets.py --update` (reuses same spreadsheet)

**The tool automatically:**
- Saves the spreadsheet ID for each game version
- Updates the same spreadsheet when using `--update`
- Preserves the URL so bookmarks continue to work
- Removes old data and replaces with fresh exports

## Output

The script creates a Google Spreadsheet with:

1. **Summary** - Export metadata and data counts
2. **Classes** - All class information
3. **All Abilities** - Complete ability database
4. **All Items** - Complete item database  
5. **Races** - Primary and sub-races
6. **Keywords** - Game keywords and mechanics
7. **Breakthroughs** - Character advancement options
8. **Monsters** - Monster stat blocks
9. **Monster Abilities** - Monster-specific abilities

With `--detailed` flag, additional breakdown sheets are created for abilities by type and items by type.

## Public Sharing

To enable public sharing of exported spreadsheets:

1. **Enable Google Drive API**: Visit https://console.developers.google.com/apis/api/drive.googleapis.com/overview
2. **Enable the API** for your project (lyriantools)
3. **Wait a few minutes** for the change to propagate
4. **Re-run export** with public sharing enabled (default)

```bash
# Export with public sharing (default)
python export_to_sheets.py

# Export privately
python export_to_sheets.py --private
```

## Troubleshooting

- **Credentials Error**: Ensure `gcp.json` exists and has Sheets API access
- **Public Sharing Fails**: Enable Google Drive API (see above)
- **No Data**: Run the scrapers first to generate `parsed_data/`
- **Rate Limits**: The script includes reasonable delays and error handling
- **Large Data**: Export may take several minutes for full dataset