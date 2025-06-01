#!/usr/bin/env python3
"""
Base fetcher class for scraping Lyrian Chronicles data.
Handles version management and common HTML fetching logic.
"""
import os
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class BaseFetcher(ABC):
    """
    Base class for all fetchers. Handles common functionality like:
    - WebDriver management
    - Version-based URL construction
    - HTML saving with proper directory structure
    - Common UI element interactions (expanding panels, etc.)
    """
    
    BASE_URL = "https://rpg.angelssword.com/game"
    DEFAULT_VERSION = "latest"
    
    def __init__(self, version: Optional[str] = None, output_base_dir: str = "scraped_html"):
        """
        Initialize the fetcher with version support.
        
        Args:
            version: Game version to scrape (e.g., "0.10.1"). If None, uses "latest"
            output_base_dir: Base directory for saving scraped HTML
        """
        self.version = version or self.DEFAULT_VERSION
        self.output_base_dir = output_base_dir
        self.base_url = f"{self.BASE_URL}/{self.version}"
        
        # Create versioned output directory
        self.output_dir = Path(output_base_dir) / self.version / self.get_data_type()
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize WebDriver
        self.driver = self._init_driver()
        logger.info(f"Initialized {self.__class__.__name__} for version: {self.version}")
        logger.info(f"Base URL: {self.base_url}")
        logger.info(f"Output directory: {self.output_dir}")
    
    @abstractmethod
    def get_data_type(self) -> str:
        """
        Return the data type this fetcher handles (e.g., "classes", "items", "races").
        Used for directory organization.
        """
        pass
    
    @abstractmethod
    def get_list_url(self) -> str:
        """Return the URL for the list page of this data type."""
        pass
    
    @abstractmethod
    def extract_list_items(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Extract items from the list page.
        
        Args:
            soup: BeautifulSoup object of the list page
            
        Returns:
            List of dictionaries containing item metadata and URLs
        """
        pass
    
    def _init_driver(self) -> webdriver.Chrome:
        """Initialize and configure Chrome WebDriver."""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.set_page_load_timeout(30)
            logger.info("Chrome WebDriver initialized successfully")
            return driver
        except Exception as e:
            logger.error(f"Failed to initialize Chrome WebDriver: {e}")
            raise
    
    def __del__(self):
        """Clean up WebDriver on deletion."""
        if hasattr(self, 'driver'):
            self.driver.quit()
            logger.info("WebDriver closed")
    
    def fetch_list_page(self) -> List[Dict[str, Any]]:
        """
        Fetch the main list page and extract items to scrape.
        
        Returns:
            List of items with metadata and URLs
        """
        list_url = self.get_list_url()
        logger.info(f"Fetching list page: {list_url}")
        
        try:
            self.driver.get(list_url)
            
            # Wait for page to load (customize wait condition per fetcher if needed)
            self._wait_for_list_page()
            
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            # Save list page HTML for debugging
            list_html_path = self.output_dir / "_list_page.html"
            with open(list_html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.debug(f"Saved list page HTML to {list_html_path}")
            
            # Extract items
            items = self.extract_list_items(soup)
            logger.info(f"Extracted {len(items)} items from list page")
            
            return items
            
        except Exception as e:
            logger.error(f"Error fetching list page: {e}")
            return []
    
    def fetch_detail_page(self, url: str, item_id: str, metadata: Optional[Dict] = None) -> str:
        """
        Fetch a detail page and save the HTML.
        
        Args:
            url: URL of the detail page
            item_id: Unique identifier for this item (used for filename)
            metadata: Optional metadata to include in a sidecar file
            
        Returns:
            Path to the saved HTML file
        """
        logger.info(f"Fetching detail page for {item_id}: {url}")
        
        try:
            self.driver.get(url)
            
            # Wait for page to load
            self._wait_for_detail_page()
            
            # Expand any collapsible sections
            self._expand_all_panels()
            
            # Get final HTML
            html = self.driver.page_source
            
            # Save HTML
            html_path = self.output_dir / f"{item_id}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Saved HTML to {html_path}")
            
            # Save metadata if provided
            if metadata:
                metadata_path = self.output_dir / f"{item_id}.meta.json"
                import json
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                logger.debug(f"Saved metadata to {metadata_path}")
            
            return str(html_path)
            
        except Exception as e:
            logger.error(f"Error fetching detail page for {item_id}: {e}")
            return ""
    
    def _wait_for_list_page(self):
        """Wait for list page to load. Override in subclasses for specific wait conditions."""
        # Default: wait for body to be present
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    
    def _wait_for_detail_page(self):
        """Wait for detail page to load. Override in subclasses for specific wait conditions."""
        # Default: wait for body to be present
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    
    def _expand_all_panels(self):
        """Expand all mat-expansion-panels on the page."""
        try:
            panels = self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel-header")
            logger.debug(f"Found {len(panels)} expansion panels to expand")
            
            for i, panel in enumerate(panels):
                try:
                    # Check if panel is already expanded
                    panel_element = panel.find_element(By.XPATH, "..")
                    classes = panel_element.get_attribute("class")
                    if "mat-expanded" not in classes:
                        self.driver.execute_script("arguments[0].click();", panel)
                        logger.debug(f"Expanded panel {i+1}")
                        time.sleep(0.3)  # Small delay for animation
                except Exception as e:
                    logger.warning(f"Error expanding panel {i+1}: {e}")
                    
        except Exception as e:
            logger.warning(f"Error finding/expanding panels: {e}")
    
    def fetch_all(self, limit: Optional[int] = None, delay: float = 2.0) -> Dict[str, str]:
        """
        Fetch all items of this type.
        
        Args:
            limit: Maximum number of items to fetch (None for all)
            delay: Delay between requests in seconds
            
        Returns:
            Dictionary mapping item IDs to their HTML file paths
        """
        items = self.fetch_list_page()
        
        if not items:
            logger.warning("No items found to fetch")
            return {}
        
        # Apply limit if specified
        if limit:
            items = items[:limit]
            logger.info(f"Limiting to {limit} items")
        
        results = {}
        for i, item in enumerate(items):
            item_id = item.get('id', f'item_{i}')
            url = item.get('url', '')
            
            if not url:
                logger.warning(f"No URL for item {item_id}, skipping")
                continue
            
            # Ensure absolute URL
            if url.startswith('/'):
                url = f"https://rpg.angelssword.com{url}"
            
            html_path = self.fetch_detail_page(url, item_id, item)
            if html_path:
                results[item_id] = html_path
            
            # Be polite to the server
            if i < len(items) - 1:
                time.sleep(delay)
        
        logger.info(f"Fetched {len(results)} items successfully")
        return results