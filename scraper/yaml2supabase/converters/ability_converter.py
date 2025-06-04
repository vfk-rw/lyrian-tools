"""
Converter for ability data with parent-child relationships and keyword normalization.
"""

from typing import Any, Dict, List, Optional
from .base_converter import BaseConverter


class AbilityConverter(BaseConverter):
    """Convert ability YAML files to SQL with proper relationships."""
    
    def __init__(self):
        super().__init__()
        self.ability_keywords: List[Dict[str, str]] = []
        
    def get_table_name(self) -> str:
        return "parsed_data_abilities"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert an ability record and extract keyword relationships."""
        
        ability_id = data.get('id')
        
        # Extract keyword relationships
        keywords = data.get('keywords', [])
        if keywords and isinstance(keywords, list):
            for keyword in keywords:
                # Normalize keyword to ID format (lowercase, replace spaces with underscores)
                keyword_id = self._normalize_keyword_id(keyword)
                self.ability_keywords.append({
                    'ability_id': ability_id,
                    'keyword_id': keyword_id
                })
        
        # Handle parent ability for crafting subdivisions
        parent_ability_id = None
        subdivision_index = None
        
        if data.get('type') == 'crafting_ability' and data.get('parent_ability'):
            parent_ability_id = data['parent_ability']
            subdivision_index = data.get('subdivision_index')
        
        # Convert associated abilities for key abilities
        associated_abilities = None
        if data.get('type') == 'key_ability' and 'associated_abilities' in data:
            associated_abilities = data['associated_abilities']
        
        return {
            'id': ability_id,
            'name': data.get('name'),
            'type': data.get('type'),
            'keywords': keywords,  # Keep as array for now
            'range': self.safe_get(data, 'range'),
            'description': self.safe_get(data, 'description'),
            'costs': self.safe_get(data, 'costs'),
            'requirements': data.get('requirements', []),
            'benefits': data.get('benefits', []) if data.get('type') == 'key_ability' else None,
            'associated_abilities': associated_abilities,
            'gathering_cost': self.safe_get(data, 'gathering_cost'),
            'gathering_bonus': self.safe_get(data, 'gathering_bonus'),
            'parent_ability_id': parent_ability_id,
            'subdivision_index': subdivision_index,
            'version': version
        }
        
    def _normalize_keyword_id(self, keyword: str) -> str:
        """Normalize a keyword string to ID format."""
        # Common keyword normalization
        return keyword.lower().replace(' ', '_').replace('-', '_')
        
    def _generate_relationship_sql(self) -> List[str]:
        """Generate SQL for ability-keyword relationships."""
        sql_lines = []
        
        if self.ability_keywords:
            sql_lines.append("\n-- Ability-Keyword relationships")
            sql_lines.append("INSERT INTO parsed_data_ability_keywords (ability_id, keyword_id) VALUES")
            
            # Deduplicate relationships
            unique_rels = []
            seen = set()
            for rel in self.ability_keywords:
                key = (rel['ability_id'], rel['keyword_id'])
                if key not in seen:
                    seen.add(key)
                    unique_rels.append(rel)
            
            value_rows = []
            for rel in unique_rels:
                value_rows.append(
                    f"('{rel['ability_id']}', '{rel['keyword_id']}')"
                )
            
            sql_lines.append(',\n'.join(value_rows))
            sql_lines.append("ON CONFLICT (ability_id, keyword_id) DO NOTHING;")
            
        return sql_lines