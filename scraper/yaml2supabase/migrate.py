#!/usr/bin/env python3
"""
YAML to Supabase SQL Migration Tool

Converts parsed YAML data to SQL files for manual upload to Supabase.
Creates tables with parsed_data_ prefix and handles all data types.
"""

import argparse
import json
import logging
import sys
import yaml
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from yaml2supabase.schema import create_schema_sql
from yaml2supabase.converters import (
    ClassConverter,
    AbilityConverter,
    RaceConverter,
    ItemConverter,
    KeywordConverter,
    BreakthroughConverter,
    MonsterConverter,
    MonsterAbilityConverter
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YamlToSupabaseMigrator:
    """Main migrator class that orchestrates the conversion process."""
    
    def __init__(self, version: str = "0.10.1", output_dir: Optional[Path] = None):
        self.version = version
        self.parsed_data_dir = Path(__file__).parent.parent / "parsed_data" / version
        self.output_dir = output_dir or Path(__file__).parent / "output"
        
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize converters
        self.converters = {
            'classes': ClassConverter(),
            'abilities': AbilityConverter(),
            'races': RaceConverter(),
            'items': ItemConverter(),
            'keywords': KeywordConverter(),
            'breakthroughs': BreakthroughConverter(),
            'monsters': MonsterConverter(),
            'monster-abilities': MonsterAbilityConverter()
        }
        
    def generate_all(self):
        """Generate SQL files for all data types."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate schema SQL
        schema_file = self.output_dir / f"01_schema_{timestamp}.sql"
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write(create_schema_sql())
        logger.info(f"Created schema file: {schema_file}")
        
        # Generate data SQL files
        for data_type, converter in self.converters.items():
            logger.info(f"Processing {data_type}...")
            
            data_dir = self.parsed_data_dir / data_type
            if not data_dir.exists():
                logger.warning(f"Directory not found: {data_dir}")
                continue
                
            sql_content = converter.convert_directory(data_dir, self.version)
            
            if sql_content:
                sql_file = self.output_dir / f"02_data_{data_type}_{timestamp}.sql"
                with open(sql_file, 'w', encoding='utf-8') as f:
                    f.write(sql_content)
                logger.info(f"Created data file: {sql_file}")
            else:
                logger.warning(f"No data generated for {data_type}")
        
        # Generate relationships SQL
        relationships_file = self.output_dir / f"03_relationships_{timestamp}.sql"
        with open(relationships_file, 'w', encoding='utf-8') as f:
            f.write(self._generate_relationships_sql())
        logger.info(f"Created relationships file: {relationships_file}")
        
        # Generate indexes SQL
        indexes_file = self.output_dir / f"04_indexes_{timestamp}.sql"
        with open(indexes_file, 'w', encoding='utf-8') as f:
            f.write(self._generate_indexes_sql())
        logger.info(f"Created indexes file: {indexes_file}")
        
        logger.info(f"\n✅ Migration files generated in: {self.output_dir}")
        logger.info("Upload these files to Supabase in order: schema → data → relationships → indexes")
        logger.info("\nTo deploy using Supabase CLI:")
        logger.info("  - For local dev: python deploy_to_supabase.py --local")
        logger.info("  - For remote: python deploy_to_supabase.py --project-ref <ref> --db-password <password>")
        logger.info("  - Or use: ./deploy.sh [options]")
        
    def _generate_relationships_sql(self) -> str:
        """Generate SQL for populating relationship tables."""
        sql_lines = [
            "-- Populate relationship tables",
            "-- This file should be run after all data is loaded",
            "",
            "-- Class-Ability relationships",
            "-- These will be populated based on class YAML files that list abilities",
            "-- For now, we'll need to manually map these or enhance the converters",
            "",
            "-- Monster-Ability relationships", 
            "-- Similarly, these come from monster YAML files",
            "",
            "-- TODO: Implement relationship extraction from YAML files",
            ""
        ]
        return '\n'.join(sql_lines)
        
    def _generate_indexes_sql(self) -> str:
        """Generate SQL for creating search indexes and performance optimizations."""
        sql_lines = [
            "-- Create indexes for better query performance",
            "",
            "-- Full-text search indexes",
            "CREATE INDEX IF NOT EXISTS idx_classes_search ON parsed_data_classes USING GIN (search_vector);",
            "CREATE INDEX IF NOT EXISTS idx_abilities_search ON parsed_data_abilities USING GIN (search_vector);",
            "CREATE INDEX IF NOT EXISTS idx_items_search ON parsed_data_items USING GIN (search_vector);",
            "CREATE INDEX IF NOT EXISTS idx_monsters_search ON parsed_data_monsters USING GIN (search_vector);",
            "",
            "-- Foreign key indexes",
            "CREATE INDEX IF NOT EXISTS idx_abilities_parent ON parsed_data_abilities(parent_ability_id);",
            "CREATE INDEX IF NOT EXISTS idx_races_primary ON parsed_data_races(primary_race);",
            "",
            "-- Type/category indexes",
            "CREATE INDEX IF NOT EXISTS idx_abilities_type ON parsed_data_abilities(type);",
            "CREATE INDEX IF NOT EXISTS idx_items_type ON parsed_data_items(type);",
            "CREATE INDEX IF NOT EXISTS idx_items_subtype ON parsed_data_items(subtype);",
            "CREATE INDEX IF NOT EXISTS idx_keywords_type ON parsed_data_keywords(type);",
            "",
            "-- Version indexes for multi-version support",
            "CREATE INDEX IF NOT EXISTS idx_classes_version ON parsed_data_classes(version);",
            "CREATE INDEX IF NOT EXISTS idx_abilities_version ON parsed_data_abilities(version);",
            "CREATE INDEX IF NOT EXISTS idx_items_version ON parsed_data_items(version);",
            "CREATE INDEX IF NOT EXISTS idx_monsters_version ON parsed_data_monsters(version);",
            ""
        ]
        return '\n'.join(sql_lines)


def main():
    """Main entry point for the migration tool."""
    parser = argparse.ArgumentParser(
        description="Convert parsed YAML data to Supabase SQL files"
    )
    parser.add_argument(
        "--version",
        default="0.10.1",
        help="Game version to migrate (default: 0.10.1)"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory for SQL files (default: yaml2supabase/output)"
    )
    parser.add_argument(
        "--data-types",
        nargs="+",
        choices=['classes', 'abilities', 'races', 'items', 'keywords', 
                 'breakthroughs', 'monsters', 'monster-abilities'],
        help="Specific data types to migrate (default: all)"
    )
    
    args = parser.parse_args()
    
    try:
        migrator = YamlToSupabaseMigrator(
            version=args.version,
            output_dir=args.output_dir
        )
        
        if args.data_types:
            # Filter converters to only requested types
            migrator.converters = {
                k: v for k, v in migrator.converters.items() 
                if k in args.data_types
            }
        
        migrator.generate_all()
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()