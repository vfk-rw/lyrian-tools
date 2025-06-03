#!/usr/bin/env python3
"""
Monster Schema - Pydantic models for monster data validation

This module defines the data structures for monsters parsed from the LC website.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class MonsterStats(BaseModel):
    """Monster statistics and attributes"""
    # Basic stats
    hp: Optional[int] = None
    ap: Optional[int] = None
    rp: Optional[int] = None
    mana: Optional[int] = None
    initiative: Optional[str] = None
    focus: Optional[int] = None
    power: Optional[int] = None
    agility: Optional[int] = None
    toughness: Optional[int] = None
    
    # Derived stats
    evasion: Optional[str] = None  # "11 / 23" format
    guard: Optional[str] = None    # "4 / 16" format
    movement_speed: Optional[str] = None
    notable_skills: Optional[str] = None
    
    # Attack stats
    light_attack: Optional[str] = None  # "+6 Accuracy, 1d4+6" format
    heavy_attack: Optional[str] = None  # "+6 Accuracy, 2d6+12" format
    
    # Combat info
    strong_against: Optional[str] = None
    weak_against: Optional[str] = None
    
    # Attributes
    fitness: Optional[int] = None
    cunning: Optional[int] = None
    reason: Optional[int] = None
    awareness: Optional[int] = None
    presence: Optional[int] = None
    
    # Descriptive
    appearance: Optional[str] = None
    habitat: Optional[str] = None


class MonsterAbilityRef(BaseModel):
    """A reference to a monster ability (parsed separately)"""
    id: str = Field(..., description="Unique identifier for the ability")
    name: str = Field(..., description="Display name of the ability")


class Monster(BaseModel):
    """Complete monster data"""
    id: str = Field(..., description="Unique identifier for the monster")
    name: str = Field(..., description="Display name of the monster")
    type: Optional[str] = Field(None, description="Monster type (e.g., 'Boss Humanoid')")
    danger_level: Optional[str] = Field(None, description="Danger level rating")
    image_url: Optional[str] = Field(None, description="URL to monster image")
    
    # Statistics
    stats: Optional[MonsterStats] = Field(None, description="Monster statistics")
    
    # Descriptive content
    lore: Optional[str] = Field(None, description="Monster lore text")
    strategy: Optional[str] = Field(None, description="Combat strategy description")
    running_notes: Optional[str] = Field(None, description="Notes for running the monster")
    
    # Ability references (detailed data parsed separately)
    abilities: List[MonsterAbilityRef] = Field(default_factory=list, description="Passive ability references")
    active_actions: List[MonsterAbilityRef] = Field(default_factory=list, description="Active action references")
    
    # Metadata
    version: Optional[str] = Field(None, description="Game version")
    source_url: Optional[str] = Field(None, description="Source URL")


class MonsterIndex(BaseModel):
    """Index of all monsters"""
    total_count: int = Field(..., description="Total number of monsters")
    version: str = Field(..., description="Game version")
    generated_at: str = Field(..., description="Generation timestamp")
    by_type: Dict[str, int] = Field(..., description="Count by monster type")
    monsters: List[Dict[str, Any]] = Field(..., description="Monster summary list")


# Type aliases for convenience
MonsterData = Union[Monster, MonsterIndex]