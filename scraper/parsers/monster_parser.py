#!/usr/bin/env python3
"""
Monster Parser - Parse HTML to structured YAML monster data

This parser converts HTML from the monster fetcher into structured YAML files,
extracting stat blocks, abilities, and metadata.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import sanitize_id, extract_keywords

logger = logging.getLogger(__name__)


class MonsterParser(BaseParser):
    """Parser for monster HTML files"""
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles"""
        return "monsters"
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse monster detail page HTML"""
        logger.debug("Parsing monster detail page")
        
        # Initialize monster data
        monster_data = {
            'abilities': [],
            'active_actions': []
        }
        
        # Extract basic monster information
        self._extract_basic_info(soup, monster_data)
        
        # Extract stats
        self._extract_stats(soup, monster_data)
        
        # Extract lore and strategy
        self._extract_descriptive_content(soup, monster_data)
        
        # Extract abilities and active actions
        self._extract_abilities(soup, monster_data)
        
        return monster_data
    
    def _extract_basic_info(self, soup: BeautifulSoup, monster_data: Dict[str, Any]):
        """Extract basic monster information (name, type, danger level, etc.)"""
        
        # Extract monster name
        name_elem = soup.select_one('h2')
        if name_elem:
            monster_data['name'] = name_elem.get_text(strip=True)
            monster_data['id'] = sanitize_id(monster_data['name'])
        
        # Extract type
        type_elem = soup.select_one('label:-soup-contains("Type:") + span.item')
        if type_elem:
            monster_data['type'] = type_elem.get_text(strip=True)
        
        # Extract danger level
        danger_elem = soup.select_one('label:-soup-contains("Danger level:") + span.item')
        if danger_elem:
            monster_data['danger_level'] = danger_elem.get_text(strip=True)
        
        # Extract image URL
        img_elem = soup.select_one('img.image')
        if img_elem:
            monster_data['image_url'] = img_elem.get('src')
    
    def _extract_stats(self, soup: BeautifulSoup, monster_data: Dict[str, Any]):
        """Extract monster stats from app-monster-stats component"""
        stats_component = soup.select_one('app-monster-stats')
        if not stats_component:
            logger.warning("No stats component found")
            return
        
        stats = {}
        
        # Extract all stat rows
        stat_rows = stats_component.select('.my-3.d-flex')
        for row in stat_rows:
            label_elem = row.select_one('.label')
            value_elem = row.select_one('.flex-fill')
            
            if not label_elem or not value_elem:
                continue
            
            label = label_elem.get_text(strip=True).rstrip(':')
            value = value_elem.get_text(strip=True)
            
            # Parse specific stats with special handling
            if label in ['HP', 'AP', 'RP', 'Mana', 'Focus', 'Power', 'Agility', 'Toughness']:
                try:
                    stats[label.lower()] = int(value)
                except ValueError:
                    stats[label.lower()] = value
            elif label == 'Initiative':
                # Handle +4 format
                stats['initiative'] = value
            elif label in ['Evasion', 'Guard']:
                # Handle "11 / 23" format
                stats[label.lower()] = value
            elif label == 'Movement speed':
                stats['movement_speed'] = value
            elif label == 'Notable skills':
                stats['notable_skills'] = value
            elif label in ['Light attack', 'Heavy attack']:
                stats[label.lower().replace(' ', '_')] = value
            elif label in ['Strong against', 'Weak against']:
                stats[label.lower().replace(' ', '_')] = value
            elif label in ['Fitness', 'Cunning', 'Reason', 'Awareness', 'Presence']:
                try:
                    stats[label.lower()] = int(value)
                except ValueError:
                    stats[label.lower()] = value
            elif label == 'Appearance':
                stats['appearance'] = value
            elif label == 'Habitat':
                stats['habitat'] = value
            elif label in ['Ability', 'Active actions']:
                # These are section headers, not actual stats
                continue
            else:
                # Store any other stats as-is
                stats[sanitize_id(label)] = value
        
        monster_data['stats'] = stats
    
    def _extract_descriptive_content(self, soup: BeautifulSoup, monster_data: Dict[str, Any]):
        """Extract lore, strategy, and running information"""
        
        # Extract lore
        lore_card = soup.select_one('mat-card-title:-soup-contains("Lore:") ~ mat-card-content')
        if lore_card:
            lore_text = self._extract_card_text(lore_card)
            if lore_text:
                monster_data['lore'] = lore_text
        
        # Extract strategy
        strategy_card = soup.select_one('mat-card-title:-soup-contains("Strategy:") ~ mat-card-content')
        if strategy_card:
            strategy_text = self._extract_card_text(strategy_card)
            if strategy_text:
                monster_data['strategy'] = strategy_text
        
        # Extract running the monster
        running_card = soup.select_one('mat-card-title:-soup-contains("Running the Monster:") ~ mat-card-content')
        if running_card:
            running_text = self._extract_card_text(running_card)
            if running_text:
                monster_data['running_notes'] = running_text
    
    def _extract_card_text(self, card_content: BeautifulSoup) -> Optional[str]:
        """Extract text from a mat-card-content element"""
        text_div = card_content.select_one('div[linkify]')
        if text_div:
            # Get all paragraphs
            paragraphs = text_div.select('p')
            if paragraphs:
                return '\n\n'.join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            else:
                return text_div.get_text(strip=True)
        return None
    
    def _extract_abilities(self, soup: BeautifulSoup, monster_data: Dict[str, Any]):
        """Extract ability references from expansion panels"""
        
        # Find all expansion panels
        panels = soup.select('mat-expansion-panel')
        
        for panel in panels:
            panel_title = self._get_panel_title(panel)
            
            if not panel_title:
                continue
            
            logger.debug(f"Processing panel: {panel_title}")
            
            if 'abilities' in panel_title.lower() and 'actions' not in panel_title.lower():
                # This is the passive abilities panel - just get ability names
                ability_refs = self._extract_ability_references(panel, 'monster_ability')
                monster_data['abilities'].extend(ability_refs)
            elif 'actions' in panel_title.lower():
                # This is the active actions panel - just get action names  
                action_refs = self._extract_ability_references(panel, 'monster_active_action')
                monster_data['active_actions'].extend(action_refs)
    
    def _get_panel_title(self, panel: BeautifulSoup) -> Optional[str]:
        """Extract the title from an expansion panel"""
        title_elem = panel.select_one('mat-panel-title span.fs-5.fw-bold')
        if title_elem:
            title = title_elem.get_text(strip=True)
            # Remove leading '○ ' character if present
            if title.startswith('○ '):
                title = title[2:].strip()
            return title
        return None
    
    def _extract_ability_references(self, panel: BeautifulSoup, ability_type: str) -> List[Dict[str, Any]]:
        """Extract ability name/ID references from a panel"""
        ability_refs = []
        
        if ability_type == 'monster_ability':
            # Find all mat-cards within the panel (passive abilities)
            ability_cards = panel.select('mat-card')
            
            for card in ability_cards:
                title_elem = card.select_one('mat-card-title')
                if title_elem:
                    ability_name = title_elem.get_text(strip=True)
                    ability_refs.append({
                        'name': ability_name,
                        'id': sanitize_id(ability_name)
                    })
        
        elif ability_type == 'monster_active_action':
            # Find all app-monster-active-action components (active actions)
            action_components = panel.select('app-monster-active-action')
            
            for component in action_components:
                title_elem = component.select_one('mat-card-title')
                if title_elem:
                    action_name = title_elem.get_text(strip=True)
                    ability_refs.append({
                        'name': action_name,
                        'id': sanitize_id(action_name)
                    })
        
        return ability_refs
    
    def _extract_text_value(self, value_div: BeautifulSoup) -> Optional[str]:
        """Extract text value, handling placeholder values"""
        text = value_div.get_text(strip=True)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Return None for placeholder values
        if text in ['--', '-', '']:
            return None
        return text
    
    def _extract_description(self, value_div: BeautifulSoup) -> str:
        """Extract description text with proper formatting"""
        # Replace <br> with newlines
        for br in value_div.find_all('br'):
            br.replace_with('\n')
        
        # Get text from paragraphs if available
        paragraphs = value_div.select('p')
        if paragraphs:
            description = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
        else:
            description = value_div.get_text(strip=True)
        
        # Clean up extra whitespace
        description = re.sub(r'\n\s*\n\s*\n', '\n\n', description)
        return description.strip()
    
    def parse_directory(self, html_dir: str, output_format: str = "yaml") -> Dict[str, str]:
        """Parse all HTML files in a directory and save monsters"""
        html_path = Path(html_dir)
        if not html_path.exists():
            logger.error(f"Directory not found: {html_dir}")
            return {}
        
        results = {}
        html_files = list(html_path.glob("*.html"))
        
        logger.info(f"Found {len(html_files)} HTML files to parse")
        
        all_monsters = []
        
        for html_file in html_files:
            # Check for corresponding metadata file
            meta_file = html_file.with_suffix('.meta.json')
            metadata = None
            if meta_file.exists():
                import json
                with open(meta_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            
            # Parse the monster file
            monster_data = self.parse_file(html_file, metadata)
            
            if monster_data:
                all_monsters.append(monster_data)
                
                # Save individual monster file
                monster_id = monster_data.get('id', html_file.stem)
                if output_format == "yaml":
                    output_path = self.to_yaml(monster_data, monster_id)
                    if output_path:
                        results[monster_id] = output_path
                
                logger.info(f"Parsed monster: {monster_data.get('name', 'Unknown')}")
        
        # Save index file
        if all_monsters:
            if output_format == "yaml":
                index_data = {
                    'total_count': len(all_monsters),
                    'version': self.version,
                    'generated_at': self._get_timestamp(),
                    'by_type': self._count_by_type(all_monsters),
                    'monsters': [
                        {
                            'id': m.get('id'),
                            'name': m.get('name'),
                            'type': m.get('type'),
                            'danger_level': m.get('danger_level'),
                            'ability_count': len(m.get('abilities', [])),
                            'action_count': len(m.get('active_actions', []))
                        } for m in all_monsters
                    ]
                }
                index_path = self.to_yaml(index_data, "monsters_index")
                if index_path:
                    results['monsters_index'] = index_path
            
            else:
                # JSON output
                output_path = self.output_dir / "monsters.json"
                import json
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(all_monsters, f, indent=2, ensure_ascii=False)
                results['monsters'] = str(output_path)
        
        logger.info(f"Successfully parsed {len(all_monsters)} total monsters")
        return results
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _count_by_type(self, monsters: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count monsters by type"""
        type_counts = {}
        for monster in monsters:
            monster_type = monster.get('type', 'unknown')
            type_counts[monster_type] = type_counts.get(monster_type, 0) + 1
        return type_counts


def main():
    """Command-line interface for monster parser"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Parse monster HTML files to YAML")
    parser.add_argument("html_dir", help="Directory containing HTML files")
    parser.add_argument("--version", default="latest", help="Game version")
    parser.add_argument("--output-dir", default="parsed_data", help="Output directory")
    parser.add_argument("--format", choices=["yaml", "json"], default="yaml", help="Output format")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create parser
    monster_parser = MonsterParser(output_dir=args.output_dir, version=args.version)
    
    # Parse directory
    html_dir = Path(args.html_dir)
    if not html_dir.exists():
        logger.error(f"HTML directory not found: {html_dir}")
        return
    
    # Parse all HTML files in directory
    results = monster_parser.parse_directory(html_dir, args.format)
    
    logger.info(f"Parsing complete: {len(results)} monsters processed")


if __name__ == "__main__":
    main()