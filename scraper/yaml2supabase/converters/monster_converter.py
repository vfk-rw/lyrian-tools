"""
Converter for monster data with ability relationships.
"""

from typing import Any, Dict, List
from .base_converter import BaseConverter


class MonsterConverter(BaseConverter):
    """Convert monster YAML files to SQL with ability relationships."""
    
    def __init__(self):
        super().__init__()
        self.monster_abilities: List[Dict[str, Any]] = []
        self.monster_active_actions: List[Dict[str, Any]] = []
        
    def get_table_name(self) -> str:
        return "parsed_data_monsters"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a monster record and extract ability relationships."""
        
        monster_id = data.get('id')
        
        # Extract ability relationships
        if 'abilities' in data and isinstance(data['abilities'], list):
            for ability in data['abilities']:
                if isinstance(ability, dict) and 'id' in ability:
                    self.monster_abilities.append({
                        'monster_id': monster_id,
                        'ability_id': ability['id']
                    })
                elif isinstance(ability, str):
                    # Sometimes it's just an ID string
                    self.monster_abilities.append({
                        'monster_id': monster_id,
                        'ability_id': ability
                    })
                    
        # Extract active action relationships  
        if 'active_actions' in data and isinstance(data['active_actions'], list):
            for action in data['active_actions']:
                if isinstance(action, dict) and 'id' in action:
                    self.monster_active_actions.append({
                        'monster_id': monster_id,
                        'action_id': action['id']
                    })
                elif isinstance(action, str):
                    # Sometimes it's just an ID string
                    self.monster_active_actions.append({
                        'monster_id': monster_id,
                        'action_id': action
                    })
        
        # Convert main monster data
        record = {
            'id': monster_id,
            'name': data.get('name'),
            'danger_level': data.get('danger_level'),
            'type': data.get('type'),
            'image_url': data.get('image_url'),
            'version': version
        }
        
        # Process stats if present
        if 'stats' in data and isinstance(data['stats'], dict):
            stats = data['stats']
            record.update({
                'hp': self._safe_int(stats.get('hp')),
                'ap': self._safe_int(stats.get('ap')),
                'rp': self._safe_int(stats.get('rp')),
                'mana': self._safe_int(stats.get('mana')),
                'evasion': self._extract_evasion(stats.get('evasion')),
                'guard': self._extract_guard(stats.get('guard')),
                'movement': self._extract_movement(stats.get('movement_speed')),
            })
            
            # Extract attributes (fitness, cunning, reason, etc.)
            attributes = {}
            for attr in ['fitness', 'cunning', 'reason', 'awareness', 'presence', 'power', 'agility', 'toughness', 'focus']:
                if attr in stats:
                    attributes[attr] = self._safe_int(stats[attr])
            if attributes:
                record['attributes'] = attributes
                
            # Extract basic attacks
            basic_attacks = []
            if 'light_attack' in stats:
                basic_attacks.append({
                    'type': 'light',
                    'description': stats['light_attack']
                })
            if 'heavy_attack' in stats:
                basic_attacks.append({
                    'type': 'heavy', 
                    'description': stats['heavy_attack']
                })
            if basic_attacks:
                record['basic_attacks'] = basic_attacks
        
        # Add description fields
        record['description'] = data.get('appearance', data.get('description'))
        record['lore'] = data.get('habitat', data.get('lore'))
        record['strategy'] = data.get('strategy')
        record['difficulty_to_run'] = data.get('difficulty_to_run')
        
        # Extract harvestable materials
        materials = data.get('harvestable_materials', [])
        if materials and isinstance(materials, list):
            record['harvestable_materials'] = materials
            
        return record
    
    def _safe_int(self, value) -> int:
        """Safely convert value to int, handling strings and None."""
        if value is None or value == '' or value == '--':
            return None
        try:
            # Handle strings like "+2" or "1d4+5"
            if isinstance(value, str):
                # For initiative and complex values, just store as 0 for now
                if '+' in value and 'd' not in value:
                    return int(value.replace('+', ''))
                elif value.isdigit():
                    return int(value)
                else:
                    return None
            return int(value)
        except (ValueError, TypeError):
            return None
    
    def _extract_evasion(self, value) -> int:
        """Extract evasion number from formats like '8/17' or '8'."""
        if not value:
            return None
        try:
            if isinstance(value, str) and '/' in value:
                return int(value.split('/')[0])
            return self._safe_int(value)
        except (ValueError, TypeError):
            return None
    
    def _extract_guard(self, value) -> int:
        """Extract guard number from formats like '3/7' or '3'."""
        if not value:
            return None
        try:
            if isinstance(value, str) and '/' in value:
                return int(value.split('/')[0])
            return self._safe_int(value)
        except (ValueError, TypeError):
            return None
    
    def _extract_movement(self, value) -> int:
        """Extract movement number from formats like '20ft' or '20'."""
        if not value:
            return None
        try:
            if isinstance(value, str):
                # Remove 'ft' and other text
                number_str = value.replace('ft', '').replace('feet', '').strip()
                if number_str.isdigit():
                    return int(number_str)
            return self._safe_int(value)
        except (ValueError, TypeError):
            return None
    
    def get_relationship_sql(self) -> List[str]:
        """Generate SQL for monster-ability relationships."""
        sql_statements = []
        
        # Monster abilities
        if self.monster_abilities:
            values = []
            for rel in self.monster_abilities:
                monster_id = self._format_value(rel['monster_id'])
                ability_id = self._format_value(rel['ability_id'])
                values.append(f"({monster_id}, {ability_id})")
            
            if values:
                sql = f"""INSERT INTO parsed_data_monster_abilities (monster_id, ability_id) VALUES
{', '.join(values)}
ON CONFLICT DO NOTHING;"""
                sql_statements.append(sql)
        
        # Monster active actions
        if self.monster_active_actions:
            values = []
            for rel in self.monster_active_actions:
                monster_id = self._format_value(rel['monster_id'])
                action_id = self._format_value(rel['action_id'])
                values.append(f"({monster_id}, {action_id})")
            
            if values:
                sql = f"""INSERT INTO parsed_data_monster_active_actions (monster_id, action_id) VALUES
{', '.join(values)}
ON CONFLICT DO NOTHING;"""
                sql_statements.append(sql)
        
        return sql_statements