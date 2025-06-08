#!/usr/bin/env python3
"""
Google Sheets exporter for class data.
"""

import logging
from typing import List, Dict, Any, Optional

from .base_sheets_exporter import BaseSheetsExporter

logger = logging.getLogger(__name__)


class ClassesExporter(BaseSheetsExporter):
    """Exporter for class data to Google Sheets."""
    
    def export_data_type(self, data_type: str = "classes", sheet_name: Optional[str] = None):
        """Export classes data to a Google Sheet."""
        if sheet_name is None:
            sheet_name = "Classes"
        
        logger.info(f"Exporting {data_type} to sheet: {sheet_name}")
        
        # Get all class files
        files = self.get_data_files(data_type)
        if not files:
            logger.warning(f"No {data_type} files found")
            return
        
        logger.info(f"Found {len(files)} class files")
        
        # Prepare data for export
        all_data = []
        headers = [
            "ID", "Name", "Tier", "Difficulty", "Main Role", "Secondary Role",
            "Requirements", "Image URL", "Description", "Guide",
            "Level 1 Abilities", "Level 2 Abilities", "Level 3 Abilities",
            "Level 4 Abilities", "Level 5 Abilities", "Level 6 Abilities",
            "Level 7 Abilities", "Level 8 Abilities"
        ]
        all_data.append(headers)
        
        # Process each class file
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data or 'class' not in data:
                logger.warning(f"Invalid class data in {file_path}")
                continue
            
            class_data = data['class']
            row = self._extract_class_row(class_data)
            all_data.append(row)
        
        # Create and populate sheet
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported {len(files)} classes to {sheet_name}")
    
    def _extract_class_row(self, class_data: Dict[str, Any]) -> List[str]:
        """Extract a single class row for the spreadsheet."""
        # Basic info
        row = [
            class_data.get('id', ''),
            class_data.get('name', ''),
            str(class_data.get('tier', '')),
            str(class_data.get('difficulty', '')),
            class_data.get('main_role', ''),
            class_data.get('secondary_role', ''),
            self._format_requirements(class_data.get('requirements', [])),
            class_data.get('image_url', ''),
            self._truncate_text(class_data.get('description', ''), 30000),
            self._truncate_text(class_data.get('guide', ''), 30000)
        ]
        
        # Extract progression abilities by level (levels 1-8)
        progression_data = class_data.get('progression', [])
        level_abilities = {}
        
        for level_info in progression_data:
            level = level_info.get('level', 0)
            benefits = level_info.get('benefits', [])
            abilities = [
                benefit.get('ability_id', '')
                for benefit in benefits
                if benefit.get('type') == 'ability'
            ]
            level_abilities[level] = ', '.join(abilities)
        
        # Add level columns (1-8)
        for level in range(1, 9):
            row.append(level_abilities.get(level, ''))
        
        return row
    
    def _format_requirements(self, requirements: List[str]) -> str:
        """Format requirements list as a string."""
        if not requirements:
            return ""
        return "; ".join(requirements)
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to fit in spreadsheet cells."""
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
    
    def export_class_abilities(self, sheet_name: str = "Class Abilities"):
        """Export a detailed breakdown of class abilities by level."""
        logger.info(f"Exporting class abilities breakdown to: {sheet_name}")
        
        files = self.get_data_files("classes")
        if not files:
            return
        
        headers = [
            "Class ID", "Class Name", "Level", "Benefit Type", 
            "Ability ID", "Ability Name", "Description", "Details"
        ]
        all_data = [headers]
        
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data or 'class' not in data:
                continue
                
            class_data = data['class']
            class_id = class_data.get('id', '')
            class_name = class_data.get('name', '')
            
            # Get ability references for names
            ability_refs = {}
            for ref in class_data.get('ability_references', []):
                ability_refs[ref.get('id', '')] = ref.get('name', '')
            
            # Process progression
            for level_info in class_data.get('progression', []):
                level = level_info.get('level', 0)
                
                for benefit in level_info.get('benefits', []):
                    benefit_type = benefit.get('type', '')
                    
                    if benefit_type == 'ability':
                        ability_id = benefit.get('ability_id', '')
                        ability_name = ability_refs.get(ability_id, ability_id)
                        
                        row = [
                            class_id, class_name, str(level), benefit_type,
                            ability_id, ability_name, "", ""
                        ]
                        all_data.append(row)
                    
                    elif benefit_type in ['attribute', 'attribute_choice', 'skills']:
                        # Non-ability benefits
                        details = self._format_benefit_details(benefit)
                        row = [
                            class_id, class_name, str(level), benefit_type,
                            "", "", benefit.get('description', ''), details
                        ]
                        all_data.append(row)
        
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported class abilities breakdown to {sheet_name}")
    
    def _format_benefit_details(self, benefit: Dict[str, Any]) -> str:
        """Format benefit details as a string."""
        details = []
        
        if 'attribute' in benefit:
            details.append(f"Attribute: {benefit['attribute']}")
        if 'options' in benefit:
            details.append(f"Options: {', '.join(benefit['options'])}")
        if 'choose' in benefit:
            details.append(f"Choose: {benefit['choose']}")
        if 'points' in benefit:
            details.append(f"Points: {benefit['points']}")
        
        return "; ".join(details)
    
    def export_all_class_sheets(self):
        """Export all class-related sheets."""
        self.export_data_type("classes", "Classes")
        self.export_class_abilities("Class Abilities")