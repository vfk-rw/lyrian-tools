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
└── scraped_html/   # Raw HTML storage (versioned)
```

### Key Design Principles

1. **Separation of Concerns**: Fetchers retrieve HTML, parsers convert to YAML
2. **Version Support**: Data is organized by game version (e.g., `0.10.1` or `latest`)
3. **Reusability**: Common patterns are extracted into base classes
4. **Offline Processing**: HTML can be saved and parsed later

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