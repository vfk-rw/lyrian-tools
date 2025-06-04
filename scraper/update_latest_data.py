#!/usr/bin/env python3
"""
Update script for fetching and parsing the latest game data.

This script runs all fetchers and parsers in sequence to grab the latest
version of game data from the Lyrian Chronicles website.

Usage:
    python update_latest_data.py [--fetch-only] [--parse-only] [--data-types TYPE1 TYPE2 ...]
"""

import argparse
import logging
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Data types in dependency order (some parsers need others to complete first)
DATA_TYPES = [
    'keywords',      # No dependencies
    'abilities',     # No dependencies 
    'monster-abilities',  # No dependencies
    'races',         # No dependencies
    'items',         # No dependencies
    'breakthroughs', # No dependencies
    'classes',       # May reference abilities (but not required for parsing)
    'monsters',      # May reference monster-abilities (but not required for parsing)
]

class DataUpdater:
    """Orchestrates fetching and parsing of game data."""
    
    def __init__(self, data_types: Optional[List[str]] = None, update_sheets: bool = True):
        self.data_types = data_types or DATA_TYPES
        self.version = "latest"
        self.update_sheets = update_sheets
        
        # Resolve actual version if using "latest"
        self.actual_version = self._resolve_actual_version()
        
        # Validate data types
        invalid_types = set(self.data_types) - set(DATA_TYPES)
        if invalid_types:
            raise ValueError(f"Invalid data types: {invalid_types}")
    
    def _resolve_actual_version(self) -> str:
        """Resolve 'latest' to the actual version number."""
        if self.version != "latest":
            return self.version
            
        # Check scraped_html/latest symlink to get actual version
        latest_path = Path("scraped_html/latest")
        if latest_path.is_symlink():
            target = latest_path.resolve()
            actual_version = target.name
            logger.info(f"📍 Resolved 'latest' to version: {actual_version}")
            return actual_version
        else:
            logger.warning("⚠️ 'latest' symlink not found, using 'latest' as version")
            return self.version
    
    def run_fetcher(self, data_type: str) -> bool:
        """Run the fetcher for a specific data type."""
        logger.info(f"🔄 Fetching {data_type} data...")
        
        # Map data types to fetcher modules
        fetcher_map = {
            'classes': 'fetchers.class_fetcher',
            'abilities': 'fetchers.ability_fetcher',
            'races': 'fetchers.race_fetcher', 
            'items': 'fetchers.item_fetcher',
            'keywords': 'fetchers.keyword_fetcher',
            'breakthroughs': 'fetchers.breakthrough_fetcher',
            'monsters': 'fetchers.monster_fetcher',
            'monster-abilities': 'fetchers.ability_fetcher',
        }
        
        fetcher_module = fetcher_map.get(data_type)
        if not fetcher_module:
            logger.error(f"No fetcher found for {data_type}")
            return False
            
        try:
            # Build base command
            cmd = ['python', '-m', fetcher_module, '--version', self.version]
            
            # Add monster flag for monster abilities
            if data_type == 'monster-abilities':
                cmd.append('--monster')
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path.cwd())
            
            if result.returncode == 0:
                logger.info(f"✅ Successfully fetched {data_type}")
                return True
            else:
                logger.error(f"❌ Failed to fetch {data_type}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error fetching {data_type}: {e}")
            return False
    
    def run_parser(self, data_type: str) -> bool:
        """Run the parser for a specific data type."""
        logger.info(f"📝 Parsing {data_type} data...")
        
        # Map data types to parser modules  
        parser_map = {
            'classes': 'parsers.class_parser',
            'abilities': 'parsers.ability_parser',
            'races': 'parsers.race_parser',
            'items': 'parsers.item_parser', 
            'keywords': 'parsers.keyword_parser',
            'breakthroughs': 'parsers.breakthrough_parser',
            'monsters': 'parsers.monster_parser',
            'monster-abilities': 'parsers.ability_parser',
        }
        
        parser_module = parser_map.get(data_type)
        if not parser_module:
            logger.error(f"No parser found for {data_type}")
            return False
            
        try:
            # Construct HTML directory path
            if data_type == 'monster-abilities':
                html_dir = f"scraped_html/{self.version}/monster-abilities"
            else:
                html_dir = f"scraped_html/{self.version}/{data_type}"
            
            # Build command with required arguments
            # Special case for race parser which doesn't take html_dir as positional arg
            if data_type == 'races':
                cmd = ['python', '-m', parser_module, '--version', self.actual_version]
            else:
                # Use actual_version for parsers to avoid symlink issues
                cmd = ['python', '-m', parser_module, html_dir, '--version', self.actual_version]
            
            # Add monster flag for monster abilities
            if data_type == 'monster-abilities':
                cmd.append('--monster')
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path.cwd())
            
            if result.returncode == 0:
                logger.info(f"✅ Successfully parsed {data_type}")
                return True
            else:
                logger.error(f"❌ Failed to parse {data_type}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error parsing {data_type}: {e}")
            return False
    
    def fetch_all(self) -> bool:
        """Fetch all data types."""
        logger.info(f"🚀 Starting fetch process for {len(self.data_types)} data types...")
        
        success_count = 0
        for data_type in self.data_types:
            if self.run_fetcher(data_type):
                success_count += 1
            else:
                logger.warning(f"Continuing despite {data_type} fetch failure...")
        
        logger.info(f"📊 Fetch complete: {success_count}/{len(self.data_types)} successful")
        return success_count == len(self.data_types)
    
    def parse_all(self) -> bool:
        """Parse all data types."""
        logger.info(f"🚀 Starting parse process for {len(self.data_types)} data types...")
        
        success_count = 0
        for data_type in self.data_types:
            if self.run_parser(data_type):
                success_count += 1
            else:
                logger.warning(f"Continuing despite {data_type} parse failure...")
        
        logger.info(f"📊 Parse complete: {success_count}/{len(self.data_types)} successful")
        return success_count == len(self.data_types)
    
    def update_google_sheets(self) -> bool:
        """Update Google Sheets with the latest parsed data."""
        if not self.update_sheets:
            logger.info("⏭️ Skipping Google Sheets update (disabled)")
            return True
            
        logger.info("📊 Updating Google Sheets with latest data...")
        
        try:
            # Run the export_to_sheets.py script
            cmd = ['python', 'export_to_sheets.py']
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path.cwd())
            
            if result.returncode == 0:
                logger.info("✅ Successfully updated Google Sheets")
                return True
            else:
                logger.error(f"❌ Failed to update Google Sheets: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error updating Google Sheets: {e}")
            return False
    
    def update_all(self) -> bool:
        """Run full fetch, parse, and Google Sheets update pipeline."""
        logger.info("🎯 Starting full data update pipeline...")
        
        fetch_success = self.fetch_all()
        if not fetch_success:
            logger.warning("⚠️ Some fetches failed, but continuing with parsing...")
        
        parse_success = self.parse_all()
        if not parse_success:
            logger.warning("⚠️ Some parsing failed, but continuing with Google Sheets update...")
        
        sheets_success = self.update_google_sheets()
        if not sheets_success:
            logger.warning("⚠️ Google Sheets update failed")
        
        if fetch_success and parse_success and sheets_success:
            logger.info("🎉 Full update pipeline completed successfully!")
            return True
        else:
            logger.warning("⚠️ Update pipeline completed with some failures")
            return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Update script for fetching and parsing the latest game data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python update_latest_data.py                    # Full update (fetch + parse + sheets)
  python update_latest_data.py --fetch-only       # Only fetch, don't parse or update sheets
  python update_latest_data.py --parse-only       # Only parse + update sheets
  python update_latest_data.py --no-sheets        # Fetch + parse, skip sheets update  
  python update_latest_data.py --data-types classes abilities  # Only specific types
  
Note: The race fetcher currently has issues with Angular content loading.
Until fixed, races will be fetched but may contain loading pages.
        """
    )
    
    parser.add_argument(
        '--fetch-only',
        action='store_true',
        help='Only run fetchers, skip parsing'
    )
    
    parser.add_argument(
        '--parse-only', 
        action='store_true',
        help='Only run parsers, skip fetching'
    )
    
    parser.add_argument(
        '--data-types',
        nargs='+',
        choices=DATA_TYPES,
        help='Specific data types to update (default: all)'
    )
    
    parser.add_argument(
        '--no-sheets',
        action='store_true',
        help='Skip Google Sheets update'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.fetch_only and args.parse_only:
        logger.error("Cannot specify both --fetch-only and --parse-only")
        sys.exit(1)
    
    try:
        updater = DataUpdater(data_types=args.data_types, update_sheets=not args.no_sheets)
        
        if args.fetch_only:
            success = updater.fetch_all()
        elif args.parse_only:
            success = updater.parse_all()
            # Also update sheets if parse-only and sheets not disabled
            if success and not args.no_sheets:
                sheets_success = updater.update_google_sheets()
                success = success and sheets_success
        else:
            success = updater.update_all()
        
        if success:
            logger.info("✨ All operations completed successfully!")
            sys.exit(0)
        else:
            logger.error("💥 Some operations failed")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("⛔ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"💥 Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()