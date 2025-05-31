#!/usr/bin/env python3
import yaml
import time
import re
import os
import json
import logging
from typing import Dict, List, Optional, Any
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ClassScraper:
    def __init__(self, output_dir: str = "class_specs", debug_dir: str = "debug_output", classes_url: str = "https://rpg.angelssword.com/game/latest/classes"):
        self.classes_url = classes_url
        self.output_dir = output_dir
        self.debug_dir = debug_dir
        
        # Create output directories if they don't exist
        for directory in [output_dir, debug_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory)
        
        # Initialize the webdriver
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.set_page_load_timeout(30)
            logger.info("Initialized Chrome WebDriver")
        except Exception as e:
            logger.error(f"Failed to initialize Chrome WebDriver: {e}")
            raise
        
    def __del__(self):
        if hasattr(self, 'driver'):
            self.driver.quit()
            logger.info("WebDriver closed")
    
    def load_yaml(self, file_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Loading class list from {file_path}")
        try:
            with open(file_path, 'r') as file:
                data = yaml.safe_load(file)
                logger.info(f"Loaded {len(data)} classes from YAML")
                return data
        except Exception as e:
            logger.error(f"Error loading YAML file: {e}")
            return []
    
    def scrape_classes_list(self) -> List[Dict[str, Any]]:
        """Scrape the classes list page to get all available classes"""
        logger.info(f"Scraping classes list from {self.classes_url}")
        
        try:
            self.driver.get(self.classes_url)
            
            # Wait for class cards to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-class-card"))
            )
            
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            classes = []
            class_cards = soup.select('app-class-card')
            logger.info(f"Found {len(class_cards)} class cards")
            
            for card in class_cards:
                try:
                    # Extract class information
                    link_elem = card.select_one('a')
                    if not link_elem:
                        continue
                    
                    href = link_elem.get('href', '')
                    title = link_elem.get('title', '')
                    
                    # Extract name from the div with class "name"
                    name_elem = card.select_one('.name')
                    class_name = name_elem.text.strip() if name_elem else title
                    
                    # Extract main role
                    main_role_span = card.select_one('label:-soup-contains("Main role:") + span')
                    main_role = main_role_span.text.strip() if main_role_span else ''
                    
                    # Extract secondary role
                    sec_role_span = card.select_one('label:-soup-contains("Sec role:") + span')
                    secondary_role = sec_role_span.text.strip() if sec_role_span else None
                    if secondary_role == '--':
                        secondary_role = None
                    
                    # Extract tier (count filled circles)
                    tier_rating = card.select('label:-soup-contains("Tier") + app-rating .fa-solid.fa-circle')
                    tier = len(tier_rating)
                    
                    # Extract difficulty (count filled stars)
                    difficulty_rating = card.select('label:-soup-contains("Difficulty") + app-rating .fa-solid.fa-star')
                    difficulty = len(difficulty_rating)
                    
                    # Extract image URL
                    img_elem = card.select_one('img')
                    image_url = img_elem.get('src', '') if img_elem else ''
                    
                    # Build the full URL if it's relative
                    if href.startswith('/'):
                        page_url = f"https://rpg.angelssword.com{href}"
                    else:
                        page_url = href
                    
                    class_info = {
                        'class_name': class_name,
                        'tier': tier,
                        'difficulty': difficulty,
                        'roles': {
                            'main': main_role,
                            'secondary': secondary_role
                        },
                        'image_link': image_url,
                        'page_link': page_url
                    }
                    
                    classes.append(class_info)
                    logger.debug(f"Extracted class: {class_name} (Tier {tier}, Difficulty {difficulty})")
                    
                except Exception as e:
                    logger.warning(f"Error extracting class from card: {e}")
                    continue
            
            logger.info(f"Successfully extracted {len(classes)} classes")
            return classes
            
        except Exception as e:
            logger.error(f"Error scraping classes list: {e}")
            return []
    
    def scrape_class(self, class_url: str, class_info: Dict[str, Any]) -> Dict[str, Any]:
        class_name = class_info.get('class_name', '')
        logger.info(f"Scraping {class_name} from {class_url}")
        
        try:
            # Load the page
            self.driver.get(class_url)
            
            # Wait for the page to load
            logger.debug(f"Waiting for page to load")
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "mat-expansion-panel"))
                )
                logger.debug("Page loaded successfully")
            except TimeoutException:
                logger.warning("Timed out waiting for page to load completely, proceeding anyway")
            
            # Click all expansion panels to expand them
            try:
                # Find all expansion panels
                panels = self.driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel-header")
                logger.debug(f"Found {len(panels)} expansion panels to click")
                
                for i, panel in enumerate(panels):
                    try:
                        self.driver.execute_script("arguments[0].click();", panel)
                        logger.debug(f"Clicked expansion panel {i+1}")
                        time.sleep(0.5)  # Give time for animation
                    except Exception as e:
                        logger.warning(f"Error clicking panel {i+1}: {e}")
            except Exception as e:
                logger.warning(f"Error expanding panels: {e}")
            
            # Save the page source
            html = self.driver.page_source
            
            # Save the raw HTML for debugging
            html_debug_path = os.path.join(self.debug_dir, f"{self.sanitize_filename(class_name)}_raw.html")
            with open(html_debug_path, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.debug(f"Saved raw HTML to {html_debug_path}")
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Use data from the scraped class list
            tier = class_info.get('tier', 0)
            difficulty = class_info.get('difficulty', 0)
            main_role = class_info.get('roles', {}).get('main', '')
            secondary_role = class_info.get('roles', {}).get('secondary', None)
            image_url = class_info.get('image_link', '')
            
            # Debug output of each extraction
            logger.debug(f"Class info from scraped list: {json.dumps(class_info, indent=2)}")
            
            # Extract description
            description = self.extract_description(soup)
            logger.debug(f"Description length: {len(description)}")
            if len(description) < 20:
                logger.warning(f"Description seems too short: '{description}'")
            
            # Extract requirements
            requirements = self.extract_requirements(soup)
            logger.debug(f"Requirements: {requirements}")
            
            # Extract guide
            guide = self.extract_guide(soup)
            logger.debug(f"Guide length: {len(guide)}")
            if len(guide) < 20:
                logger.warning(f"Guide seems too short: '{guide}'")
            
            # Extract progression
            progression = self.extract_progression(soup)
            logger.debug(f"Progression items: {len(progression)}")
            for idx, item in enumerate(progression):
                logger.debug(f"Progression {idx}: {json.dumps(item, indent=2)}")
            
            # Extract ability references (just names/IDs for separate ability scraper)
            ability_references = self.extract_ability_references(soup)
            logger.debug(f"Ability references extracted: {len(ability_references)}")
            for idx, ability_ref in enumerate(ability_references):
                logger.debug(f"Ability ref {idx}: {ability_ref}")
            
            # Extract class data
            class_id = self.sanitize_filename(class_name.lower().replace(' ', '_'))
            class_data = {
                "class": {
                    "id": class_id,
                    "name": class_name,
                    "tier": tier,
                    "difficulty": difficulty,
                    "main_role": main_role,
                    "secondary_role": secondary_role,
                    "image_url": image_url,
                    "requirements": requirements,
                    "description": description,
                    "guide": guide,
                    "progression": progression,
                    "ability_references": ability_references
                }
            }
            
            # Save debug JSON for this class
            debug_json_path = os.path.join(self.debug_dir, f"{class_id}_debug.json")
            with open(debug_json_path, 'w', encoding='utf-8') as f:
                json.dump(class_data, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved debug JSON to {debug_json_path}")
            
            return class_data
        
        except Exception as e:
            logger.error(f"Error scraping {class_name}: {str(e)}", exc_info=True)
            return {}
    
    def sanitize_filename(self, filename: str) -> str:
        # Remove invalid characters for filenames
        return re.sub(r'[^\w\-]', '_', filename)
    
    def extract_description(self, soup: BeautifulSoup) -> str:
        logger.debug("Extracting description")
        
        # Look for mat-card with title containing "Description"
        desc_card = soup.find('mat-card-title', string=lambda s: s and 'Description' in s)
        if desc_card:
            logger.debug("Found description card title")
            
            # Find the parent mat-card
            mat_card = desc_card.find_parent('mat-card')
            if mat_card:
                logger.debug("Found description mat-card")
                
                # Find the content div inside mat-card-content
                content_div = mat_card.select_one('mat-card-content div[linkify]')
                if content_div:
                    logger.debug("Found description content div")
                    text = content_div.get_text(strip=True, separator="\n")
                    logger.debug(f"Description text: {text[:100]}...")
                    return text
        
        logger.warning("Could not extract description")
        return ""
    
    def extract_requirements(self, soup: BeautifulSoup) -> dict:
        logger.debug("Extracting requirements")
        
        # Look for mat-card with title containing "Requirements"
        req_card = soup.find('mat-card-title', string=lambda s: s and 'Requirements' in s)
        if req_card:
            logger.debug("Found requirements card title")
            
            # Find the parent mat-card
            mat_card = req_card.find_parent('mat-card')
            if mat_card:
                logger.debug("Found requirements mat-card")
                
                # Find the content div inside mat-card-content
                content_div = mat_card.select_one('mat-card-content div[linkify]')
                if content_div:
                    logger.debug("Found requirements content div")
                    req_text = content_div.get_text(strip=True)
                    logger.debug(f"Requirements text: {req_text}")
                    
                    # Parse requirements
                    if req_text.lower() == "none":
                        return {"type": "none"}
                    
                    # Create a simple conditions list for text requirements
                    return {
                        "type": "and",
                        "conditions": [
                            {
                                "type": "text",
                                "description": req_text
                            }
                        ]
                    }
        
        logger.warning("Could not extract requirements, defaulting to none")
        return {"type": "none"}
    
    def extract_guide(self, soup: BeautifulSoup) -> str:
        logger.debug("Extracting guide")
        
        # Look for mat-card with title containing "Guide"
        guide_card = soup.find('mat-card-title', string=lambda s: s and 'Guide' in s)
        if guide_card:
            logger.debug("Found guide card title")
            
            # Find the parent mat-card
            mat_card = guide_card.find_parent('mat-card')
            if mat_card:
                logger.debug("Found guide mat-card")
                
                # Find the content div inside mat-card-content
                content_div = mat_card.select_one('mat-card-content div[linkify]')
                if content_div:
                    logger.debug("Found guide content div")
                    text = content_div.get_text(strip=True, separator="\n")
                    logger.debug(f"Guide text: {text[:100]}...")
                    return text
        
        logger.warning("Could not extract guide")
        return ""
    
    def extract_progression(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        logger.debug("Extracting progression")
        progression = []
        level_cache = {}  # Cache to prevent duplicates
        
        # Find all app-progression elements (but avoid duplicates between desktop/mobile)
        prog_elements = soup.select('app-progression')
        if not prog_elements:
            logger.warning("No app-progression elements found")
            return progression
        
        logger.debug(f"Found {len(prog_elements)} app-progression elements")
        
        # Only process the first app-progression element to avoid duplicates
        prog_element = prog_elements[0]
        logger.debug("Processing first progression element")
        
        # Find all parent divs with flex-column and flex-md-row classes
        rows = prog_element.select('.d-flex.flex-column.flex-md-row')
        logger.debug(f"Found {len(rows)} rows in progression element")
        
        for row_idx, row in enumerate(rows):
            logger.debug(f"Processing row {row_idx+1}")
            
            label_elem = row.select_one('.label')
            value_elem = row.select_one('.flex-fill')
            
            if not label_elem or not value_elem:
                logger.warning(f"Missing label or value in row {row_idx+1}")
                continue
            
            label = label_elem.text.strip()
            value = value_elem.text.strip()
            
            logger.debug(f"Label: '{label}', Value: '{value}'")
            
            # Extract the level number
            level_match = re.match(r'Level (\d+)', label)
            level = int(level_match.group(1)) if level_match else None
            
            # For key ability, set level to 1
            if "Key Ability" in label:
                level = 1
                benefit_type = "ability"
            # Extract the benefit type
            elif "Ability" in label:
                benefit_type = "ability"
            elif "Skills" in label:
                benefit_type = "skills"
            elif "Heart" in label:
                benefit_type = "attribute_choice"
            elif "Soul" in label:
                benefit_type = "attribute_choice"
            else:
                benefit_type = "text"
            
            logger.debug(f"Level: {level}, Benefit type: {benefit_type}")
            
            # Skip entries without level
            if level is None:
                logger.warning(f"No level found for label '{label}'")
                continue
            
            # Create benefit object based on type
            if benefit_type == "ability":
                # For abilities, just provide the ability ID reference
                ability_id = self.sanitize_filename(value.lower().replace(' ', '_').replace(':', ''))
                benefits = {"type": benefit_type, "ability_id": ability_id}
            elif benefit_type == "skills":
                # For skills, parse the skill description
                skill_options = []
                if "any" in value.lower():
                    skill_options = ["any"]
                else:
                    # Try to extract mentioned skills
                    skill_options = [s.strip() for s in re.findall(r'(?:in|on) ([\w\s,]+)\.', value)]
                    if not skill_options:
                        skill_options = ["custom"]
                
                benefits = {
                    "type": benefit_type,
                    "points": 5,  # Typically 5 points
                    "eligible_skills": skill_options,
                    "can_convert_to_expertise": "expertise" in value.lower(),
                }
            elif benefit_type == "attribute_choice":
                # Parse attribute choices robustly
                suffix = value
                parts = re.split(r'\bto\b', value, flags=re.IGNORECASE)
                if len(parts) > 1:
                    suffix = parts[1]
                raw_attrs = re.split(r',|\bor\b', suffix, flags=re.IGNORECASE)
                attributes = []
                for attr in raw_attrs:
                    attr_clean = attr.strip()
                    attr_clean = re.sub(r'^(?:either\s+)', '', attr_clean, flags=re.IGNORECASE)
                    attr_clean = attr_clean.rstrip('.').strip()
                    if attr_clean:
                        attributes.append(attr_clean)
                benefits = {
                    "type": benefit_type,
                    "choose": 1,
                    "options": [{"attribute": attr, "value": 1} for attr in attributes]
                }
            else:
                benefits = {"type": "text", "description": value}
            
            # Generate a cache key to detect duplicates
            cache_key = f"{level}-{benefit_type}-{json.dumps(benefits)}"
            if cache_key in level_cache:
                logger.debug(f"Skipping duplicate progression item at level {level}")
                continue
            
            level_cache[cache_key] = True
            
            # Check if we already have an entry for this level
            existing_item = next((item for item in progression if item["level"] == level), None)
            
            if existing_item:
                # Add to existing level
                existing_item["benefits"].append(benefits)
                logger.debug(f"Added benefit to existing level {level}")
            else:
                # Create new level entry
                progression_item = {
                    "level": level,
                    "benefits": [benefits]
                }
                progression.append(progression_item)
                logger.debug(f"Added new progression item for level {level}")
        
        # Sort by level
        progression.sort(key=lambda x: x.get("level", 0))
        logger.debug(f"Extracted {len(progression)} progression items")
        return progression
    
    def extract_ability_references(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract ability references for separate ability scraper to handle"""
        logger.debug("Extracting ability references")
        ability_references = []
        
        # Find all expansion panels
        panels = soup.select('mat-expansion-panel')
        logger.debug(f"Found {len(panels)} expansion panels")
        
        for panel_idx, panel in enumerate(panels):
            logger.debug(f"Processing panel {panel_idx+1}")
            
            # Get the header
            header = panel.select_one('mat-expansion-panel-header')
            if not header:
                logger.warning(f"No header found for panel {panel_idx+1}")
                continue
            
            # Get the ability name
            title = header.select_one('span.fs-5.fw-bold')
            if not title:
                logger.warning(f"No title found for panel {panel_idx+1}")
                continue
            
            ability_name = title.text.strip()
            logger.debug(f"Found ability title: '{ability_name}'")
            
            if not ability_name.startswith('○ '):
                logger.debug(f"Skipping non-ability panel: '{ability_name}'")
                continue
            
            ability_name = ability_name.replace('○ ', '')
            logger.info(f"Processing ability reference: {ability_name}")
            
            # Get the panel body
            body = panel.select_one('.mat-expansion-panel-body')
            if not body:
                logger.warning(f"No body found for ability {ability_name}")
                continue
            
            # Determine if this is a key ability or regular ability
            is_key_ability = body.select_one('app-key-ability') is not None
            
            ability_ref = {
                "id": self.sanitize_filename(ability_name.lower().replace(' ', '_')),
                "name": ability_name,
                "type": "key_ability" if is_key_ability else "regular_ability"
            }
            
            # For key abilities, also extract any associated abilities
            if is_key_ability:
                logger.debug(f"Key ability detected: {ability_name}")
                associated_abilities = self.extract_associated_abilities(body)
                if associated_abilities:
                    ability_ref["associated_abilities"] = associated_abilities
                    logger.debug(f"Found {len(associated_abilities)} associated abilities")
            
            ability_references.append(ability_ref)
            logger.info(f"Added ability reference: {ability_name}")
        
        logger.debug(f"Extracted {len(ability_references)} ability references")
        return ability_references
    
    def extract_associated_abilities(self, key_ability_body) -> List[Dict[str, str]]:
        """Extract associated abilities from within key abilities"""
        associated = []
        
        # Look for "Associated Ability" sections
        associated_sections = key_ability_body.select('div.fw-bold.fs-5:-soup-contains("Associated Ability")')
        
        for section in associated_sections:
            # Find the next sibling that contains app-true-ability
            next_element = section.find_next_sibling()
            while next_element:
                if next_element.select_one('app-true-ability'):
                    # Extract the ability name from the mat-card-title
                    title_elem = next_element.select_one('mat-card-title')
                    if title_elem:
                        ability_name = title_elem.text.strip()
                        associated.append({
                            "id": self.sanitize_filename(ability_name.lower().replace(' ', '_')),
                            "name": ability_name
                        })
                        logger.debug(f"Found associated ability: {ability_name}")
                    break
                next_element = next_element.find_next_sibling()
        
        return associated
    
    def save_to_yaml(self, data: Dict[str, Any], class_id: str) -> None:
        filename = f"{self.output_dir}/{class_id}.yaml"
        try:
            with open(filename, 'w', encoding='utf-8') as file:
                yaml.dump(data, file, default_flow_style=False, allow_unicode=True, sort_keys=False)
            logger.info(f"Saved {class_id} to {filename}")
        except Exception as e:
            logger.error(f"Error saving {class_id} to YAML: {str(e)}", exc_info=True)
    
    def run(self, limit_num=None) -> None:
        total_classes = 0
        
        logger.info("Starting scraping process")
        
        # First, scrape the classes list from the website
        classes_list = self.scrape_classes_list()
        if not classes_list:
            logger.error("Failed to scrape classes list from website")
            return
        
        classes_to_scrape = classes_list[:limit_num] if limit_num is not None else classes_list
        logger.info(f"Will scrape {len(classes_to_scrape)} classes")
        
        for class_item in classes_to_scrape:
            class_url = class_item.get('page_link')
            
            if not class_url:
                logger.warning(f"No URL found for class: {class_item.get('class_name', 'Unknown')}")
                continue
            
            class_data = self.scrape_class(class_url, class_item)
            if class_data and 'class' in class_data:
                class_id = class_data['class']['id']
                self.save_to_yaml(class_data, class_id)
                total_classes += 1
            else:
                logger.error(f"Failed to get valid data for {class_item.get('class_name', 'Unknown')}")
            
            # Be nice to the server
            time.sleep(2)
        
        logger.info(f"Scraping process completed. Scraped {total_classes} classes and saved to {self.output_dir}/")

if __name__ == "__main__":
    scraper = ClassScraper(output_dir="class_specs", debug_dir="debug_output")
    
    # Uncomment the line below and change the number to limit the classes processed
    # scraper.run(limit_num=2)
    
    # Or process all classes
    scraper.run()