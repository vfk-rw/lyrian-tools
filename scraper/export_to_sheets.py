#!/usr/bin/env python3
"""
Main script to export all parsed TTRPG data to Google Sheets.

This script creates a comprehensive Google Spreadsheet with multiple tabs
containing all the game data for easy browsing and sharing.
"""

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from exporters.sheets.classes_exporter import ClassesExporter
from exporters.sheets.abilities_exporter import AbilitiesExporter
from exporters.sheets.items_exporter import ItemsExporter
from exporters.sheets.generic_exporter import GenericExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main export function."""
    parser = argparse.ArgumentParser(
        description="Export parsed TTRPG data to Google Sheets"
    )
    parser.add_argument(
        "--version", 
        default="0.10.1",
        help="Game version to export (default: 0.10.1)"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON file"
    )
    parser.add_argument(
        "--title",
        default=None,
        help="Title for the spreadsheet (default: auto-generated)"
    )
    parser.add_argument(
        "--data-types",
        nargs="+",
        default=["all"],
        choices=["all", "classes", "abilities", "items", "races", "keywords", "breakthroughs", "monsters"],
        help="Data types to export (default: all)"
    )
    parser.add_argument(
        "--detailed",
        action="store_true",
        help="Export detailed breakdown sheets (e.g., abilities by type)"
    )
    parser.add_argument(
        "--public",
        action="store_true",
        default=True,
        help="Make the spreadsheet publicly viewable (default: True)"
    )
    parser.add_argument(
        "--private",
        action="store_true",
        help="Keep the spreadsheet private (overrides --public)"
    )
    
    args = parser.parse_args()
    
    # Determine if spreadsheet should be public
    make_public = args.public and not args.private
    
    # Generate default title if not provided
    if args.title is None:
        timestamp = datetime.now().strftime("%Y-%m-%d")
        args.title = f"Lyrian Chronicles Data Export - v{args.version} - {timestamp}"
    
    logger.info(f"Starting export with title: {args.title}")
    logger.info(f"Game version: {args.version}")
    logger.info(f"Data types: {args.data_types}")
    logger.info(f"Public access: {make_public}")
    
    try:
        # Create the main exporter (using ClassesExporter as base since they all inherit from BaseSheetsExporter)
        main_exporter = ClassesExporter(
            credentials_path=args.credentials,
            version=args.version
        )
        
        # Create the spreadsheet
        spreadsheet_id = main_exporter.create_spreadsheet(args.title, public=make_public)
        logger.info(f"Created spreadsheet with ID: {spreadsheet_id}")
        
        # Create summary sheet first
        main_exporter.create_summary_sheet()
        
        # Initialize all exporters with the same spreadsheet
        exporters = {
            'classes': ClassesExporter(args.credentials, args.version),
            'abilities': AbilitiesExporter(args.credentials, args.version),
            'items': ItemsExporter(args.credentials, args.version),
            'generic': GenericExporter(args.credentials, args.version)
        }
        
        # Set the spreadsheet ID for all exporters
        for exporter in exporters.values():
            exporter.spreadsheet_id = spreadsheet_id
        
        # Export data based on selected types
        if "all" in args.data_types:
            export_all_data(exporters, args.detailed)
        else:
            export_selected_data(exporters, args.data_types, args.detailed)
        
        logger.info("Export completed successfully!")
        logger.info(f"Spreadsheet URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
        print(f"\n✅ Export completed!")
        print(f"📊 Spreadsheet URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
        
        if make_public:
            print(f"\n💡 Note: If the spreadsheet remains private, you may need to enable the Google Drive API")
            print(f"   at: https://console.developers.google.com/apis/api/drive.googleapis.com/overview")
        
    except Exception as e:
        logger.error(f"Export failed: {e}", exc_info=True)
        print(f"\n❌ Export failed: {e}")
        sys.exit(1)


def export_all_data(exporters, detailed=False):
    """Export all data types."""
    logger.info("Exporting all data types...")
    
    # Classes
    logger.info("Exporting classes...")
    exporters['classes'].export_data_type("classes", "Classes")
    if detailed:
        exporters['classes'].export_class_abilities()
    
    # Abilities
    logger.info("Exporting abilities...")
    exporters['abilities'].export_data_type("abilities", "All Abilities")
    if detailed:
        exporters['abilities'].export_abilities_by_type()
    
    # Items
    logger.info("Exporting items...")
    exporters['items'].export_data_type("items", "All Items")
    if detailed:
        exporters['items'].export_items_by_type()
    
    # Other data types
    logger.info("Exporting other data types...")
    exporters['generic'].export_all_generic_sheets()


def export_selected_data(exporters, data_types, detailed=False):
    """Export only selected data types."""
    logger.info(f"Exporting selected data types: {data_types}")
    
    for data_type in data_types:
        if data_type == "classes":
            exporters['classes'].export_data_type("classes", "Classes")
            if detailed:
                exporters['classes'].export_class_abilities()
        
        elif data_type == "abilities":
            exporters['abilities'].export_data_type("abilities", "All Abilities")
            if detailed:
                exporters['abilities'].export_abilities_by_type()
        
        elif data_type == "items":
            exporters['items'].export_data_type("items", "All Items")
            if detailed:
                exporters['items'].export_items_by_type()
        
        elif data_type == "races":
            exporters['generic'].export_races()
        
        elif data_type == "keywords":
            exporters['generic'].export_keywords()
        
        elif data_type == "breakthroughs":
            exporters['generic'].export_breakthroughs()
        
        elif data_type == "monsters":
            exporters['generic'].export_monsters()
            exporters['generic'].export_monster_abilities()


if __name__ == "__main__":
    main()