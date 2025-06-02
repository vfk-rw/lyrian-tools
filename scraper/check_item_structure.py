#!/usr/bin/env python3
"""Check the structure of fetched item HTML files."""

from bs4 import BeautifulSoup
import glob
import os

def check_item_html(file_path):
    """Check if an item HTML file has the expected structure."""
    with open(file_path, 'r') as f:
        content = f.read()
        
    # Quick checks
    has_loading = "Loading:" in content
    has_app_item = "app-item-detail" in content
    
    # Parse with BeautifulSoup
    soup = BeautifulSoup(content, 'html.parser')
    
    # Look for item name
    h2_elem = soup.find('h2')
    item_name = h2_elem.text.strip() if h2_elem else "No H2"
    
    # Look for property structure
    properties = {}
    
    # Try different selectors for properties
    prop_divs = soup.select('div.d-flex.justify-content-between')
    for div in prop_divs:
        spans = div.find_all('span')
        if len(spans) >= 2:
            label = spans[0].text.strip().rstrip(':')
            value = spans[1].text.strip()
            properties[label] = value
    
    return {
        'file': os.path.basename(file_path),
        'has_loading': has_loading,
        'has_app_item': has_app_item,
        'item_name': item_name,
        'properties': properties,
        'file_size': len(content)
    }

def main():
    # Get all HTML files
    files = glob.glob('scraped_html/latest/items/*.html')
    files = [f for f in files if not f.endswith('_list_page.html')]
    
    print(f"Checking {len(files)} item HTML files...\n")
    
    # Check a few files
    types_found = set()
    subtypes_found = set()
    properly_loaded = 0
    
    for file_path in files[:10]:  # Check first 10
        result = check_item_html(file_path)
        
        if result['has_loading']:
            print(f"❌ {result['file']}: Still showing loading page")
        elif result['properties']:
            properly_loaded += 1
            print(f"✓ {result['file']}: {result['item_name']}")
            if 'Type' in result['properties']:
                types_found.add(result['properties']['Type'])
                print(f"  Type: {result['properties']['Type']}")
            if 'Sub type' in result['properties']:
                subtypes_found.add(result['properties']['Sub type'])
                print(f"  Sub type: {result['properties']['Sub type']}")
        else:
            print(f"? {result['file']}: No properties found")
    
    print(f"\nProperly loaded: {properly_loaded}/{min(10, len(files))}")
    print(f"Types found: {sorted(types_found)}")
    print(f"Subtypes found: {sorted(subtypes_found)}")

if __name__ == "__main__":
    main()