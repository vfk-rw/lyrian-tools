#!/usr/bin/env python3
"""
Rulebook Parser - Convert rulebook HTML to Markdown

This parser converts the rulebook HTML into a clean markdown document,
preserving formatting, headers, lists, and tables.
"""

import re
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

from core.parser import BaseParser

logger = logging.getLogger(__name__)


class RulebookParser(BaseParser):
    """Parser for converting rulebook HTML to Markdown"""
    
    def get_data_type(self) -> str:
        """Return the data type this parser handles"""
        return "rulebook"
    
    def parse_detail(self, soup: BeautifulSoup, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Parse rulebook HTML into markdown content"""
        logger.debug("Parsing rulebook HTML")
        
        # Find the main article content using the specific selector
        content_area = soup.select_one('#content > app-rulebook > div > article')
        
        if not content_area:
            logger.warning("Could not find main content div, trying article[linkify]")
            content_area = soup.select_one('article[linkify]')
            
        if not content_area:
            logger.warning("Could not find article content, trying app-rulebook")
            content_area = soup.select_one('app-rulebook')
            
        if not content_area:
            logger.error("Could not find any content area")
            return {"content": ""}
        
        # Convert to markdown
        markdown_content = self._convert_to_markdown(content_area)
        
        # Clean up the markdown
        markdown_content = self._clean_markdown(markdown_content)
        
        return {
            "content": markdown_content,
            "version": metadata.get("version", "unknown") if metadata else "unknown"
        }
    
    def _convert_to_markdown(self, element: Tag) -> str:
        """Convert HTML elements to markdown recursively"""
        markdown_parts = []
        
        for child in element.children:
            if isinstance(child, NavigableString):
                text = str(child).strip()
                if text:
                    markdown_parts.append(text)
            elif isinstance(child, Tag):
                md = self._process_element(child)
                if md:
                    markdown_parts.append(md)
        
        return '\n\n'.join(part for part in markdown_parts if part.strip())
    
    def _process_element(self, element: Tag) -> str:
        """Process a single HTML element and convert to markdown"""
        tag_name = element.name.lower()
        
        # Headers
        if tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            level = int(tag_name[1])
            text = element.get_text(strip=True)
            return f"\n\n{'#' * level} {text}\n"
        
        # Paragraphs
        elif tag_name == 'p':
            content = self._process_inline_content(element)
            return f"{content}\n" if content else ""
        
        # Lists
        elif tag_name == 'ul':
            list_content = self._process_unordered_list(element)
            return f"\n{list_content}\n" if list_content else ""
        elif tag_name == 'ol':
            list_content = self._process_ordered_list(element)
            return f"\n{list_content}\n" if list_content else ""
        
        # Tables and figures containing tables
        elif tag_name == 'table':
            return self._process_table(element)
        elif tag_name == 'figure' and 'table' in element.get('class', []):
            # Handle <figure class="table"> wrappers
            table = element.find('table')
            if table:
                return self._process_table(table)
            return ''
        
        # Material Design cards
        elif tag_name == 'mat-card':
            return self._process_mat_card(element)
        
        # Divs and other containers
        elif tag_name in ['div', 'section', 'mat-sidenav-content', 'mat-card-content']:
            # Recursively process children
            return self._convert_to_markdown(element)
        
        # Bold/italic
        elif tag_name in ['strong', 'b']:
            return f"**{element.get_text(strip=True)}**"
        elif tag_name in ['em', 'i']:
            return f"*{element.get_text(strip=True)}*"
        
        # Links
        elif tag_name == 'a':
            text = element.get_text(strip=True)
            href = element.get('href', '')
            if href:
                return f"[{text}]({href})"
            return text
        
        # Line breaks
        elif tag_name == 'br':
            return '\n'
        
        # Skip these tags
        elif tag_name in ['script', 'style', 'mat-toolbar', 'mat-sidenav']:
            return ''
        
        # Default: just get the text
        else:
            text = element.get_text(strip=True)
            if text:
                logger.debug(f"Unhandled tag: {tag_name}")
            return text
    
    def _process_inline_content(self, element: Tag) -> str:
        """Process inline content with formatting"""
        parts = []
        
        for child in element.children:
            if isinstance(child, NavigableString):
                parts.append(str(child))
            elif isinstance(child, Tag):
                if child.name in ['strong', 'b']:
                    parts.append(f"**{child.get_text()}**")
                elif child.name in ['em', 'i']:
                    parts.append(f"*{child.get_text()}*")
                elif child.name == 'a':
                    text = child.get_text()
                    href = child.get('href', '')
                    if href:
                        parts.append(f"[{text}]({href})")
                    else:
                        parts.append(text)
                elif child.name == 'br':
                    parts.append('\n')
                else:
                    parts.append(child.get_text())
        
        return ''.join(parts).strip()
    
    def _process_unordered_list(self, ul: Tag) -> str:
        """Process unordered list to markdown"""
        items = []
        for li in ul.find_all('li', recursive=False):
            text = self._process_inline_content(li)
            if text:
                items.append(f"- {text}")
        return '\n'.join(items)
    
    def _process_ordered_list(self, ol: Tag) -> str:
        """Process ordered list to markdown"""
        items = []
        for i, li in enumerate(ol.find_all('li', recursive=False), 1):
            text = self._process_inline_content(li)
            if text:
                items.append(f"{i}. {text}")
        return '\n'.join(items)
    
    def _process_table(self, table: Tag) -> str:
        """Process HTML table to markdown table"""
        rows = []
        
        # Process header if exists
        thead = table.find('thead')
        tbody = table.find('tbody') or table
        
        # If no explicit thead, treat first row as header
        all_rows = tbody.find_all('tr')
        if not thead and all_rows:
            first_row = all_rows[0]
            headers = []
            for cell in first_row.find_all(['td', 'th']):
                headers.append(cell.get_text(strip=True))
            if headers:
                rows.append('| ' + ' | '.join(headers) + ' |')
                rows.append('|' + '|'.join([' --- ' for _ in headers]) + '|')
                # Skip first row since we used it as header
                all_rows = all_rows[1:]
        elif thead:
            # Process explicit header
            headers = []
            for th in thead.find_all(['th', 'td']):
                headers.append(th.get_text(strip=True))
            if headers:
                rows.append('| ' + ' | '.join(headers) + ' |')
                rows.append('|' + '|'.join([' --- ' for _ in headers]) + '|')
        
        # Process remaining rows
        for tr in all_rows:
            cells = []
            for td in tr.find_all(['td', 'th']):
                cell_text = td.get_text(strip=True)
                # Handle empty cells or dashes
                if not cell_text or cell_text == '-':
                    cell_text = '-'
                cells.append(cell_text)
            if cells:
                rows.append('| ' + ' | '.join(cells) + ' |')
        
        return '\n' + '\n'.join(rows) + '\n' if rows else ''
    
    def _process_mat_card(self, card: Tag) -> str:
        """Process Material Design card"""
        parts = []
        
        # Get title if present
        title = card.find('mat-card-title')
        if title:
            title_text = title.get_text(strip=True)
            # Determine header level based on context
            parts.append(f"## {title_text}")
        
        # Get content
        content = card.find('mat-card-content')
        if content:
            content_md = self._convert_to_markdown(content)
            if content_md:
                parts.append(content_md)
        
        return '\n\n'.join(parts)
    
    def _clean_markdown(self, content: str) -> str:
        """Clean up the generated markdown"""
        # Remove excessive blank lines (more than 2)
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Fix spacing around headers - ensure headers have proper spacing
        content = re.sub(r'\n*(#{1,6} [^\n]+)\n*', r'\n\n\1\n\n', content)
        
        # Ensure paragraphs have proper spacing
        content = re.sub(r'([^\n])\n([A-Z][^#\-\d])', r'\1\n\n\2', content)
        
        # Clean up list formatting
        content = re.sub(r'\n+(\- |\d+\. )', r'\n\1', content)
        
        # Remove leading/trailing whitespace
        content = content.strip()
        
        # Ensure the content starts and ends cleanly
        content = re.sub(r'^\n+', '', content)
        content = re.sub(r'\n+$', '', content)
        
        return content
    
    def parse_directory(self, html_dir: str, output_format: str = "yaml") -> Dict[str, str]:
        """Parse rulebook HTML file and save as markdown"""
        html_path = Path(html_dir)
        if not html_path.exists():
            logger.error(f"Directory not found: {html_dir}")
            return {}
        
        # Look for rulebook.html
        rulebook_file = html_path / "rulebook.html"
        if not rulebook_file.exists():
            logger.error(f"Rulebook file not found: {rulebook_file}")
            return {}
        
        # Check for metadata
        meta_file = rulebook_file.with_suffix('.meta.json')
        metadata = None
        if meta_file.exists():
            import json
            with open(meta_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        
        # Parse the file
        result = self.parse_file(str(rulebook_file), str(meta_file) if meta_file.exists() else None)
        
        if result and result.get("content"):
            # Save as markdown
            output_path = self.output_dir / "rulebook.md"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"# Lyrian Chronicles Rulebook\n\n")
                f.write(f"*Version: {result.get('version', 'unknown')}*\n\n")
                f.write(result["content"])
            
            logger.info(f"Saved rulebook to {output_path}")
            return {"rulebook": str(output_path)}
        
        return {}


def main():
    """Command-line interface for rulebook parser"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Parse rulebook HTML to Markdown")
    parser.add_argument("html_dir", help="Directory containing rulebook HTML")
    parser.add_argument("--version", default="latest", help="Game version")
    parser.add_argument("--output-dir", default="parsed_data", help="Output directory")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create parser
    rulebook_parser = RulebookParser(output_dir=args.output_dir, version=args.version)
    
    # Parse the rulebook
    results = rulebook_parser.parse_directory(args.html_dir)
    
    if results:
        logger.info("Rulebook parsing complete")
    else:
        logger.error("Failed to parse rulebook")


if __name__ == "__main__":
    main()