#!/usr/bin/env python3
"""
Script to scrape all classes from the Lyrian Chronicles website.
"""
import logging
import sys
from pathlib import Path

# Add scraper directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fetchers.class_fetcher import ClassFetcher
from parsers.class_parser import ClassParser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Scrape all classes and parse them."""
    logger.info("Starting full class scraping process...")
    
    # Step 1: Fetch all class HTML pages
    logger.info("\n=== Step 1: Fetching all class HTML pages ===")
    fetcher = ClassFetcher(version="latest")
    
    try:
        # Fetch all classes (no limit)
        results = fetcher.fetch_all()
        logger.info(f"✓ Successfully fetched {len(results)} class pages")
    except Exception as e:
        logger.error(f"✗ Error during fetching: {e}")
        raise
    finally:
        fetcher.cleanup()
    
    # Step 2: Parse all HTML files to YAML
    logger.info("\n=== Step 2: Parsing all HTML files to YAML ===")
    parser = ClassParser(output_dir="parsed_data")
    
    # Parse the fetched HTML files
    html_dir = Path("scraped_html/latest/classes")
    if html_dir.exists():
        parsed_results = parser.parse_directory(str(html_dir), output_format='yaml')
        logger.info(f"✓ Successfully parsed {len(parsed_results)} class files to YAML")
        
        # Also create JSON versions
        logger.info("\n=== Step 3: Creating JSON versions ===")
        json_results = parser.parse_directory(str(html_dir), output_format='json')
        logger.info(f"✓ Successfully created {len(json_results)} JSON files")
        
        # Summary
        logger.info(f"\n=== Summary ===")
        logger.info(f"HTML files fetched: {len(results)}")
        logger.info(f"YAML files created: {len(parsed_results)}")
        logger.info(f"JSON files created: {len(json_results)}")
        logger.info(f"HTML directory: scraped_html/latest/classes/")
        logger.info(f"YAML output: parsed_data/classes/")
        
        # List a few examples
        yaml_files = list(Path("parsed_data/classes").glob("*.yaml"))
        if yaml_files:
            logger.info(f"\nExample files created:")
            for i, file in enumerate(yaml_files[:5]):
                logger.info(f"  - {file.name}")
            if len(yaml_files) > 5:
                logger.info(f"  ... and {len(yaml_files) - 5} more")
    else:
        logger.error(f"✗ HTML directory not found: {html_dir}")
    
    logger.info("\n✓ Full class scraping completed successfully!")


if __name__ == "__main__":
    main()