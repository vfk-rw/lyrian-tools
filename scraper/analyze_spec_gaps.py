#!/usr/bin/env python3
"""
Analyze parsed class data to identify gaps in the current class specification.
This script systematically reviews classes and identifies patterns that don't 
match the expected spec format.
"""

import json
import yaml
import os
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Any

def load_class_data(file_path: Path) -> Dict[str, Any]:
    """Load class data from YAML or JSON file."""
    try:
        with open(file_path, 'r') as f:
            if file_path.suffix == '.yaml':
                return yaml.safe_load(f)
            else:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

def analyze_requirements(requirements: Any, class_name: str) -> List[str]:
    """Analyze requirements format and identify non-standard patterns."""
    issues = []
    
    if not requirements:
        return issues
    
    # Check if it's a simple list instead of structured format
    if isinstance(requirements, list):
        if all(isinstance(req, str) for req in requirements):
            issues.append(f"Simple string list requirements: {requirements}")
        else:
            issues.append(f"Complex list requirements that need structure: {requirements}")
    
    # Check if it's some other format
    elif not isinstance(requirements, dict):
        issues.append(f"Unexpected requirements format: {type(requirements)} - {requirements}")
    
    return issues

def analyze_progression_benefits(progression: List[Dict], class_name: str) -> List[str]:
    """Analyze progression benefits and identify non-standard patterns."""
    issues = []
    
    for level_data in progression:
        level = level_data.get('level')
        benefits = level_data.get('benefits', [])
        
        for benefit in benefits:
            benefit_type = benefit.get('type')
            
            # Check attribute handling
            if benefit_type == 'attribute':
                if 'attribute' in benefit:
                    attr_value = benefit['attribute']
                    if attr_value == 'heart':
                        issues.append(f"Level {level}: Invalid 'heart' attribute type")
                    elif not isinstance(attr_value, str):
                        issues.append(f"Level {level}: Unexpected attribute format: {attr_value}")
                
            elif benefit_type == 'attribute_choice':
                options = benefit.get('options', [])
                if options:
                    # Check if options are simple strings vs structured
                    if all(isinstance(opt, str) for opt in options):
                        issues.append(f"Level {level}: attribute_choice has simple string options: {options}")
                    elif not all(isinstance(opt, dict) for opt in options):
                        issues.append(f"Level {level}: attribute_choice has mixed option types: {options}")
            
            elif benefit_type == 'skills':
                # Check if we have structured skill data vs just description
                if 'description' in benefit and not any(key in benefit for key in ['eligible_skills', 'can_convert_to_expertise']):
                    issues.append(f"Level {level}: skills benefit only has description, missing structure")
            
            # Check for unknown benefit types
            known_types = ['ability', 'skills', 'attribute', 'attribute_choice', 'expertise_points', 'proficiency', 'element_mastery']
            if benefit_type not in known_types:
                issues.append(f"Level {level}: Unknown benefit type: {benefit_type}")
    
    return issues

def analyze_ability_references(ability_refs: List[Dict], class_name: str) -> List[str]:
    """Analyze ability references for inconsistent patterns."""
    issues = []
    
    types_seen = set()
    
    for ref in ability_refs:
        ref_type = ref.get('type')
        ref_id = ref.get('id')
        ref_name = ref.get('name')
        
        if ref_type:
            types_seen.add(ref_type)
        
        # Check for ID inconsistencies (underscores, etc.)
        if ref_id and ref_name:
            # Look for potential ID formatting issues
            if ' ' in ref_id:
                issues.append(f"Ability ID contains spaces: '{ref_id}'")
            
            # Check for inconsistent underscore usage in secret arts
            if 'secret art' in ref_name.lower() and ref_id.count('_') != ref_name.count(' ') + ref_name.count(':'):
                issues.append(f"Potential ID/name mismatch: '{ref_id}' vs '{ref_name}'")
    
    # Report unusual ability types
    standard_types = {'key_ability', 'ability', 'regular_ability'}
    unusual_types = types_seen - standard_types
    if unusual_types:
        issues.append(f"Non-standard ability types: {unusual_types}")
    
    return issues

def main():
    """Analyze available classes for spec gaps."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze class spec gaps')
    parser.add_argument('--range', default='A-E', help='Letter range to analyze (e.g., A-E, F-M, N-Z, ALL)')
    args = parser.parse_args()
    
    parsed_dir = Path("current_parsed/classes")
    
    if not parsed_dir.exists():
        print(f"Directory {parsed_dir} not found!")
        return
    
    # Get class files based on range
    if args.range == 'ALL':
        yaml_files = sorted(list(parsed_dir.glob("*.yaml")))
        range_desc = "all available"
    else:
        start_letter, end_letter = args.range.split('-')
        range_letters = [chr(i) for i in range(ord(start_letter.upper()), ord(end_letter.upper()) + 1)]
        yaml_files = sorted([f for f in parsed_dir.glob("*.yaml") if f.stem[0].upper() in range_letters])
        range_desc = f"classes {args.range}"
    
    print(f"Analyzing {len(yaml_files)} {range_desc} classes...")
    print("=" * 60)
    
    all_requirement_issues = []
    all_progression_issues = []
    all_ability_issues = []
    requirement_patterns = Counter()
    benefit_types = Counter()
    
    for yaml_file in yaml_files:
        class_data = load_class_data(yaml_file)
        if not class_data:
            continue
            
        class_info = class_data.get('class', {})
        class_name = class_info.get('name', yaml_file.stem)
        
        print(f"\n--- {class_name} ---")
        
        # Analyze requirements
        requirements = class_info.get('requirements')
        req_issues = analyze_requirements(requirements, class_name)
        if req_issues:
            all_requirement_issues.extend(req_issues)
            print("  Requirements issues:")
            for issue in req_issues:
                print(f"    - {issue}")
        
        # Track requirement patterns
        if isinstance(requirements, list):
            requirement_patterns['string_list'] += 1
        elif isinstance(requirements, dict):
            requirement_patterns['structured'] += 1
        elif not requirements:
            requirement_patterns['empty'] += 1
        else:
            requirement_patterns['other'] += 1
        
        # Analyze progression
        progression = class_info.get('progression', [])
        prog_issues = analyze_progression_benefits(progression, class_name)
        if prog_issues:
            all_progression_issues.extend(prog_issues)
            print("  Progression issues:")
            for issue in prog_issues:
                print(f"    - {issue}")
        
        # Track benefit types
        for level_data in progression:
            for benefit in level_data.get('benefits', []):
                benefit_types[benefit.get('type')] += 1
        
        # Analyze ability references
        ability_refs = class_info.get('ability_references', [])
        ability_issues = analyze_ability_references(ability_refs, class_name)
        if ability_issues:
            all_ability_issues.extend(ability_issues)
            print("  Ability reference issues:")
            for issue in ability_issues:
                print(f"    - {issue}")
    
    # Summary report
    print("\n" + "=" * 60)
    print("SUMMARY REPORT")
    print("=" * 60)
    
    print(f"\nRequirement patterns:")
    for pattern, count in requirement_patterns.items():
        print(f"  {pattern}: {count}")
    
    print(f"\nBenefit types found:")
    for btype, count in benefit_types.most_common():
        print(f"  {btype}: {count}")
    
    print(f"\nTotal issues found:")
    print(f"  Requirement issues: {len(all_requirement_issues)}")
    print(f"  Progression issues: {len(all_progression_issues)}")
    print(f"  Ability reference issues: {len(all_ability_issues)}")
    
    if all_requirement_issues or all_progression_issues or all_ability_issues:
        print(f"\nRecommendations for spec updates:")
        
        if any('string list requirements' in issue for issue in all_requirement_issues):
            print("  - Add support for simple string list requirements")
        
        if any('heart' in issue for issue in all_progression_issues):
            print("  - Fix 'heart' attribute type (should be specific attribute)")
        
        if any('simple string options' in issue for issue in all_progression_issues):
            print("  - Update attribute_choice to handle both simple and structured options")
        
        if any('only has description' in issue for issue in all_progression_issues):
            print("  - Extract structured skill data from description text")

if __name__ == "__main__":
    main()