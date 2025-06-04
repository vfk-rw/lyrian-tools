"""
Converter for item data.
"""

from typing import Any, Dict
from .base_converter import BaseConverter


class ItemConverter(BaseConverter):
    """Convert item YAML files to SQL."""
    
    def get_table_name(self) -> str:
        return "parsed_data_items"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert an item record."""
        
        return {
            'id': data.get('id'),
            'name': data.get('name'),
            'type': data.get('type'),
            'subtype': self.safe_get(data, 'subtype'),
            'cost': self.safe_get(data, 'cost'),
            'burden': self.safe_get(data, 'burden'),
            'description': self.safe_get(data, 'description'),
            'activation_cost': self.safe_get(data, 'activation_cost'),
            'crafting_points': self.safe_get(data, 'crafting_points'),
            'crafting_type': self.safe_get(data, 'crafting_type'),
            'fuel_usage': self.safe_get(data, 'fuel_usage'),
            'shell_size': self.safe_get(data, 'shell_size'),
            'version': version
        }