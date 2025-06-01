#!/usr/bin/env python3
"""
Base parser class for converting HTML to structured YAML data.
"""
import os
import yaml
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class BaseParser(ABC):
    """
    Base class for all parsers. Handles common functionality like:
    - HTML loading and parsing
    - YAML serialization
    - Schema validation
    - Common HTML element extraction patterns
    """
    
    def __init__(self, output_dir: str = "parsed_data", version: str = "0.10.1"):
        """
        Initialize the parser.
        
        Args:
            output_dir: Base directory for saving parsed files
            version: Version identifier for organizing output
        """
        self.version = version
        self.base_output_dir = Path(output_dir)
        self.output_dir = self.base_output_dir / version / self.get_data_type()
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create/update latest symlink if this is the newest version
        latest_link = self.base_output_dir / "latest"
        version_dir = self.base_output_dir / version
        
        if not latest_link.exists() or self._should_update_latest(version):
            if latest_link.is_symlink() or latest_link.exists():
                latest_link.unlink()
            latest_link.symlink_to(version_dir.name)
            logger.info(f"Updated 'latest' symlink to point to {version}")
        
        logger.info(f"Initialized {self.__class__.__name__}")
        logger.info(f"Version: {self.version}")
        logger.info(f"Output directory: {self.output_dir}")
    
    @abstractmethod
    def get_data_type(self) -> str:
        """Return the data type this parser handles (e.g., "classes", "items")."""
        pass
    
    @abstractmethod
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Parse a detail page into structured data.
        
        Args:
            soup: BeautifulSoup object of the detail page
            metadata: Optional metadata from the fetcher
            
        Returns:
            Parsed data dictionary
        """
        pass
    
    def parse_file(self, html_path: str, metadata_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Parse an HTML file into structured data.
        
        Args:
            html_path: Path to the HTML file
            metadata_path: Optional path to metadata JSON file
            
        Returns:
            Parsed data dictionary or None if parsing fails
        """
        logger.info(f"Parsing file: {html_path}")
        
        try:
            # Load HTML
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Load metadata if provided
            metadata = None
            if metadata_path and os.path.exists(metadata_path):
                import json
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                logger.debug(f"Loaded metadata from {metadata_path}")
            
            # Parse the content
            data = self.parse_detail(soup, metadata)
            
            if data:
                logger.info(f"Successfully parsed {html_path}")
                return data
            else:
                logger.warning(f"No data extracted from {html_path}")
                return None
                
        except Exception as e:
            logger.error(f"Error parsing {html_path}: {e}")
            return None
    
    def to_yaml(self, data: Dict[str, Any], output_name: str) -> str:
        """
        Save parsed data to a YAML file.
        
        Args:
            data: Data dictionary to save
            output_name: Name for the output file (without extension)
            
        Returns:
            Path to the saved YAML file
        """
        output_path = self.output_dir / f"{output_name}.yaml"
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            logger.info(f"Saved to {output_path}")
            return str(output_path)
        except Exception as e:
            logger.error(f"Error saving to YAML: {e}")
            return ""
    
    def parse_directory(self, html_dir: str, output_format: str = "yaml") -> Dict[str, str]:
        """
        Parse all HTML files in a directory.
        
        Args:
            html_dir: Directory containing HTML files
            output_format: Output format ("yaml" or "json")
            
        Returns:
            Dictionary mapping item IDs to output file paths
        """
        html_path = Path(html_dir)
        if not html_path.exists():
            logger.error(f"Directory not found: {html_dir}")
            return {}
        
        results = {}
        html_files = list(html_path.glob("*.html"))
        
        # Filter out special files like _list_page.html
        html_files = [f for f in html_files if not f.name.startswith("_")]
        
        logger.info(f"Found {len(html_files)} HTML files to parse")
        
        for html_file in html_files:
            # Check for corresponding metadata file
            meta_file = html_file.with_suffix('.meta.json')
            metadata_path = str(meta_file) if meta_file.exists() else None
            
            # Parse the file
            data = self.parse_file(str(html_file), metadata_path)
            
            if data:
                # Use the ID from the data if available, otherwise use filename
                item_id = data.get('id', html_file.stem)
                
                if output_format == "yaml":
                    output_path = self.to_yaml(data, item_id)
                else:
                    # JSON output
                    output_path = self.output_dir / f"{item_id}.json"
                    import json
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    output_path = str(output_path)
                
                if output_path:
                    results[item_id] = output_path
        
        logger.info(f"Successfully parsed {len(results)} files")
        return results
    
    def _should_update_latest(self, version: str) -> bool:
        """
        Determine if the latest symlink should be updated to point to this version.
        
        Args:
            version: Version to check
            
        Returns:
            True if latest should be updated
        """
        latest_link = self.base_output_dir / "latest"
        
        if not latest_link.exists():
            return True
        
        try:
            current_latest = latest_link.readlink().name
            # Simple version comparison - assumes format like "0.10.1"
            current_parts = [int(x) for x in current_latest.split('.')]
            new_parts = [int(x) for x in version.split('.')]
            
            # Compare version parts
            for i in range(max(len(current_parts), len(new_parts))):
                current_val = current_parts[i] if i < len(current_parts) else 0
                new_val = new_parts[i] if i < len(new_parts) else 0
                
                if new_val > current_val:
                    return True
                elif new_val < current_val:
                    return False
            
            return False  # Versions are equal
        except (ValueError, OSError):
            # If version parsing fails or symlink is broken, update it
            return True
    
    # Common parsing utilities
    
    @staticmethod
    def extract_from_mat_card(soup: BeautifulSoup, title_text: str) -> Optional[str]:
        """
        Extract content from a mat-card with the given title.
        
        Args:
            soup: BeautifulSoup object to search in
            title_text: Text to search for in mat-card-title
            
        Returns:
            Extracted text content or None
        """
        card_title = soup.find('mat-card-title', string=lambda s: s and title_text in s)
        if card_title:
            mat_card = card_title.find_parent('mat-card')
            if mat_card:
                content_elem = mat_card.select_one('mat-card-content')
                if content_elem:
                    # Look for linkify div first
                    linkify_div = content_elem.select_one('div[linkify]')
                    if linkify_div:
                        return linkify_div.get_text(strip=True, separator="\n")
                    # Otherwise get all text
                    return content_elem.get_text(strip=True, separator="\n")
        return None
    
    @staticmethod
    def extract_keywords(element) -> List[str]:
        """Extract keywords from mat-chips or comma-separated text."""
        keywords = []
        
        # Try to find mat-chips first
        chips = element.select('mat-chip .mdc-evolution-chip__text-label')
        if chips:
            keywords = [chip.get_text(strip=True) for chip in chips]
        else:
            # Fall back to text parsing
            text = element.get_text(strip=True)
            if text and text not in ['--', '-', 'None']:
                # Split by common separators
                import re
                keywords = [kw.strip() for kw in re.split(r'[,;]', text) if kw.strip()]
        
        # Filter out placeholder values
        keywords = [kw for kw in keywords if kw not in ['--', '-']]
        
        return keywords
    
    @staticmethod
    def sanitize_id(name: str) -> str:
        """Convert a name to a valid ID."""
        import re
        # Remove leading/trailing whitespace and convert to lowercase
        clean_name = name.strip().lower()
        # Replace spaces and special characters with underscores
        clean_name = re.sub(r'[^\w\s-]', '', clean_name)
        clean_name = re.sub(r'[-\s]+', '_', clean_name)
        # Remove multiple underscores
        clean_name = re.sub(r'_+', '_', clean_name)
        # Remove leading/trailing underscores
        clean_name = clean_name.strip('_')
        return clean_name
    
    @staticmethod
    def extract_costs(text: str) -> Dict[str, Union[int, str]]:
        """
        Extract cost information from text.
        
        Returns dict with keys like 'mana', 'ap', 'rp', 'other'
        """
        import re
        costs = {}
        
        # Common cost patterns
        cost_patterns = {
            'mana': r'(\d+|X)\s*(?:MP|Mana|mana)',
            'ap': r'(\d+)\s*(?:AP|Action Points?)',
            'rp': r'(\d+|NaN)\s*(?:RP|Reaction Points?)',
        }
        
        for cost_type, pattern in cost_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1)
                if value.isdigit():
                    costs[cost_type] = int(value)
                else:
                    costs[cost_type] = value  # 'X' or 'NaN'
        
        # Check for other costs
        if 'and' in text.lower() or '+' in text:
            # There might be additional costs
            costs['other'] = text
        
        return costs