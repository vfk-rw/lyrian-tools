#!/usr/bin/env python3
"""
Google Sheets exporter for ability data.
"""

import logging
from typing import List, Dict, Any, Optional

from .base_sheets_exporter import BaseSheetsExporter

logger = logging.getLogger(__name__)


class AbilitiesExporter(BaseSheetsExporter):
    """Exporter for ability data to Google Sheets."""
    
    def export_data_type(self, data_type: str = "abilities", sheet_name: Optional[str] = None):
        """Export abilities data to a Google Sheet."""
        if sheet_name is None:
            sheet_name = "Abilities"
        
        logger.info(f"Exporting {data_type} to sheet: {sheet_name}")
        
        # Get all ability files (exclude index)
        files = self.get_data_files(data_type)
        if not files:
            logger.warning(f"No {data_type} files found")
            return
        
        logger.info(f"Found {len(files)} ability files")
        
        # Prepare data for export
        all_data = []
        headers = [
            "ID", "Name", "Type", "Keywords", "Range", "Description",
            "Requirements", "Combined Costs", "Mana Cost", "AP Cost", "RP Cost", "Other Costs",
            "Benefits", "Associated Abilities", "Parent Ability", "Subdivision Index",
            "Gathering Cost", "Gathering Bonus"
        ]
        all_data.append(headers)
        
        # Process each ability file
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data:
                logger.warning(f"Invalid ability data in {file_path}")
                continue
            
            row = self._extract_ability_row(data)
            all_data.append(row)
        
        # Create and populate sheet
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported {len(files)} abilities to {sheet_name}")
    
    def _extract_ability_row(self, ability_data: Dict[str, Any]) -> List[str]:
        """Extract a single ability row for the spreadsheet."""
        # Basic info
        row = [
            ability_data.get('id', ''),
            ability_data.get('name', ''),
            ability_data.get('type', ''),
            self._format_list(ability_data.get('keywords', [])),
            ability_data.get('range', ''),
            self._truncate_text(ability_data.get('description', ''), 500)
        ]
        
        # Requirements
        row.append(self._format_list(ability_data.get('requirements', [])))
        
        # Costs
        costs = ability_data.get('costs', {})
        row.append(self._format_combined_costs(costs))  # New combined costs column
        row.extend([
            str(costs.get('mana', '')),
            str(costs.get('ap', '')),
            str(costs.get('rp', '')),
            self._format_other_costs(costs)
        ])
        
        # Key ability specific fields
        row.append(self._format_list(ability_data.get('benefits', [])))
        row.append(self._format_associated_abilities(ability_data.get('associated_abilities', [])))
        
        # Crafting ability specific fields
        row.append(ability_data.get('parent_ability', ''))
        row.append(str(ability_data.get('subdivision_index', '')))
        
        # Gathering ability specific fields
        row.append(ability_data.get('gathering_cost', ''))
        row.append(ability_data.get('gathering_bonus', ''))
        
        return row
    
    def _format_list(self, items: List[str]) -> str:
        """Format a list as a comma-separated string."""
        if not items:
            return ""
        return ", ".join(str(item) for item in items)
    
    def _format_combined_costs(self, costs: Dict[str, Any]) -> str:
        """Format all costs into a single readable string like 'AP: 2 MP: 4 RP: 1'."""
        if not costs:
            return ""
        
        cost_parts = []
        
        # Standard costs in preferred order - check if key exists and value is not None
        if 'ap' in costs and costs['ap'] is not None:
            cost_parts.append(f"AP: {costs['ap']}")
        if 'mana' in costs and costs['mana'] is not None:
            cost_parts.append(f"MP: {costs['mana']}")
        if 'rp' in costs and costs['rp'] is not None:
            cost_parts.append(f"RP: {costs['rp']}")
        
        # Other costs
        for key, value in costs.items():
            if key not in ['mana', 'ap', 'rp'] and value is not None and value != "":
                # Format key nicely (e.g., "other" -> "Other")
                formatted_key = key.replace('_', ' ').title()
                cost_parts.append(f"{formatted_key}: {value}")
        
        return " ".join(cost_parts)
    
    def _format_other_costs(self, costs: Dict[str, Any]) -> str:
        """Format non-standard costs."""
        other_costs = []
        
        for key, value in costs.items():
            if key not in ['mana', 'ap', 'rp'] and value:
                other_costs.append(f"{key}: {value}")
        
        return "; ".join(other_costs)
    
    def _format_associated_abilities(self, abilities: List[Dict[str, Any]]) -> str:
        """Format associated abilities from key abilities."""
        if not abilities:
            return ""
        
        formatted = []
        for ability in abilities:
            name = ability.get('name', '')
            ability_id = ability.get('id', '')
            if name and ability_id:
                formatted.append(f"{name} ({ability_id})")
            elif name:
                formatted.append(name)
            elif ability_id:
                formatted.append(ability_id)
        
        return "; ".join(formatted)
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to fit in spreadsheet cells."""
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
    
    def export_abilities_by_type(self):
        """Export separate sheets for each ability type."""
        files = self.get_data_files("abilities")
        if not files:
            return
        
        # Group abilities by type
        abilities_by_type = {}
        
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data:
                continue
            
            ability_type = data.get('type', 'unknown')
            if ability_type not in abilities_by_type:
                abilities_by_type[ability_type] = []
            abilities_by_type[ability_type].append(data)
        
        # Create a sheet for each type
        for ability_type, abilities in abilities_by_type.items():
            sheet_name = f"Abilities - {ability_type.replace('_', ' ').title()}"
            logger.info(f"Creating sheet: {sheet_name} with {len(abilities)} abilities")
            
            # Customize headers based on type
            headers = self._get_headers_for_type(ability_type)
            all_data = [headers]
            
            for ability_data in abilities:
                row = self._extract_ability_row_for_type(ability_data, ability_type)
                all_data.append(row)
            
            self.add_sheet(sheet_name)
            self.clear_sheet(sheet_name)
            self.write_data(sheet_name, all_data)
            self.format_headers(sheet_name, len(headers))
            self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported abilities by type to {len(abilities_by_type)} sheets")
    
    def _get_headers_for_type(self, ability_type: str) -> List[str]:
        """Get appropriate headers for a specific ability type."""
        base_headers = ["ID", "Name", "Keywords", "Description"]
        
        if ability_type == "true_ability":
            return base_headers + [
                "Range", "Requirements", "Combined Costs", "Mana Cost", "AP Cost", "RP Cost", "Other Costs"
            ]
        elif ability_type == "key_ability":
            return base_headers + [
                "Benefits", "Associated Abilities"
            ]
        elif ability_type == "crafting_ability":
            return base_headers + [
                "Cost", "Parent Ability", "Subdivision Index"
            ]
        elif ability_type == "gathering_ability":
            return base_headers + [
                "Requirements", "Gathering Cost", "Gathering Bonus"
            ]
        else:
            # Unknown type, use all headers
            return [
                "ID", "Name", "Type", "Keywords", "Range", "Description",
                "Requirements", "Combined Costs", "Mana Cost", "AP Cost", "RP Cost", "Other Costs",
                "Benefits", "Associated Abilities", "Parent Ability", "Subdivision Index",
                "Gathering Cost", "Gathering Bonus"
            ]
    
    def _extract_ability_row_for_type(self, ability_data: Dict[str, Any], ability_type: str) -> List[str]:
        """Extract ability row customized for specific type."""
        base_row = [
            ability_data.get('id', ''),
            ability_data.get('name', ''),
            self._format_list(ability_data.get('keywords', [])),
            self._truncate_text(ability_data.get('description', ''), 800)
        ]
        
        if ability_type == "true_ability":
            costs = ability_data.get('costs', {})
            return base_row + [
                ability_data.get('range', ''),
                self._format_list(ability_data.get('requirements', [])),
                self._format_combined_costs(costs),
                str(costs.get('mana', '')),
                str(costs.get('ap', '')),
                str(costs.get('rp', '')),
                self._format_other_costs(costs)
            ]
        elif ability_type == "key_ability":
            return base_row + [
                self._format_list(ability_data.get('benefits', [])),
                self._format_associated_abilities(ability_data.get('associated_abilities', []))
            ]
        elif ability_type == "crafting_ability":
            return base_row + [
                ability_data.get('cost', ''),
                ability_data.get('parent_ability', ''),
                str(ability_data.get('subdivision_index', ''))
            ]
        elif ability_type == "gathering_ability":
            return base_row + [
                self._format_list(ability_data.get('requirements', [])),
                ability_data.get('gathering_cost', ''),
                ability_data.get('gathering_bonus', '')
            ]
        else:
            # Fall back to full row
            return self._extract_ability_row(ability_data)
    
    def export_all_ability_sheets(self):
        """Export all ability-related sheets."""
        self.export_data_type("abilities", "All Abilities")
        self.export_abilities_by_type()