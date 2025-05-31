#!/usr/bin/env python3
import re
import yaml
import argparse
from bs4 import BeautifulSoup
import os

def parse_individual_crafting_ability(ability_text, ability_name):
    """Parse a single crafting ability from its text block"""
    crafting_ability = {
        'name': ability_name,
        'id': sanitize_ability_id(ability_name),
        'type': 'crafting_ability'
    }
    
    # Extract cost - look for "Cost:" followed by the cost value, stopping at "Description:" or newline
    cost_match = re.search(r'Cost:\s*([^:\n]+?)(?:Description:|$)', ability_text, re.IGNORECASE)
    if cost_match:
        cost_text = cost_match.group(1).strip()
        if cost_text and cost_text not in ['-', '--']:
            crafting_ability['cost'] = cost_text
    
    # Extract keywords if present (though crafting abilities usually don't have them)
    keywords_match = re.search(r'Keywords:\s*([^\n]+?)(?:\n|$)', ability_text, re.IGNORECASE)
    if keywords_match:
        keywords_text = keywords_match.group(1).strip()
        if keywords_text and keywords_text not in ['-', '--']:
            keywords = [kw.strip() for kw in re.split(r'[,;]', keywords_text) if kw.strip()]
            crafting_ability['keywords'] = keywords
    
    # Extract description - look for "Description:" followed by the description
    desc_match = re.search(r'Description:\s*(.+?)(?=\n\s*\*\*[^*]+\*\*|$)', ability_text, re.IGNORECASE | re.DOTALL)
    if desc_match:
        description = desc_match.group(1).strip()
        # Clean up any remaining HTML-like artifacts
        description = re.sub(r'&nbsp;', ' ', description)
        description = re.sub(r'\s+', ' ', description)
        crafting_ability['description'] = description
    elif not cost_match:
        # If no description section found and no cost, treat the whole text as description
        crafting_ability['description'] = ability_text.strip()
    
    # Check if this is a co-craft ability and add keyword
    description = crafting_ability.get('description', '')
    if description.lower().startswith('co-craft'):
        # Initialize keywords if not present
        if 'keywords' not in crafting_ability:
            crafting_ability['keywords'] = []
        # Add co-craft keyword if not already present
        if 'co-craft' not in crafting_ability['keywords']:
            crafting_ability['keywords'].append('co-craft')
    
    return crafting_ability



def sanitize_ability_id(name):
    """Create a consistent ability ID from the name"""
    # Remove leading/trailing whitespace and convert to lowercase
    clean_name = name.strip().lower()
    # Replace spaces and special characters with underscores
    clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphens
    clean_name = re.sub(r'[-\s]+', '_', clean_name)   # Replace spaces/hyphens with underscores
    # Remove multiple underscores
    clean_name = re.sub(r'_+', '_', clean_name)
    # Remove leading/trailing underscores
    clean_name = clean_name.strip('_')
    return clean_name

def extract_costs(ability_data):
    """Extract and normalize cost information into a structured format"""
    costs = {}
    
    # Handle different cost types
    cost_mappings = {
        'mana_cost': 'mana',
        'ap_cost': 'ap', 
        'rp_cost': 'rp'
    }
    
    for field_name, cost_type in cost_mappings.items():
        if field_name in ability_data:
            cost_text = ability_data[field_name]
            if cost_text and cost_text not in ['--', '-', None]:
                # Handle X costs for variable spells
                if 'X' in cost_text:
                    costs[cost_type] = 'X'
                else:
                    # Extract number from cost text (e.g., "4 MP" -> 4)
                    match = re.search(r'(\d+)', cost_text)
                    if match:
                        costs[cost_type] = int(match.group(1))
                    else:
                        # Handle special cases like "NaN RP"
                        if 'NaN' in cost_text:
                            costs[cost_type] = 'variable'
                        else:
                            costs[cost_type] = cost_text
            # Remove the original field
            del ability_data[field_name]
    
    # Handle "Other costs" field
    if 'other_costs' in ability_data:
        other_costs = ability_data['other_costs']
        if other_costs and other_costs not in ['--', '-', None]:
            costs['other'] = other_costs
        del ability_data['other_costs']
    
    if costs:
        ability_data['costs'] = costs

def parse_crafting_abilities(description_text, ability_name):
    """Parse crafting abilities from complex description text"""
    crafting_abilities = []
    
    # Look for ability patterns: Word/phrase followed by "Cost:" at start of line or after newline
    # This is more conservative - looks for clear ability starts
    ability_pattern = r'(?:^|\n\n)([A-Z][a-zA-Z\s&\']+?)(?=Cost:)'
    
    # Find all potential ability starts
    matches = list(re.finditer(ability_pattern, description_text, re.MULTILINE))
    
    if len(matches) < 2:
        # If we don't find at least 2 clear abilities, don't split
        return [{
            'name': ability_name,
            'type': 'crafting_ability',
            'description': description_text.strip()
        }]
    
    # Process each found ability
    for i, match in enumerate(matches):
        ability_name_match = match.group(1).strip()
        start_pos = match.start()
        
        # Find the end position (start of next ability or end of text)
        if i + 1 < len(matches):
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(description_text)
        
        ability_text = description_text[start_pos:end_pos].strip()
        
        # Skip if this looks like it's just a fragment
        if len(ability_text) < 20:
            continue
            
        # Parse the individual crafting ability
        crafting_ability = parse_individual_crafting_ability(ability_text, ability_name_match)
        if crafting_ability and crafting_ability.get('name'):
            crafting_abilities.append(crafting_ability)
    
    # If we didn't get good results, fall back to single ability
    if len(crafting_abilities) < 2:
        return [{
            'name': ability_name,
            'type': 'crafting_ability', 
            'description': description_text.strip()
        }]
    
    return crafting_abilities

def should_parse_as_crafting(ability_data, class_roles=None):
    """Determine if an ability should be parsed as crafting abilities"""
    description = ability_data.get('description', '')
    
    # Check if class has Artisan role
    is_artisan_class = class_roles and ('Artisan' in class_roles)
    
    # Look for crafting indicators
    crafting_indicators = [
        'crafting points', 'crafting check', 'crafting session', 'crafting dice',
        'interlude point', 'IP', 'co-craft'
    ]
    
    has_crafting_indicators = any(indicator.lower() in description.lower() for indicator in crafting_indicators)
    
    # Look for multiple ability blocks that start with a name and have Cost:/Description:
    ability_block_pattern = r'(?:^|\n\n)([A-Z][a-zA-Z\s&\']+?)Cost:[^\n]+.*?Description:'
    ability_blocks = re.findall(ability_block_pattern, description, re.IGNORECASE | re.DOTALL)
    
    has_multiple_blocks = len(ability_blocks) >= 2
    
    # Check for strong Co-Craft indicators - multiple Co-Craft abilities with clear structure
    co_craft_count = description.lower().count('co-craft')
    has_strong_co_craft_pattern = co_craft_count >= 2 and has_multiple_blocks
    
    # Split if:
    # 1. Traditional case: Artisan class with crafting indicators and multiple blocks, OR
    # 2. Strong Co-Craft pattern: Multiple Co-Craft abilities with clear block structure
    return (is_artisan_class and has_crafting_indicators and has_multiple_blocks) or \
           (has_strong_co_craft_pattern and has_crafting_indicators)

def extract_requirements(ability_data):
    """Extract and structure requirement information"""
    if 'requirement' in ability_data:
        req_text = ability_data['requirement']
        if req_text and req_text not in ['--', '-', None]:
            # Structure requirements as a list for consistency
            ability_data['requirements'] = [req_text]
        del ability_data['requirement']

def parse_ability(panel, class_roles=None):
    """Parses a single mat-expansion-panel for ability information."""
    ability_data = {}

    # Extract Ability Name
    name_span = panel.select_one('mat-panel-title span.fs-5.fw-bold')
    if not name_span:
        # Try alternative selector
        name_span = panel.select_one('.mat-expansion-panel-header-title span.fs-5.fw-bold')
    
    if name_span:
        # Remove the leading '○ ' character and strip whitespace
        ability_name = name_span.get_text(strip=True)
        if ability_name.startswith('○ '):
            ability_name = ability_name[2:].strip()
        
        if not ability_name:
            print("Warning: Empty ability name found in panel.")
            return None
            
        ability_data['name'] = ability_name
        ability_data['id'] = sanitize_ability_id(ability_name)
    else:
        print("Warning: No ability name found in the panel.")
        return None

    # Check for ability type (true or key)
    true_ability = panel.select_one('app-true-ability')
    key_ability = panel.select_one('app-key-ability')
    
    # Set the ability type
    if key_ability:
        ability_data['type'] = 'key_ability'
    elif true_ability:
        ability_data['type'] = 'true_ability'
    else:
        ability_data['type'] = 'unknown'
        print(f"Warning: Unknown ability type for {ability_data.get('name', 'unnamed ability')}")

    # Process true-ability content
    if true_ability:
        content_area = true_ability.select_one('.mat-mdc-card-content')
        if content_area:
            # Extract information from the list items
            for li in content_area.select('li.d-flex'):
                title_div = li.select_one('.title.fs-6')
                value_div = li.select_one('.flex-fill.fs-6')

                if not title_div or not value_div:
                    continue

                title = title_div.get_text(strip=True)
                
                # Process based on title
                if title == 'Keywords':
                    # Look for mat-chip elements for keywords
                    keywords = []
                    chips = value_div.select('mat-chip .mdc-evolution-chip__text-label')
                    
                    if chips:
                        keywords = [chip.get_text(strip=True) for chip in chips]
                    else:
                        # Fallback: check for plain text keywords
                        keyword_text = value_div.get_text(strip=True)
                        if keyword_text and keyword_text not in ['--', '-']:
                            # Split by common separators
                            keywords = [kw.strip() for kw in re.split(r'[,;]', keyword_text) if kw.strip()]
                    
                    # Handle the '--' case for keywords
                    if len(keywords) == 1 and keywords[0] in ['--', '-']:
                        ability_data['keywords'] = []
                    else:
                        ability_data['keywords'] = keywords
                
                elif title in ['Description', 'Requirement', 'Other costs']:
                    # Extract text, preserving basic line breaks
                    # Replace <br> with newline for better text extraction
                    for br in value_div.find_all('br'):
                        br.replace_with('\n')
                    
                    # Get text from p tags, preserving paragraphs
                    paragraphs = value_div.select('p')
                    if paragraphs:
                        # Join paragraphs with double newline for clarity
                        value_text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
                    else:
                        # If no paragraphs, get text directly
                        value_text = value_div.get_text(strip=True)
                    
                    # Clean up extra whitespace
                    value_text = re.sub(r'\n\s*\n\s*\n', '\n\n', value_text)  # Remove excessive newlines
                    value_text = value_text.strip()

                    if value_text in ['--', '-']:
                        ability_data[title.lower().replace(' ', '_')] = None
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
        benefits_section = key_ability.select_one('div.fw-bold.fs-5:-soup-contains("Benefits")')
        if benefits_section:
            # Find the next mat-card after the Benefits header
            benefits_card = benefits_section.find_next_sibling('mat-card')
            if benefits_card:
                benefit_items = benefits_card.select('mat-card-content ul li')
                if benefit_items:
                    benefits = [item.get_text(strip=True) for item in benefit_items if item.get_text(strip=True)]
                    if benefits:
                        ability_data['benefits'] = benefits
        
        # Extract associated abilities from key-ability
        associated_section = key_ability.select_one('div.fw-bold.fs-5:-soup-contains("Associated Ability")')
        if associated_section:
            # Find the next app-true-ability after the Associated Ability header
            associated_ability = associated_section.find_next_sibling('app-true-ability')
            if associated_ability:
                # Get the ability name from the mat-card-title
                title_elem = associated_ability.select_one('mat-card-title')
                if title_elem:
                    associated_name = title_elem.get_text(strip=True)
                    associated_id = sanitize_ability_id(associated_name)
                    # Avoid self-references
                    if associated_id != ability_data['id']:
                        ability_data['associated_abilities'] = [{
                            'name': associated_name,
                            'id': associated_id
                        }]

    # Check if this should be parsed as crafting abilities
    if should_parse_as_crafting(ability_data, class_roles):
        description = ability_data.get('description', '')
        if description:
            crafting_abilities = parse_crafting_abilities(description, ability_data['name'])
            # If we got multiple crafting abilities, return them as a list
            if len(crafting_abilities) > 1:
                print(f"  ⚡ Parsed {len(crafting_abilities)} crafting abilities from: {ability_data['name']}")
                # Update each crafting ability with the base ability data
                for craft_ability in crafting_abilities:
                    craft_ability['id'] = sanitize_ability_id(f"{ability_data['name']}_{craft_ability['name']}")
                    if 'keywords' not in craft_ability:
                        craft_ability['keywords'] = ability_data.get('keywords', [])
                return crafting_abilities

    # Post-process the ability data
    extract_costs(ability_data)
    extract_requirements(ability_data)
    
    # Set default values for missing fields
    if 'keywords' not in ability_data:
        ability_data['keywords'] = []
    
    if 'range' not in ability_data and ability_data['type'] == 'true_ability':
        ability_data['range'] = None

    return ability_data

def process_html_file(file_path, class_roles=None):
    """Process a single HTML file and return a list of parsed abilities."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, 'html.parser')
        ability_panels = soup.select('mat-expansion-panel')
        
        print(f"Found {len(ability_panels)} potential ability panels in {os.path.basename(file_path)}.")
        
        abilities_from_file = []
        seen_ids = set()
        
        for panel in ability_panels:
            ability_result = parse_ability(panel, class_roles)
            
            # Handle both single abilities and lists of crafting abilities
            if isinstance(ability_result, list):
                # Multiple crafting abilities returned
                for ability in ability_result:
                    if ability and 'name' in ability:
                        if ability['id'] not in seen_ids:
                            abilities_from_file.append(ability)
                            seen_ids.add(ability['id'])
                            print(f"  ✓ Parsed: {ability['name']} (type: {ability['type']})")
                        else:
                            print(f"  ⚠️  Skipping duplicate: {ability['name']} ({ability['id']})")
            else:
                # Single ability returned
                ability = ability_result
                if ability and 'name' in ability:
                    if ability['id'] not in seen_ids:
                        abilities_from_file.append(ability)
                        seen_ids.add(ability['id'])
                        print(f"  ✓ Parsed: {ability['name']} (type: {ability['type']})")
                    else:
                        print(f"  ⚠️  Skipping duplicate: {ability['name']} ({ability['id']})")
                else:
                    print(f"  ✗ Failed to parse panel")
        
        return abilities_from_file
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def validate_abilities(abilities):
    """Validate the parsed abilities and report any issues"""
    print(f"\n=== Validation Report ===")
    
    # Check for duplicate names/IDs
    names = [ability['name'] for ability in abilities]
    ids = [ability['id'] for ability in abilities]
    
    duplicate_names = [name for name in set(names) if names.count(name) > 1]
    duplicate_ids = [id for id in set(ids) if ids.count(id) > 1]
    
    if duplicate_names:
        print(f"⚠️  Duplicate names found: {duplicate_names}")
    
    if duplicate_ids:
        print(f"⚠️  Duplicate IDs found: {duplicate_ids}")
    
    # Check for abilities missing key fields
    missing_fields = []
    for ability in abilities:
        issues = []
        if not ability.get('description'):
            issues.append('description')
        if ability['type'] == 'true_ability' and not ability.get('keywords'):
            issues.append('keywords')
        if issues:
            missing_fields.append(f"{ability['name']}: missing {', '.join(issues)}")
    
    if missing_fields:
        print(f"⚠️  Abilities with missing fields:")
        for issue in missing_fields:
            print(f"     {issue}")
    
    # Summary
    key_abilities = [a for a in abilities if a['type'] == 'key_ability']
    true_abilities = [a for a in abilities if a['type'] == 'true_ability']
    unknown_abilities = [a for a in abilities if a['type'] == 'unknown']
    
    print(f"\n📊 Summary:")
    print(f"   Total abilities: {len(abilities)}")
    print(f"   Key abilities: {len(key_abilities)}")
    print(f"   True abilities: {len(true_abilities)}")
    print(f"   Unknown type: {len(unknown_abilities)}")
    
    if unknown_abilities:
        print(f"   Unknown abilities: {[a['name'] for a in unknown_abilities]}")

def main():
    parser = argparse.ArgumentParser(description='Parse ability HTML files into YAML.')
    parser.add_argument('--true-abilities', help='Path to true abilities HTML file')
    parser.add_argument('--key-abilities', help='Path to key abilities HTML file')
    parser.add_argument('--output', default='abilities.yaml', help='Output YAML file path')
    parser.add_argument('--validate', action='store_true', help='Run validation on parsed abilities')
    parser.add_argument('--class-roles', nargs='*', help='Class roles (e.g., Artisan Support) to help with crafting ability detection')
    args = parser.parse_args()

    all_abilities = []
    global_seen_ids = set()  # Track IDs across all files
    class_roles = args.class_roles or []
    
    def add_abilities_with_dedup(abilities_list, file_type):
        """Add abilities to all_abilities while deduplicating across files"""
        added_count = 0
        for ability in abilities_list:
            if ability and 'id' in ability:
                if ability['id'] not in global_seen_ids:
                    all_abilities.append(ability)
                    global_seen_ids.add(ability['id'])
                    added_count += 1
                else:
                    print(f"  ⚠️  Skipping cross-file duplicate: {ability['name']} ({ability['id']}) in {file_type}")
        return added_count
    
    # Process true abilities if provided
    if args.true_abilities:
        if os.path.exists(args.true_abilities):
            true_abilities = process_html_file(args.true_abilities, class_roles)
            added = add_abilities_with_dedup(true_abilities, "true abilities")
            print(f"Processed {len(true_abilities)} true abilities, added {added} unique abilities.")
        else:
            print(f"Warning: True abilities file not found: {args.true_abilities}")
    
    # Process key abilities if provided
    if args.key_abilities:
        if os.path.exists(args.key_abilities):
            key_abilities = process_html_file(args.key_abilities, class_roles)
            added = add_abilities_with_dedup(key_abilities, "key abilities")
            print(f"Processed {len(key_abilities)} key abilities, added {added} unique abilities.")
        else:
            print(f"Warning: Key abilities file not found: {args.key_abilities}")

    # If no input files were specified, use default paths
    if not (args.true_abilities or args.key_abilities):
        version_dir = 'version/0.9.12'
        true_abilities_path = f"{version_dir}/true_abilities.html"
        key_abilities_path = f"{version_dir}/key_abilities.html"
        
        # Check if files exist and process them
        if os.path.exists(true_abilities_path):
            true_abilities = process_html_file(true_abilities_path, class_roles)
            added = add_abilities_with_dedup(true_abilities, "true abilities")
            print(f"Processed {len(true_abilities)} true abilities from default path, added {added} unique abilities.")
        else:
            print(f"Default true abilities file not found: {true_abilities_path}")
        
        if os.path.exists(key_abilities_path):
            key_abilities = process_html_file(key_abilities_path, class_roles)
            added = add_abilities_with_dedup(key_abilities, "key abilities")
            print(f"Processed {len(key_abilities)} key abilities from default path, added {added} unique abilities.")
        else:
            print(f"Default key abilities file not found: {key_abilities_path}")

    # Run validation if requested
    if args.validate and all_abilities:
        validate_abilities(all_abilities)

    # Write the combined data to a YAML file
    if all_abilities:
        output_path = args.output
        
        # Sort abilities by name for consistent output
        all_abilities.sort(key=lambda x: x['name'])
        
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(all_abilities, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        print(f"\n✅ Successfully saved {len(all_abilities)} abilities to {output_path}")
    else:
        print("❌ No abilities were processed. Check your input files.")

if __name__ == '__main__':
    main()
