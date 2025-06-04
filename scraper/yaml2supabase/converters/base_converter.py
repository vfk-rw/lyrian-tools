"""
Base converter class for YAML to SQL conversion.
"""

import json
import yaml
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class BaseConverter(ABC):
    """Abstract base class for all data type converters."""
    
    def __init__(self):
        self.processed_ids: Set[str] = set()
        self.relationships: List[Dict[str, Any]] = []
        
    @abstractmethod
    def get_table_name(self) -> str:
        """Return the target table name."""
        pass
        
    @abstractmethod
    def convert_record(self, data: Dict[str, Any], version: str) -> Dict[str, Any]:
        """Convert a single YAML record to database format."""
        pass
        
    def convert_directory(self, directory: Path, version: str) -> str:
        """Convert all YAML files in a directory to SQL."""
        sql_lines = []
        
        # Add header
        sql_lines.append(f"-- {self.get_table_name()} data")
        sql_lines.append(f"-- Generated from: {directory}")
        sql_lines.append("")
        
        # Process all YAML files
        yaml_files = list(directory.glob("*.yaml")) + list(directory.glob("*.yml"))
        # Skip index files
        yaml_files = [f for f in yaml_files if not f.name.endswith('_index.yaml')]
        
        if not yaml_files:
            return ""
            
        records = []
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
                continue
                
        # Generate INSERT statement
        if records:
            sql_lines.append(self._generate_insert_sql(records))
            
        # Add relationship inserts if any
        if hasattr(self, 'relationships') and self.relationships:
            sql_lines.append("")
            sql_lines.append("-- Relationships")
            sql_lines.extend(self._generate_relationship_sql())
            
        return '\n'.join(sql_lines)
        
    def _generate_insert_sql(self, records: List[Dict[str, Any]]) -> str:
        """Generate INSERT SQL for multiple records."""
        if not records:
            return ""
            
        table_name = self.get_table_name()
        columns = list(records[0].keys())
        
        sql_lines = [f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES"]
        
        value_rows = []
        for record in records:
            values = []
            for col in columns:
                value = record[col]
                values.append(self._format_value(value))
            value_rows.append(f"({', '.join(values)})")
            
        sql_lines.append(',\n'.join(value_rows))
        sql_lines.append("ON CONFLICT (id, version) DO UPDATE SET")
        
        # Generate update columns (exclude id and version)
        update_cols = [col for col in columns if col not in ['id', 'version', 'created_at']]
        update_parts = [f"  {col} = EXCLUDED.{col}" for col in update_cols]
        sql_lines.append(',\n'.join(update_parts) + ";")
        
        return '\n'.join(sql_lines)
        
    def _generate_relationship_sql(self) -> List[str]:
        """Generate SQL for relationship tables."""
        # To be implemented by subclasses that need it
        return []
        
    def _format_value(self, value: Any) -> str:
        """Format a value for SQL insertion."""
        if value is None:
            return "NULL"
        elif isinstance(value, bool):
            return "TRUE" if value else "FALSE"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, list):
            if not value:
                return "ARRAY[]::TEXT[]"
            # Format as PostgreSQL array
            array_values = [self._escape_string(str(v)) for v in value]
            formatted_values = [f"'{v}'" for v in array_values]
            return f"ARRAY[{', '.join(formatted_values)}]"
        elif isinstance(value, dict):
            # Format as JSONB
            return f"'{json.dumps(value, ensure_ascii=False)}'::jsonb"
        else:
            # String value
            return f"'{self._escape_string(str(value))}'"
            
    def _escape_string(self, value: str) -> str:
        """Escape single quotes in strings."""
        return value.replace("'", "''")
        
    def safe_get(self, data: Dict[str, Any], key: str, default: Any = None) -> Any:
        """Safely get a value from dict, returning None for empty values."""
        value = data.get(key, default)
        if value in ['', '-', [], {}]:
            return None
        return value