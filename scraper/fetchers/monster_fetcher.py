#!/usr/bin/env python3
"""
Monster Fetcher - Navigate monster list and fetch detail pages

This fetcher navigates the monsters list page and fetches individual monster detail pages,
saving HTML files for parsing.
"""

import logging
import time
from typing import Dict, List, Optional, Any
from pathlib import Path
from urllib.parse import urljoin

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from core.fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class MonsterFetcher(BaseFetcher):
    """Fetcher for monster pages"""
    
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles"""
        return "monsters"
    
    def get_list_url(self) -> str:
        """Get the URL for the monster list page"""
        return f"https://rpg.angelssword.com/game/{self.version}/monsters"
    
    def extract_list_items(self) -> List[Dict[str, Any]]:
        """Extract monster items from the list page - required by BaseFetcher"""
        monster_links = self._extract_monster_links()
        
        items = []
        for monster_id, monster_url in monster_links.items():
            items.append({
                'id': monster_id,
                'url': monster_url,
                'name': monster_id.replace('-', ' ').title()
            })
        
        return items
    
    def fetch_all(self) -> Dict[str, str]:
        """Fetch all monster detail pages"""
        logger.info(f"Starting monster fetch for version {self.version}")
        
        try:
            # Navigate to monsters list page
            list_url = self.get_list_url()
            logger.info(f"Navigating to monsters list: {list_url}")
            self.driver.get(list_url)
            
            # Wait for page to load
            self._wait_for_list_page()
            
            # Extract monster links
            monster_links = self._extract_monster_links()
            logger.info(f"Found {len(monster_links)} monsters to fetch")
            
            results = {}
            
            # Fetch each monster detail page
            for i, (monster_id, monster_url) in enumerate(monster_links.items(), 1):
                try:
                    logger.info(f"Fetching monster {i}/{len(monster_links)}: {monster_id}")
                    
                    # Create metadata for this monster
                    metadata = {
                        'monster_id': monster_id,
                        'source_url': monster_url,
                        'list_url': list_url,
                        'fetch_order': i
                    }
                    
                    # Fetch the detail page
                    html_path = self.fetch_detail_page(monster_url, monster_id, metadata)
                    results[monster_id] = html_path
                    
                    # Add delay between requests
                    time.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error fetching monster {monster_id}: {e}")
                    continue
            
            logger.info(f"Successfully fetched {len(results)} monster detail pages")
            return results
            
        except Exception as e:
            logger.error(f"Error during monster fetch: {e}")
            return {}
        finally:
            self.cleanup()
    
    def _wait_for_list_page(self):
        """Wait for the monster list page to load"""
        try:
            # Wait for monster cards to appear (like we do for classes)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-monster-card"))
            )
            logger.debug("Monster cards loaded")
            
            # If we used "latest", detect the actual version from the URL after redirect
            if self.version == "latest":
                current_url = self.driver.current_url
                logger.debug(f"Current URL after redirect: {current_url}")
                
                # Extract version from URL like: https://rpg.angelssword.com/game/0.10.1/monsters
                import re
                version_match = re.search(r'/game/([^/]+)/', current_url)
                if version_match:
                    actual_version = version_match.group(1)
                    if actual_version != "latest":
                        logger.info(f"Detected actual version: {actual_version} (redirected from 'latest')")
                        
                        # Update our version and output directory
                        self.version = actual_version
                        self.base_url = f"https://rpg.angelssword.com/game/{actual_version}"
                        
                        # Update output directory
                        from pathlib import Path
                        self.output_dir = Path(self.output_base_dir) / actual_version / self.get_data_type()
                        self.output_dir.mkdir(parents=True, exist_ok=True)
                        
                        # Update latest symlink
                        self._update_symlink(actual_version)
            
            # Additional wait for all cards to load
            time.sleep(2)
            
        except TimeoutException:
            logger.warning("Timeout waiting for monster list page to load")
    
    def _extract_monster_links(self) -> Dict[str, str]:
        """Extract monster links from the list page"""
        monster_links = {}
        
        try:
            # First try to find monster-specific components (like app-monster-card)
            monster_cards = self.driver.find_elements(By.CSS_SELECTOR, "app-monster-card")
            
            if monster_cards:
                logger.info(f"Found {len(monster_cards)} app-monster-card elements")
                for card in monster_cards:
                    try:
                        # Look for links within the card
                        link_elem = card.find_element(By.CSS_SELECTOR, "a")
                        href = link_elem.get_attribute("href")
                        
                        if href and "/monsters/" in href:
                            # Extract monster ID from URL
                            monster_id = href.split("/monsters/")[-1]
                            if monster_id:
                                monster_links[monster_id] = href
                                logger.debug(f"Found monster: {monster_id} -> {href}")
                    
                    except Exception as e:
                        logger.debug(f"Skipping card without valid link: {e}")
                        continue
            else:
                # Fallback to mat-card if no app-monster-card found
                cards = self.driver.find_elements(By.CSS_SELECTOR, "mat-card")
                logger.info(f"Found {len(cards)} mat-card elements")
                
                for card in cards:
                    try:
                        # Look for links within the card
                        link_elem = card.find_element(By.CSS_SELECTOR, "a")
                        href = link_elem.get_attribute("href")
                        
                        if href and "/monsters/" in href:
                            # Extract monster ID from URL
                            monster_id = href.split("/monsters/")[-1]
                            if monster_id:
                                monster_links[monster_id] = href
                                logger.debug(f"Found monster: {monster_id} -> {href}")
                    
                    except Exception as e:
                        logger.debug(f"Skipping card without valid link: {e}")
                        continue
            
            logger.info(f"Extracted {len(monster_links)} monster links")
            return monster_links
            
        except Exception as e:
            logger.error(f"Error extracting monster links: {e}")
            return {}
    
    def _wait_for_detail_page(self):
        """Override base fetcher method with monster-specific waits"""
        try:
            # Wait for the monster detail component
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-monster-details"))
            )
            
            # Wait for the stats component
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-monster-stats"))
            )
            
            # Wait for expansion panels (abilities)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "mat-expansion-panel"))
            )
            
            # Expand all ability panels
            self._expand_all_panels()
            
            # Final wait for content to stabilize
            time.sleep(3)
            
        except TimeoutException as e:
            logger.warning(f"Timeout waiting for monster detail content: {e}")
            time.sleep(5)  # Last ditch effort
    
    def _expand_all_panels(self):
        """Expand all mat-expansion-panel elements"""
        try:
            panels = self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel-header")
            logger.info(f"Found {len(panels)} expansion panels to expand")
            
            # Expand panels in batches to avoid overwhelming the page
            batch_size = 5
            for i in range(0, len(panels), batch_size):
                batch = panels[i:i + batch_size]
                
                for panel in batch:
                    try:
                        # Check if panel is already expanded
                        parent = panel.find_element(By.XPATH, "..")
                        if "mat-expanded" not in parent.get_attribute("class"):
                            self.driver.execute_script("arguments[0].click();", panel)
                            time.sleep(0.5)  # Brief pause between clicks
                    except Exception as e:
                        logger.debug(f"Could not expand panel: {e}")
                        continue
                
                # Pause between batches
                if i + batch_size < len(panels):
                    time.sleep(2)
            
            # Final wait for all content to load
            time.sleep(3)
            
        except Exception as e:
            logger.warning(f"Error expanding panels: {e}")
    
    def fetch_detail_page(self, url: str, monster_id: str, metadata: Optional[Dict] = None) -> str:
        """Override base fetcher method to add validation"""
        logger.info(f"Fetching detail page for {monster_id}: {url}")
        
        try:
            self.driver.get(url)
            self._wait_for_detail_page()
            
            html = self.driver.page_source
            
            # Validate content before saving
            has_monster_details = '<app-monster-details' in html
            has_stats = '<app-monster-stats' in html
            has_loading = "Loading: Angel's Sword Studios" in html[:1000]
            
            if has_loading or not has_monster_details or not has_stats:
                error_msg = f"Failed to load content for {monster_id}:"
                if has_loading: error_msg += " Still on loading page."
                if not has_monster_details: error_msg += " Missing monster details."
                if not has_stats: error_msg += " Missing stats."
                logger.error(error_msg)
                raise Exception(error_msg)
            
            # Save HTML
            html_path = self.output_dir / f"{monster_id}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Successfully saved {len(html)} chars for {monster_id}")
            
            # Save metadata if provided
            if metadata:
                import json
                meta_path = self.output_dir / f"{monster_id}.meta.json"
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2)
            
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching detail page for {monster_id}: {e}")
            raise
    
    def test_single_monster(self, monster_id: str):
        """Test mode: fetch single monster by ID"""
        logger.info(f"Test mode: fetching single monster {monster_id}")
        
        try:
            # Construct URL directly
            monster_url = f"https://rpg.angelssword.com/game/{self.version}/monsters/{monster_id}"
            
            # Create metadata for this monster
            metadata = {
                'monster_id': monster_id,
                'source_url': monster_url,
                'test_mode': True
            }
            
            # Fetch the detail page
            html_path = self.fetch_detail_page(monster_url, monster_id, metadata)
            logger.info(f"Test fetch complete: {html_path}")
            
            return html_path
            
        except Exception as e:
            logger.error(f"Error in test fetch for {monster_id}: {e}")
            raise
        finally:
            self.cleanup()


def main():
    """Command-line interface for monster fetcher"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fetch monster HTML pages")
    parser.add_argument("--version", default="latest", help="Game version to fetch")
    parser.add_argument("--output-dir", default="scraped_html", help="Output directory")
    parser.add_argument("--test-monster", help="Test mode: fetch single monster by ID")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create fetcher
    fetcher = MonsterFetcher(version=args.version, output_base_dir=args.output_dir)
    
    try:
        if args.test_monster:
            # Test mode - single monster
            fetcher.test_single_monster(args.test_monster)
        else:
            # Normal mode - fetch all monsters
            results = fetcher.fetch_all()
            logger.info(f"Fetch complete: {len(results)} monsters processed")
    
    except KeyboardInterrupt:
        logger.info("Fetch interrupted by user")
    except Exception as e:
        logger.error(f"Fetch failed: {e}")


if __name__ == "__main__":
    main()