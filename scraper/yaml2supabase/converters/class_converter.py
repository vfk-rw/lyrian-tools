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
        
        class_id = data.get('id')
        
        # Extract ability relationships from skills
        if 'skills' in data and isinstance(data['skills'], dict):
            # Extract key abilities (level 1 abilities)
            key_abilities = data['skills'].get('key_abilities', [])
            if isinstance(key_abilities, list):
                for ability in key_abilities:
                    if isinstance(ability, dict) and 'id' in ability:
                        self.class_key_abilities.append({
                            'class_id': class_id,
                            'key_ability_id': ability['id']
                        })
                    elif isinstance(ability, str):
                        # Sometimes it's just an ID string
                        self.class_key_abilities.append({
                            'class_id': class_id,
                            'key_ability_id': ability
                        })
                        
            # Extract level abilities if they exist
            level_abilities = data['skills'].get('level_abilities', [])
            if isinstance(level_abilities, list):
                for level_data in level_abilities:
                    if isinstance(level_data, dict):
                        level = level_data.get('level', 1)
                        abilities = level_data.get('abilities', [])
                        for ability in abilities:
                            if isinstance(ability, dict) and 'id' in ability:
                                self.class_abilities.append({
                                    'class_id': class_id,
                                    'ability_id': ability['id'],
                                    'level_gained': level
                                })
                            elif isinstance(ability, str):
                                self.class_abilities.append({
                                    'class_id': class_id,
                                    'ability_id': ability,
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