"""Parser for Lyrian Chronicles races and sub-races."""

import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup, Tag

from core.parser import BaseParser
from core.utils import sanitize_id, clean_text

logger = logging.getLogger(__name__)


class RaceParser(BaseParser):
    """Parser for race and sub-race data."""
    
    def __init__(self, version: str = "0.10.1", input_base_dir: str = "scraped_html", 
                 output_dir: str = "parsed_data"):
        self.data_type = "races"
        self.input_base_dir = Path(input_base_dir)
        # Use actual input version for input path
        self.input_version = version
        self.input_dir = self.input_base_dir / self.input_version / self.data_type
        # Always use real version number for output
        if version == "latest":
            version = "0.10.1"
        super().__init__(output_dir=output_dir, version=version)
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles."""
        return self.data_type
    
    def parse_detail(self, html_path: Path) -> Dict[str, Any]:
        """Parse individual race detail page HTML and extract structured data."""
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
        
        # Check if this is a detail page (has app-primary-details, app-secondary-details, or app-race-details)
        detail_component = soup.select_one('app-primary-details, app-secondary-details, app-race-details')
        if detail_component:
            return self._parse_race_detail_page(soup, html_path.stem)
        else:
            # Fallback for list pages (old behavior)
            return self._parse_race_list_page(soup, html_path.name)
    
    def _parse_ancestry_card(self, card: Tag) -> Optional[Dict[str, Any]]:
        """Parse a single ancestry card element."""
        try:
            # Find the link element
            link = card.select_one('a')
            if not link:
                logger.warning("No link found in ancestry card")
                return None
            
            # Extract basic info
            name = link.get('title', '').strip()
            if not name:
                # Try to get name from the name div
                name_elem = card.select_one('.name')
                if name_elem:
                    name = clean_text(name_elem.text).strip('• ')
            
            # Extract URL to determine if it's primary or sub-race
            url = link.get('href', '')
            is_sub_race = '/secondary/' in url or '/sub/' in url
            
            # Generate ID
            race_id = sanitize_id(name)
            
            # Extract image
            img_elem = card.select_one('img')
            image_url = img_elem.get('src', '') if img_elem else ''
            
            # Extract description
            desc_elem = card.select_one('.description')
            description = clean_text(desc_elem.text) if desc_elem else ''
            
            # Parse benefits (attributes and proficiencies)
            benefits = []
            
            # Extract attributes as benefits
            attr_elem = card.find(text=lambda t: 'Attributes:' in str(t))
            if attr_elem and attr_elem.parent:
                attr_text = clean_text(attr_elem.parent.text)
                attr_benefits = self._parse_attribute_benefits(attr_text)
                benefits.extend(attr_benefits)
            
            # Extract proficiencies as benefits
            prof_elem = card.find(text=lambda t: 'Proficiencies:' in str(t))
            if prof_elem and prof_elem.parent:
                prof_text = clean_text(prof_elem.parent.text)
                prof_text = prof_text.replace('Proficiencies:', '').strip()
                prof_benefits = self._parse_proficiency_benefits(prof_text)
                benefits.extend(prof_benefits)
            
            race_data = {
                'name': name,
                'id': race_id,
                'type': 'subrace' if is_sub_race else 'primary',
                'description': description,
                'image_url': image_url,
                'benefits': benefits,
            }
            
            # For sub-races, extract parent race from the page
            if is_sub_race:
                # Look for "Primary race:" field
                primary_elem = card.find(string=lambda t: 'Primary race:' in str(t))
                if primary_elem and primary_elem.parent:
                    primary_text = clean_text(primary_elem.parent.text)
                    primary_race = primary_text.replace('Primary race:', '').strip()
                    race_data['primary_race'] = sanitize_id(primary_race)
            
            return race_data
            
        except Exception as e:
            logger.error(f"Error parsing ancestry card: {e}")
            return None
    
    def _parse_race_detail_page(self, soup: BeautifulSoup, race_id: str) -> Dict[str, Any]:
        """Parse individual race detail page with full benefits."""
        logger.info(f"Parsing race detail page for {race_id}")
        
        try:
            # Extract race name from header
            header = soup.select_one('h2')
            name = clean_text(header.text) if header else race_id.replace('_', ' ').title()
            
            # Determine race type from the HTML content - look for URL pattern
            page_text = soup.get_text()
            is_sub_race = '/secondary/' in page_text or 'secondary' in race_id
            
            # Extract description from mat-card
            description = ""
            desc_card = soup.select_one('mat-card mat-card-content')
            if desc_card:
                description = clean_text(desc_card.text)
            
            # Extract image URL
            image_url = ""
            img = soup.select_one('img.image')
            if img:
                image_url = img.get('src', '')
            
            # Extract benefits according to race spec
            benefits = []
            primary_race = None
            
            # Parse benefits from the detail section using CSS selectors
            # Look for div elements containing labels and spans (primary races)
            detail_divs = soup.select('div.mb-3.ms-3.d-flex')
            for div in detail_divs:
                label_elem = div.select_one('label')
                span_elem = div.select_one('span.item')
                
                if label_elem and span_elem:
                    label_text = clean_text(label_elem.text).strip()
                    span_text = clean_text(span_elem.text).strip()
                    
                    if 'Attributes:' in label_text:
                        attr_benefits = self._parse_attribute_benefits(span_text)
                        benefits.extend(attr_benefits)
                    elif 'Proficiencies:' in label_text:
                        prof_benefits = self._parse_proficiency_benefits(span_text)
                        benefits.extend(prof_benefits)
                    elif 'Skills:' in label_text:
                        skill_benefits = self._parse_skill_benefits(span_text)
                        benefits.extend(skill_benefits)
                    elif label_text not in ['Attributes:', 'Proficiencies:', 'Skills:']:
                        # Handle other benefits like Ambition, etc.
                        benefits.append({
                            'type': 'special',
                            'name': label_text.rstrip(':'),
                            'description': span_text
                        })
            
            # Also look for sub-race style layout (just label and span without specific CSS)
            primary_race_div = soup.select('div.mb-3.ms-3')
            for div in primary_race_div:
                label_elem = div.select_one('label')
                span_elem = div.select_one('span.item')
                
                if label_elem and span_elem:
                    label_text = clean_text(label_elem.text).strip()
                    span_text = clean_text(span_elem.text).strip()
                    
                    if 'Primary race:' in label_text:
                        # This is a sub-race - store the primary race reference
                        primary_race = sanitize_id(span_text)
            
            # Parse racial abilities from expansion panels
            ability_benefits = self._parse_racial_abilities(soup)
            benefits.extend(ability_benefits)
            
            # Add primary race if found or determined
            if primary_race:
                pass  # Already found from layout
            elif is_sub_race:
                # Look for primary race information in text as fallback
                primary_text = soup.text
                for primary in ['Chimera', 'Demon', 'Fae', 'Human', 'Youkai']:
                    if primary in primary_text:
                        primary_race = sanitize_id(primary)
                        break
            
            # Determine final race type - if we found a primary race, this is a subrace
            race_type = 'subrace' if primary_race else 'primary'
            
            race_data = {
                'name': name,
                'id': race_id,
                'type': race_type,
                'description': description,
                'image_url': image_url,
                'benefits': benefits,
            }
            
            if primary_race:
                race_data['primary_race'] = primary_race
            
            return race_data
            
        except Exception as e:
            logger.error(f"Error parsing race detail page for {race_id}: {e}")
            return None
    
    def _parse_race_list_page(self, soup: BeautifulSoup, filename: str) -> Dict[str, Any]:
        """Parse old-style race list page (fallback)."""
        ancestry_cards = soup.select('app-ancestry-card')
        logger.info(f"Found {len(ancestry_cards)} ancestry cards in {filename}")
        
        races = []
        for card in ancestry_cards:
            race_data = self._parse_ancestry_card(card)
            if race_data:
                races.append(race_data)
        
        return {
            "races": races,
            "count": len(races),
            "source_file": filename
        }
    
    def _parse_skill_benefits(self, skill_text: str) -> List[Dict[str, Any]]:
        """Parse skill point benefits."""
        benefits = []
        
        if skill_text:
            # Parse patterns like "+5 skill points in either Magic, Survival, Animal Husbandry..."
            import re
            match = re.search(r'\+(\d+)\s+skill\s+points?\s+in\s+(?:either\s+)?(.+)', skill_text, re.IGNORECASE)
            if match:
                points = int(match.group(1))
                skills_text = match.group(2).strip()
                
                # Parse skill list
                eligible_skills = []
                if ' or ' in skills_text:
                    skills_text = skills_text.replace(' or ', ', ')
                if ', ' in skills_text:
                    eligible_skills = [skill.strip().rstrip('.') for skill in skills_text.split(', ')]
                else:
                    eligible_skills = [skills_text.strip().rstrip('.')]
                
                benefits.append({
                    'type': 'skills',
                    'points': points,
                    'eligible_skills': eligible_skills,
                    'description': skill_text
                })
        
        return benefits
    
    def _parse_racial_abilities(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Parse racial abilities from expansion panels."""
        abilities = []
        
        # Find expansion panels containing abilities
        panels = soup.select('mat-expansion-panel')
        for panel in panels:
            try:
                # Get ability name from panel title
                title_elem = panel.select_one('mat-panel-title span')
                if not title_elem:
                    continue
                
                ability_name = clean_text(title_elem.text).strip('○ ')
                ability_id = sanitize_id(ability_name)
                
                # This is a racial ability - just reference it by name/id
                # Following the pattern from class spec where abilities are listed by name
                abilities.append({
                    'type': 'ability',
                    'value': ability_id,
                    'name': ability_name
                })
                
            except Exception as e:
                logger.warning(f"Error parsing racial ability panel: {e}")
        
        return abilities
    
    def _parse_attribute_benefits(self, attr_text: str) -> List[Dict[str, Any]]:
        """Parse attribute bonuses as benefit objects.
        
        Examples:
        - "You gain +1 in toughness and +1 in awareness."
        - "You gain +1 in Power and +1 in Reason."
        - "You gain +1 in the main stat of your choice and +1 in the substat of your choice."
        """
        benefits = []
        
        # Remove the "Attributes:" prefix if present
        text = attr_text.replace('Attributes:', '').strip()
        
        # Special case for human (choice-based)
        if "of your choice" in text:
            # Main stat choice
            if "main stat of your choice" in text:
                benefits.append({
                    'type': 'attribute_choice',
                    'choose': 1,
                    'options': [
                        {'attribute': 'Focus', 'value': 1},
                        {'attribute': 'Agility', 'value': 1},
                        {'attribute': 'Toughness', 'value': 1},
                        {'attribute': 'Power', 'value': 1},
                        {'attribute': 'Fitness', 'value': 1},
                    ]
                })
            # Substat choice
            if "substat of your choice" in text:
                benefits.append({
                    'type': 'attribute_choice',
                    'choose': 1,
                    'options': [
                        {'attribute': 'Fitness', 'value': 1},
                        {'attribute': 'Reason', 'value': 1},
                        {'attribute': 'Awareness', 'value': 1},
                        {'attribute': 'Presence', 'value': 1},
                        {'attribute': 'Cunning', 'value': 1},
                    ]
                })
            return benefits
        
        # Parse standard +X in attribute format
        import re
        pattern = r'\+(\d+)\s+in\s+(\w+)'
        matches = re.findall(pattern, text, re.IGNORECASE)
        
        for value, attr in matches:
            # Normalize attribute names - capitalize first letter
            attr_normalized = attr.capitalize()
            benefits.append({
                'type': 'attribute_choice',  # Single option is still attribute_choice per spec
                'choose': 1,
                'options': [{'attribute': attr_normalized, 'value': int(value)}]
            })
        
        return benefits
    
    def _parse_proficiency_benefits(self, prof_text: str) -> List[Dict[str, Any]]:
        """Parse proficiencies as benefit objects.
        
        Examples:
        - "You can speak, read and write Common as well as the special dialect of your sub-race."
        - "You can speak, read, write Common and Sorthen. You also gain proficiency in one weapon or +5 skill points in a skill relating to your demon clan."
        """
        benefits = []
        
        # For now, we'll store proficiencies as a single text benefit
        # In a more advanced parser, we could break these down into:
        # - language proficiencies
        # - weapon proficiencies
        # - skill point benefits
        
        if prof_text:
            # Check for skill point grants
            import re
            skill_match = re.search(r'\+(\d+)\s+skill\s+points?\s+in\s+(.+?)(?:\.|$)', prof_text, re.IGNORECASE)
            if skill_match:
                points = int(skill_match.group(1))
                skill_desc = skill_match.group(2).strip()
                benefits.append({
                    'type': 'skills',
                    'points': points,
                    'description': f"+{points} skill points in {skill_desc}"
                })
            
            # Check for weapon proficiency
            if "proficiency in one weapon" in prof_text.lower():
                benefits.append({
                    'type': 'proficiency',
                    'value': 'weapon_choice',
                    'description': 'Proficiency in one weapon'
                })
            
            # For now, add the full text as a generic benefit
            # This preserves all information even if we can't parse it perfectly
            benefits.append({
                'type': 'proficiency',
                'value': 'languages_and_other',
                'description': prof_text
            })
        
        return benefits
    
    def parse_all_races(self) -> Dict[str, Any]:
        """Parse all individual race detail files."""
        all_data = {
            'primary_races': [],
            'sub_races': [],
            'total_count': 0
        }
        
        # Parse all individual race HTML files
        html_files = list(self.input_dir.glob("*.html"))
        logger.info(f"Found {len(html_files)} race HTML files to parse")
        
        for html_file in html_files:
            logger.info(f"Parsing {html_file.name}")
            result = self.parse_detail(html_file)
            
            if result:
                race_type = result.get('type', 'primary')
                if race_type == 'primary':
                    all_data['primary_races'].append(result)
                else:
                    all_data['sub_races'].append(result)
        
        all_data['total_count'] = len(all_data['primary_races']) + len(all_data['sub_races'])
        
        # Save individual race files
        for race in all_data['primary_races']:
            # Create subdirectory
            primary_dir = self.output_dir / 'primary'
            primary_dir.mkdir(parents=True, exist_ok=True)
            # Save in current directory then move
            temp_path = self.to_yaml(race, race['id'])
            if temp_path:
                final_path = primary_dir / f"{race['id']}.yaml"
                Path(temp_path).rename(final_path)
                logger.info(f"Moved to {final_path}")
        
        for race in all_data['sub_races']:
            # Create subdirectory  
            sub_dir = self.output_dir / 'sub'
            sub_dir.mkdir(parents=True, exist_ok=True)
            # Save in current directory then move
            temp_path = self.to_yaml(race, race['id'])
            if temp_path:
                final_path = sub_dir / f"{race['id']}.yaml"
                Path(temp_path).rename(final_path)
                logger.info(f"Moved to {final_path}")
        
        # Save index file
        self.to_yaml(all_data, "races_index")
        
        logger.info(f"Parsed {all_data['total_count']} total races/sub-races")
        logger.info(f"  - {len(all_data['primary_races'])} primary races")
        logger.info(f"  - {len(all_data['sub_races'])} sub-races")
        
        return all_data


if __name__ == "__main__":
    import argparse
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    parser = argparse.ArgumentParser(description="Parse LC race data")
    parser.add_argument("--version", default="latest", help="Game version to parse")
    parser.add_argument("--format", choices=["yaml", "json"], default="yaml",
                       help="Output format")
    args = parser.parse_args()
    
    race_parser = RaceParser(version=args.version)
    race_parser.parse_all_races()