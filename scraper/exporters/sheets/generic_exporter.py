#!/usr/bin/env python3
"""
Generic Google Sheets exporter for various data types.
Handles races, keywords, breakthroughs, monsters, and monster-abilities.
"""

import logging
from typing import List, Dict, Any

from .base_sheets_exporter import BaseSheetsExporter

logger = logging.getLogger(__name__)


class GenericExporter(BaseSheetsExporter):
    """Generic exporter for various data types to Google Sheets."""
    
    def export_races(self, sheet_name: str = "Races"):
        """Export races data (both primary and sub-races)."""
        logger.info(f"Exporting races to sheet: {sheet_name}")
        
        # Get files from both primary and sub directories
        primary_files = list((self.parsed_data_dir / "races" / "primary").glob("*.yaml"))
        sub_files = list((self.parsed_data_dir / "races" / "sub").glob("*.yaml"))
        
        if not primary_files and not sub_files:
            logger.warning("No race files found")
            return
        
        logger.info(f"Found {len(primary_files)} primary races, {len(sub_files)} sub-races")
        
        headers = [
            "ID", "Name", "Type", "Description", "Image URL", "Benefits Summary", "Abilities"
        ]
        all_data = [headers]
        
        # Process primary races
        for file_path in primary_files:
            data = self.load_yaml_file(file_path)
            if data:
                row = self._extract_race_row(data)
                all_data.append(row)
        
        # Process sub-races
        for file_path in sub_files:
            data = self.load_yaml_file(file_path)
            if data:
                row = self._extract_race_row(data)
                all_data.append(row)
        
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported races to {sheet_name}")
    
    def _extract_race_row(self, race_data: Dict[str, Any]) -> List[str]:
        """Extract a race row for the spreadsheet."""
        # Get abilities from benefits
        abilities = []
        other_benefits = []
        
        for benefit in race_data.get('benefits', []):
            if benefit.get('type') == 'ability':
                ability_name = benefit.get('name', benefit.get('value', ''))
                abilities.append(ability_name)
            else:
                benefit_desc = self._format_benefit(benefit)
                if benefit_desc:
                    other_benefits.append(benefit_desc)
        
        return [
            race_data.get('id', ''),
            race_data.get('name', ''),
            race_data.get('type', ''),
            self._truncate_text(race_data.get('description', ''), 400),
            race_data.get('image_url', ''),
            "; ".join(other_benefits),
            "; ".join(abilities)
        ]
    
    def _format_benefit(self, benefit: Dict[str, Any]) -> str:
        """Format a benefit as a readable string."""
        benefit_type = benefit.get('type', '')
        
        if benefit_type == 'attribute_choice':
            options = benefit.get('options', [])
            if options:
                attr = options[0].get('attribute', '')
                return f"+1 {attr}"
        elif benefit_type == 'skills':
            points = benefit.get('points', 0)
            return f"+{points} skill points"
        elif benefit_type == 'proficiency':
            value = benefit.get('value', '')
            return f"Proficiency: {value}"
        
        return f"{benefit_type}: {benefit.get('description', '')}"
    
    def export_keywords(self, sheet_name: str = "Keywords"):
        """Export keywords data."""
        self._export_simple_data("keywords", sheet_name, [
            "ID", "Name", "Type", "Description", "Variable Value", "Related Keywords"
        ], self._extract_keyword_row)
    
    def _extract_keyword_row(self, data: Dict[str, Any]) -> List[str]:
        """Extract a keyword row."""
        return [
            data.get('id', ''),
            data.get('name', ''),
            data.get('type', ''),
            self._truncate_text(data.get('description', ''), 500),
            data.get('variable_value', ''),
            self._format_list(data.get('related_keywords', []))
        ]
    
    def export_breakthroughs(self, sheet_name: str = "Breakthroughs"):
        """Export breakthroughs data."""
        self._export_simple_data("breakthroughs", sheet_name, [
            "ID", "Name", "Cost", "Requirements", "Description"
        ], self._extract_breakthrough_row)
    
    def _extract_breakthrough_row(self, data: Dict[str, Any]) -> List[str]:
        """Extract a breakthrough row."""
        return [
            data.get('id', ''),
            data.get('name', ''),
            str(data.get('cost', '')),
            self._format_list(data.get('requirements', [])),
            self._truncate_text(data.get('description', ''), 500)
        ]
    
    def export_monsters(self, sheet_name: str = "Monsters"):
        """Export monsters data."""
        self._export_simple_data("monsters", sheet_name, [
            "ID", "Name", "Danger Level", "Type", "HP", "AP", "RP", "Mana",
            "Evasion", "Guard", "Movement", "Lore", "Strategy", "Abilities"
        ], self._extract_monster_row)
    
    def _extract_monster_row(self, data: Dict[str, Any]) -> List[str]:
        """Extract a monster row."""
        # Get abilities
        abilities = []
        for ability in data.get('abilities', []):
            abilities.append(ability.get('name', ''))
        for action in data.get('actions', []):
            abilities.append(action.get('name', ''))
        
        return [
            data.get('id', ''),
            data.get('name', ''),
            str(data.get('danger_level', '')),
            data.get('type', ''),
            str(data.get('hp', '')),
            str(data.get('ap', '')),
            str(data.get('rp', '')),
            str(data.get('mana', '')),
            str(data.get('evasion', '')),
            str(data.get('guard', '')),
            str(data.get('movement', '')),
            self._truncate_text(data.get('lore', ''), 300),
            self._truncate_text(data.get('strategy', ''), 300),
            "; ".join(abilities)
        ]
    
    def export_monster_abilities(self, sheet_name: str = "Monster Abilities"):
        """Export monster abilities data."""
        self._export_simple_data("monster-abilities", sheet_name, [
            "ID", "Name", "Type", "Keywords", "Range", "Description",
            "Requirements", "AP Cost", "RP Cost"
        ], self._extract_monster_ability_row)
    
    def _extract_monster_ability_row(self, data: Dict[str, Any]) -> List[str]:
        """Extract a monster ability row."""
        costs = data.get('costs', {})
        return [
            data.get('id', ''),
            data.get('name', ''),
            data.get('type', ''),
            self._format_list(data.get('keywords', [])),
            data.get('range', ''),
            self._truncate_text(data.get('description', ''), 500),
            self._format_list(data.get('requirements', [])),
            str(costs.get('ap', '')),
            str(costs.get('rp', ''))
        ]
    
    def _export_simple_data(self, data_type: str, sheet_name: str, 
                           headers: List[str], extract_func):
        """Generic export function for simple data types."""
        logger.info(f"Exporting {data_type} to sheet: {sheet_name}")
        
        files = self.get_data_files(data_type)
        if not files:
            logger.warning(f"No {data_type} files found")
            return
        
        logger.info(f"Found {len(files)} {data_type} files")
        
        all_data = [headers]
        
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data:
                continue
            
            row = extract_func(data)
            all_data.append(row)
        
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported {len(files)} {data_type} to {sheet_name}")
    
    def _format_list(self, items: List[str]) -> str:
        """Format a list as a comma-separated string."""
        if not items:
            return ""
        return ", ".join(str(item) for item in items)
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to fit in spreadsheet cells."""
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
    
    def export_all_generic_sheets(self):
        """Export all generic data type sheets."""
        self.export_races()
        self.export_keywords()
        self.export_breakthroughs()
        self.export_monsters()
        self.export_monster_abilities()