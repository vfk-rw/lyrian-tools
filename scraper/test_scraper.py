#!/usr/bin/env python3
"""
Test script for the modular scraper architecture.
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


def test_class_scraper():
    """Test the class fetcher and parser."""
    logger.info("Testing class scraper...")
    
    # Test fetching
    logger.info("\n=== Testing ClassFetcher ===")
    fetcher = ClassFetcher(version="latest")
    
    try:
        # Fetch just a few classes for testing
        fetcher.fetch_all(limit=2)
        logger.info("✓ Class fetching completed successfully")
    except Exception as e:
        logger.error(f"✗ Error during fetching: {e}")
        raise
    finally:
        fetcher.cleanup()
    
    # Test parsing
    logger.info("\n=== Testing ClassParser ===")
    parser = ClassParser(output_dir="test_output")
    
    # Parse the fetched HTML files
    html_dir = Path(f"scraped_html/latest/classes")
    if html_dir.exists():
        parser.parse_directory(str(html_dir), output_format='yaml')
        logger.info("✓ Class parsing completed successfully")
        
        # Check if files were created - they'll be in the parser's output directory
        output_dir = Path("test_output/classes")  # The parser adds the data type
        parsed_files = list(output_dir.glob("*.yaml"))
        if parsed_files:
            logger.info(f"✓ Created {len(parsed_files)} YAML files")
            
            # Display first parsed file as example
            with open(parsed_files[0], 'r') as f:
                logger.info(f"\nExample output ({parsed_files[0].name}):")
                logger.info("-" * 50)
                content = f.read()
                # Show first 500 characters
                logger.info(content[:500] + "..." if len(content) > 500 else content)
        else:
            logger.warning("✗ No YAML files were created")
    else:
        logger.error(f"✗ HTML directory not found: {html_dir}")


def main():
    """Run all tests."""
    logger.info("Starting scraper tests...")
    
    try:
        test_class_scraper()
        logger.info("\n✓ All tests completed successfully!")
    except Exception as e:
        logger.error(f"\n✗ Tests failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()