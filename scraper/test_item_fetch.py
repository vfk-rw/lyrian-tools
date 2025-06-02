#!/usr/bin/env python3
"""Test script to fetch a few items and check their types."""

import logging
from fetchers.item_fetcher import ItemFetcher

logging.basicConfig(level=logging.INFO)

# Create fetcher
fetcher = ItemFetcher(version="latest")

# Override fetch_all to limit items
def limited_fetch_all(self, limit=5):
    """Fetch only a limited number of items for testing."""
    items = self.fetch_list_page()
    
    if not items:
        logging.warning("No items found to fetch")
        return {}
    
    # Take only first few items
    items = items[:limit]
    
    fetched = {}
    all_metadata = []
    
    for item in items:
        item_id = item.get('id', '')
        
        if not item_id:
            logging.warning(f"Skipping item with no ID: {item}")
            continue
        
        try:
            # Use fetch_detail method instead
            html_path = self.fetch_detail(item_id, item)
            if html_path:
                fetched[item_id] = str(html_path)
                all_metadata.append(item)
                logging.info(f"Successfully fetched {item_id}")
            else:
                logging.error(f"Failed to fetch {item_id}")
        except Exception as e:
            logging.error(f"Error fetching {item_id}: {e}")
            import traceback
            traceback.print_exc()
    
    # Run post-processing
    if hasattr(self, 'post_process'):
        self.post_process(all_metadata)
    
    return fetched

# Monkey patch the method
ItemFetcher.fetch_all = limited_fetch_all

# Run the fetcher
try:
    fetcher.fetch_all(fetcher)
finally:
    fetcher.cleanup()