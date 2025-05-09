#!/usr/bin/env python3
import re
import yaml
import argparse
from bs4 import BeautifulSoup
import os

def parse_ability(panel):
    """Parses a single mat-expansion-panel for ability information."""
    ability_data = {}

    # Extract Ability Name
    name_span = panel.select_one('mat-panel-title span.fs-5.fw-bold')
    if name_span:
        # Remove the leading '○ ' character and strip whitespace
        ability_name = name_span.get_text(strip=True)
        if ability_name.startswith('○ '):
            ability_name = ability_name[2:]
        ability_data['name'] = ability_name.strip()
    else:
        print("Warning: No ability name found in the panel.")
        return None

    # Check for ability type (true or key)
    true_ability = panel.select_one('app-true-ability')
    key_ability = panel.select_one('app-key-ability')
    
    # Set the ability type
    if true_ability:
        ability_data['type'] = 'true_ability'
    elif key_ability:
        ability_data['type'] = 'key_ability'
    else:
        ability_data['type'] = 'unknown'

    # Process true-ability content
    if true_ability:
        content_area = true_ability.select_one('.mat-mdc-card-content')
        if content_area:
            # Extract information from the list items
            for li in content_area.select('li.d-flex'):
                title_div = li.select_one('.title.fs-6')
                value_div = li.select_one('.flex-fill.fs-6')

                if title_div and value_div:
                    title = title_div.get_text(strip=True)

                    # Process based on title
                    if title == 'Keywords':
                        keywords = [chip.get_text(strip=True)
                                    for chip in value_div.select('.mat-mdc-chip .mdc-evolution-chip__text-label')]
                        # Handle the '--' case for keywords
                        if len(keywords) == 1 and keywords[0] == '--':
                            ability_data['keywords'] = []
                        else:
                            ability_data['keywords'] = keywords
                    elif title in ['Description', 'Requirement', 'Other costs']:
                        # Extract text, preserving basic line breaks
                        # Replace <br> with newline, then get text from <p> tags
                        for br in value_div.find_all('br'):
                            br.replace_with('\n')
                        # Get text from p tags, preserving line breaks from <br>
                        paragraphs = value_div.select('p')
                        if paragraphs:
                            # Join paragraphs with double newline for clarity
                            value_text = "\n\n".join(p.get_text(strip=True) for p in paragraphs)
                        else:
                            # If no paragraphs, get text directly (handle -- or -)
                            value_text = value_div.get_text(strip=True)

                        if value_text in ['--', '-']:
                            ability_data[title.lower().replace(' ', '_')] = None # Use None for empty/dash values
                        else:
                            ability_data[title.lower().replace(' ', '_')] = value_text
                    elif title in ['Range', 'Mana cost', 'AP cost', 'RP cost']:
                        value_text = value_div.get_text(strip=True)
                        # Clean up potential weird whitespace/newlines within values
                        value_text = re.sub(r'\s+', ' ', value_text).strip()
                        if value_text in ['--', '-']:
                            ability_data[title.lower().replace(' ', '_')] = None
                        else:
                            ability_data[title.lower().replace(' ', '_')] = value_text

    # Process key-ability content
    if key_ability:
        # Extract benefits from key-ability
        benefits_title = key_ability.select_one('div.fw-bold.fs-5')
        if benefits_title and 'Benefits' in benefits_title.get_text(strip=True):
            benefit_items = key_ability.select('mat-card-content ul li')
            if benefit_items:
                benefits = [item.get_text(strip=True) for item in benefit_items]
                ability_data['benefits'] = benefits

    return ability_data

def process_html_file(file_path):
    """Process a single HTML file and return a list of parsed abilities."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, 'html.parser')
        ability_panels = soup.select('mat-expansion-panel')
        
        print(f"Found {len(ability_panels)} potential ability panels in {os.path.basename(file_path)}.")
        
        abilities_from_file = []
        for panel in ability_panels:
            ability = parse_ability(panel)
            if ability and 'name' in ability:
                abilities_from_file.append(ability)
        
        return abilities_from_file
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description='Parse ability HTML files into YAML.')
    parser.add_argument('--true-abilities', help='Path to true abilities HTML file')
    parser.add_argument('--key-abilities', help='Path to key abilities HTML file')
    parser.add_argument('--output', default='abilities.yaml', help='Output YAML file path')
    args = parser.parse_args()

    all_abilities = []
    
    # Process true abilities if provided
    if args.true_abilities:
        true_abilities = process_html_file(args.true_abilities)
        all_abilities.extend(true_abilities)
        print(f"Processed {len(true_abilities)} true abilities.")
    
    # Process key abilities if provided
    if args.key_abilities:
        key_abilities = process_html_file(args.key_abilities)
        all_abilities.extend(key_abilities)
        print(f"Processed {len(key_abilities)} key abilities.")

    # If no input files were specified, use default paths
    if not (args.true_abilities or args.key_abilities):
        version_dir = 'version/0.9.12'
        true_abilities_path = f"{version_dir}/true_abilities.html"
        key_abilities_path = f"{version_dir}/key_abilities.html"
        
        # Check if files exist and process them
        if os.path.exists(true_abilities_path):
            true_abilities = process_html_file(true_abilities_path)
            all_abilities.extend(true_abilities)
            print(f"Processed {len(true_abilities)} true abilities from default path.")
        
        if os.path.exists(key_abilities_path):
            key_abilities = process_html_file(key_abilities_path)
            all_abilities.extend(key_abilities)
            print(f"Processed {len(key_abilities)} key abilities from default path.")

    # Write the combined data to a YAML file
    if all_abilities:
        output_path = args.output
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(all_abilities, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        print(f"Successfully saved {len(all_abilities)} combined abilities to {output_path}")
    else:
        print("No abilities were processed. Check your input files.")

if __name__ == '__main__':
    main()

