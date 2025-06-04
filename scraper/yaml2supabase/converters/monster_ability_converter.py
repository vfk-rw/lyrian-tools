"""
Converter for monster ability data.
"""

from typing import Any, Dict
from .base_converter import BaseConverter


class MonsterAbilityConverter(BaseConverter):
    """Convert monster ability YAML files to SQL."""
    
    def get_table_name(self) -> str:
        return "parsed_data_monster_abilities_list"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a monster ability record."""
        
        record = {
            'id': data.get('id'),
            'name': data.get('name'),
            'type': data.get('type', 'monster_ability'),  # Default to monster_ability
            'description': data.get('description'),
            'version': version
        }
        
        # Handle keywords (for active actions)
        keywords = data.get('keywords', [])
        if keywords and isinstance(keywords, list):
            record['keywords'] = keywords
        
        # Handle range (for active actions)
        if 'range' in data:
            record['range'] = data['range']
            
        # Handle AP cost (for active actions)
        if 'ap_cost' in data:
            record['ap_cost'] = self._safe_int(data['ap_cost'])
        elif 'costs' in data and isinstance(data['costs'], dict):
            # Extract AP from costs dict
            record['ap_cost'] = self._safe_int(data['costs'].get('ap'))
            
        # Handle requirements (for active actions)
        requirements = data.get('requirements', [])
        if requirements and isinstance(requirements, list):
            record['requirements'] = requirements
            
        return record
    
    def _safe_int(self, value) -> int:
        """Safely convert value to int, handling strings and None."""
        if value is None or value == '' or value == '--':
            return None
        try:
            if isinstance(value, str):
                if value.isdigit():
                    return int(value)
                else:
                    return None
            return int(value)
        except (ValueError, TypeError):
            return None