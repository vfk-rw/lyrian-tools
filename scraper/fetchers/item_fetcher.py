#!/usr/bin/env python3
"""
Fetcher for Lyrian Chronicles items.

This fetcher navigates the items page and saves individual item HTML pages.
Items have diverse types (weapons, armor, artifice, alchemy, materials, etc.)
with varying structures and properties.
"""

import logging
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

from core.fetcher import BaseFetcher
from core.utils import sanitize_id

logger = logging.getLogger(__name__)


class ItemFetcher(BaseFetcher):
    """Fetches item data from the Lyrian Chronicles items pages."""
    
    def __init__(self, version: str = "latest", output_base_dir: str = "scraped_html"):
        """Initialize the item fetcher."""
        self.data_type = "items"
        super().__init__(version=version, output_base_dir=output_base_dir)
        
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles."""
        return self.data_type
        
    def get_list_url(self) -> str:
        """Return the URL for the items list page."""
        return f"{self.base_url}/items"
        
    def _wait_for_list_page(self):
        """Wait for items list page to load with all item cards."""
        try:
            # Wait for Angular app to initialize
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-items"))
            )
            
            # Wait for item cards to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-item-card"))
            )
            
            # Additional wait for all cards to render
            time.sleep(3)
            
            logger.info("Items list page loaded successfully")
            
            # If we used "latest", detect the actual version from the URL after redirect
            if self.version == "latest":
                current_url = self.driver.current_url
                logger.debug(f"Current URL after redirect: {current_url}")
                
                # Extract version from URL like: https://rpg.angelssword.com/game/0.10.1/items
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
                        
                        # Create symlink for latest
                        self._create_latest_symlink()
                        
        except TimeoutException:
            logger.warning("Timeout waiting for items page to load - proceeding anyway")
    
    def extract_list_items(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract item information from the list page."""
        items = []
        
        # Find all item cards
        item_cards = soup.select('app-item-card')
        logger.info(f"Found {len(item_cards)} item cards")
        
        for card in item_cards:
            try:
                # Get the link element first (contains title and href)
                link_elem = card.select_one('a')
                if not link_elem:
                    continue
                    
                # Get item name from title attribute or div.name
                item_name = link_elem.get('title', '')
                if not item_name:
                    name_elem = card.select_one('div.name')
                    if name_elem:
                        item_name = name_elem.get_text(strip=True)
                
                if not item_name:
                    continue
                
                # Get the URL
                item_url = link_elem.get('href', '')
                
                # Extract ID from URL
                item_id = item_url.split('/')[-1] if '/' in item_url else sanitize_id(item_name)
                
                # Look for cost info
                cost_elem = card.select_one('div.cost')
                cost = cost_elem.get_text(strip=True) if cost_elem else None
                
                items.append({
                    'id': item_id,
                    'name': item_name,
                    'url': item_url,
                    'cost': cost
                })
                
            except Exception as e:
                logger.warning(f"Error extracting item card: {e}")
                import traceback
                traceback.print_exc()
                
        return items
        
    def fetch_detail(self, identifier: str, metadata: Dict[str, Any]) -> Path:
        """Fetch individual item detail page."""
        relative_url = metadata.get('url', '')
        item_name = metadata.get('name', identifier)
        
        # Construct full URL from relative URL
        if relative_url.startswith('/'):
            url = f"https://rpg.angelssword.com{relative_url}"
        else:
            url = relative_url
            
        logger.info(f"Fetching detail page for {item_name}: {url}")
        
        try:
            self.driver.get(url)
            
            # Wait for the item detail to load - using the same pattern as race fetcher
            logger.info(f"Waiting for item content to load for {item_name}...")
            
            # Initial navigation wait
            time.sleep(5)  # Give Angular time to start loading
            
            try:
                # Wait for item-specific Angular elements to load (like class fetcher does)
                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "app-item-detail"))
                )
                
                # Angular HTTP check times out but content loads anyway - skip it
                # The site appears to use a different Angular version or structure
                logger.info(f"Skipping Angular HTTP check - content loads without it")
                
                # Wait for specific item content elements like class fetcher waits for expansion panels
                WebDriverWait(self.driver, 30).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.d-flex.justify-content-between"))
                )
                
                # Additional specific content checks using page source
                WebDriverWait(self.driver, 10).until(
                    lambda driver: (
                        # Check we have the Angular-rendered item structure
                        'class="d-flex justify-content-between"' in driver.page_source and
                        'Type: </label>' in driver.page_source and
                        'Sub type: </label>' in driver.page_source and
                        'Cost: </label>' in driver.page_source and
                        'Description:</mat-card-title>' in driver.page_source and
                        '<mat-card-content _ngcontent' in driver.page_source and
                        'linkify' in driver.page_source and
                        # Make sure we're not on loading page
                        "Loading: Angel's Sword Studios" not in driver.page_source[:1000] and
                        # Ensure substantial content
                        len(driver.page_source) > 60000
                    )
                )
                
                logger.info(f"Item content loaded for {item_name} - page size: {len(self.driver.page_source)}")
                time.sleep(2)  # Small wait for final rendering
                
            except TimeoutException as e:
                logger.warning(f"Timeout waiting for item content: {e}")
                # Still try to get what we have
                time.sleep(10)  # Last ditch effort like race fetcher
            
            # Save the HTML
            html = self.driver.page_source
            
            # Validate we got actual item content before saving
            has_description = 'Description:</mat-card-title>' in html
            has_loading = "Loading: Angel's Sword Studios" in html[:1000]
            has_item_structure = 'app-item-detail' in html and 'Type: </label>' in html
            
            if has_loading or not has_description or not has_item_structure:
                error_msg = f"Failed to load item content for {item_name}:"
                if has_loading:
                    error_msg += " Still on loading page."
                if not has_description:
                    error_msg += " Missing Description block."
                if not has_item_structure:
                    error_msg += " Missing item structure."
                error_msg += f" Page size: {len(html)} chars"
                logger.error(error_msg)
                raise Exception(error_msg)
            
            output_path = self.output_dir / f"{identifier}.html"
            output_path.write_text(html, encoding='utf-8')
            logger.info(f"Successfully saved {len(html)} chars for {item_name}")
            
            # Update metadata with actual fetched data
            metadata['fetched'] = True
            metadata['file'] = f"{identifier}.html"
            
            # Try to extract type and subtype from the detail page
            try:
                type_elem = self.driver.find_element(
                    By.XPATH, "//span[@class='property-label' and text()='Type:']/following-sibling::span"
                )
                metadata['type'] = type_elem.text.strip()
            except NoSuchElementException:
                pass
                
            try:
                subtype_elem = self.driver.find_element(
                    By.XPATH, "//span[@class='property-label' and text()='Sub type:']/following-sibling::span"
                )
                metadata['sub_type'] = subtype_elem.text.strip()
            except NoSuchElementException:
                pass
            
            logger.info(f"Successfully fetched: {item_name} (Type: {metadata.get('type', 'Unknown')})")
            return output_path
            
        except TimeoutException:
            logger.error(f"Timeout loading item detail page: {url}")
            raise
        except Exception as e:
            logger.error(f"Error fetching item detail: {e}")
            raise
    
    def post_process(self, all_metadata: List[Dict[str, Any]]) -> None:
        """Post-process fetched items to gather statistics."""
        # Count items by type and subtype
        type_counts = {}
        subtype_counts = {}
        
        for item in all_metadata:
            if 'type' in item:
                item_type = item['type']
                type_counts[item_type] = type_counts.get(item_type, 0) + 1
                
                if 'sub_type' in item:
                    subtype_key = f"{item_type}/{item['sub_type']}"
                    subtype_counts[subtype_key] = subtype_counts.get(subtype_key, 0) + 1
        
        # Log statistics
        logger.info("\n=== Item Type Statistics ===")
        for item_type, count in sorted(type_counts.items()):
            logger.info(f"{item_type}: {count} items")
            
        logger.info("\n=== Item Subtype Statistics ===")
        for subtype, count in sorted(subtype_counts.items()):
            logger.info(f"{subtype}: {count} items")
    
    def _wait_for_detail_page(self):
        """Wait for the item detail page to load properly."""
        try:
            # Simple wait like class fetcher - just wait for the item detail component
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-item-detail"))
            )
            logger.debug("Item detail page loaded")
            # Small additional wait for Angular rendering
            time.sleep(2)
        except TimeoutException:
            logger.warning("Timeout waiting for item detail component, proceeding anyway")
            # Give it a bit more time just in case
            time.sleep(3)

    def fetch_detail_page(self, url: str, item_id: str, metadata: Optional[Dict] = None) -> str:
        """Fetch an item detail page - simplified like other working fetchers."""
        logger.info(f"Fetching detail page for {item_id}")
        
        try:
            self.driver.get(url)
            
            # Use our custom wait logic
            self._wait_for_detail_page()
            
            # Expand any collapsible sections  
            self._expand_all_panels()
            
            # Get final HTML
            html = self.driver.page_source
            
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
                    json.dump(metadata, f, indent=2)
                    
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching detail page for {item_id}: {e}")
            raise

    def test_single_item(self, url_path: str):
        """Test mode: fetch a single item by URL for debugging."""
        logger.info(f"=== SINGLE ITEM TEST MODE ===")
        logger.info(f"Testing URL: {url_path}")
        
        # Driver is already initialized in constructor
        
        try:
            # Construct full URL
            if url_path.startswith('/'):
                full_url = f"https://rpg.angelssword.com{url_path}"
            else:
                full_url = url_path
                
            logger.info(f"Full URL: {full_url}")
            
            # Extract item ID from URL for filename
            item_id = url_path.split('/')[-1] if '/' in url_path else "test-item"
            test_filename = f"TEST_{item_id}.html"
            
            logger.info(f"Navigating to: {full_url}")
            self.driver.get(full_url)
            
            # Use the same wait logic as fetch_detail but with more debugging
            logger.info("=== WAIT PHASE 1: Initial wait ===")
            time.sleep(5)
            
            logger.info("=== WAIT PHASE 2: app-item-detail ===")
            try:
                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "app-item-detail"))
                )
                logger.info("✓ Found app-item-detail")
            except TimeoutException:
                logger.error("✗ Timeout waiting for app-item-detail")
            
            logger.info("=== WAIT PHASE 3: Angular HTTP ===")
            def wait_for_angular_http(driver):
                try:
                    result = driver.execute_script("""
                        if (typeof angular === 'undefined') return false;
                        var injector = angular.element('body').injector();
                        if (!injector) return false;
                        var $http = injector.get('$http');
                        return $http.pendingRequests.length === 0;
                    """)
                    logger.info(f"Angular HTTP check result: {result}")
                    return result
                except Exception as e:
                    logger.info(f"Angular HTTP check failed: {e}")
                    return False
            
            try:
                WebDriverWait(self.driver, 20).until(wait_for_angular_http)
                logger.info("✓ Angular HTTP requests completed")
            except TimeoutException:
                logger.warning("✗ Timeout waiting for Angular HTTP")
            
            logger.info("=== WAIT PHASE 4: Content elements ===")
            try:
                WebDriverWait(self.driver, 30).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.d-flex.justify-content-between"))
                )
                logger.info("✓ Found div.d-flex.justify-content-between")
            except TimeoutException:
                logger.warning("✗ Timeout waiting for div.d-flex.justify-content-between")
            
            # Get page source and analyze
            html = self.driver.page_source
            logger.info(f"=== PAGE ANALYSIS ===")
            logger.info(f"Page size: {len(html)} characters")
            logger.info(f"Title in HTML: {'Loading:' in html[:1000]}")
            logger.info(f"Has Description: {'Description:</mat-card-title>' in html}")
            logger.info(f"Has Type: {'Type: </label>' in html}")
            logger.info(f"Has app-item-detail: {'app-item-detail' in html}")
            logger.info(f"Has Angular content: {'_ngcontent' in html}")
            
            # Save the test file
            output_path = self.output_dir / test_filename
            output_path.write_text(html, encoding='utf-8')
            logger.info(f"Saved test file: {output_path}")
            
            # Show first 500 chars of content for debugging
            logger.info(f"=== FIRST 500 CHARS ===")
            logger.info(html[:500])
            
        finally:
            if hasattr(self, 'driver') and self.driver:
                self.driver.quit()
                logger.info("Browser closed")
    
    def _create_latest_symlink(self):
        """Create a symlink from 'latest' to the actual version directory."""
        try:
            from pathlib import Path
            import os
            import shutil
            
            base_path = Path(self.output_base_dir)
            latest_link = base_path / "latest"
            actual_version_dir = base_path / self.version
            
            # Remove existing symlink or directory
            if latest_link.exists() or latest_link.is_symlink():
                if latest_link.is_symlink():
                    os.unlink(latest_link)
                else:
                    # It's a real directory, remove it
                    shutil.rmtree(latest_link)
            
            # Create new symlink
            os.symlink(actual_version_dir.name, latest_link)
            logger.info(f"Created symlink: latest -> {self.version}")
            
        except Exception as e:
            logger.warning(f"Failed to create latest symlink: {e}")


def main():
    """Command-line interface for the item fetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fetch Lyrian Chronicles items")
    parser.add_argument(
        "--version",
        default="latest",
        help="Game version to fetch (default: latest)"
    )
    parser.add_argument(
        "--output-dir",
        default="scraped_html",
        help="Output directory for HTML files"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Set logging level"
    )
    parser.add_argument(
        "--single-url",
        help="Test mode: fetch a single item by URL (e.g., '/game/0.10.1/items/axe--heavy-')"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the fetcher
    fetcher = ItemFetcher(version=args.version, output_base_dir=args.output_dir)
    
    if args.single_url:
        # Test mode: fetch single item
        fetcher.test_single_item(args.single_url)
    else:
        # Normal mode: fetch all items
        fetcher.fetch_all()


if __name__ == "__main__":
    main()