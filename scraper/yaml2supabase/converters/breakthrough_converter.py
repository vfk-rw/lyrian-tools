"""
Converter for breakthrough data.
"""

from typing import Any, Dict
from .base_converter import BaseConverter


class BreakthroughConverter(BaseConverter):
    """Convert breakthrough YAML files to SQL."""
    
    def get_table_name(self) -> str:
        return "parsed_data_breakthroughs"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a breakthrough record."""
        
        return {
            'id': data.get('id'),
            'name': data.get('name'),
            'cost': data.get('cost'),
            'requirements': data.get('requirements', []),
            'description': self.safe_get(data, 'description'),
            'version': version
        }