#!/usr/bin/env python3
"""
Breakthrough Parser - Parses breakthrough HTML into structured YAML format.
"""
import re
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import sanitize_id

logger = logging.getLogger(__name__)


class BreakthroughParser(BaseParser):
    """Parser for Lyrian Chronicles breakthrough data."""
    
    def __init__(self, version: str = "0.10.1", output_base_dir: str = "parsed_data"):
        """Initialize the breakthrough parser.
        
        Args:
            version: The game version being parsed
            output_base_dir: Base directory for output
        """
        self.data_type = "breakthroughs"
        super().__init__(output_dir=output_base_dir, version=version)
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles."""
        return self.data_type
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse a detail page into structured data.
        
        For breakthroughs, this delegates to parse_file since all breakthroughs are on one page.
        
        Args:
            soup: BeautifulSoup object of the detail page
            metadata: Optional metadata from the fetcher
            
        Returns:
            Parsed data dictionary
        """
        # Breakthroughs are all on one page, so we parse all of them
        panels = soup.select('mat-expansion-panel')
        breakthroughs = []
        
        for panel in panels:
            breakthrough_data = self.parse_breakthrough(panel)
            if breakthrough_data:
                breakthroughs.append(breakthrough_data)
        
        return {'breakthroughs': breakthroughs}
    
    def parse_cost(self, cost_text: str) -> Union[int, str]:
        """Parse cost value from text.
        
        Args:
            cost_text: The cost text (e.g., "300", "Variable", "X")
            
        Returns:
            Integer cost or string for variable costs
        """
        if not cost_text:
            return None
            
        # Clean the text
        cost_text = cost_text.strip()
        
        # Check for variable costs
        if cost_text.lower() in ['variable', 'x', 'varies']:
            return "variable"
        
        # Try to extract numeric value
        try:
            # Extract first number from text
            match = re.search(r'\d+', cost_text)
            if match:
                return int(match.group())
        except:
            pass
        
        # Return as string if can't parse
        return cost_text
    
    def parse_requirements(self, req_text: str) -> List[str]:
        """Parse requirements into a list.
        
        Args:
            req_text: The requirements text
            
        Returns:
            List of requirement strings
        """
        if not req_text or req_text.strip() in ['-', '--', 'None']:
            return []
        
        # Split by common separators
        requirements = []
        
        # Check if it's a multi-line requirement
        if '\n' in req_text:
            requirements = [r.strip() for r in req_text.split('\n') if r.strip()]
        # Check for semicolon separation
        elif ';' in req_text:
            requirements = [r.strip() for r in req_text.split(';') if r.strip()]
        # Check for "and" separation
        elif ' and ' in req_text.lower():
            requirements = [r.strip() for r in re.split(r'\s+and\s+', req_text, flags=re.IGNORECASE) if r.strip()]
        else:
            # Single requirement
            requirements = [req_text.strip()]
        
        # Clean up requirements
        cleaned = []
        for req in requirements:
            # Remove trailing periods
            req = req.rstrip('.')
            # Skip empty requirements
            if req and req not in ['-', '--', 'None']:
                cleaned.append(req)
        
        return cleaned
    
    def parse_breakthrough(self, panel_element) -> Optional[Dict[str, Any]]:
        """Parse a single breakthrough from an expansion panel.
        
        Args:
            panel_element: BeautifulSoup element for the mat-expansion-panel
            
        Returns:
            Dictionary containing breakthrough data or None if parsing fails
        """
        try:
            # Extract breakthrough name from the panel title
            title_elem = panel_element.select_one('mat-panel-title span.fw-bold')
            if not title_elem:
                logger.warning("No title element found in breakthrough panel")
                return None
            
            # Remove the bullet point (○) if present
            name = title_elem.get_text(strip=True)
            name = re.sub(r'^[○•]\s*', '', name).strip()
            
            if not name:
                logger.warning("Empty breakthrough name")
                return None
            
            # Generate ID
            breakthrough_id = sanitize_id(name)
            
            # Initialize breakthrough data
            breakthrough_data = {
                'name': name,
                'id': breakthrough_id,
                'cost': None,
                'requirements': [],
                'description': ""
            }
            
            # Find the app-breakthrough component
            app_breakthrough = panel_element.select_one('app-breakthrough')
            if not app_breakthrough:
                logger.warning(f"No app-breakthrough component found for {name}")
                return breakthrough_data
            
            # Extract cost and requirements from the structured list
            info_items = app_breakthrough.select('ul li')
            for item in info_items:
                title_div = item.select_one('div.title')
                value_div = item.select_one('div.flex-fill')
                
                if title_div and value_div:
                    title = title_div.get_text(strip=True)
                    value = value_div.get_text(strip=True)
                    
                    if title == "Cost":
                        breakthrough_data['cost'] = self.parse_cost(value)
                    elif title == "Requirements":
                        breakthrough_data['requirements'] = self.parse_requirements(value)
            
            # Extract description
            desc_elem = app_breakthrough.select_one('div[linkify].description')
            if desc_elem:
                # Get text with proper paragraph separation
                paragraphs = desc_elem.find_all('p')
                if paragraphs:
                    description_parts = []
                    for p in paragraphs:
                        p_text = p.get_text(strip=True)
                        if p_text:
                            description_parts.append(p_text)
                    breakthrough_data['description'] = '\n\n'.join(description_parts)
                else:
                    # Fallback to direct text
                    breakthrough_data['description'] = desc_elem.get_text(strip=True, separator="\n")
            
            return breakthrough_data
            
        except Exception as e:
            logger.error(f"Error parsing breakthrough panel: {e}")
            return None
    
    def parse_file(self, html_path: Path) -> List[Dict[str, Any]]:
        """Parse the breakthroughs HTML file.
        
        Args:
            html_path: Path to the HTML file
            
        Returns:
            List of breakthrough dictionaries
        """
        logger.info(f"Parsing breakthroughs from {html_path}")
        
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
            
            # Find all expansion panels
            panels = soup.select('mat-expansion-panel')
            logger.info(f"Found {len(panels)} breakthrough panels")
            
            breakthroughs = []
            for i, panel in enumerate(panels):
                breakthrough_data = self.parse_breakthrough(panel)
                if breakthrough_data:
                    breakthroughs.append(breakthrough_data)
                else:
                    logger.warning(f"Failed to parse breakthrough panel {i+1}")
            
            logger.info(f"Successfully parsed {len(breakthroughs)} breakthroughs")
            return breakthroughs
            
        except Exception as e:
            logger.error(f"Error parsing breakthroughs file: {e}")
            return []
    
    def parse_and_save_all(self, input_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Parse all breakthroughs and save to individual YAML files.
        
        Args:
            input_dir: Directory containing HTML files (defaults to scraped_html/{version}/breakthroughs)
            
        Returns:
            Summary statistics of parsing results
        """
        if input_dir is None:
            input_dir = Path("scraped_html") / self.version / self.data_type
        
        breakthroughs_html = input_dir / "breakthroughs.html"
        
        if not breakthroughs_html.exists():
            logger.error(f"Breakthroughs HTML file not found: {breakthroughs_html}")
            return {'error': 'Breakthroughs HTML file not found'}
        
        # Parse breakthroughs
        breakthroughs = self.parse_file(breakthroughs_html)
        
        if not breakthroughs:
            logger.error("No breakthroughs parsed")
            return {'error': 'No breakthroughs parsed'}
        
        # Save individual breakthrough files
        saved_count = 0
        for breakthrough in breakthroughs:
            breakthrough_id = breakthrough['id']
            
            try:
                self.to_yaml(breakthrough, breakthrough_id)
                saved_count += 1
            except Exception as e:
                logger.error(f"Error saving breakthrough {breakthrough_id}: {e}")
        
        # Create index file
        index_data = self.create_breakthroughs_index(breakthroughs)
        self.to_yaml(index_data, "breakthroughs_index")
        
        logger.info(f"Saved {saved_count} breakthrough files and index to {self.output_dir}")
        
        return {
            'total_breakthroughs': len(breakthroughs),
            'saved_breakthroughs': saved_count,
            'cost_types': index_data['cost_summary'],
            'output_dir': str(self.output_dir)
        }
    
    def create_breakthroughs_index(self, breakthroughs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create an index file summarizing all breakthroughs.
        
        Args:
            breakthroughs: List of parsed breakthrough dictionaries
            
        Returns:
            Index data dictionary
        """
        # Analyze costs
        cost_summary = {
            'numeric': 0,
            'variable': 0,
            'none': 0
        }
        
        for breakthrough in breakthroughs:
            cost = breakthrough.get('cost')
            if cost is None:
                cost_summary['none'] += 1
            elif isinstance(cost, str) and cost.lower() == 'variable':
                cost_summary['variable'] += 1
            else:
                cost_summary['numeric'] += 1
        
        # Count breakthroughs with requirements
        with_requirements = sum(1 for b in breakthroughs if b.get('requirements'))
        
        # Sort breakthroughs alphabetically
        sorted_breakthroughs = sorted(breakthroughs, key=lambda b: b['name'])
        
        # Create index entries
        index_entries = []
        for bt in sorted_breakthroughs:
            entry = {
                'id': bt['id'],
                'name': bt['name'],
                'cost': bt.get('cost')
            }
            if bt.get('requirements'):
                entry['has_requirements'] = True
            index_entries.append(entry)
        
        import datetime
        
        index_data = {
            'total_count': len(breakthroughs),
            'version': self.version,
            'generated_at': datetime.datetime.now().isoformat(),
            'cost_summary': cost_summary,
            'with_requirements': with_requirements,
            'without_requirements': len(breakthroughs) - with_requirements,
            'breakthroughs': index_entries
        }
        
        return index_data


def main():
    """Command-line interface for the breakthrough parser."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Parse breakthrough data from Lyrian Chronicles')
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
    breakthrough_parser = BreakthroughParser(version=args.version, output_base_dir=args.output_dir)
    
    # Parse input directory
    input_path = Path(args.input_dir) if args.input_dir else None
    
    # Parse and save all breakthroughs
    results = breakthrough_parser.parse_and_save_all(input_path)
    
    # Print results
    if 'error' in results:
        logger.error(f"Parsing failed: {results['error']}")
    else:
        logger.info(f"Successfully parsed {results['total_breakthroughs']} breakthroughs")
        logger.info(f"Saved {results['saved_breakthroughs']} breakthrough files")
        logger.info("Cost summary:")
        for cost_type, count in results['cost_types'].items():
            logger.info(f"  {cost_type}: {count}")
        logger.info(f"Output directory: {results['output_dir']}")


if __name__ == "__main__":
    main()