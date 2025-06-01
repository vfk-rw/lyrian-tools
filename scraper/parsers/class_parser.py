#!/usr/bin/env python3
"""
Class Parser - Parses class HTML pages into structured YAML data.
"""
import re
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup

from core.parser import BaseParser
from core.utils import (
    extract_from_mat_card, extract_keywords, sanitize_id,
    extract_requirements, clean_text
)

logger = logging.getLogger(__name__)


class ClassParser(BaseParser):
    """Parses class HTML files into structured data."""
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles."""
        return "classes"
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse a class detail page into structured data."""
        if not metadata:
            metadata = self._extract_basic_metadata(soup)
        
        # Extract class ID and name
        class_id = metadata.get('id', 'unknown')
        class_name = metadata.get('name', class_id.replace('_', ' ').title())
        
        # Extract description
        description = self._extract_description(soup)
        
        # Extract requirements
        requirements = self._extract_requirements(soup)
        
        # Extract guide
        guide = self._extract_guide(soup)
        
        # Extract progression
        progression = self._extract_progression(soup)
        
        # Extract ability references (just names/IDs for ability scraper)
        ability_references = self._extract_ability_references(soup)
        
        # Build class data structure
        class_data = {
            "class": {
                "id": class_id,
                "name": class_name,
                "tier": metadata.get('tier', 1),
                "difficulty": metadata.get('difficulty', 1),
                "main_role": metadata.get('main_role', ''),
                "secondary_role": metadata.get('secondary_role'),
                "image_url": metadata.get('image_url', ''),
                "description": description,
                "requirements": requirements,
                "guide": guide,
                "progression": progression,
                "ability_references": ability_references
            }
        }
        
        return class_data
    
    def _extract_basic_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract basic metadata from the page if metadata file is missing."""
        metadata = {}
        
        # Try to extract class name from heading
        heading = soup.select_one('h2.mat-card-title')
        if heading:
            # Remove bullet point or other symbols
            name = heading.text.strip()
            name = re.sub(r'^[∙•·]\s*', '', name)
            metadata['name'] = name
            metadata['id'] = sanitize_id(name)
        
        # Try to extract tier
        tier_container = soup.select_one('label:-soup-contains("Tier:") + app-rating')
        if tier_container:
            filled_circles = tier_container.select('.fa-solid.fa-circle')
            metadata['tier'] = len(filled_circles)
        
        # Try to extract difficulty
        diff_container = soup.select_one('label:-soup-contains("Difficulty:") + app-rating')
        if diff_container:
            filled_stars = diff_container.select('.fa-solid.fa-star')
            metadata['difficulty'] = len(filled_stars)
        
        # Try to extract roles
        main_role = soup.select_one('label:-soup-contains("Main role:") + span')
        if main_role:
            metadata['main_role'] = main_role.text.strip()
        
        sec_role = soup.select_one('label:-soup-contains("Secondary role:") + span')
        if sec_role and sec_role.text.strip() != '--':
            metadata['secondary_role'] = sec_role.text.strip()
        
        return metadata
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract class description."""
        # extract_from_mat_card returns text content directly
        description = extract_from_mat_card(soup, "Description")
        if description:
            return clean_text(description)
        
        # Fallback: look for description in other formats
        desc_section = soup.select_one('.description-section')
        if desc_section:
            return clean_text(desc_section.get_text(separator="\n"))
        
        return ""
    
    def _extract_requirements(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract class requirements."""
        # extract_from_mat_card returns text content directly
        req_text = extract_from_mat_card(soup, "Requirements")
        if req_text:
            return extract_requirements(req_text)
        
        # Default to no requirements
        return {"type": "none"}
    
    def _extract_guide(self, soup: BeautifulSoup) -> str:
        """Extract class guide."""
        # extract_from_mat_card returns text content directly
        guide_text = extract_from_mat_card(soup, "Guide")
        if guide_text:
            return clean_text(guide_text)
        
        return ""
    
    def _extract_progression(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract class progression."""
        progression = []
        
        # Find progression element
        prog_element = soup.select_one('app-progression')
        if not prog_element:
            logger.warning("No progression element found")
            return progression
        
        # Find all progression rows
        rows = prog_element.select('.d-flex.flex-column.flex-md-row')
        
        for row in rows:
            label_elem = row.select_one('.label')
            value_elem = row.select_one('.flex-fill')
            
            if not label_elem or not value_elem:
                continue
            
            label = label_elem.text.strip()
            value = value_elem.text.strip()
            
            # Parse the progression entry
            prog_entry = self._parse_progression_entry(label, value)
            if prog_entry:
                # Check if we need to merge with existing level
                existing = next((p for p in progression if p['level'] == prog_entry['level']), None)
                if existing:
                    existing['benefits'].extend(prog_entry['benefits'])
                else:
                    progression.append(prog_entry)
        
        # Sort by level
        progression.sort(key=lambda x: x['level'])
        return progression
    
    def _parse_progression_entry(self, label: str, value: str) -> Optional[Dict[str, Any]]:
        """Parse a single progression entry."""
        # Extract level
        level = None
        if "Key Ability" in label:
            level = 1
        else:
            level_match = re.match(r'Level (\d+)', label)
            if level_match:
                level = int(level_match.group(1))
        
        if level is None:
            return None
        
        # Determine benefit type and create benefit object
        benefits = []
        
        if "Key Ability" in label or "Ability" in label:
            # Normalize ability IDs, especially for Secret Arts
            ability_id = self._normalize_ability_id(value)
            benefits.append({
                "type": "ability",
                "ability_id": ability_id
            })
        
        elif "Skills" in label:
            # Parse skill benefits with structured data extraction
            skill_data = self._parse_skills_from_description(value, 5)
            benefits.append(skill_data)
        
        elif "Heart" in label:
            # Parse actual attribute from description instead of using "heart"
            actual_attribute = self._parse_attribute_from_description(value)
            if actual_attribute:
                benefits.append({
                    "type": "attribute",
                    "attribute": actual_attribute,
                    "description": value
                })
            else:
                # Fallback to attribute choice if multiple attributes mentioned
                attributes = self._extract_attribute_options(value)
                if len(attributes) > 1:
                    benefits.append({
                        "type": "attribute_choice",
                        "choose": 1,
                        "options": self._create_structured_attribute_options(attributes, value),
                        "description": value
                    })
                else:
                    # Keep original broken format for debugging
                    benefits.append({
                        "type": "attribute",
                        "attribute": "heart",
                        "description": value
                    })
        
        elif "Soul" in label:
            # Soul attribute choice
            attributes = self._extract_attribute_options(value)
            benefits.append({
                "type": "attribute_choice",
                "choose": 1,
                "options": self._create_structured_attribute_options(attributes, value),
                "description": value
            })
        
        else:
            # Generic text benefit
            benefits.append({
                "type": "text",
                "description": value
            })
        
        return {
            "level": level,
            "benefits": benefits
        }
    
    def _extract_attribute_options(self, text: str) -> List[str]:
        """Extract attribute options from text like '+1 to Power, Focus, Agility or Toughness.'"""
        # Common attribute names
        attributes = []
        
        # Look for common patterns
        if "Power" in text:
            attributes.append("Power")
        if "Focus" in text:
            attributes.append("Focus")
        if "Agility" in text:
            attributes.append("Agility")
        if "Toughness" in text:
            attributes.append("Toughness")
        if "Fitness" in text:
            attributes.append("Fitness")
        if "Mind" in text:
            attributes.append("Mind")
        
        return attributes if attributes else ["various"]
    
    def _extract_ability_references(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract ability references (names only, for ability scraper to handle)."""
        ability_refs = []
        seen_abilities = set()
        
        # Find all expansion panels (abilities)
        panels = soup.select('mat-expansion-panel')
        
        for panel in panels:
            # Get the header
            header = panel.select_one('mat-expansion-panel-header')
            if not header:
                continue
            
            # Get the ability name
            title = header.select_one('span.fs-5.fw-bold')
            if not title:
                continue
            
            ability_name = title.text.strip()
            
            # Skip non-ability panels
            if not ability_name.startswith('○'):
                continue
            
            # Clean the ability name
            ability_name = ability_name.replace('○', '').strip()
            ability_id = self._normalize_ability_id(ability_name)
            
            # Skip if we've already seen this ability
            if ability_id in seen_abilities:
                continue
            
            seen_abilities.add(ability_id)
            
            # Determine if this is a key ability
            is_key = panel.select_one('.mat-expansion-panel-body app-key-ability') is not None
            
            ability_ref = {
                "id": ability_id,
                "name": ability_name,
                "type": "key_ability" if is_key else "ability"
            }
            
            ability_refs.append(ability_ref)
            logger.debug(f"Found ability reference: {ability_name} ({'key' if is_key else 'regular'})")
        
        return ability_refs
    
    def _parse_attribute_from_description(self, description: str) -> Optional[str]:
        """Parse actual attribute name from description text."""
        # Look for patterns like "You gain +1 Reason"
        attributes = ["Focus", "Agility", "Toughness", "Power", "Fitness", "Reason", "Awareness", "Presence", "Cunning"]
        
        for attr in attributes:
            if re.search(rf'\+\d+\s+{attr}', description, re.IGNORECASE):
                return attr
        
        # Look for other patterns like "gain +1 to X"
        match = re.search(r'gain \+\d+ (?:to )?(Focus|Agility|Toughness|Power|Fitness|Reason|Awareness|Presence|Cunning)', description, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _parse_skills_from_description(self, description: str, points: int) -> Dict[str, Any]:
        """Extract structured skills data from description."""
        result = {
            "type": "skills",
            "points": points,
            "description": description
        }
        
        # Extract eligible skills using common patterns
        skill_patterns = [
            r'skill points (?:to spend )?(?:on|in) ([^.]+?)(?:\.|,|$)',
            r'points in ([^.]+?)(?:\.|,| or )',
            r'\+\d+ skill points in ([^.]+?)(?:\.|,| You)',
        ]
        
        eligible_skills = []
        for pattern in skill_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                skills_text = match.group(1)
                # Parse comma-separated skills
                skills = [s.strip() for s in re.split(r',| or ', skills_text)]
                eligible_skills.extend(skills)
                break
        
        if eligible_skills:
            result["eligible_skills"] = eligible_skills
        
        # Check for expertise conversion
        if "exchange" in description.lower() and "expertise" in description.lower():
            result["can_convert_to_expertise"] = True
            # Extract conversion ratio
            ratio_match = re.search(r'(\d+)\s+expertise\s+points', description)
            if ratio_match:
                result["conversion_ratio"] = int(ratio_match.group(1))
        
        # Check for DM approval requirements
        if "dm approval" in description.lower() or "approval" in description.lower():
            result["expert_knowledge_needs_approval"] = True
        
        return result
    
    def _create_structured_attribute_options(self, options_list: List[str], description: str) -> List[Dict[str, Any]]:
        """Create structured attribute choice options."""
        structured_options = []
        
        # Extract value from description (usually +1)
        value_match = re.search(r'\+(\d+)', description)
        value = int(value_match.group(1)) if value_match else 1
        
        for option in options_list:
            structured_options.append({
                "attribute": option,
                "value": value
            })
        
        return structured_options
    
    def _normalize_ability_id(self, name: str) -> str:
        """Create normalized ability ID with consistent Secret Art handling."""
        if name.startswith("Secret Art:"):
            # Remove "Secret Art:" and normalize the rest
            art_name = name.replace("Secret Art:", "").strip()
            art_id = sanitize_id(art_name)
            return f"secret_art__{art_id}"  # Double underscore
        else:
            return sanitize_id(name)


def main():
    """Example usage of the ClassParser."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Parse class HTML files')
    parser.add_argument('input_dir', help='Directory containing HTML files to parse')
    parser.add_argument('--output-dir', default='parsed_classes', help='Output directory')
    parser.add_argument('--format', choices=['yaml', 'json'], default='yaml', help='Output format')
    args = parser.parse_args()
    
    parser = ClassParser(output_dir=args.output_dir)
    parser.parse_directory(args.input_dir, output_format=args.format)


if __name__ == "__main__":
    main()