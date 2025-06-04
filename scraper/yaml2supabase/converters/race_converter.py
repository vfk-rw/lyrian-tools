"""
Converter for race data with sub-race relationships.
"""

from typing import Any, Dict, List
from pathlib import Path
import yaml
from .base_converter import BaseConverter


class RaceConverter(BaseConverter):
    """Convert race YAML files to SQL with sub-race relationships."""
    
    def __init__(self):
        super().__init__()
        self.race_abilities: List[Dict[str, str]] = []
        
    def get_table_name(self) -> str:
        return "parsed_data_races"
        
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a race record and extract ability relationships."""
        
        race_id = data.get('id')
        
        # Extract racial ability relationships from benefits
        benefits = data.get('benefits', [])
        if isinstance(benefits, list):
            for benefit in benefits:
                if isinstance(benefit, dict) and benefit.get('type') == 'ability':
                    ability_id = benefit.get('id')
                    if ability_id:
                        self.race_abilities.append({
                            'race_id': race_id,
                            'ability_id': ability_id
                        })
        
        return {
            'id': race_id,
            'name': data.get('name'),
            'type': data.get('type'),  # primary or sub
            'primary_race': self.safe_get(data, 'primary_race'),  # For sub-races
            'description': self.safe_get(data, 'description'),
            'benefits': benefits,  # Keep as JSONB
            'version': version
        }
    
    def convert_directory(self, directory: Path, version: str) -> str:
        """Override to handle subdirectory structure for races."""
        sql_lines = []
        
        # Add header
        sql_lines.append(f"-- {self.get_table_name()} data")
        sql_lines.append(f"-- Generated from: {directory}")
        sql_lines.append("")
        
        # Process primary and sub directories
        records = []
        for subdir_name in ['primary', 'sub']:
            subdir = directory / subdir_name
            if not subdir.exists():
                continue
                
            # Process all YAML files in subdirectory
            yaml_files = list(subdir.glob("*.yaml")) + list(subdir.glob("*.yml"))
            
            for yaml_file in sorted(yaml_files):
                try:
                    with open(yaml_file, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                        
                    if data:
                        record = self.convert_record(data, version)
                        if record and record.get('id') not in self.processed_ids:
                            records.append(record)
                            self.processed_ids.add(record['id'])
                            
                except Exception as e:
                    print(f"Error processing {yaml_file}: {e}")
        
        if not records:
            return ""
            
        # Generate INSERT statement
        sql_lines.append(self._generate_insert_sql(records))
        
        return '\n'.join(sql_lines)
        
    def _generate_relationship_sql(self) -> List[str]:
        """Generate SQL for race-ability relationships."""
        sql_lines = []
        
        if self.race_abilities:
            sql_lines.append("\n-- Race-Ability relationships")
            sql_lines.append("INSERT INTO parsed_data_race_abilities (race_id, ability_id) VALUES")
            
            value_rows = []
            for rel in self.race_abilities:
                value_rows.append(
                    f"('{rel['race_id']}', '{rel['ability_id']}')"
                )
            
            sql_lines.append(',\n'.join(value_rows))
            sql_lines.append("ON CONFLICT (race_id, ability_id) DO NOTHING;")
            
        return sql_lines