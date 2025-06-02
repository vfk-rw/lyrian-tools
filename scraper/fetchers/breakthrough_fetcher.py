#!/usr/bin/env python3
"""
Breakthrough Fetcher - Fetches breakthrough HTML page from the Lyrian Chronicles website.
"""
import time
import logging
import json
from typing import List, Dict, Any
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup

from core.fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class BreakthroughFetcher(BaseFetcher):
    """Fetches breakthrough data from the Lyrian Chronicles website."""
    
    def __init__(self, version: str = "latest", output_base_dir: str = "scraped_html"):
        """Initialize the breakthrough fetcher.
        
        Args:
            version: The game version to fetch (e.g., "latest", "0.10.1")
            output_base_dir: Base directory for output (defaults to "scraped_html")
        """
        self.data_type = "breakthroughs"
        self.output_base_dir = output_base_dir
        super().__init__(version=version, output_base_dir=output_base_dir)
    
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles."""
        return self.data_type
    
    def get_list_url(self) -> str:
        """Get the URL for the breakthroughs page."""
        return f"{self.base_url}/breakthroughs"
    
    def extract_list_items(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract breakthrough items from the breakthroughs page.
        
        Since breakthroughs are all on a single page, this returns a single item
        representing the entire breakthroughs page.
        
        Args:
            soup: BeautifulSoup object of the breakthroughs page
            
        Returns:
            List with a single dictionary for the breakthroughs page
        """
        # Breakthroughs are all on one page, so we return a single item
        return [{
            'id': 'all_breakthroughs',
            'name': 'All Breakthroughs',
            'url': self.get_list_url()
        }]
    
    def _wait_for_list_page(self):
        """Wait for the breakthroughs page to load properly."""
        try:
            # Wait for mat-expansion-panels to appear
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "mat-expansion-panel"))
            )
            logger.debug("Breakthroughs page loaded with expansion panels")
            
            # If we used "latest", detect the actual version from the URL after redirect
            if self.version == "latest":
                current_url = self.driver.current_url
                logger.debug(f"Current URL after redirect: {current_url}")
                
                # Extract version from URL like: https://rpg.angelssword.com/game/0.10.1/breakthroughs
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
                        self.output_dir = Path(self.output_base_dir) / actual_version / self.get_data_type()
                        self.output_dir.mkdir(parents=True, exist_ok=True)
                        logger.info(f"Updated output directory to: {self.output_dir}")
            
        except TimeoutException:
            logger.warning("Timeout waiting for breakthroughs page expansion panels")
    
    def _wait_for_detail_page(self):
        """Wait for the breakthroughs page content to load properly."""
        # For breakthroughs, this is the same as waiting for the list page
        self._wait_for_list_page()
    
    def _expand_all_breakthroughs(self):
        """Expand all breakthrough panels on the page."""
        try:
            # Wait a moment for content to settle
            time.sleep(1)
            
            # Find all expansion panel headers
            panels = self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel-header")
            logger.info(f"Found {len(panels)} breakthrough panels to expand")
            
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
                        # Check if panel is already expanded by looking at parent element
                        panel_element = panel.find_element(By.XPATH, "..")
                        classes = panel_element.get_attribute("class") or ""
                        
                        if "mat-expanded" not in classes:
                            # Click to expand
                            self.driver.execute_script("arguments[0].click();", panel)
                            expanded_count += 1
                            
                            # Small delay between expansions
                            time.sleep(0.05)
                        
                    except Exception as e:
                        logger.warning(f"Error expanding panel {i+j+1}: {e}")
                        continue
                
                # Pause between batches
                if i + batch_size < len(panels):
                    logger.debug(f"Expanded {expanded_count} panels so far, pausing...")
                    time.sleep(1)
            
            logger.info(f"Expanded {expanded_count} breakthrough panels")
            
            # Wait for all panels to finish expanding
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Error expanding breakthrough panels: {e}")
    
    def fetch_breakthroughs_page(self) -> str:
        """Fetch the breakthroughs page with all panels expanded.
        
        Returns:
            Path to the saved HTML file
        """
        logger.info("Fetching breakthroughs page")
        
        try:
            # Navigate to breakthroughs page
            breakthroughs_url = self.get_list_url()
            logger.debug(f"Navigating to breakthroughs page: {breakthroughs_url}")
            self.driver.get(breakthroughs_url)
            
            # Wait for page to load
            self._wait_for_list_page()
            
            # Expand all breakthrough panels
            self._expand_all_breakthroughs()
            
            # Get the final HTML
            html = self.driver.page_source
            
            # Save HTML
            html_path = self.output_dir / "breakthroughs.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Saved breakthroughs HTML to {html_path}")
            
            # Count breakthroughs for metadata
            soup = BeautifulSoup(html, 'html.parser')
            breakthrough_count = len(soup.select("mat-expansion-panel"))
            
            # Save metadata
            metadata = {
                'id': 'all_breakthroughs',
                'name': 'All Breakthroughs',
                'version': self.version,
                'url': breakthroughs_url,
                'fetched_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'breakthrough_count': breakthrough_count
            }
            
            metadata_path = self.output_dir / "breakthroughs.meta.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved metadata to {metadata_path}")
            
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching breakthroughs page: {e}")
            return ""
    
    def fetch_detail_page(self, url: str, item_id: str, metadata: Dict = None) -> str:
        """Override to handle single-page fetching.
        
        For breakthroughs, this delegates to fetch_breakthroughs_page since all breakthroughs
        are on a single page rather than individual detail pages.
        """
        return self.fetch_breakthroughs_page()
    
    def fetch_all(self, limit: int = None, delay: float = 2.0) -> Dict[str, str]:
        """Fetch the breakthroughs page.
        
        Args:
            limit: Not used for breakthroughs (single page)
            delay: Not used for breakthroughs (single page)
            
        Returns:
            Dictionary mapping 'breakthroughs' to the HTML file path
        """
        logger.info("Starting breakthrough fetch")
        
        html_path = self.fetch_breakthroughs_page()
        
        if html_path:
            logger.info("Breakthroughs fetching completed successfully")
            return {"breakthroughs": html_path}
        else:
            logger.error("Failed to fetch breakthroughs")
            return {}


def main():
    """Example usage of the BreakthroughFetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch breakthrough data from Lyrian Chronicles')
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
    
    fetcher = BreakthroughFetcher(version=args.version, output_base_dir=args.output_dir)
    
    try:
        # Fetch breakthroughs
        results = fetcher.fetch_all()
        if results:
            logger.info(f"Successfully fetched breakthroughs: {list(results.keys())}")
        else:
            logger.error("No results from breakthrough fetching")
    except Exception as e:
        logger.error(f"Error during fetching: {e}")
        raise
    finally:
        fetcher.cleanup()


if __name__ == "__main__":
    main()