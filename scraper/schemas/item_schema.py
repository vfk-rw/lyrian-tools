#!/usr/bin/env python3
"""
Pydantic schemas for Lyrian Chronicles items.

Based on analysis of actual scraped item data. Items have a consistent structure
with optional fields for crafting, fuel usage, etc.
"""

from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, Field


class Item(BaseModel):
    """
    Item model based on actual scraped data structure.
    
    All items follow the same basic pattern with optional fields.
    """
    # Basic identification
    name: str = Field(description="Item name")
    id: str = Field(description="Sanitized item identifier")
    
    # Item classification
    type: str = Field(description="Main item type (e.g., 'Artifice', 'Adventuring Essentials')")
    sub_type: str = Field(description="Item subtype (e.g., 'Weapon', 'Kit', 'Airship')")
    
    # Core properties (always present)
    cost: str = Field(description="Purchase cost (can be formula like 'Original Weapon + 3000')")
    activation_cost: Optional[str] = Field(None, description="Action point cost to use (null for no cost)")
    burden: str = Field(description="Weight/encumbrance (can be number or formula)")
    
    # Optional fuel/shell properties (for Artifice items)
    shell_size: Optional[str] = Field(None, description="Fuel shell size (e.g., 'M')")
    fuel_usage: Optional[str] = Field(None, description="Fuel consumption (e.g., '1 shell per hour')")
    
    # Optional crafting properties (for craftable items)
    crafting_points: Optional[int] = Field(None, description="Points required to craft")
    crafting_type: Optional[str] = Field(None, description="Crafting skill needed (e.g., 'Artificing')")
    
    # Content
    description: str = Field(description="Item description/effects (HTML content)")
    
    # Visual
    image_url: Optional[str] = Field(None, description="URL to item image")
    
    # Metadata  
    version: Optional[str] = Field(None, description="Game version this item was scraped from")


class ItemsIndex(BaseModel):
    """Index of all items with summary statistics."""
    total_count: int = Field(description="Total number of items")
    version: str = Field(description="Game version")
    generated_at: str = Field(description="ISO timestamp of generation")
    
    # Statistics by type
    by_type: Dict[str, int] = Field(description="Count of items by main type")
    by_subtype: Dict[str, int] = Field(description="Count of items by subtype")
    
    # All items list
    items: List[Dict[str, str]] = Field(description="List of all items with basic info")


# Type aliases for clarity
ItemData = Dict[str, Any]
ItemList = List[Item]