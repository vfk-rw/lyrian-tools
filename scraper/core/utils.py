#!/usr/bin/env python3
"""
Common utilities for scraping and parsing Lyrian Chronicles data.
"""
import re
import logging
from typing import Dict, List, Optional, Union, Any
from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)


def sanitize_id(name: str) -> str:
    """
    Convert a name to a valid ID for use in filenames and YAML keys.
    
    Args:
        name: The name to sanitize
        
    Returns:
        A sanitized ID string
    """
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


def extract_from_mat_card(soup: BeautifulSoup, title_text: str) -> Optional[str]:
    """
    Extract content from a mat-card with the given title.
    
    Args:
        soup: BeautifulSoup object to search in
        title_text: Text to search for in mat-card-title
        
    Returns:
        Extracted text content or None
    """
    # Find mat-card with matching title
    card_title = soup.find('mat-card-title', string=lambda s: s and title_text in s)
    if not card_title:
        return None
    
    mat_card = card_title.find_parent('mat-card')
    if not mat_card:
        return None
    
    content_elem = mat_card.select_one('mat-card-content')
    if not content_elem:
        return None
    
    # Look for linkify div first (common pattern)
    linkify_div = content_elem.select_one('div[linkify]')
    if linkify_div:
        return linkify_div.get_text(strip=True, separator="\n")
    
    # Otherwise get all text from content
    return content_elem.get_text(strip=True, separator="\n")


def extract_keywords(element: Union[Tag, BeautifulSoup]) -> List[str]:
    """
    Extract keywords from mat-chips or comma-separated text.
    
    Args:
        element: BeautifulSoup element containing keywords
        
    Returns:
        List of keyword strings
    """
    keywords = []
    
    # Try to find mat-chips first (preferred format)
    chips = element.select('mat-chip .mdc-evolution-chip__text-label')
    if chips:
        keywords = [chip.get_text(strip=True) for chip in chips]
    else:
        # Fall back to text parsing
        text = element.get_text(strip=True)
        if text and text not in ['--', '-', 'None', '']:
            # Split by common separators
            keywords = [kw.strip() for kw in re.split(r'[,;]', text) if kw.strip()]
    
    # Filter out placeholder values
    keywords = [kw for kw in keywords if kw not in ['--', '-', 'None', '']]
    
    return keywords


def extract_costs(text: str) -> Dict[str, Union[int, str]]:
    """
    Extract cost information from text.
    
    Common cost types:
    - MP/Mana: Mana points
    - AP: Action points
    - RP: Reaction points
    - Other: Special costs
    
    Args:
        text: Text containing cost information
        
    Returns:
        Dictionary with cost types as keys and values as integers or strings
    """
    costs = {}
    
    # Define patterns for different cost types
    cost_patterns = {
        'mana': [
            r'(\d+|X)\s*(?:MP|Mana Points?|mana)',
            r'(?:MP|Mana):\s*(\d+|X)',
            r'Cost:\s*(\d+|X)\s*MP'
        ],
        'ap': [
            r'(\d+)\s*(?:AP|Action Points?)',
            r'(?:AP|Action):\s*(\d+)',
        ],
        'rp': [
            r'(\d+|NaN)\s*(?:RP|Reaction Points?)',
            r'(?:RP|Reaction):\s*(\d+|NaN)',
        ],
    }
    
    # Try each pattern for each cost type
    for cost_type, patterns in cost_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1)
                if value.isdigit():
                    costs[cost_type] = int(value)
                else:
                    costs[cost_type] = value  # 'X' or 'NaN'
                break  # Found a match for this cost type
    
    # Check for special/other costs
    # Look for patterns like "Cost: <something> and <something>"
    if 'and' in text.lower() or '+' in text:
        # If we found standard costs but there's more text, it's additional
        if costs and len(text) > 20:  # Arbitrary length check
            costs['other'] = text
    
    return costs


def extract_requirements(text: str) -> List[str]:
    """
    Parse requirement text into a list of requirements.
    
    Args:
        text: Raw requirement text
        
    Returns:
        List of requirement strings
    """
    if not text or text.lower() in ['none', '--', '-', '']:
        return []
    
    # Split by common separators
    # Look for patterns like "and", ",", ";", or line breaks
    requirements = []
    
    # First try splitting by line breaks
    lines = text.split('\n')
    if len(lines) > 1:
        requirements = [line.strip() for line in lines if line.strip()]
    else:
        # Try splitting by 'and' or commas
        if ' and ' in text.lower():
            parts = re.split(r'\s+and\s+', text, flags=re.IGNORECASE)
            requirements = [part.strip() for part in parts if part.strip()]
        elif ',' in text:
            requirements = [req.strip() for req in text.split(',') if req.strip()]
        else:
            # Single requirement
            requirements = [text.strip()]
    
    return requirements


def parse_expansion_panels(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """
    Extract data from mat-expansion-panels (common UI pattern).
    
    Args:
        soup: BeautifulSoup object containing panels
        
    Returns:
        List of dictionaries with panel data
    """
    panels_data = []
    panels = soup.select('mat-expansion-panel')
    
    for panel in panels:
        panel_data = {}
        
        # Extract header information
        header = panel.select_one('mat-expansion-panel-header')
        if header:
            # Get title (usually in a span with specific class)
            title_elem = header.select_one('span.fs-5.fw-bold')
            if title_elem:
                title = title_elem.get_text(strip=True)
                # Remove common prefixes like "○ "
                if title.startswith('○ '):
                    title = title[2:].strip()
                panel_data['title'] = title
                panel_data['id'] = sanitize_id(title)
        
        # Extract body content
        body = panel.select_one('.mat-expansion-panel-body')
        if body:
            panel_data['body_html'] = str(body)
            panel_data['body_text'] = body.get_text(strip=True, separator="\n")
        
        if panel_data:
            panels_data.append(panel_data)
    
    return panels_data


def extract_list_items(soup: BeautifulSoup, item_selector: str, 
                      name_selector: str, link_selector: str = 'a') -> List[Dict[str, str]]:
    """
    Generic function to extract items from a list page.
    
    Args:
        soup: BeautifulSoup object of the list page
        item_selector: CSS selector for item containers
        name_selector: CSS selector for item names within containers
        link_selector: CSS selector for links within containers
        
    Returns:
        List of dictionaries with 'name', 'id', and 'url' keys
    """
    items = []
    containers = soup.select(item_selector)
    
    for container in containers:
        item_data = {}
        
        # Extract name
        name_elem = container.select_one(name_selector)
        if name_elem:
            name = name_elem.get_text(strip=True)
            item_data['name'] = name
            item_data['id'] = sanitize_id(name)
        
        # Extract URL
        link_elem = container.select_one(link_selector)
        if link_elem and link_elem.get('href'):
            url = link_elem['href']
            # Ensure absolute URL
            if url.startswith('/'):
                url = f"https://rpg.angelssword.com{url}"
            item_data['url'] = url
        
        if 'name' in item_data and 'url' in item_data:
            items.append(item_data)
    
    return items


def clean_text(text: str) -> str:
    """
    Clean up text by removing extra whitespace and HTML artifacts.
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    # Replace common HTML entities
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    
    # Replace multiple whitespaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Clean up line breaks
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    return text.strip()


def extract_rating(soup: BeautifulSoup, label_text: str, 
                  filled_selector: str = '.fa-solid') -> int:
    """
    Extract rating value (e.g., tier, difficulty) from star/circle displays.
    
    Args:
        soup: BeautifulSoup object to search in
        label_text: Label text to find (e.g., "Tier", "Difficulty")
        filled_selector: CSS selector for filled rating elements
        
    Returns:
        Integer rating value (0 if not found)
    """
    # Find the label
    label = soup.find(string=lambda s: s and label_text in s)
    if not label:
        return 0
    
    # Find the parent element and look for rating display
    parent = label.find_parent()
    if not parent:
        return 0
    
    # Look for rating container (usually follows the label)
    rating_container = parent.find_next_sibling()
    if not rating_container:
        return 0
    
    # Count filled elements
    filled_elements = rating_container.select(filled_selector)
    return len(filled_elements)