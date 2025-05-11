# Census Database Schema

This document outlines the structure of the database used to store the Mirane census data.

## Tables

### census_classes
Stores each unique class with its tier level.

- **id** (SERIAL PRIMARY KEY): Unique identifier for the class.  
- **name** (TEXT UNIQUE NOT NULL): Name of the class (e.g., "Mage", "Fighter").  
- **tier** (INT NOT NULL): Tier level of the class, as defined in class_list.yaml.

### census_characters
Stores each individual character entry including timestamps and metadata.

- **id** (SERIAL PRIMARY KEY): Unique identifier for the character.  
- **created_at** (TIMESTAMP NOT NULL DEFAULT now()): Record insertion timestamp.  
- **player_name** (TEXT): Name of the player.  
- **adventurer_name** (TEXT): Name of the in-game character.  
- **adventurer_url** (TEXT): Link to the original spreadsheet or profile.  
- **spirit_core_current** (INT): Current Spirit Core value, if provided.  
- **race** (TEXT): Race of the character (e.g., "Human", "Fae").  
- **sub_race** (TEXT): Sub-race or lineage (e.g., "Pixie", "Salamander").  
- **expedition_departure** (DATE): Departure date for the current expedition.  
- **expedition_return** (DATE): Return date for the current expedition.  
- **ip_lockout_end** (DATE): Date when IP lockout expires.

### census_character_classes
Join table mapping characters to their multiple classes.

- **character_id** (INT REFERENCES characters(id)): Foreign key to characters.  
- **class_id** (INT REFERENCES classes(id)): Foreign key to classes.  
- **PRIMARY KEY(character_id, class_id)**: Ensures each pairing is unique.

## Relationships

- **One-to-Many**: Each character can have zero or more class assignments.  
- **Many-to-One**: Each class may be assigned to multiple characters.  
- Implemented via the `census_character_classes` join table for a many-to-many relationship.

---

Load this schema by running the Python generator script and importing the resulting SQL into your Supabase instance.