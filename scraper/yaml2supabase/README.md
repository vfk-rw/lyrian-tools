# YAML to Supabase Migration Tool

This tool converts parsed YAML game data into SQL files that can be imported into Supabase.

## Overview

The migration tool:
1. Reads YAML files from `parsed_data/{version}/`
2. Converts them to PostgreSQL-compatible SQL
3. Generates migration files in the correct order
4. Optionally deploys them using Supabase CLI

## Usage

### Generate Migration Files

```bash
# Generate SQL files for the latest version (0.10.1)
python migrate.py

# Generate for a specific version
python migrate.py --version 0.10.2

# Generate only specific data types
python migrate.py --data-types classes abilities items
```

### Deploy to Supabase

#### Using Python Script

```bash
# Deploy to local development database
python deploy_to_supabase.py --local

# Deploy to remote Supabase project
python deploy_to_supabase.py --project-ref your-project-ref --db-password your-db-password

# Dry run (see what would be deployed)
python deploy_to_supabase.py --dry-run

# Reset tables before deploying (CAUTION!)
python deploy_to_supabase.py --reset --local
```

#### Using Bash Script

```bash
# Deploy to local development database
./deploy.sh --local

# Deploy to remote Supabase project
./deploy.sh --project-ref your-project-ref --db-password your-db-password
```

#### Manual Deployment

You can also manually run the SQL files using Supabase CLI:

```bash
# For local development
supabase db push --file output/01_schema_*.sql
supabase db push --file output/02_data_*.sql
# ... etc

# For remote database
supabase db execute --file output/01_schema_*.sql --project-ref <ref>
# ... etc
```

## Generated Files

The tool generates files with timestamps in the `output/` directory:

1. **01_schema_{timestamp}.sql** - Database schema (tables, types, functions)
2. **02_data_{type}_{timestamp}.sql** - Data for each type (classes, abilities, etc.)
3. **03_relationships_{timestamp}.sql** - Foreign key relationships
4. **04_indexes_{timestamp}.sql** - Performance indexes

## Prerequisites

### For Generation
- Python 3.8+
- PyYAML (`pip install pyyaml`)
- Parsed YAML data in `../parsed_data/`

### For Deployment
- [Supabase CLI](https://supabase.com/docs/reference/cli/installing-and-updating)
- Supabase project (local or remote)
- Database credentials (for remote deployment)

## Database Schema

Tables are prefixed with `parsed_data_` to avoid conflicts:

- `parsed_data_classes` - Character classes
- `parsed_data_abilities` - All ability types
- `parsed_data_races` - Races and sub-races
- `parsed_data_items` - Equipment, consumables, etc.
- `parsed_data_keywords` - Game mechanics keywords
- `parsed_data_breakthroughs` - Character progression options
- `parsed_data_monsters` - NPCs and enemies
- `parsed_data_monster_abilities_list` - Monster-specific abilities

### Relationship Tables
- `parsed_data_class_abilities` - Links classes to their abilities
- `parsed_data_class_key_abilities` - Links classes to key abilities
- `parsed_data_monster_abilities` - Links monsters to abilities
- `parsed_data_race_abilities` - Links races to racial abilities
- `parsed_data_item_keywords` - Links items to keywords
- `parsed_data_ability_keywords` - Links abilities to keywords

## Features

- **Version Support**: Can migrate different game versions
- **Incremental Updates**: ON CONFLICT clauses prevent duplicate errors
- **Full-Text Search**: Automatic search vector generation
- **Type Safety**: Proper PostgreSQL types (JSONB, arrays, etc.)
- **Performance**: Indexes on commonly queried fields

## Troubleshooting

### "Supabase CLI not found"
Install the Supabase CLI:
```bash
npm install -g supabase
```

### "No migration files found"
Run `python migrate.py` first to generate the SQL files.

### Permission Errors
Make sure you're logged in to Supabase:
```bash
supabase login
```

### Table Already Exists Errors
Use the `--reset` flag to drop existing tables first (CAUTION: this deletes data!)

## Development

### Adding a New Data Type

1. Create a converter in `converters/new_type_converter.py`
2. Inherit from `BaseConverter`
3. Implement required methods:
   - `get_table_name()`
   - `convert_record()`
4. Add to `converters/__init__.py`
5. Add to `migrate.py` converters dict

### Modifying Schema

Edit `schema.py` to modify table structures. Changes include:
- Adding/removing columns
- Changing data types
- Adding constraints
- Creating new tables