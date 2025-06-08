#!/usr/bin/env python3
"""
Google Sheets exporter for item data.
"""

import logging
from typing import List, Dict, Any, Optional

from .base_sheets_exporter import BaseSheetsExporter

logger = logging.getLogger(__name__)


class ItemsExporter(BaseSheetsExporter):
    """Exporter for item data to Google Sheets."""
    
    def export_data_type(self, data_type: str = "items", sheet_name: Optional[str] = None):
        """Export items data to a Google Sheet."""
        if sheet_name is None:
            sheet_name = "Items"
        
        logger.info(f"Exporting {data_type} to sheet: {sheet_name}")
        
        # Get all item files
        files = self.get_data_files(data_type)
        if not files:
            logger.warning(f"No {data_type} files found")
            return
        
        logger.info(f"Found {len(files)} item files")
        
        # Prepare data for export
        all_data = []
        headers = [
            "ID", "Name", "Type", "Sub Type", "Cost", "Burden", 
            "Activation Cost", "Shell Size", "Fuel Usage",
            "Crafting Points", "Crafting Type", "Description", "Image URL"
        ]
        all_data.append(headers)
        
        # Process each item file
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data:
                logger.warning(f"Invalid item data in {file_path}")
                continue
            
            row = self._extract_item_row(data)
            all_data.append(row)
        
        # Create and populate sheet
        self.add_sheet(sheet_name)
        self.clear_sheet(sheet_name)
        self.write_data(sheet_name, all_data)
        self.format_headers(sheet_name, len(headers))
        self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported {len(files)} items to {sheet_name}")
    
    def _extract_item_row(self, item_data: Dict[str, Any]) -> List[str]:
        """Extract a single item row for the spreadsheet."""
        return [
            item_data.get('id', ''),
            item_data.get('name', ''),
            item_data.get('type', ''),
            item_data.get('sub_type', ''),
            item_data.get('cost', ''),
            item_data.get('burden', ''),
            str(item_data.get('activation_cost', '') or ''),
            str(item_data.get('shell_size', '') or ''),
            str(item_data.get('fuel_usage', '') or ''),
            str(item_data.get('crafting_points', '') or ''),
            str(item_data.get('crafting_type', '') or ''),
            self._truncate_text(item_data.get('description', ''), 30000),
            item_data.get('image_url', '')
        ]
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to fit in spreadsheet cells."""
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
    
    def export_items_by_type(self):
        """Export separate sheets for each item type."""
        files = self.get_data_files("items")
        if not files:
            return
        
        # Group items by type
        items_by_type = {}
        
        for file_path in files:
            data = self.load_yaml_file(file_path)
            if not data:
                continue
            
            item_type = data.get('type', 'unknown')
            if item_type not in items_by_type:
                items_by_type[item_type] = []
            items_by_type[item_type].append(data)
        
        # Create a sheet for each type
        for item_type, items in items_by_type.items():
            sheet_name = f"Items - {item_type}"
            logger.info(f"Creating sheet: {sheet_name} with {len(items)} items")
            
            headers = [
                "ID", "Name", "Sub Type", "Cost", "Burden", 
                "Activation Cost", "Shell Size", "Fuel Usage",
                "Crafting Points", "Crafting Type", "Description", "Image URL"
            ]
            all_data = [headers]
            
            for item_data in items:
                row = self._extract_item_row_for_type(item_data)
                all_data.append(row)
            
            self.add_sheet(sheet_name)
            self.clear_sheet(sheet_name)
            self.write_data(sheet_name, all_data)
            self.format_headers(sheet_name, len(headers))
            self.auto_resize_columns(sheet_name)
        
        logger.info(f"Successfully exported items by type to {len(items_by_type)} sheets")
    
    def _extract_item_row_for_type(self, item_data: Dict[str, Any]) -> List[str]:
        """Extract item row without the type column (since it's grouped by type)."""
        return [
            item_data.get('id', ''),
            item_data.get('name', ''),
            item_data.get('sub_type', ''),
            item_data.get('cost', ''),
            item_data.get('burden', ''),
            str(item_data.get('activation_cost', '') or ''),
            str(item_data.get('shell_size', '') or ''),
            str(item_data.get('fuel_usage', '') or ''),
            str(item_data.get('crafting_points', '') or ''),
            str(item_data.get('crafting_type', '') or ''),
            self._truncate_text(item_data.get('description', ''), 30000),
            item_data.get('image_url', '')
        ]
    
    def export_all_item_sheets(self):
        """Export all item-related sheets."""
        self.export_data_type("items", "All Items")
        self.export_items_by_type()