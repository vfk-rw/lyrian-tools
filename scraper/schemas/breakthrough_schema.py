#!/usr/bin/env python3
"""
Breakthrough Schema - Pydantic models for Lyrian Chronicles breakthrough data validation.
"""
from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field, field_validator


class Breakthrough(BaseModel):
    """Schema for a single breakthrough."""
    
    name: str = Field(..., description="The breakthrough name")
    id: str = Field(..., description="Unique identifier (sanitized name)")
    cost: Optional[Union[int, Literal["variable"]]] = Field(
        None, 
        description="XP cost of the breakthrough (number or 'variable')"
    )
    requirements: List[str] = Field(
        default_factory=list, 
        description="List of requirements to take this breakthrough"
    )
    description: str = Field(..., description="Full description of the breakthrough's effects")
    
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
    
    @field_validator('cost')
    def validate_cost(cls, v: Optional[Union[int, str]]) -> Optional[Union[int, str]]:
        """Validate cost value."""
        if v is None:
            return v
        if isinstance(v, str) and v != "variable":
            raise ValueError("String cost must be 'variable'")
        if isinstance(v, int) and v < 0:
            raise ValueError("Numeric cost cannot be negative")
        return v


class BreakthroughIndexEntry(BaseModel):
    """Schema for a breakthrough entry in the index file."""
    
    id: str = Field(..., description="Breakthrough ID")
    name: str = Field(..., description="Breakthrough name")
    cost: Optional[Union[int, Literal["variable"]]] = Field(None, description="XP cost")
    has_requirements: Optional[bool] = Field(None, description="Whether breakthrough has requirements")


class BreakthroughIndex(BaseModel):
    """Schema for the breakthroughs index file."""
    
    total_count: int = Field(..., description="Total number of breakthroughs")
    version: str = Field(..., description="Game version")
    generated_at: str = Field(..., description="Timestamp when index was generated")
    cost_summary: dict[str, int] = Field(
        ..., 
        description="Summary of cost types (numeric, variable, none)"
    )
    with_requirements: int = Field(..., description="Number of breakthroughs with requirements")
    without_requirements: int = Field(..., description="Number of breakthroughs without requirements")
    breakthroughs: List[BreakthroughIndexEntry] = Field(..., description="List of all breakthroughs")
    
    @field_validator('cost_summary')
    def validate_cost_summary(cls, v: dict) -> dict:
        """Ensure cost summary has expected keys."""
        expected_keys = {'numeric', 'variable', 'none'}
        if not expected_keys.issubset(v.keys()):
            raise ValueError(f"Cost summary must contain keys: {expected_keys}")
        for key, count in v.items():
            if count < 0:
                raise ValueError(f"Count for {key} cannot be negative")
        return v
    
    @field_validator('breakthroughs')
    def validate_breakthroughs_list(cls, v: List[BreakthroughIndexEntry]) -> List[BreakthroughIndexEntry]:
        """Ensure breakthroughs list is not empty."""
        if not v:
            raise ValueError("Breakthroughs list cannot be empty")
        return v


# Example usage for validation
if __name__ == "__main__":
    # Example breakthrough data
    example_breakthrough = {
        "name": "Blend In",
        "id": "blend_in",
        "cost": 300,
        "requirements": ["Must be a Slimefolk."],
        "description": "You disguise your appearance using magic to be that of another race. This skill does not allow you to change your appearance at will, but instead lets you appear as you would as a different race."
    }
    
    # Validate
    breakthrough = Breakthrough(**example_breakthrough)
    print(f"Valid breakthrough: {breakthrough.name} (Cost: {breakthrough.cost})")
    
    # Example with variable cost
    variable_breakthrough = {
        "name": "Advanced Training",
        "id": "advanced_training",
        "cost": "variable",
        "requirements": [],
        "description": "Gain additional training in a skill of your choice. The cost varies based on the skill level."
    }
    
    breakthrough2 = Breakthrough(**variable_breakthrough)
    print(f"Variable cost breakthrough: {breakthrough2.name} - Cost: {breakthrough2.cost}")