#!/usr/bin/env python3
"""
Ability Parser - Parse HTML to structured YAML ability data

This parser converts HTML from the ability fetcher into structured YAML files,
handling all four ability types: true_ability, key_ability, crafting_ability, gathering_ability.
"""

import re
import logging
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import sanitize_id, extract_keywords

logger = logging.getLogger(__name__)


class AbilityParser(BaseParser):
    """Parser for ability HTML files"""
    
    def __init__(self, version: str = "latest", output_base_dir: str = "parsed_data", monster: bool = False):
        self.monster = monster
        self.data_type = "monster-abilities" if monster else "abilities"
        super().__init__(output_base_dir, version)
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles"""
        return self.data_type
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse ability detail page - not used for abilities (we parse tabs instead)"""
        # For abilities, we override parse_file instead since we parse tab content
        # This method is required by BaseParser but not used for our implementation
        return {}
    
    def parse_abilities_file(self, html_path: Path, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Parse an HTML file containing abilities"""
        logger.info(f"Parsing abilities from {html_path}")
        
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all expansion panels
            panels = soup.select('mat-expansion-panel')
            logger.info(f"Found {len(panels)} ability panels")
            
            abilities = []
            for i, panel in enumerate(panels):
                try:
                    ability_result = self._parse_ability_panel(panel)
                    
                    # Handle both single abilities and lists (from crafting subdivision)
                    if isinstance(ability_result, list):
                        abilities.extend(ability_result)
                        logger.debug(f"Panel {i+1}: Added {len(ability_result)} crafting abilities")
                    elif ability_result:
                        abilities.append(ability_result)
                        logger.debug(f"Panel {i+1}: Added ability '{ability_result.get('name', 'Unknown')}'")
                    else:
                        logger.warning(f"Panel {i+1}: Failed to parse")
                        
                except Exception as e:
                    logger.error(f"Error parsing panel {i+1}: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(abilities)} abilities")
            return abilities
            
        except Exception as e:
            logger.error(f"Error parsing file {html_path}: {e}")
            return []
    
    def _parse_ability_panel(self, panel: BeautifulSoup) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
        """Parse a single mat-expansion-panel into ability data"""
        
        # Extract ability name from panel title
        name_elem = panel.select_one('mat-panel-title span.fs-5.fw-bold')
        if not name_elem:
            name_elem = panel.select_one('.mat-expansion-panel-header-title span.fs-5.fw-bold')
        
        if not name_elem:
            logger.warning("No ability name found in panel")
            return None
        
        ability_name = name_elem.get_text(strip=True)
        # Remove leading '○ ' character if present
        if ability_name.startswith('○ '):
            ability_name = ability_name[2:].strip()
        
        if not ability_name:
            logger.warning("Empty ability name found")
            return None
        
        logger.debug(f"Parsing ability: {ability_name}")
        
        # Check for ability type components
        if self.monster:
            monster_ability = panel.select_one('app-monster-ability')
            monster_active_action = panel.select_one('app-monster-active-action')
            
            if monster_ability:
                ability_type = 'monster_ability'
                ability_data = self._parse_monster_ability(monster_ability, ability_name)
            elif monster_active_action:
                ability_type = 'monster_active_action'
                ability_data = self._parse_monster_active_action(monster_active_action, ability_name)
            else:
                logger.warning(f"Unknown monster ability type for: {ability_name}")
                return None
        else:
            true_ability = panel.select_one('app-true-ability')
            key_ability = panel.select_one('app-key-ability')
            
            # Determine base ability type
            if key_ability:
                ability_type = 'key_ability'
                ability_data = self._parse_key_ability(key_ability, ability_name)
            elif true_ability:
                ability_type = 'true_ability'
                ability_data = self._parse_true_ability(true_ability, ability_name)
            else:
                logger.warning(f"Unknown ability type for: {ability_name}")
                return None
        
        if not ability_data:
            return None
        
        # Check for specialized ability types that override the base type (only for regular abilities)
        if not self.monster:
            if self._should_parse_as_crafting(ability_data):
                return self._parse_crafting_abilities(ability_data)
            elif self._should_parse_as_gathering(ability_data):
                ability_data['type'] = 'gathering_ability'
                self._parse_gathering_specifics(ability_data)
        
        return ability_data
    
    def _parse_true_ability(self, true_ability: BeautifulSoup, ability_name: str) -> Optional[Dict[str, Any]]:
        """Parse app-true-ability content"""
        ability_data = {
            'id': self._normalize_ability_id(ability_name),
            'name': ability_name,
            'type': 'true_ability',
            'keywords': [],
            'requirements': []
        }
        
        # Extract information from mat-card content
        content_area = true_ability.select_one('.mat-mdc-card-content')
        if not content_area:
            logger.warning(f"No card content found for true ability: {ability_name}")
            return ability_data
        
        # Process each list item in the content
        for li in content_area.select('li.d-flex'):
            title_div = li.select_one('.title.fs-6')
            value_div = li.select_one('.flex-fill.fs-6')
            
            if not title_div or not value_div:
                continue
            
            title = title_div.get_text(strip=True)
            
            if title == 'Keywords':
                ability_data['keywords'] = extract_keywords(value_div)
            elif title == 'Range':
                ability_data['range'] = self._extract_text_value(value_div)
            elif title == 'Description':
                ability_data['description'] = self._extract_description(value_div)
            elif title == 'Requirement':
                req_text = self._extract_text_value(value_div)
                if req_text:
                    ability_data['requirements'] = [req_text]
            elif title in ['Mana cost', 'AP cost', 'RP cost']:
                if 'costs' not in ability_data:
                    ability_data['costs'] = {}
                cost_type = title.lower().replace(' cost', '').replace('mana', 'mana')
                cost_value = self._parse_cost_value(value_div.get_text(strip=True))
                if cost_value is not None:
                    ability_data['costs'][cost_type] = cost_value
            elif title == 'Other costs':
                other_cost = self._extract_text_value(value_div)
                if other_cost:
                    if 'costs' not in ability_data:
                        ability_data['costs'] = {}
                    ability_data['costs']['other'] = other_cost
        
        return ability_data
    
    def _parse_key_ability(self, key_ability: BeautifulSoup, ability_name: str) -> Optional[Dict[str, Any]]:
        """Parse app-key-ability content"""
        ability_data = {
            'id': self._normalize_ability_id(ability_name),
            'name': ability_name,
            'type': 'key_ability',
            'keywords': [],
            'requirements': []
        }
        
        # Extract benefits
        benefits_section = key_ability.select_one('div.fw-bold.fs-5:-soup-contains("Benefits")')
        if benefits_section:
            benefits_card = benefits_section.find_next_sibling('mat-card')
            if benefits_card:
                benefit_items = benefits_card.select('mat-card-content ul li')
                if benefit_items:
                    ability_data['benefits'] = [
                        item.get_text(strip=True) for item in benefit_items 
                        if item.get_text(strip=True)
                    ]
        
        # Extract associated abilities
        associated_section = key_ability.select_one('div.fw-bold.fs-5:-soup-contains("Associated Ability")')
        if associated_section:
            associated_ability = associated_section.find_next_sibling('app-true-ability')
            if associated_ability:
                title_elem = associated_ability.select_one('mat-card-title')
                if title_elem:
                    associated_name = title_elem.get_text(strip=True)
                    associated_id = self._normalize_ability_id(associated_name)
                    if associated_id != ability_data['id']:  # Avoid self-references
                        ability_data['associated_abilities'] = [{
                            'name': associated_name,
                            'id': associated_id
                        }]
                
                # Check for costs in the associated ability
                costs = self._extract_costs_from_true_ability(associated_ability)
                if costs:
                    ability_data['costs'] = costs
        
        # Extract description if present
        description = self._extract_description_from_key_ability(key_ability)
        if description:
            ability_data['description'] = description
        
        return ability_data
    
    def _parse_monster_ability(self, monster_ability: BeautifulSoup, ability_name: str) -> Optional[Dict[str, Any]]:
        """Parse app-monster-ability content"""
        ability_data = {
            'id': self._normalize_ability_id(ability_name),
            'name': ability_name,
            'type': 'monster_ability'
        }
        
        # Extract description from the linkify div
        description_elem = monster_ability.select_one('div[linkify]')
        if description_elem:
            ability_data['description'] = self._extract_description(description_elem)
        else:
            logger.warning(f"No description found for monster ability: {ability_name}")
            ability_data['description'] = ""
        
        return ability_data
    
    def _parse_monster_active_action(self, monster_active_action: BeautifulSoup, ability_name: str) -> Optional[Dict[str, Any]]:
        """Parse app-monster-active-action content"""
        ability_data = {
            'id': self._normalize_ability_id(ability_name),
            'name': ability_name,
            'type': 'monster_active_action',
            'keywords': []
        }
        
        # Extract information from mat-card content (similar to true abilities)
        content_area = monster_active_action.select_one('.mat-mdc-card-content')
        if not content_area:
            logger.warning(f"No card content found for monster active action: {ability_name}")
            return ability_data
        
        # Process each list item in the content
        for li in content_area.select('li.d-flex'):
            title_div = li.select_one('.title.fs-6')
            value_div = li.select_one('.flex-fill.fs-6')
            
            if not title_div or not value_div:
                continue
            
            title = title_div.get_text(strip=True)
            
            if title == 'Keywords':
                ability_data['keywords'] = extract_keywords(value_div)
            elif title == 'Range':
                ability_data['range'] = self._extract_text_value(value_div)
            elif title == 'Description':
                ability_data['description'] = self._extract_description(value_div)
            elif title == 'Requirement':
                req_text = self._extract_text_value(value_div)
                if req_text:
                    ability_data['requirements'] = [req_text]
            elif title == 'AP Cost':
                cost_text = value_div.get_text(strip=True)
                if 'costs' not in ability_data:
                    ability_data['costs'] = {}
                ability_data['costs']['ap'] = cost_text
        
        return ability_data
    
    
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
    
    def _parse_cost_value(self, cost_text: str) -> Union[int, str, None]:
        """Parse cost value from text"""
        if not cost_text or cost_text in ['--', '-']:
            return None
        
        # Handle variable costs
        if 'X' in cost_text:
            return 'X'
        
        # Handle special cases like "NaN RP"
        if 'NaN' in cost_text:
            return 'variable'
        
        # Extract numeric value
        match = re.search(r'(\d+)', cost_text)
        if match:
            return int(match.group(1))
        
        # Return as string for complex costs
        return cost_text
    
    def _normalize_ability_id(self, name: str) -> str:
        """Normalize ability name to ID, handling Secret Arts"""
        if name.startswith("Secret Art:"):
            art_name = name.replace("Secret Art:", "").strip()
            art_id = sanitize_id(art_name)
            return f"secret_art__{art_id}"  # Double underscore for Secret Arts
        else:
            return sanitize_id(name)
    
    def _should_parse_as_crafting(self, ability_data: Dict[str, Any]) -> bool:
        """Determine if ability should be parsed as crafting abilities"""
        description = ability_data.get('description', '')
        
        # Check for crafting indicators
        crafting_indicators = [
            'crafting points', 'crafting check', 'crafting session', 'crafting dice',
            'interlude point', 'IP', 'co-craft'
        ]
        
        has_crafting_indicators = any(
            indicator.lower() in description.lower() 
            for indicator in crafting_indicators
        )
        
        # Check for multiple cost blocks (subdivision pattern)
        cost_count = description.lower().count('cost:')
        has_multiple_costs = cost_count >= 2
        
        # Check for craft in name and multiple costs
        has_craft_in_name = 'craft' in ability_data['name'].lower()
        
        return (has_crafting_indicators and has_multiple_costs) or \
               (has_craft_in_name and has_multiple_costs)
    
    def _should_parse_as_gathering(self, ability_data: Dict[str, Any]) -> bool:
        """Determine if ability should be marked as gathering ability"""
        # Check requirements for gathering session
        requirements = ability_data.get('requirements', [])
        for req in requirements:
            if req and 'gathering session' in req.lower():
                return True
        
        # Check description for gathering indicators
        description = ability_data.get('description', '')
        gathering_indicators = [
            'gathering session', 'gathering check', 'node points', 'lucky points',
            'foraging skill', 'strike dice'
        ]
        
        return any(indicator.lower() in description.lower() for indicator in gathering_indicators)
    
    def _parse_crafting_abilities(self, ability_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse crafting abilities with subdivision logic"""
        description = ability_data.get('description', '')
        parent_name = ability_data['name']
        
        # Look for ability patterns: name followed by "Cost:"
        ability_pattern = r'(?:^|\n)([^\n]+?)(?=\s*Cost:)'
        matches = list(re.finditer(ability_pattern, description, re.MULTILINE))
        
        if len(matches) < 2:
            # Single crafting ability
            crafting_ability = dict(ability_data)
            crafting_ability['type'] = 'crafting_ability'
            self._parse_crafting_cost(crafting_ability, description)
            return [crafting_ability]
        
        # Multiple crafting abilities - subdivide
        crafting_abilities = []
        
        for i, match in enumerate(matches):
            sub_ability_name = match.group(1).strip()
            start_pos = match.start()
            
            # Find end position
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(description)
            
            ability_text = description[start_pos:end_pos].strip()
            
            # Skip short fragments
            if len(ability_text) < 20:
                continue
            
            # Create sub-ability
            sub_ability = {
                'id': sanitize_id(f"{parent_name}_{sub_ability_name}"),
                'name': sub_ability_name,
                'type': 'crafting_ability',
                'keywords': ability_data.get('keywords', []).copy(),
                'requirements': [],
                'parent_ability': ability_data['id'],
                'subdivision_index': i + 1
            }
            
            self._parse_individual_crafting_ability(sub_ability, ability_text)
            crafting_abilities.append(sub_ability)
        
        return crafting_abilities if crafting_abilities else [ability_data]
    
    def _parse_individual_crafting_ability(self, ability: Dict[str, Any], text: str):
        """Parse individual crafting ability from text block"""
        # Extract cost
        cost_match = re.search(r'Cost:\s*([^:\n]+?)(?:Description:|$)', text, re.IGNORECASE)
        if cost_match:
            cost_text = cost_match.group(1).strip()
            if cost_text and cost_text not in ['-', '--']:
                ability['cost'] = cost_text
        
        # Extract description
        desc_match = re.search(r'Description:\s*(.+?)(?=\n\s*\*\*[^*]+\*\*|$)', text, re.IGNORECASE | re.DOTALL)
        if desc_match:
            description = desc_match.group(1).strip()
            description = re.sub(r'&nbsp;', ' ', description)
            description = re.sub(r'\s+', ' ', description)
            ability['description'] = description
        elif not cost_match:
            # If no description section and no cost, use whole text
            ability['description'] = text.strip()
        
        # Check for co-craft and add keyword
        description = ability.get('description', '')
        if description.lower().startswith('co-craft'):
            if 'co-craft' not in ability['keywords']:
                ability['keywords'].append('co-craft')
    
    def _parse_crafting_cost(self, ability: Dict[str, Any], description: str):
        """Parse crafting cost from description"""
        # Look for cost patterns in crafting abilities
        cost_patterns = [
            r'(\d+)\s*Crafting Points',
            r'(\d+)\s*CP',
            r'(\d+u)\s*of\s*([^.]+)',
            r'Cost:\s*([^.]+)'
        ]
        
        for pattern in cost_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                ability['cost'] = match.group(1) if len(match.groups()) == 1 else match.group(0)
                break
    
    def _parse_gathering_specifics(self, ability: Dict[str, Any]):
        """Parse gathering-specific fields"""
        description = ability.get('description', '')
        requirements = ability.get('requirements', [])
        
        # Extract gathering cost from requirements
        for req in requirements:
            if 'strike dice' in req.lower():
                strike_match = re.search(r'(\d+)\s*strike\s*dice', req, re.IGNORECASE)
                if strike_match:
                    ability['gathering_cost'] = f"{strike_match.group(1)} strike dice"
        
        # Extract gathering bonus
        bonus_match = re.search(r'\+(\d+)\s*bonus', description, re.IGNORECASE)
        if bonus_match:
            ability['gathering_bonus'] = f"+{bonus_match.group(1)} bonus"
        
        # Check for node/lucky points effects
        ability['affects_node_points'] = 'node point' in description.lower()
        ability['affects_lucky_points'] = 'lucky point' in description.lower()
    
    def _extract_costs_from_true_ability(self, true_ability: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract costs from associated true ability"""
        costs = {}
        content_area = true_ability.select_one('.mat-mdc-card-content')
        if not content_area:
            return None
        
        for li in content_area.select('li.d-flex'):
            title_div = li.select_one('.title.fs-6')
            value_div = li.select_one('.flex-fill.fs-6')
            
            if not title_div or not value_div:
                continue
            
            title = title_div.get_text(strip=True)
            if title in ['Mana cost', 'AP cost', 'RP cost']:
                cost_type = title.lower().replace(' cost', '').replace('mana', 'mana')
                cost_value = self._parse_cost_value(value_div.get_text(strip=True))
                if cost_value is not None:
                    costs[cost_type] = cost_value
        
        return costs if costs else None
    
    def _extract_description_from_key_ability(self, key_ability: BeautifulSoup) -> Optional[str]:
        """Extract description from key ability if present"""
        # Key abilities sometimes have descriptions in their content
        # This is a placeholder for more sophisticated extraction if needed
        return None
    
    def parse_directory(self, html_dir: str, output_format: str = "yaml") -> Dict[str, str]:
        """Parse all HTML files in a directory and save abilities"""
        html_path = Path(html_dir)
        if not html_path.exists():
            logger.error(f"Directory not found: {html_dir}")
            return {}
        
        results = {}
        html_files = list(html_path.glob("*.html"))
        
        logger.info(f"Found {len(html_files)} HTML files to parse")
        
        all_abilities = []
        
        for html_file in html_files:
            # Check for corresponding metadata file
            meta_file = html_file.with_suffix('.meta.json')
            metadata = None
            if meta_file.exists():
                import json
                with open(meta_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            
            # Parse the abilities file
            abilities = self.parse_abilities_file(html_file, metadata)
            
            if abilities:
                all_abilities.extend(abilities)
                logger.info(f"Parsed {len(abilities)} abilities from {html_file.name}")
        
        # Save all abilities in different formats
        if all_abilities:
            if output_format == "yaml":
                # Handle duplicates by preferring true abilities over key abilities
                abilities_by_id = {}
                
                # First pass: collect all abilities by ID
                for ability in all_abilities:
                    ability_id = ability.get('id', 'unknown')
                    ability_type = ability.get('type', 'unknown')
                    
                    if ability_id in abilities_by_id:
                        existing_type = abilities_by_id[ability_id].get('type', 'unknown')
                        logger.info(f"Duplicate ability ID '{ability_id}': existing={existing_type}, new={ability_type}")
                        
                        # Prefer true_ability over key_ability for duplicates
                        if ability_type == 'true_ability' and existing_type == 'key_ability':
                            logger.info(f"  Replacing key_ability with true_ability for '{ability_id}'")
                            abilities_by_id[ability_id] = ability
                        elif existing_type == 'true_ability' and ability_type == 'key_ability':
                            logger.info(f"  Keeping true_ability over key_ability for '{ability_id}'")
                            # Keep existing true_ability, don't replace
                        else:
                            logger.warning(f"  Unexpected duplicate types for '{ability_id}': {existing_type} vs {ability_type}")
                            abilities_by_id[ability_id] = ability  # Use the newer one
                    else:
                        abilities_by_id[ability_id] = ability
                
                # Second pass: save deduplicated abilities
                for ability_id, ability in abilities_by_id.items():
                    output_path = self.to_yaml(ability, ability_id)
                    if output_path:
                        results[ability_id] = output_path
                
                # Also save a combined index using deduplicated abilities
                final_abilities = list(abilities_by_id.values())
                index_data = {
                    'total_count': len(final_abilities),
                    'version': self.version,
                    'generated_at': self._get_timestamp(),
                    'by_type': self._count_by_type(final_abilities),
                    'abilities': [
                        {
                            'id': a.get('id'),
                            'name': a.get('name'),
                            'type': a.get('type'),
                            'keywords': a.get('keywords', [])
                        } for a in final_abilities
                    ]
                }
                index_path = self.to_yaml(index_data, "abilities_index")
                if index_path:
                    results['abilities_index'] = index_path
            
            else:
                # JSON output - save all abilities in one file
                output_path = self.output_dir / "abilities.json"
                import json
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(all_abilities, f, indent=2, ensure_ascii=False)
                results['abilities'] = str(output_path)
        
        logger.info(f"Successfully parsed {len(all_abilities)} total abilities")
        return results
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _count_by_type(self, abilities: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count abilities by type"""
        type_counts = {}
        for ability in abilities:
            ability_type = ability.get('type', 'unknown')
            type_counts[ability_type] = type_counts.get(ability_type, 0) + 1
        return type_counts


def main():
    """Command-line interface for ability parser"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Parse ability HTML files to YAML")
    parser.add_argument("html_dir", help="Directory containing HTML files")
    parser.add_argument("--version", default="latest", help="Game version")
    parser.add_argument("--output-dir", default="parsed_data", help="Output directory")
    parser.add_argument("--monster", action="store_true", help="Parse monster abilities instead of regular abilities")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create parser
    ability_parser = AbilityParser(version=args.version, output_base_dir=args.output_dir, monster=args.monster)
    
    # Parse directory
    html_dir = Path(args.html_dir)
    if not html_dir.exists():
        logger.error(f"HTML directory not found: {html_dir}")
        return
    
    # Parse all HTML files in directory
    results = ability_parser.parse_directory(html_dir)
    
    ability_type = "monster abilities" if args.monster else "abilities"
    logger.info(f"Parsing complete: {len(results)} {ability_type} processed")


if __name__ == "__main__":
    main()