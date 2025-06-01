#!/usr/bin/env python3
"""
Ability Fetcher - Fetches ability HTML pages from the Lyrian Chronicles website.
"""
import time
import logging
from typing import List, Dict, Any
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

from core.fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class AbilityFetcher(BaseFetcher):
    """Fetches ability data from the Lyrian Chronicles website."""
    
    def __init__(self, version: str = "latest", output_base_dir: str = "scraped_html"):
        """Initialize the ability fetcher.
        
        Args:
            version: The game version to fetch (e.g., "latest", "0.10.1")
            output_base_dir: Base directory for output (defaults to "scraped_html")
        """
        self.data_type = "abilities"
        self.output_base_dir = output_base_dir
        super().__init__(version=version, output_base_dir=output_base_dir)
    
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles."""
        return self.data_type
    
    def get_list_url(self) -> str:
        """Get the URL for the abilities page."""
        return f"{self.base_url}/abilities"
    
    def extract_list_items(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract ability tabs from the abilities page.
        
        Since abilities are organized in tabs rather than individual pages,
        this returns metadata about the tabs to fetch.
        
        Args:
            soup: BeautifulSoup object of the abilities page
            
        Returns:
            List of dictionaries containing tab information
        """
        # For abilities, we need to handle two tabs: True Abilities and Key Abilities
        # This method returns metadata about what we need to fetch
        tabs = [
            {
                'id': 'true_abilities',
                'name': 'True Abilities',
                'tab_index': 0,
                'url': self.get_list_url()  # Same URL, different tab
            },
            {
                'id': 'key_abilities', 
                'name': 'Key Abilities',
                'tab_index': 1,
                'url': self.get_list_url()  # Same URL, different tab
            }
        ]
        
        logger.info(f"Prepared {len(tabs)} ability tabs for fetching")
        return tabs
    
    def _wait_for_list_page(self):
        """Wait for the abilities page to load properly."""
        try:
            # Wait for the mat-tab-group to appear
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "mat-tab-group"))
            )
            logger.debug("Abilities page loaded")
            
            # If we used "latest", detect the actual version from the URL after redirect
            if self.version == "latest":
                current_url = self.driver.current_url
                logger.debug(f"Current URL after redirect: {current_url}")
                
                # Extract version from URL like: https://rpg.angelssword.com/game/0.10.1/abilities
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
                        logger.info(f"Updated output directory to: {self.output_dir}")
            
        except TimeoutException:
            logger.warning("Timeout waiting for abilities page, proceeding anyway")
    
    def _wait_for_detail_page(self):
        """Wait for the abilities tab content to load properly."""
        try:
            # Wait for expansion panels to appear
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "mat-expansion-panel"))
            )
            logger.debug("Abilities tab content loaded")
        except TimeoutException:
            logger.warning("Timeout waiting for expansion panels, proceeding anyway")
    
    def _switch_to_tab(self, tab_index: int, tab_name: str):
        """Switch to a specific tab in the mat-tab-group.
        
        Args:
            tab_index: Zero-based index of the tab to switch to
            tab_name: Name of the tab for logging
        """
        try:
            # Find tab headers
            tab_headers = self.driver.find_elements(By.CSS_SELECTOR, "div[role='tab']")
            
            if tab_index >= len(tab_headers):
                logger.error(f"Tab index {tab_index} out of range (found {len(tab_headers)} tabs)")
                return False
            
            # Click on the desired tab
            tab_header = tab_headers[tab_index]
            logger.info(f"Switching to tab: {tab_name} (index {tab_index})")
            
            # Click the tab
            self.driver.execute_script("arguments[0].click();", tab_header)
            
            # Wait for tab content to load
            time.sleep(3)
            
            # Wait for expansion panels to appear in this tab
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "mat-expansion-panel"))
                )
                logger.debug(f"Tab {tab_name} content loaded with expansion panels")
                return True
            except TimeoutException:
                logger.warning(f"No expansion panels found in {tab_name} tab after switching")
                return True  # Proceed anyway - tab might be empty
            
        except Exception as e:
            logger.error(f"Error switching to tab {tab_name}: {e}")
            return False
    
    def _expand_all_abilities(self):
        """Expand all ability panels in the current tab."""
        try:
            # Wait a moment for content to fully load
            time.sleep(1)
            
            panels = self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel-header")
            logger.info(f"Found {len(panels)} ability panels to expand")
            
            if not panels:
                logger.warning("No expansion panels found to expand")
                return
            
            expanded_count = 0
            batch_size = 20  # Process in batches to avoid overwhelming the page
            
            for i in range(0, len(panels), batch_size):
                batch = panels[i:i + batch_size]
                logger.debug(f"Processing batch {i//batch_size + 1}: panels {i+1}-{min(i+batch_size, len(panels))}")
                
                for j, panel in enumerate(batch):
                    try:
                        # Check if panel is already expanded
                        panel_element = panel.find_element(By.XPATH, "..")
                        classes = panel_element.get_attribute("class")
                        
                        if "mat-expanded" not in classes:
                            # Click to expand without scrolling (faster)
                            self.driver.execute_script("arguments[0].click();", panel)
                            expanded_count += 1
                            
                            # Very small delay
                            time.sleep(0.05)
                        
                    except Exception as e:
                        logger.warning(f"Error expanding panel {i+j+1}: {e}")
                        continue
                
                # Pause between batches
                if i + batch_size < len(panels):
                    logger.debug(f"Expanded {expanded_count} panels so far, pausing...")
                    time.sleep(1)
            
            logger.info(f"Expanded {expanded_count} ability panels")
            
            # Wait for all panels to finish expanding
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Error expanding ability panels: {e}")
    
    def fetch_ability_tab(self, tab_info: Dict[str, Any]) -> str:
        """Fetch content from a specific ability tab.
        
        Args:
            tab_info: Dictionary containing tab metadata
            
        Returns:
            Path to the saved HTML file
        """
        tab_id = tab_info['id']
        tab_name = tab_info['name']
        tab_index = tab_info['tab_index']
        
        logger.info(f"Fetching {tab_name} tab content")
        
        try:
            # Navigate to abilities page if not already there
            current_url = self.driver.current_url
            abilities_url = self.get_list_url()
            
            if not current_url.endswith('/abilities'):
                logger.debug(f"Navigating to abilities page: {abilities_url}")
                self.driver.get(abilities_url)
                self._wait_for_list_page()
            
            # Switch to the desired tab
            if not self._switch_to_tab(tab_index, tab_name):
                logger.error(f"Failed to switch to {tab_name} tab")
                return ""
            
            # Wait for tab content to load
            self._wait_for_detail_page()
            
            # Expand all ability panels
            self._expand_all_abilities()
            
            # Get the final HTML
            html = self.driver.page_source
            
            # Save HTML
            html_path = self.output_dir / f"{tab_id}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Saved {tab_name} HTML to {html_path}")
            
            # Save metadata
            metadata = {
                **tab_info,
                'version': self.version,
                'url': abilities_url,
                'fetched_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'panel_count': len(self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel"))
            }
            
            metadata_path = self.output_dir / f"{tab_id}.meta.json"
            import json
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved metadata to {metadata_path}")
            
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching {tab_name} tab: {e}")
            return ""
    
    def fetch_detail_page(self, url: str, item_id: str, metadata: Dict = None) -> str:
        """Override to handle tab-based fetching instead of individual pages.
        
        For abilities, this delegates to fetch_ability_tab since abilities
        are organized in tabs rather than individual detail pages.
        """
        # The metadata should contain tab information
        if metadata:
            return self.fetch_ability_tab(metadata)
        else:
            logger.error(f"No metadata provided for ability tab {item_id}")
            return ""
    
    def fetch_all(self, limit: int = None, delay: float = 2.0) -> Dict[str, str]:
        """Fetch all ability tabs.
        
        Args:
            limit: Not used for abilities (we always fetch both tabs)
            delay: Delay between tab fetches in seconds
            
        Returns:
            Dictionary mapping tab IDs to their HTML file paths
        """
        # Get tab information
        tabs = self.extract_list_items(None)  # Don't need soup for this
        
        if not tabs:
            logger.warning("No ability tabs found to fetch")
            return {}
        
        results = {}
        
        for i, tab_info in enumerate(tabs):
            tab_id = tab_info['id']
            
            html_path = self.fetch_ability_tab(tab_info)
            if html_path:
                results[tab_id] = html_path
            
            # Delay between tabs
            if i < len(tabs) - 1:
                logger.debug(f"Waiting {delay}s before next tab...")
                time.sleep(delay)
        
        logger.info(f"Fetched {len(results)} ability tabs successfully")
        return results


def main():
    """Example usage of the AbilityFetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch ability data from Lyrian Chronicles')
    parser.add_argument('--version', default='latest', help='Game version to fetch')
    parser.add_argument('--output-dir', default='scraped_html', help='Output directory base')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    
    fetcher = AbilityFetcher(version=args.version, output_base_dir=args.output_dir)
    
    try:
        # Fetch all ability tabs
        results = fetcher.fetch_all()
        logger.info(f"Ability fetching completed successfully: {list(results.keys())}")
    except Exception as e:
        logger.error(f"Error during fetching: {e}")
        raise
    finally:
        fetcher.cleanup()


if __name__ == "__main__":
    main()