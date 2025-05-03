#!/usr/bin/env python3
import yaml
import time
import re
import os
import json
import logging
import requests
import shutil
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Changed default level to INFO
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("image_scraper_debug.log"), # Changed log file name
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ImageScraper:
    def __init__(self, yaml_file: str, output_dir: str = "../lctools-app/public/images/classes"):
        self.classes = self.load_yaml(yaml_file)
        self.output_dir = output_dir

        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            logger.info(f"Created output directory: {self.output_dir}")

    def load_yaml(self, file_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Loading class list from {file_path}")
        try:
            with open(file_path, 'r') as file:
                data = yaml.safe_load(file)
                if not isinstance(data, list):
                    logger.error(f"YAML file {file_path} does not contain a list.")
                    return []
                logger.info(f"Loaded {len(data)} classes from YAML")
                return data
        except Exception as e:
            logger.error(f"Error loading YAML file {file_path}: {e}")
            return []

    def sanitize_filename(self, filename: str) -> str:
        # Remove invalid characters for filenames, keep spaces initially for readability if needed
        sanitized = re.sub(r'[^\w\-\s]', '_', filename)
        # Replace spaces with underscores
        sanitized = re.sub(r'\s+', '_', sanitized)
        return sanitized

    def download_image(self, class_info: Dict[str, Any]) -> None:
        class_name = class_info.get('class_name')
        image_url = class_info.get('image_link')

        if not class_name:
            logger.warning(f"Skipping entry due to missing class_name: {class_info}")
            return
        if not image_url:
            logger.warning(f"No image_link found for class: {class_name}")
            return

        logger.info(f"Processing class: {class_name}, Image URL: {image_url}")

        try:
            # Get the image
            response = requests.get(image_url, stream=True, timeout=30)
            response.raise_for_status() # Raise an exception for bad status codes

            # Determine the file extension
            parsed_url = urlparse(image_url)
            _, ext = os.path.splitext(parsed_url.path)
            if not ext:
                # Try to guess from content type
                content_type = response.headers.get('content-type')
                if content_type:
                    if 'jpeg' in content_type or 'jpg' in content_type:
                        ext = '.jpg'
                    elif 'png' in content_type:
                        ext = '.png'
                    elif 'gif' in content_type:
                        ext = '.gif'
                    elif 'webp' in content_type:
                        ext = '.webp'
                    else:
                        logger.warning(f"Could not determine file extension for {class_name} from URL or content-type ({content_type}). Skipping.")
                        return
                else:
                     logger.warning(f"Could not determine file extension for {class_name} from URL and no content-type header found. Skipping.")
                     return


            # Sanitize class name for filename and add extension
            filename = f"{self.sanitize_filename(class_name)}{ext}"
            output_path = os.path.join(self.output_dir, filename)

            # Save the image
            with open(output_path, 'wb') as f:
                response.raw.decode_content = True
                shutil.copyfileobj(response.raw, f)

            logger.info(f"Successfully downloaded and saved image for {class_name} to {output_path}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Error downloading image for {class_name} from {image_url}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred while processing {class_name}: {e}", exc_info=True)


    def run(self, limit_num=None) -> None:
        total_downloaded = 0

        logger.info("Starting image downloading process")
        classes_to_process = self.classes[:limit_num] if limit_num is not None else self.classes
        logger.info(f"Will process images for {len(classes_to_process)} classes")

        if not self.classes:
             logger.error("No classes loaded from YAML. Aborting.")
             return

        for class_item in classes_to_process:
            if not isinstance(class_item, dict):
                logger.warning(f"Skipping invalid entry in class list: {class_item}")
                continue

            self.download_image(class_item)
            total_downloaded += 1 # Increment even if download fails, to track processed items

            # Be nice to the server
            time.sleep(0.5) # Reduced sleep time as we are only downloading images

        logger.info(f"Image downloading process completed. Processed {total_downloaded} classes. Images saved to {self.output_dir}/")

if __name__ == "__main__":
    # Assuming class_list.yaml is in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    yaml_path = os.path.join(script_dir, "class_list.yaml")
    # Output directory relative to the script's location
    output_path = os.path.join(script_dir, "../lctools-app/public/images/classes")

    scraper = ImageScraper(yaml_path, output_path)

    # Uncomment the line below and change the number to limit the classes processed
    # scraper.run(limit_num=5)

    # Or process all classes
    scraper.run()
