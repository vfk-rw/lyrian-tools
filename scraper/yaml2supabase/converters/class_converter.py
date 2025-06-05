"""
Converter for class data with ability relationships.
"""

from typing import Any, Dict, List
from .base_converter import BaseConverter


class ClassConverter(BaseConverter):
    """Convert class YAML files to SQL with ability relationships."""
    
    def __init__(self):
        super().__init__()
        self.class_abilities: List[Dict[str, Any]] = []
        self.class_key_abilities: List[Dict[str, Any]] = []
        
    def get_table_name(self) -> str:
        return "parsed_data_classes"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a class record and extract ability relationships."""
        
        # Handle nested structure - extract class data from 'class' key if present
        if 'class' in data:
            data = data['class']
        
        class_id = data.get('id')
        
        # Extract ability relationships from progression
        if 'progression' in data and isinstance(data['progression'], list):
            for level_data in data['progression']:
                if isinstance(level_data, dict):
                    level = level_data.get('level', 1)
                    benefits = level_data.get('benefits', [])
                    
                    for benefit in benefits:
                        if isinstance(benefit, dict) and benefit.get('type') == 'ability':
                            ability_id = benefit.get('ability_id')
                            if ability_id:
                                # Check if it's a key ability by looking in ability_references
                                is_key_ability = False
                                if 'ability_references' in data:
                                    for ref in data['ability_references']:
                                        if ref.get('id') == ability_id and ref.get('type') == 'key_ability':
                                            is_key_ability = True
                                            break
                                
                                if is_key_ability:
                                    self.class_key_abilities.append({
                                        'class_id': class_id,
                                        'key_ability_id': ability_id
                                    })
                                else:
                                    self.class_abilities.append({
                                        'class_id': class_id,
                                        'ability_id': ability_id,
                                        'level_gained': level
                                    })
        
        return {
            'id': class_id,
            'name': data.get('name'),
            'tier': data.get('tier'),
            'difficulty': self.safe_get(data, 'difficulty'),
            'main_role': self.safe_get(data, 'main_role'),
            'secondary_role': self.safe_get(data, 'secondary_role'),
            'description': self.safe_get(data, 'description'),
            'requirements': data.get('requirements', []),
            'skills': data.get('skills', {}),
            'attributes': self.safe_get(data, 'attributes'),
            'defenses': self.safe_get(data, 'defenses'),
            'option_attrs': self.safe_get(data, 'option_attrs'),
            'special': self.safe_get(data, 'special'),
            'image_url': self.safe_get(data, 'image_url'),
            'version': version
        }
        
    def _generate_relationship_sql(self) -> List[str]:
        """Generate SQL for class-ability relationships."""
        sql_lines = []
        
        # Class-Ability relationships
        if self.class_abilities:
            sql_lines.append("\n-- Class-Ability relationships")
            sql_lines.append("INSERT INTO parsed_data_class_abilities (class_id, ability_id, level_gained) VALUES")
            
            value_rows = []
            for rel in self.class_abilities:
                value_rows.append(
                    f"('{rel['class_id']}', '{rel['ability_id']}', {rel.get('level_gained', 1)})"
                )
            
            sql_lines.append(',\n'.join(value_rows))
            sql_lines.append("ON CONFLICT (class_id, ability_id) DO NOTHING;")
            
        # Class-Key Ability relationships
        if self.class_key_abilities:
            sql_lines.append("\n-- Class-Key Ability relationships")
            sql_lines.append("INSERT INTO parsed_data_class_key_abilities (class_id, key_ability_id) VALUES")
            
            value_rows = []
            for rel in self.class_key_abilities:
                value_rows.append(
                    f"('{rel['class_id']}', '{rel['key_ability_id']}')"
                )
            
            sql_lines.append(',\n'.join(value_rows))
            sql_lines.append("ON CONFLICT (class_id, key_ability_id) DO NOTHING;")
            
        return sql_lines