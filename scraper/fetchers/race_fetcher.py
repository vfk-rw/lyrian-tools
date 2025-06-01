"""Fetcher for Lyrian Chronicles races and sub-races."""

import logging
from pathlib import Path
from typing import Dict, Any, List
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from core.fetcher import BaseFetcher
from core.utils import sanitize_id
import time

logger = logging.getLogger(__name__)

class RaceFetcher(BaseFetcher):
    """Fetches race and sub-race data from the LC website."""
    
    def __init__(self, version: str = "latest", output_base_dir: str = "scraped_html"):
        self.data_type = "races"
        super().__init__(version=version, output_base_dir=output_base_dir)
        
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles."""
        return self.data_type
        
    def get_list_url(self) -> str:
        """Get the URL for the races list page."""
        return f"{self.base_url}/races"
        
    def extract_list_items(self, soup) -> List[Dict[str, Any]]:
        """Extract race items from both tabs on the races page."""
        races = []
        
        # Extract ancestry cards from the current page
        ancestry_cards = soup.select('app-ancestry-card')
        logger.info(f"Found {len(ancestry_cards)} ancestry cards on current tab")
        
        for card in ancestry_cards:
            try:
                # Find the link element
                link = card.select_one('a')
                if not link:
                    continue
                
                # Extract basic info
                name = link.get('title', '').strip()
                url = link.get('href', '')
                
                if name and url:
                    race_id = sanitize_id(name)
                    races.append({
                        'id': race_id,
                        'name': name,
                        'url': url,
                        'is_sub_race': '/secondary/' in url or '/sub/' in url
                    })
                    
            except Exception as e:
                logger.warning(f"Error extracting race info: {e}")
        
        return races
        
    def fetch_detail(self, identifier: str, metadata: Dict[str, Any]) -> Path:
        """Fetch individual race detail page."""
        relative_url = metadata.get('url', '')
        race_name = metadata.get('name', identifier)
        
        # Construct full URL from relative URL
        if relative_url.startswith('/'):
            url = f"https://rpg.angelssword.com{relative_url}"
        else:
            url = relative_url
        
        logger.info(f"Fetching detail page for {race_name}: {url}")
        
        try:
            self.driver.get(url)
            time.sleep(5)  # Wait longer for page load
            
            # Wait for the race content to load - look for actual race content
            try:
                # Wait for Angular content to load - look for race-specific elements
                logger.info(f"Waiting for race content to load for {race_name}...")
                WebDriverWait(self.driver, 30).until(
                    lambda driver: (
                        "Attributes:" in driver.page_source or 
                        "Proficiencies:" in driver.page_source or
                        "mat-expansion-panel" in driver.page_source or
                        len(driver.page_source) > 50000  # Fallback if content is large
                    )
                )
                logger.info(f"Race content loaded for {race_name}")
                time.sleep(5)  # Additional wait for all panels to load
            except Exception as e:
                logger.warning(f"Timeout waiting for race content: {e}")
                # Still try to get what we have
                time.sleep(10)  # Last ditch effort
            
            # Expand all panels on the detail page
            self._expand_all_panels()
            time.sleep(2)  # Wait for expansion
            
            # Get final HTML
            html = self.driver.page_source
            
            # Check if we got actual content
            if len(html) < 1000:  # Very small HTML suggests incomplete load
                logger.warning(f"Suspiciously small HTML ({len(html)} chars) for {race_name}")
            else:
                logger.info(f"Successfully loaded {len(html)} chars for {race_name}")
            
            # Save HTML
            html_path = self.output_dir / f"{identifier}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Saved HTML to {html_path}")
            
            # Save metadata
            if metadata:
                metadata_path = self.output_dir / f"{identifier}.meta.json"
                import json
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                logger.debug(f"Saved metadata to {metadata_path}")
            
            return html_path
            
        except Exception as e:
            logger.error(f"Error fetching detail page for {identifier}: {e}")
            return None
            
    def fetch_list_page(self) -> List[Dict[str, Any]]:
        """Fetch the races list page and extract race URLs from both tabs."""
        races_url = f"{self.base_url}/races"
        logger.info(f"Fetching races list from {races_url}")
        
        self.driver.get(races_url)
        time.sleep(3)
        
        # Wait for tabs to load
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[role='tab']"))
            )
        except Exception as e:
            logger.warning(f"Tab elements not found: {e}")
        
        all_races = []
        
        # Get races from first tab (primary races)
        logger.info("Extracting primary races...")
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        primary_races = self.extract_list_items(soup)
        all_races.extend(primary_races)
        
        # Click on Sub-Races tab
        try:
            logger.info("Clicking on Sub-Races tab...")
            sub_races_tab = self.driver.find_element(By.XPATH, "//div[@role='tab'][contains(.,'Sub-Races')]")
            self.driver.execute_script("arguments[0].click();", sub_races_tab)
            time.sleep(3)
            
            # Extract sub-races
            logger.info("Extracting sub-races...")
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            sub_races = self.extract_list_items(soup)
            all_races.extend(sub_races)
            
        except Exception as e:
            logger.warning(f"Failed to fetch sub-races tab: {e}")
        
        logger.info(f"Found {len(all_races)} total races/sub-races")
        return all_races


if __name__ == "__main__":
    import argparse
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    parser = argparse.ArgumentParser(description="Fetch LC races data")
    parser.add_argument("--version", default="latest", help="Game version to fetch")
    args = parser.parse_args()
    
    fetcher = RaceFetcher(version=args.version)
    try:
        fetcher.fetch_all()
    finally:
        fetcher.cleanup()