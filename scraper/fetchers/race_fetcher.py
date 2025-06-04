"""Fetcher for Lyrian Chronicles races and sub-races."""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
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
        
            
    def fetch_list_page(self) -> List[Dict[str, Any]]:
        """Fetch the races list page and extract race URLs from both tabs."""
        races_url = self.get_list_url()
        logger.info(f"Fetching races list from {races_url}")
        
        self.driver.get(races_url)
        self._wait_for_list_page()
        
        all_races = []
        
        # Primary races are not listed on the website but exist as direct URLs
        # Add them manually based on known primary races from the game system
        logger.info("Adding known primary races...")
        primary_race_names = ['Human', 'Fae', 'Demon', 'Chimera', 'Youkai']
        
        for race_name in primary_race_names:
            race_id = sanitize_id(race_name)
            primary_race = {
                'id': race_id,
                'name': race_name,
                'url': f'/game/{self.version}/races/primary/{race_id}',
                'is_sub_race': False
            }
            all_races.append(primary_race)
            logger.info(f"Added primary race: {race_name}")
        
        # Click on Sub-Races tab to get sub-races (they should be on the second tab)
        try:
            logger.info("Clicking on Sub-Races tab...")
            sub_races_tab = self.driver.find_element(By.XPATH, "//div[@role='tab'][contains(.,'Sub-Races')]")
            self.driver.execute_script("arguments[0].click();", sub_races_tab)
            time.sleep(3)
            
            # Extract sub-races
            logger.info("Extracting sub-races...")
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            sub_races = self.extract_list_items(soup)
            logger.info(f"Found {len(sub_races)} sub-races")
            all_races.extend(sub_races)
            
        except Exception as e:
            logger.warning(f"Failed to fetch sub-races tab: {e}")
        
        logger.info(f"Found {len(all_races)} total races/sub-races")
        return all_races
    
    def _wait_for_list_page(self):
        """Wait for races list page to load."""
        try:
            # Wait for tabs to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[role='tab']"))
            )
        except Exception as e:
            logger.warning(f"Tab elements not found: {e}")
    
    def _wait_for_detail_page(self):
        """Override base fetcher method with proper Angular waiting for race pages."""
        try:
            # First wait for basic page structure
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Wait for the page title to change away from loading
            WebDriverWait(self.driver, 30).until(
                lambda driver: "Loading: Angel's Sword Studios" not in driver.title
            )
            
            # Wait for actual race content patterns to appear in page source
            WebDriverWait(self.driver, 30).until(
                lambda driver: (
                    # Ensure we have actual content, not just HTML structure
                    len(driver.page_source) > 50000 and
                    # Look for race-specific content patterns that indicate data has loaded
                    ("Primary race:" in driver.page_source or 
                     "You gain +" in driver.page_source or  # Attribute benefits
                     "You can speak" in driver.page_source or  # Proficiency benefits
                     "Points:" in driver.page_source) and  # Skills points
                    # Double-check not on loading page
                    "Loading: Angel's Sword Studios" not in driver.page_source[:2000]
                )
            )
            
            # Additional wait for all content to render
            time.sleep(5)
            
        except TimeoutException as e:
            logger.warning(f"Timeout waiting for race content: {e}")
            # Last ditch effort - wait longer and check what we have
            time.sleep(15)
            page_source = self.driver.page_source
            logger.debug(f"Page source length: {len(page_source)}")
            logger.debug(f"Page title: {self.driver.title}")
            logger.debug(f"Has loading text: {'Loading: Angel' in page_source[:2000]}")
            logger.debug(f"Has You gain: {'You gain +' in page_source}")
            logger.debug(f"Has Primary race: {'Primary race:' in page_source}")
    
    def fetch_detail_page(self, url: str, item_id: str, metadata: Optional[Dict] = None) -> str:
        """Override base fetcher method to add validation for race pages."""
        logger.info(f"Fetching detail page for {item_id}: {url}")
        
        try:
            self.driver.get(url)
            self._wait_for_detail_page()
            self._expand_all_panels()
            
            html = self.driver.page_source
            
            # CRITICAL: Validate content before saving - look for actual content data
            has_race_content = any(marker in html for marker in [
                "Primary race:", "You gain +", "You can speak", "Points:"
            ])
            has_loading = "Loading: Angel's Sword Studios" in html[:2000]
            is_sufficient_size = len(html) > 50000  # Back to original size check
            
            if has_loading or not has_race_content or not is_sufficient_size:
                error_msg = f"Failed to load content for {item_id}:"
                if has_loading: 
                    error_msg += " Still on loading page."
                if not has_race_content: 
                    error_msg += " Missing race content markers."
                if not is_sufficient_size: 
                    error_msg += f" Insufficient content size ({len(html)} bytes)."
                logger.error(error_msg)
                logger.debug(f"Page source snippet: {html[:500]}...")
                raise Exception(error_msg)
            
            # Save HTML
            html_path = self.output_dir / f"{item_id}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Successfully saved {len(html)} chars for {item_id}")
            
            # Save metadata if provided
            if metadata:
                metadata_path = self.output_dir / f"{item_id}.meta.json"
                import json
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching detail page for {item_id}: {e}")
            raise


    def test_single_race(self, race_url: str):
        """Test fetching a single race for debugging."""
        logger.info(f"Testing single race: {race_url}")
        
        if not race_url.startswith('http'):
            race_url = f"https://rpg.angelssword.com{race_url}"
        
        race_id = race_url.split('/')[-1].split(';')[0]
        
        try:
            html_path = self.fetch_detail_page(race_url, race_id)
            logger.info(f"Successfully fetched race to {html_path}")
        except Exception as e:
            logger.error(f"Failed to fetch race: {e}")


if __name__ == "__main__":
    import argparse
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,  # Reduced verbosity
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Suppress selenium debug logs
    logging.getLogger('selenium').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    parser = argparse.ArgumentParser(description="Fetch LC races data")
    parser.add_argument("--version", default="latest", help="Game version to fetch")
    parser.add_argument("--test-race", help="Test mode: fetch single race by URL")
    args = parser.parse_args()
    
    fetcher = RaceFetcher(version=args.version)
    try:
        if args.test_race:
            fetcher.test_single_race(args.test_race)
        else:
            fetcher.fetch_all()
    finally:
        fetcher.cleanup()