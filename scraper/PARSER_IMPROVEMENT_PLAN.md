# Class Parser Improvement Plan

Based on comprehensive analysis of all 116 classes, this document outlines systematic improvements needed in the ClassParser to fix consistent parsing issues.

## Critical Issues Found

### Final Analysis Statistics (All 116 Classes):
- **Requirements Issues**: 108/116 classes (93%) use simple string format
- **"Heart" Attribute Issue**: 116/116 classes (100%) affected
- **Skills Structure Missing**: 116/116 classes (100%) only have description text
- **Attribute Choice Simplification**: 116/116 classes (100%) use simple string format
- **Secret Art ID Inconsistencies**: 49/116 classes (42%) have naming issues

### Critical Issues (Systematic Problems)

### 1. "Heart" Attribute Parsing Issue
**Problem**: All classes show `attribute: "heart"` instead of the actual attribute.
**Root Cause**: Parser is extracting a generic "heart" value instead of parsing the description text.
**Fix Required**: Update `_extract_attribute_from_description()` method to parse actual attribute names from description text.

**Example**:
```yaml
# Current (WRONG):
- type: "attribute"
  attribute: "heart"
  description: "You gain +1 Reason."

# Should be (CORRECT):
- type: "attribute"
  attribute: "Reason"
  description: "You gain +1 Reason."
```

### 2. Skills Structure Missing
**Problem**: Skills benefits only have `description` field, missing structured data.
**Root Cause**: Parser not extracting eligible skills, conversion rules from description.
**Fix Required**: Create `_parse_skills_from_description()` method to extract structured data.

**Example**:
```yaml
# Current (LIMITED):
- type: "skills"
  points: 5
  description: "You gain +5 skill points in Medicine, Magic, Religion, History, Flight, Artifice, Common Knowledge or a relevant Expert Knowledge Skill (DM Approval). You can exchange any skill point for 2 expertise points, but must spend them in these skills."

# Should extract (STRUCTURED):
- type: "skills"
  points: 5
  eligible_skills: ["Medicine", "Magic", "Religion", "History", "Flight", "Artifice", "Common Knowledge"]
  expert_knowledge_needs_approval: true
  can_convert_to_expertise: true
  conversion_ratio: 2
  description: "You gain +5 skill points in Medicine, Magic, Religion, History, Flight, Artifice, Common Knowledge or a relevant Expert Knowledge Skill (DM Approval). You can exchange any skill point for 2 expertise points, but must spend them in these skills."
```

### 3. Attribute Choice Format Simplification
**Problem**: Using simple string arrays instead of structured format.
**Root Cause**: Parser extracting attribute names but not creating proper structure.
**Fix Required**: Update `_extract_attribute_choice()` to create structured options.

**Example**:
```yaml
# Current (SIMPLE):
- type: "attribute_choice"
  choose: 1
  options: ["Power", "Focus", "Agility", "Toughness"]
  description: "You gain +1 to Focus, Power, Agility or Toughness."

# Should be (STRUCTURED):
- type: "attribute_choice"
  choose: 1
  options:
    - attribute: "Power"
      value: 1
    - attribute: "Focus" 
      value: 1
    - attribute: "Agility"
      value: 1
    - attribute: "Toughness"
      value: 1
  description: "You gain +1 to Focus, Power, Agility or Toughness."
```

### 4. Secret Art ID Inconsistencies
**Problem**: Secret Art ability IDs have inconsistent underscore patterns.
**Root Cause**: ID generation not following consistent pattern for Secret Arts.
**Fix Required**: Normalize Secret Art IDs to use double underscore before ability name.

**Examples**:
```yaml
# Current (INCONSISTENT):
secret_art_efficient_spirit_control
secret_art_razor_hurricane
secret_art_all_of_creation

# Should be (CONSISTENT):
secret_art__efficient_spirit_control
secret_art__razor_hurricane
secret_art__all_of_creation
```

## Parser Code Changes Required

### 1. Fix Heart Attribute Parsing

**File**: `parsers/class_parser.py`
**Method**: `_extract_progression()` or new `_parse_attribute_from_description()`

```python
def _parse_attribute_from_description(self, description: str) -> str:
    """Parse actual attribute name from description text."""
    # Look for patterns like "You gain +1 Reason"
    import re
    
    attributes = ["Focus", "Agility", "Toughness", "Power", "Fitness", "Reason", "Awareness", "Presence", "Cunning"]
    
    for attr in attributes:
        if re.search(rf'\+\d+\s+{attr}', description, re.IGNORECASE):
            return attr
    
    # Look for other patterns like "gain +1 to X"
    match = re.search(r'gain \+\d+ (?:to )?(\w+)', description, re.IGNORECASE)
    if match:
        candidate = match.group(1)
        if candidate in attributes:
            return candidate
    
    return None  # Return None if no valid attribute found
```

### 2. Extract Skills Structure

```python
def _parse_skills_from_description(self, description: str, points: int) -> dict:
    """Extract structured skills data from description."""
    result = {
        "points": points,
        "description": description
    }
    
    # Extract eligible skills
    skill_patterns = [
        r'skill points (?:to spend )?(?:on|in) ([^.]+?)(?:\.|,|$)',
        r'points in ([^.]+?)(?:\.|,| or )',
    ]
    
    eligible_skills = []
    for pattern in skill_patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            skills_text = match.group(1)
            # Parse comma-separated skills
            skills = [s.strip() for s in re.split(r',| or ', skills_text)]
            eligible_skills.extend(skills)
    
    if eligible_skills:
        result["eligible_skills"] = eligible_skills
    
    # Check for expertise conversion
    if "exchange" in description.lower() and "expertise" in description.lower():
        result["can_convert_to_expertise"] = True
        # Extract conversion ratio
        ratio_match = re.search(r'(\d+)\s+expertise\s+points', description)
        if ratio_match:
            result["conversion_ratio"] = int(ratio_match.group(1))
    
    # Check for DM approval requirements
    if "dm approval" in description.lower() or "approval" in description.lower():
        result["expert_knowledge_needs_approval"] = True
    
    return result
```

### 3. Fix Attribute Choice Structure

```python
def _create_structured_attribute_options(self, options_list: list, description: str) -> list:
    """Create structured attribute choice options."""
    structured_options = []
    
    # Extract value from description (usually +1)
    value_match = re.search(r'\+(\d+)', description)
    value = int(value_match.group(1)) if value_match else 1
    
    for option in options_list:
        structured_options.append({
            "attribute": option,
            "value": value
        })
    
    return structured_options
```

### 4. Fix Secret Art IDs

```python
def _normalize_ability_id(self, name: str) -> str:
    """Create normalized ability ID with consistent Secret Art handling."""
    from core.utils import sanitize_id
    
    if name.startswith("Secret Art:"):
        # Remove "Secret Art:" and normalize the rest
        art_name = name.replace("Secret Art:", "").strip()
        art_id = sanitize_id(art_name)
        return f"secret_art__{art_id}"  # Double underscore
    else:
        return sanitize_id(name)
```

## Implementation Priority

1. **HIGH**: Fix "heart" attribute parsing - affects all classes
2. **HIGH**: Fix Secret Art ID normalization - affects many classes  
3. **MEDIUM**: Extract skills structure - improves data quality
4. **MEDIUM**: Create structured attribute choices - improves consistency

## Testing Plan

1. Run parser improvements on current 25 classes
2. Compare before/after YAML output
3. Validate that all "heart" attributes are resolved
4. Verify Secret Art IDs follow consistent pattern
5. Check that skills have structured data where possible

## Classes Requiring Special Attention

Based on analysis, these classes have complex requirements that may need individual review:

- **Abjurer**: Spell dependency requirement
- **Angelblooded**: Breakthrough requirement  
- **Bard**: Complex expertise skill requirements
- **Battle Mage**: Multiple requirement types
- **Assassin**: Multi-class mastery requirements

## Future Considerations

Once parser improvements are complete:

1. Consider structured requirement parsing for complex cases
2. Add validation against the updated class specification
3. Create automated tests for parser improvements
4. Document edge cases found in remaining classes (C-Z)