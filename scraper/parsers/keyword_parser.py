#!/usr/bin/env python3
"""
Keyword Parser - Parses keyword HTML into structured YAML format.
"""
import re
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import sanitize_id

logger = logging.getLogger(__name__)


class KeywordParser(BaseParser):
    """Parser for Lyrian Chronicles keyword data."""
    
    def __init__(self, version: str = "0.10.1", output_base_dir: str = "parsed_data"):
        """Initialize the keyword parser.
        
        Args:
            version: The game version being parsed
            output_base_dir: Base directory for output
        """
        self.data_type = "keywords"
        super().__init__(output_dir=output_base_dir, version=version)
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles."""
        return self.data_type
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse a detail page into structured data.
        
        For keywords, this delegates to parse_file since all keywords are on one page.
        
        Args:
            soup: BeautifulSoup object of the detail page
            metadata: Optional metadata from the fetcher
            
        Returns:
            Parsed data dictionary
        """
        # Keywords are all on one page, so we parse all of them
        panels = soup.select('mat-expansion-panel')
        keywords = []
        
        for panel in panels:
            keyword_data = self.parse_keyword(panel)
            if keyword_data:
                keywords.append(keyword_data)
        
        return {'keywords': keywords}
    
    def parse_keyword_type(self, name: str, description: str) -> str:
        """Determine the keyword type based on name and description patterns.
        
        Args:
            name: The keyword name
            description: The keyword description
            
        Returns:
            The keyword type (timing, combat, magic, etc.)
        """
        name_lower = name.lower()
        desc_lower = description.lower()
        
        # Timing keywords
        if any(word in name_lower for word in ['rapid', 'counter', 'start', 'end', 'turn']):
            return "timing"
        
        # Magic/Element keywords
        if any(word in name_lower for word in ['fire', 'water', 'earth', 'air', 'frost', 'lightning', 'holy', 'dark', 'arcane']):
            return "element"
        
        # Status effects
        if any(word in name_lower for word in ['burning', 'bleeding', 'stunned', 'frozen', 'poisoned', 'cursed']):
            return "status"
        
        # Combat mechanics
        if any(word in name_lower for word in ['strike', 'attack', 'defend', 'shield', 'parry']):
            return "combat"
        
        # Weapon types
        if any(word in name_lower for word in ['blade', 'sword', 'axe', 'bow', 'spear', 'staff']):
            return "weapon"
        
        # Movement
        if any(word in name_lower for word in ['teleport', 'flight', 'move', 'speed']):
            return "movement"
        
        # Spell types
        if 'spell' in name_lower:
            return "spell"
        
        # Check description for clues
        if 'at the start of' in desc_lower or 'at the end of' in desc_lower:
            return "timing"
        if 'damage' in desc_lower:
            return "combat"
        if 'resist' in desc_lower or 'immunity' in desc_lower:
            return "defense"
        
        # Default
        return "general"
    
    def extract_variable_from_description(self, description: str) -> Optional[str]:
        """Extract variable (X) explanation from description if present.
        
        Args:
            description: The keyword description
            
        Returns:
            The variable explanation or None
        """
        # Look for patterns like "X damage" or "X equals"
        if 'X' in description:
            # Try to find explanation of what X represents
            patterns = [
                r'X equals? ([^.]+)',
                r'X is ([^.]+)',
                r'where X ([^.]+)',
                r'X = ([^.]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, description, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
            
            # If no explicit explanation, note that X is used
            return "Variable value (context-dependent)"
        
        return None
    
    def parse_keyword(self, panel_element) -> Optional[Dict[str, Any]]:
        """Parse a single keyword from an expansion panel.
        
        Args:
            panel_element: BeautifulSoup element for the mat-expansion-panel
            
        Returns:
            Dictionary containing keyword data or None if parsing fails
        """
        try:
            # Extract keyword name from the panel title
            title_elem = panel_element.select_one('mat-panel-title span.fw-bold')
            if not title_elem:
                logger.warning("No title element found in keyword panel")
                return None
            
            # Remove the bullet point (○) if present
            name = title_elem.get_text(strip=True)
            name = re.sub(r'^[○•]\s*', '', name).strip()
            
            if not name:
                logger.warning("Empty keyword name")
                return None
            
            # Extract description from the expanded content
            desc_elem = panel_element.select_one('div[linkify].description')
            if not desc_elem:
                # Try alternative selector
                desc_elem = panel_element.select_one('.mat-expansion-panel-body')
            
            description = ""
            if desc_elem:
                description = desc_elem.get_text(strip=True, separator="\n")
            
            # Generate ID
            keyword_id = sanitize_id(name)
            
            # Determine keyword type
            keyword_type = self.parse_keyword_type(name, description)
            
            # Build keyword data
            keyword_data = {
                'name': name,
                'id': keyword_id,
                'type': keyword_type,
                'description': description
            }
            
            # Check for variable usage
            variable_info = self.extract_variable_from_description(description)
            if variable_info:
                keyword_data['variable_info'] = variable_info
            
            # Look for related keywords mentioned in description
            related = []
            # Common patterns: "like Rapid", "similar to Counter", "see also Shield"
            related_patterns = [
                r'like (\w+)',
                r'similar to (\w+)',
                r'see also (\w+)',
                r'as per (\w+)',
            ]
            
            for pattern in related_patterns:
                matches = re.findall(pattern, description, re.IGNORECASE)
                related.extend(matches)
            
            if related:
                keyword_data['related_keywords'] = list(set(related))  # Remove duplicates
            
            return keyword_data
            
        except Exception as e:
            logger.error(f"Error parsing keyword panel: {e}")
            return None
    
    def parse_file(self, html_path: Path) -> List[Dict[str, Any]]:
        """Parse the keywords HTML file.
        
        Args:
            html_path: Path to the HTML file
            
        Returns:
            List of keyword dictionaries
        """
        logger.info(f"Parsing keywords from {html_path}")
        
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
            
            # Find all expansion panels
            panels = soup.select('mat-expansion-panel')
            logger.info(f"Found {len(panels)} keyword panels")
            
            keywords = []
            for i, panel in enumerate(panels):
                keyword_data = self.parse_keyword(panel)
                if keyword_data:
                    keywords.append(keyword_data)
                else:
                    logger.warning(f"Failed to parse keyword panel {i+1}")
            
            logger.info(f"Successfully parsed {len(keywords)} keywords")
            return keywords
            
        except Exception as e:
            logger.error(f"Error parsing keywords file: {e}")
            return []
    
    def parse_and_save_all(self, input_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Parse all keywords and save to individual YAML files.
        
        Args:
            input_dir: Directory containing HTML files (defaults to scraped_html/{version}/keywords)
            
        Returns:
            Summary statistics of parsing results
        """
        if input_dir is None:
            input_dir = Path("scraped_html") / self.version / self.data_type
        
        keywords_html = input_dir / "keywords.html"
        
        if not keywords_html.exists():
            logger.error(f"Keywords HTML file not found: {keywords_html}")
            return {'error': 'Keywords HTML file not found'}
        
        # Parse keywords
        keywords = self.parse_file(keywords_html)
        
        if not keywords:
            logger.error("No keywords parsed")
            return {'error': 'No keywords parsed'}
        
        # Save individual keyword files
        saved_count = 0
        for keyword in keywords:
            keyword_id = keyword['id']
            output_path = self.output_dir / f"{keyword_id}.yaml"
            
            try:
                self.to_yaml(keyword, keyword_id)
                saved_count += 1
            except Exception as e:
                logger.error(f"Error saving keyword {keyword_id}: {e}")
        
        # Create index file
        index_data = self.create_keywords_index(keywords)
        self.to_yaml(index_data, "keywords_index")
        
        logger.info(f"Saved {saved_count} keyword files and index to {self.output_dir}")
        
        return {
            'total_keywords': len(keywords),
            'saved_keywords': saved_count,
            'by_type': index_data['by_type'],
            'output_dir': str(self.output_dir)
        }
    
    def create_keywords_index(self, keywords: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create an index file summarizing all keywords.
        
        Args:
            keywords: List of parsed keyword dictionaries
            
        Returns:
            Index data dictionary
        """
        # Count by type
        type_counts = {}
        for keyword in keywords:
            kw_type = keyword.get('type', 'general')
            type_counts[kw_type] = type_counts.get(kw_type, 0) + 1
        
        # Sort keywords alphabetically
        sorted_keywords = sorted(keywords, key=lambda k: k['name'])
        
        # Create index entries
        index_entries = []
        for kw in sorted_keywords:
            entry = {
                'id': kw['id'],
                'name': kw['name'],
                'type': kw.get('type', 'general')
            }
            if 'variable_info' in kw:
                entry['has_variable'] = True
            index_entries.append(entry)
        
        import datetime
        
        index_data = {
            'total_count': len(keywords),
            'version': self.version,
            'generated_at': datetime.datetime.now().isoformat(),
            'by_type': type_counts,
            'keywords': index_entries
        }
        
        return index_data


def main():
    """Command-line interface for the keyword parser."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Parse keyword data from Lyrian Chronicles')
    parser.add_argument('input_dir', nargs='?', help='Input directory containing HTML files')
    parser.add_argument('--version', default='0.10.1', help='Game version being parsed')
    parser.add_argument('--output-dir', default='parsed_data', help='Output directory base')
    parser.add_argument('--format', choices=['yaml', 'json'], default='yaml', help='Output format')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    
    # Create parser
    keyword_parser = KeywordParser(version=args.version, output_base_dir=args.output_dir)
    
    # Parse input directory
    input_path = Path(args.input_dir) if args.input_dir else None
    
    # Parse and save all keywords
    results = keyword_parser.parse_and_save_all(input_path)
    
    # Print results
    if 'error' in results:
        logger.error(f"Parsing failed: {results['error']}")
    else:
        logger.info(f"Successfully parsed {results['total_keywords']} keywords")
        logger.info(f"Saved {results['saved_keywords']} keyword files")
        logger.info("Keywords by type:")
        for kw_type, count in results['by_type'].items():
            logger.info(f"  {kw_type}: {count}")
        logger.info(f"Output directory: {results['output_dir']}")


if __name__ == "__main__":
    main()