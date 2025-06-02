#!/usr/bin/env python3
"""
Keyword Schema - Pydantic models for Lyrian Chronicles keyword data validation.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator


class Keyword(BaseModel):
    """Schema for a single keyword."""
    
    name: str = Field(..., description="The keyword name")
    id: str = Field(..., description="Unique identifier (sanitized name)")
    type: Literal[
        "timing",      # Rapid, Counter, Encounter Start, etc.
        "element",     # Fire, Water, Earth, Air, etc.
        "status",      # Burning, Bleeding, Stunned, etc.
        "combat",      # Strike, Attack, Shield, etc.
        "weapon",      # Blade, Sword, Axe, Bow, etc.
        "movement",    # Teleport, Flight, Speed, etc.
        "spell",       # Spell-related keywords
        "defense",     # Resistance, Immunity keywords
        "general"      # Default category
    ] = Field("general", description="The keyword category/type")
    
    description: str = Field(..., description="Full description of the keyword's effect")
    variable_info: Optional[str] = Field(None, description="Explanation of X or variable values if used")
    related_keywords: List[str] = Field(default_factory=list, description="Related or similar keywords")
    
    @field_validator('id')
    def validate_id(cls, v: str) -> str:
        """Ensure ID is properly formatted."""
        if not v:
            raise ValueError("ID cannot be empty")
        if not v.replace('_', '').isalnum():
            raise ValueError("ID must contain only alphanumeric characters and underscores")
        return v
    
    @field_validator('name')
    def validate_name(cls, v: str) -> str:
        """Ensure name is not empty."""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()
    
    @field_validator('description')
    def validate_description(cls, v: str) -> str:
        """Ensure description is not empty."""
        if not v or not v.strip():
            raise ValueError("Description cannot be empty")
        return v.strip()


class KeywordIndexEntry(BaseModel):
    """Schema for a keyword entry in the index file."""
    
    id: str = Field(..., description="Keyword ID")
    name: str = Field(..., description="Keyword name")
    type: str = Field(..., description="Keyword type")
    has_variable: Optional[bool] = Field(None, description="Whether keyword uses variable values (X)")


class KeywordIndex(BaseModel):
    """Schema for the keywords index file."""
    
    total_count: int = Field(..., description="Total number of keywords")
    version: str = Field(..., description="Game version")
    generated_at: str = Field(..., description="Timestamp when index was generated")
    by_type: dict[str, int] = Field(..., description="Count of keywords by type")
    keywords: List[KeywordIndexEntry] = Field(..., description="List of all keywords")
    
    @field_validator('by_type')
    def validate_by_type(cls, v: dict) -> dict:
        """Ensure by_type counts are positive."""
        for type_name, count in v.items():
            if count < 0:
                raise ValueError(f"Count for type '{type_name}' cannot be negative")
        return v
    
    @field_validator('keywords')
    def validate_keywords_list(cls, v: List[KeywordIndexEntry]) -> List[KeywordIndexEntry]:
        """Ensure keywords list is not empty."""
        if not v:
            raise ValueError("Keywords list cannot be empty")
        return v


# Example usage for validation
if __name__ == "__main__":
    # Example keyword data
    example_keyword = {
        "name": "Rapid",
        "id": "rapid",
        "type": "timing",
        "description": "This ability can be used as a reaction when its requirements are met.",
        "related_keywords": ["Counter", "Encounter Start"]
    }
    
    # Validate
    keyword = Keyword(**example_keyword)
    print(f"Valid keyword: {keyword.name} ({keyword.type})")
    
    # Example with variable
    variable_keyword = {
        "name": "Burning",
        "id": "burning",
        "type": "status",
        "description": "A Burning character takes X damage at the end of their turn. They may spend 1 AP to remove this effect.",
        "variable_info": "Variable value (context-dependent)"
    }
    
    keyword2 = Keyword(**variable_keyword)
    print(f"Variable keyword: {keyword2.name} - X = {keyword2.variable_info}")