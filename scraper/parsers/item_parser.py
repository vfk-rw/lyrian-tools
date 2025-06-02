#!/usr/bin/env python3
"""
Item Parser - Parses item HTML pages into structured YAML data.

Based on analysis of actual item HTML structure, items have a consistent
format with property fields and description content.
"""

import re
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import sanitize_id, clean_text
from schemas.item_schema import Item, ItemsIndex

logger = logging.getLogger(__name__)


class ItemParser(BaseParser):
    """Parses item HTML files into structured data."""
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles."""
        return "items"
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse an item detail page into structured data."""
        if not metadata:
            metadata = {}
        
        # Extract item ID and name  
        item_name = self._extract_item_name(soup)
        item_id = metadata.get('id', sanitize_id(item_name))
        
        # Extract all property fields
        properties = self._extract_properties(soup)
        
        # Extract description content
        description = self._extract_description(soup)
        
        # Extract image URL
        image_url = self._extract_image_url(soup)
        
        # Build item data structure
        item_data = {
            'id': item_id,
            'name': item_name,
            'type': properties.get('type') or '',
            'sub_type': properties.get('sub_type') or '',
            'cost': properties.get('cost') or '',
            'activation_cost': properties.get('activation_cost'),
            'burden': properties.get('burden') or '',
            'description': description,
            'version': self.version
        }
        
        # Add optional fields if present
        if 'shell_size' in properties:
            item_data['shell_size'] = properties['shell_size']
        if 'fuel_usage' in properties:
            item_data['fuel_usage'] = properties['fuel_usage']
        if 'crafting_points' in properties and properties['crafting_points'] is not None:
            try:
                item_data['crafting_points'] = int(properties['crafting_points'])
            except (ValueError, TypeError):
                logger.warning(f"Invalid crafting_points value: {properties['crafting_points']}")
        if 'crafting_type' in properties:
            item_data['crafting_type'] = properties['crafting_type']
        if image_url:
            item_data['image_url'] = image_url
            
        return item_data
    
    def _extract_item_name(self, soup: BeautifulSoup) -> str:
        """Extract item name from the page."""
        # Item name is in the h2 element
        name_elem = soup.select_one('h2')
        if name_elem:
            return clean_text(name_elem.get_text())
        
        # Fallback to page title
        title_elem = soup.select_one('title')
        if title_elem:
            title = title_elem.get_text()
            # Extract item name from title like "Classes/Item Name | ..."
            if '/' in title:
                return clean_text(title.split('/')[1].split('|')[0])
        
        return "Unknown Item"
    
    def _extract_properties(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract all property fields from the item detail section."""
        properties = {}
        
        # Find all label elements followed by spans
        for label in soup.select('label'):
            label_text = clean_text(label.get_text()).rstrip(':')
            
            # Find the corresponding value span
            value_span = label.find_next_sibling('span', class_='item')
            if value_span:
                # Get the inner span text
                inner_span = value_span.select_one('span.item')
                if inner_span:
                    value = clean_text(inner_span.get_text())
                else:
                    value = clean_text(value_span.get_text())
                
                # Convert dashes to None for consistency
                if value == '-' or value == '':
                    value = None
                
                # Map to standard field names
                field_name = self._normalize_field_name(label_text)
                if field_name:
                    properties[field_name] = value
        
        return properties
    
    def _normalize_field_name(self, label_text: str) -> Optional[str]:
        """Normalize label text to standard field names."""
        field_mapping = {
            'type': 'type',
            'sub type': 'sub_type',
            'cost': 'cost',
            'activation cost': 'activation_cost',
            'burden': 'burden',
            'shell size': 'shell_size',
            'fuel usage': 'fuel_usage',
            'crafting points': 'crafting_points',
            'crafting type': 'crafting_type'
        }
        
        normalized = label_text.lower()
        return field_mapping.get(normalized)
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract description content from the mat-card."""
        # Find the Description card
        desc_card = soup.select_one('mat-card')
        if not desc_card:
            return ""
        
        # Check if this is the description card
        title_elem = desc_card.select_one('mat-card-title')
        if not title_elem or 'Description:' not in title_elem.get_text():
            return ""
        
        # Extract content from mat-card-content
        content_elem = desc_card.select_one('mat-card-content')
        if not content_elem:
            return ""
        
        # Get the linkify div content and clean it
        linkify_div = content_elem.select_one('div[linkify]')
        if linkify_div:
            # Extract clean text content, preserving structure but removing HTML tags
            return clean_text(linkify_div.get_text())
        
        return clean_text(content_elem.get_text())
    
    def _extract_image_url(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract item image URL."""
        img_elem = soup.select_one('img.image')
        if img_elem:
            return img_elem.get('src')
        return None
    
    def create_items_index(self, all_items: List[Dict[str, Any]]) -> ItemsIndex:
        """Create an index of all items with statistics."""
        # Count by type and subtype
        type_counts = {}
        subtype_counts = {}
        
        for item in all_items:
            item_type = item.get('type', 'Unknown')
            item_subtype = item.get('sub_type', 'Unknown')
            
            type_counts[item_type] = type_counts.get(item_type, 0) + 1
            subtype_key = f"{item_type}/{item_subtype}"
            subtype_counts[subtype_key] = subtype_counts.get(subtype_key, 0) + 1
        
        # Create items list with basic info
        items_list = []
        for item in all_items:
            items_list.append({
                'id': item.get('id', ''),
                'name': item.get('name', ''),
                'type': item.get('type', ''),
                'sub_type': item.get('sub_type', ''),
                'cost': item.get('cost', '')
            })
        
        return ItemsIndex(
            total_count=len(all_items),
            version=self.version,
            generated_at=datetime.now().isoformat(),
            by_type=type_counts,
            by_subtype=subtype_counts,
            items=items_list
        )
    
    def parse_and_save_all(self, input_dir: str) -> Dict[str, Any]:
        """Parse all items and save to organized structure."""
        logger.info(f"Starting item parsing for version {self.version}")
        
        # Get input directory
        input_path = Path(input_dir)
        if not input_path.exists():
            raise FileNotFoundError(f"Input directory not found: {input_path}")
        
        # Output directory is already created by BaseParser
        output_dir = self.output_dir
        
        # Find all HTML files
        html_files = list(input_path.glob("*.html"))
        if not html_files:
            logger.warning(f"No HTML files found in {input_path}")
            return {"parsed_count": 0, "items": []}
        
        # Exclude list page
        html_files = [f for f in html_files if f.name != "_list_page.html"]
        
        logger.info(f"Found {len(html_files)} item HTML files")
        
        all_items = []
        failed_items = []
        
        for html_file in html_files:
            try:
                # Load metadata if available
                meta_file = html_file.with_suffix('.meta.json')
                metadata = {}
                if meta_file.exists():
                    with open(meta_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                
                # Parse the HTML
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                soup = BeautifulSoup(html_content, 'html.parser')
                item_data = self.parse_detail(soup, metadata)
                
                # Validate with Pydantic
                item = Item(**item_data)
                all_items.append(item.model_dump())
                
                # Save individual item file
                self.to_yaml(item.model_dump(), item.id)
                
                logger.debug(f"Parsed item: {item.name}")
                
            except Exception as e:
                logger.error(f"Failed to parse {html_file.name}: {e}")
                failed_items.append(html_file.name)
        
        # Create and save index
        if all_items:
            items_index = self.create_items_index(all_items)
            index_path = self.to_yaml(items_index.model_dump(), "items_index")
            logger.info(f"Saved items index to {index_path}")
        
        # Log results
        logger.info(f"Successfully parsed {len(all_items)} items")
        if failed_items:
            logger.warning(f"Failed to parse {len(failed_items)} items: {failed_items}")
        
        return {
            "parsed_count": len(all_items),
            "failed_count": len(failed_items),
            "items": all_items,
            "failed_items": failed_items
        }


def main():
    """Command-line interface for the item parser."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Parse Lyrian Chronicles items")
    parser.add_argument(
        "input_dir",
        help="Directory containing item HTML files"
    )
    parser.add_argument(
        "--version",
        default="0.10.1", 
        help="Game version (default: 0.10.1)"
    )
    parser.add_argument(
        "--output-dir",
        default="parsed_data",
        help="Output directory for parsed files"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Set logging level"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the parser
    item_parser = ItemParser(
        version=args.version,
        output_dir=args.output_dir
    )
    
    results = item_parser.parse_and_save_all(args.input_dir)
    
    print(f"Parsing complete!")
    print(f"Successfully parsed: {results['parsed_count']} items")
    if results['failed_count'] > 0:
        print(f"Failed to parse: {results['failed_count']} items")


if __name__ == "__main__":
    main()