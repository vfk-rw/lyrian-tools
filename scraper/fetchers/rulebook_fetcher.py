#!/usr/bin/env python3
"""
Rulebook Fetcher - Fetch the game rulebook HTML

This fetcher retrieves the rulebook page which contains game rules,
mechanics, and tables that need to be converted to markdown.
"""

import logging
import time
from datetime import datetime
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException

from core.fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class RulebookFetcher(BaseFetcher):
    """Fetcher for the game rulebook"""
    
    def get_data_type(self) -> str:
        """Return the data type this fetcher handles"""
        return "rulebook"
    
    def get_base_url(self, version: str) -> str:
        """Get the base URL for the rulebook"""
        return f"https://rpg.angelssword.com/game/{version}/rulebook"
    
    def get_list_url(self, version: str) -> str:
        """Get the list URL - rulebook only has one page"""
        return self.get_base_url(version)
    
    def extract_list_items(self) -> list:
        """Extract list items - rulebook is a single page"""
        return [{"id": "rulebook", "url": self.get_base_url(self.version)}]
    
    def fetch_all(self):
        """Override to fetch the single rulebook page"""
        logger.info("Starting rulebook fetch")
        
        # Navigate to the rulebook page
        url = self.get_base_url(self.version)
        self.driver.get(url)
        
        # Wait for content to load
        self._wait_for_detail_page()
        
        # Save the page
        metadata = {
            "url": url,
            "fetched_at": datetime.now().isoformat(),
            "version": self.version
        }
        self.fetch_detail_page(url, "rulebook", metadata)
        
        return ["rulebook"]
    
    def _wait_for_detail_page(self):
        """Wait for the rulebook page to load"""
        try:
            # Wait for the main content to appear
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "mat-card"))
            )
            
            # Wait for specific rulebook content indicators
            WebDriverWait(self.driver, 10).until(
                lambda driver: (
                    "Rulebook" in driver.page_source or
                    "Table of Contents" in driver.page_source or
                    "Character Creation" in driver.page_source
                )
            )
            
            # Additional wait for content to fully render
            time.sleep(2)
            
        except TimeoutException:
            logger.warning("Timeout waiting for rulebook content")
            # Continue anyway - we might have partial content


def main():
    """Command-line interface for rulebook fetcher"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fetch game rulebook HTML")
    parser.add_argument("--version", default="latest", help="Game version (default: latest)")
    parser.add_argument("--output-dir", default="scraped_html", help="Output directory")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create fetcher and run
    fetcher = RulebookFetcher(version=args.version, output_base_dir=args.output_dir)
    fetcher.fetch_all()


if __name__ == "__main__":
    main()