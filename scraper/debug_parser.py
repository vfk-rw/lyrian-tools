#!/usr/bin/env python3
"""
Debug script to check parser issues.
"""
import sys
from pathlib import Path
from bs4 import BeautifulSoup

# Add scraper directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from parsers.class_parser import ClassParser

def debug_parse():
    """Debug the parsing issue."""
    # Check if HTML files exist
    html_dir = Path("scraped_html/latest/classes")
    if not html_dir.exists():
        print("No HTML files found. Run the fetcher first.")
        return
    
    html_files = list(html_dir.glob("*.html"))
    if not html_files:
        print("No HTML files found in directory.")
        return
    
    # Try to parse the first file manually
    first_file = html_files[0]
    print(f"Debugging file: {first_file}")
    
    # Read HTML
    with open(first_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    print(f"HTML content length: {len(html_content)}")
    
    # Create BeautifulSoup object
    soup = BeautifulSoup(html_content, 'html.parser')
    print(f"Soup object type: {type(soup)}")
    
    # Test a simple selection
    title = soup.find('title')
    print(f"Page title: {title.text if title else 'Not found'}")
    
    # Try the problematic selector
    try:
        heading = soup.select_one('h2')
        print(f"Found h2: {heading.text if heading else 'Not found'}")
    except Exception as e:
        print(f"Error with h2 selector: {e}")
    
    # Try parsing with the parser
    parser = ClassParser(output_dir="debug_output")
    try:
        result = parser.parse_detail(soup, {})
        print(f"Parse result type: {type(result)}")
        if result:
            print("✓ Parsing succeeded")
        else:
            print("✗ Parsing returned None")
    except Exception as e:
        print(f"✗ Parsing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_parse()