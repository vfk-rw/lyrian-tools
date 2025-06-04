"""
Converter for keyword data.
"""

from typing import Any, Dict
from .base_converter import BaseConverter


class KeywordConverter(BaseConverter):
    """Convert keyword YAML files to SQL."""
    
    def get_table_name(self) -> str:
        return "parsed_data_keywords"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a keyword record."""
        
        return {
            'id': data.get('id'),
            'name': data.get('name'),
            'type': self.safe_get(data, 'type'),
            'description': self.safe_get(data, 'description'),
            'variable_value': self.safe_get(data, 'variable_value'),
            'related_keywords': data.get('related_keywords', []),
            'version': version
        }