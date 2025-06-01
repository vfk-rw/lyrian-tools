# Scraper Usage Guide

## New Version-Aware Structure

The scraper now uses a clean, version-aware directory structure that matches the organization of scraped HTML files:

```
scraped_html/           # Raw HTML from fetchers
├── 0.10.1/
│   ├── classes/
│   └── abilities/      (future)
└── latest -> 0.10.1

parsed_data/            # Structured YAML/JSON from parsers  
├── 0.10.1/
│   ├── classes/
│   └── abilities/      (future)
└── latest -> 0.10.1
```

## Usage Examples

### Parse all classes from a specific version

```bash
# Parse all classes from version 0.10.1
python -m parsers.class_parser scraped_html/0.10.1/classes --version 0.10.1

# Output will be saved to: parsed_data/0.10.1/classes/
```

### Parse with custom output directory

```bash
# Use custom base directory
python -m parsers.class_parser scraped_html/0.10.1/classes \
  --output-dir custom_output \
  --version 0.10.1

# Output will be saved to: custom_output/0.10.1/classes/
```

### Parse in JSON format

```bash
# Output as JSON instead of YAML
python -m parsers.class_parser scraped_html/0.10.1/classes \
  --version 0.10.1 \
  --format json
```

## Programmatic Usage

```python
from parsers.class_parser import ClassParser

# Create parser for specific version
parser = ClassParser(version='0.10.1')

# Parse single file
result = parser.parse_file(
    'scraped_html/0.10.1/classes/zen_warrior.html',
    'scraped_html/0.10.1/classes/zen_warrior.meta.json'
)

# Parse entire directory
results = parser.parse_directory('scraped_html/0.10.1/classes')

print(f"Parsed {len(results)} classes")
print(f"Output directory: {parser.output_dir}")
```

## Version Management

- **Latest symlink**: Automatically created/updated to point to the newest version
- **Version comparison**: Uses semantic versioning (e.g., 0.10.1 > 0.10.0)
- **Parallel versions**: Multiple versions can coexist in the same directory structure

## Data Quality Improvements

The improved parser fixes 5 critical issues identified in systematic analysis:

1. ✅ **Heart attribute parsing**: Now extracts actual attributes (Fitness, Reason, etc.)
2. ✅ **Secret Art ID normalization**: Consistent `secret_art__name` format  
3. ✅ **Structured skills data**: Includes eligible_skills, conversion rules, etc.
4. ✅ **Structured attribute choices**: Uses `{attribute: "X", value: 1}` objects
5. ✅ **Requirements handling**: Proper empty arrays for Tier 1 classes

All 116 classes parse successfully with zero errors.