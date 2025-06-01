#!/usr/bin/env python3
"""
Class Fetcher - Fetches class HTML pages from the Lyrian Chronicles website.
"""
import logging
from typing import List, Dict, Any
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup

from core.fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class ClassFetcher(BaseFetcher):
    """Fetches class data from the Lyrian Chronicles website."""
    
    def __init__(self, version: str = "latest"):
        """Initialize the class fetcher.
        
        Args:
            version: The game version to fetch (e.g., "latest", "0.10.1")
        """
        self.data_type = "classes"
        super().__init__(version=version)
    
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles."""
        return self.data_type
    
    def get_list_url(self) -> str:
        """Get the URL for the classes list page."""
        return f"{self.base_url}/classes"
    
    def extract_list_items(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract class items from the classes list page.
        
        Args:
            soup: BeautifulSoup object of the list page
            
        Returns:
            List of dictionaries containing class information
        """
        classes = []
        class_cards = soup.select('app-class-card')
        
        logger.info(f"Found {len(class_cards)} class cards")
        
        for card in class_cards:
            try:
                # Extract class information
                link_elem = card.select_one('a')
                if not link_elem:
                    continue
                
                href = link_elem.get('href', '')
                title = link_elem.get('title', '')
                
                # Extract name from the div with class "name"
                name_elem = card.select_one('.name')
                class_name = name_elem.text.strip() if name_elem else title
                
                # Extract main role
                main_role_span = card.select_one('label:-soup-contains("Main role:") + span')
                main_role = main_role_span.text.strip() if main_role_span else ''
                
                # Extract secondary role
                sec_role_span = card.select_one('label:-soup-contains("Sec role:") + span')
                secondary_role = sec_role_span.text.strip() if sec_role_span else None
                if secondary_role == '--':
                    secondary_role = None
                
                # Extract tier (count filled circles)
                tier_rating = card.select('label:-soup-contains("Tier") + app-rating .fa-solid.fa-circle')
                tier = len(tier_rating)
                
                # Extract difficulty (count filled stars)
                difficulty_rating = card.select('label:-soup-contains("Difficulty") + app-rating .fa-solid.fa-star')
                difficulty = len(difficulty_rating)
                
                # Extract image URL
                img_elem = card.select_one('img')
                image_url = img_elem.get('src', '') if img_elem else ''
                
                # Build the full URL if it's relative
                if href.startswith('/'):
                    page_url = f"https://rpg.angelssword.com{href}"
                else:
                    page_url = href
                
                # Sanitize ID using the utility function
                from core.utils import sanitize_id
                class_id = sanitize_id(class_name)
                
                class_info = {
                    'id': class_id,
                    'name': class_name,
                    'url': page_url,
                    'tier': tier,
                    'difficulty': difficulty,
                    'main_role': main_role,
                    'secondary_role': secondary_role,
                    'image_url': image_url
                }
                
                classes.append(class_info)
                logger.debug(f"Extracted class: {class_name} (Tier {tier}, Difficulty {difficulty})")
                
            except Exception as e:
                logger.warning(f"Error extracting class from card: {e}")
                continue
        
        return classes
    
    def _wait_for_list_page(self):
        """Wait for the class list page to load properly."""
        try:
            # Wait for class cards to appear
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-class-card"))
            )
            logger.debug("Class cards loaded")
        except TimeoutException:
            logger.warning("Timeout waiting for class cards, proceeding anyway")
    
    def _wait_for_detail_page(self):
        """Wait for the class detail page to load properly."""
        try:
            # Wait for expansion panels to appear
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "mat-expansion-panel"))
            )
            logger.debug("Class detail page loaded")
        except TimeoutException:
            logger.warning("Timeout waiting for expansion panels, proceeding anyway")


def main():
    """Example usage of the ClassFetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch class data from Lyrian Chronicles')
    parser.add_argument('--version', default='latest', help='Game version to fetch')
    parser.add_argument('--limit', type=int, help='Limit number of classes to fetch')
    args = parser.parse_args()
    
    fetcher = ClassFetcher(version=args.version)
    
    try:
        # Fetch all classes (or limited number)
        fetcher.fetch_all(limit=args.limit)
        logger.info("Class fetching completed successfully")
    except Exception as e:
        logger.error(f"Error during fetching: {e}")
        raise
    finally:
        fetcher.cleanup()


if __name__ == "__main__":
    main()