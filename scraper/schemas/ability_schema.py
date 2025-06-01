#!/usr/bin/env python3
"""
Ability Schema - Pydantic models for ability validation

Defines the structure and validation rules for all four ability types:
- true_ability (standard combat abilities)
- key_ability (level 1 class features) 
- crafting_ability (crafting mechanics)
- gathering_ability (resource gathering)
"""

from typing import List, Optional, Union, Dict, Any, Literal
from pydantic import BaseModel, Field, validator, root_validator


class BaseCost(BaseModel):
    """Base cost structure for abilities"""
    mana: Optional[Union[int, str]] = None  # Can be int, "X", or "variable"
    ap: Optional[Union[int, str]] = None    # Action points
    rp: Optional[Union[int, str]] = None    # Reaction points
    other: Optional[str] = None             # Complex costs like "30 Crafting Points"


class AssociatedAbility(BaseModel):
    """Reference to an associated ability"""
    name: str
    id: str = Field(..., description="Sanitized ID of the associated ability")


class BaseAbility(BaseModel):
    """Base ability model with common fields"""
    id: str = Field(..., description="Unique ability identifier")
    name: str = Field(..., description="Display name of the ability")
    type: Literal["true_ability", "key_ability", "crafting_ability", "gathering_ability"]
    keywords: List[str] = Field(default_factory=list, description="List of ability keywords")
    description: Optional[str] = None
    requirements: List[str] = Field(default_factory=list, description="List of requirement descriptions")
    
    @validator('id')
    def validate_id(cls, v):
        """Ensure ID follows expected patterns"""
        if not v or not isinstance(v, str):
            raise ValueError("ID must be a non-empty string")
        
        # Secret Arts should use double underscore pattern
        if v.startswith("secret_art_") and "__" not in v:
            raise ValueError("Secret Art IDs should use double underscore pattern: secret_art__name")
        
        return v
    
    @validator('keywords')
    def validate_keywords(cls, v):
        """Ensure keywords are valid"""
        if v is None:
            return []
        return [kw for kw in v if kw and isinstance(kw, str)]


class TrueAbility(BaseAbility):
    """True ability - standard combat and general abilities"""
    type: Literal["true_ability"] = "true_ability"
    range: Optional[str] = None
    costs: Optional[BaseCost] = None
    max_variable_cost: Optional[int] = None
    variable_effect: Optional[str] = None
    
    @validator('costs')
    def validate_costs(cls, v):
        """Validate cost structure"""
        if v is None:
            return None
        
        # Ensure costs is a BaseCost instance or dict
        if isinstance(v, dict):
            return BaseCost(**v)
        return v


class KeyAbility(BaseAbility):
    """Key ability - level 1 passive abilities with benefits"""
    type: Literal["key_ability"] = "key_ability"
    benefits: Optional[List[str]] = None
    associated_abilities: Optional[List[AssociatedAbility]] = None
    costs: Optional[BaseCost] = None  # For associated abilities
    
    @validator('associated_abilities')
    def validate_associated_abilities(cls, v):
        """Validate associated abilities"""
        if v is None:
            return None
        
        validated = []
        for item in v:
            if isinstance(item, dict):
                validated.append(AssociatedAbility(**item))
            else:
                validated.append(item)
        return validated


class CraftingAbility(BaseAbility):
    """Crafting ability - used in crafting system"""
    type: Literal["crafting_ability"] = "crafting_ability"
    cost: Optional[str] = None  # String-based cost like "15 Crafting Points"
    parent_ability: Optional[str] = None  # If subdivided from parent
    subdivision_index: Optional[int] = None  # Order within subdivisions
    
    @validator('keywords')
    def validate_crafting_keywords(cls, v):
        """Validate crafting-specific keywords"""
        if v is None:
            return []
        
        # Ensure co-craft keyword is properly formatted
        validated = []
        for kw in v:
            if kw and isinstance(kw, str):
                # Normalize co-craft variations
                if kw.lower() in ['co-craft', 'cocraft', 'co craft']:
                    validated.append('co-craft')
                else:
                    validated.append(kw)
        return validated


class GatheringAbility(BaseAbility):
    """Gathering ability - used in gathering system"""
    type: Literal["gathering_ability"] = "gathering_ability"
    gathering_cost: Optional[str] = None     # "1 strike dice", "2 strike dice", etc.
    gathering_bonus: Optional[str] = None    # "+5 bonus", "+3 bonus", etc.
    affects_node_points: bool = False        # Whether affects node points
    affects_lucky_points: bool = False       # Whether affects lucky points
    
    @validator('gathering_cost')
    def validate_gathering_cost(cls, v):
        """Validate gathering cost format"""
        if v is None:
            return None
        
        # Should match pattern like "1 strike dice" or "2 strike dice"
        import re
        if not re.match(r'\d+\s*strike\s*dice?', v, re.IGNORECASE):
            raise ValueError(f"Invalid gathering cost format: {v}")
        return v
    
    @validator('gathering_bonus')
    def validate_gathering_bonus(cls, v):
        """Validate gathering bonus format"""
        if v is None:
            return None
        
        # Should match pattern like "+5 bonus" or "+3 bonus"
        import re
        if not re.match(r'\+\d+\s*bonus', v, re.IGNORECASE):
            raise ValueError(f"Invalid gathering bonus format: {v}")
        return v


# Union type for all ability types
Ability = Union[TrueAbility, KeyAbility, CraftingAbility, GatheringAbility]


class AbilityIndex(BaseModel):
    """Index of all abilities with metadata"""
    total_count: int
    version: str
    generated_at: str
    by_type: Dict[str, int] = Field(default_factory=dict)
    abilities: List[Dict[str, Any]] = Field(default_factory=list)
    
    @validator('by_type')
    def validate_type_counts(cls, v, values):
        """Ensure type counts add up to total"""
        if 'total_count' in values:
            calculated_total = sum(v.values())
            if calculated_total != values['total_count']:
                raise ValueError(f"Type counts ({calculated_total}) don't match total ({values['total_count']})")
        return v


def validate_ability(ability_data: Dict[str, Any]) -> Ability:
    """Validate ability data against appropriate schema"""
    ability_type = ability_data.get('type')
    
    if ability_type == 'true_ability':
        return TrueAbility(**ability_data)
    elif ability_type == 'key_ability':
        return KeyAbility(**ability_data)
    elif ability_type == 'crafting_ability':
        return CraftingAbility(**ability_data)
    elif ability_type == 'gathering_ability':
        return GatheringAbility(**ability_data)
    else:
        raise ValueError(f"Unknown ability type: {ability_type}")


def create_ability_index(abilities: List[Dict[str, Any]], version: str) -> AbilityIndex:
    """Create an ability index from a list of abilities"""
    from datetime import datetime
    
    # Count by type
    type_counts = {}
    for ability in abilities:
        ability_type = ability.get('type', 'unknown')
        type_counts[ability_type] = type_counts.get(ability_type, 0) + 1
    
    # Create summary entries
    ability_summaries = []
    for ability in abilities:
        summary = {
            'id': ability.get('id'),
            'name': ability.get('name'),
            'type': ability.get('type'),
            'keywords': ability.get('keywords', [])
        }
        ability_summaries.append(summary)
    
    return AbilityIndex(
        total_count=len(abilities),
        version=version,
        generated_at=datetime.now().isoformat(),
        by_type=type_counts,
        abilities=ability_summaries
    )


# Example validation function for batch processing
def validate_abilities_batch(abilities: List[Dict[str, Any]]) -> tuple[List[Ability], List[str]]:
    """Validate a batch of abilities, returning valid ones and error messages"""
    valid_abilities = []
    errors = []
    
    for i, ability_data in enumerate(abilities):
        try:
            validated = validate_ability(ability_data)
            valid_abilities.append(validated)
        except Exception as e:
            ability_name = ability_data.get('name', f'ability_{i}')
            errors.append(f"Error validating '{ability_name}': {e}")
    
    return valid_abilities, errors


# Common keyword validation
VALID_KEYWORDS = {
    # Combat timing
    'Rapid', 'Encounter Start', 'Counter',
    
    # Magic types  
    'Spell', 'Arcane', 'Bounded Field', 'Holy', 'Fire', 'Lightning', 'Water', 'Earth', 'Wind',
    
    # Action types
    'Shield', 'Aid', 'Healing', 'Curse', 'Combo',
    
    # Weapon types
    'Unarmed Strike', 'Secret Art', 'Light Blade', 'Heavy Weapon',
    
    # Special mechanics
    'Lock On', 'Concentration', 'Teleport', 'Pass', 'Mounted',
    
    # Crafting
    'co-craft',
    
    # Add more as needed
}


def validate_keyword(keyword: str) -> bool:
    """Check if a keyword is in the known valid set"""
    return keyword in VALID_KEYWORDS


if __name__ == "__main__":
    # Example usage and testing
    
    # Example true ability
    true_ability_data = {
        "id": "absorb_ice",
        "name": "Absorb Ice", 
        "type": "true_ability",
        "keywords": ["Rapid"],
        "range": "Self",
        "description": "When you take damage from any source...",
        "requirements": ["Attack Deals Water(Frost) Damage."],
        "costs": {
            "rp": 1,
            "mana": 2,
            "ap": 2
        }
    }
    
    # Example key ability
    key_ability_data = {
        "id": "acolytes_journey",
        "name": "Acolyte's Journey",
        "type": "key_ability", 
        "keywords": [],
        "description": "You have begun your religious training...",
        "requirements": [],
        "benefits": [
            "You gain proficiency in light armor, shields and a single group of weapons of your choice.",
            "You gain +5 skill points in the Religion skill."
        ],
        "associated_abilities": [
            {
                "name": "Presence Concealment",
                "id": "presence_concealment"
            }
        ]
    }
    
    # Test validation
    try:
        true_ability = validate_ability(true_ability_data)
        print(f"✅ True ability validation passed: {true_ability.name}")
        
        key_ability = validate_ability(key_ability_data)
        print(f"✅ Key ability validation passed: {key_ability.name}")
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")