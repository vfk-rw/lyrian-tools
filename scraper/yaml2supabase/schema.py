"""
Supabase schema definitions for parsed game data.

All tables use parsed_data_ prefix and include proper foreign key relationships.
"""

from datetime import datetime

def create_schema_sql() -> str:
    """Generate the complete schema SQL with all tables and relationships."""
    
    return """
-- ============================================
-- Supabase Schema for Lyrian Chronicles Data
-- ============================================
-- Generated: {timestamp}
-- 
-- This schema creates all necessary tables for storing parsed game data
-- with proper foreign key relationships and search capabilities.
--
-- Tables are prefixed with 'parsed_data_' to avoid conflicts.
-- ============================================

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS parsed_data_class_abilities CASCADE;
DROP TABLE IF EXISTS parsed_data_class_key_abilities CASCADE;
DROP TABLE IF EXISTS parsed_data_monster_abilities CASCADE;
DROP TABLE IF EXISTS parsed_data_monster_active_actions CASCADE;
DROP TABLE IF EXISTS parsed_data_race_abilities CASCADE;
DROP TABLE IF EXISTS parsed_data_item_keywords CASCADE;
DROP TABLE IF EXISTS parsed_data_ability_keywords CASCADE;
DROP TABLE IF EXISTS parsed_data_abilities CASCADE;
DROP TABLE IF EXISTS parsed_data_monster_abilities_list CASCADE;
DROP TABLE IF EXISTS parsed_data_classes CASCADE;
DROP TABLE IF EXISTS parsed_data_races CASCADE;
DROP TABLE IF EXISTS parsed_data_items CASCADE;
DROP TABLE IF EXISTS parsed_data_keywords CASCADE;
DROP TABLE IF EXISTS parsed_data_breakthroughs CASCADE;
DROP TABLE IF EXISTS parsed_data_monsters CASCADE;

-- ============================================
-- Core Data Tables
-- ============================================

-- Keywords (referenced by abilities, items, etc.)
CREATE TABLE parsed_data_keywords (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,  -- timing, element, status, combat, weapon, movement, spell, defense, general
    description TEXT,
    variable_value TEXT,  -- For keywords with X values
    related_keywords TEXT[],
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id, version)
);

-- Classes
CREATE TABLE parsed_data_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    difficulty TEXT,
    main_role TEXT,
    secondary_role TEXT,
    description TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,  -- Array of requirement strings
    skills JSONB,  -- Complex skills object with points, eligible_skills, etc.
    attributes JSONB,  -- Heart attributes and choices
    defenses JSONB,
    option_attrs JSONB,
    special JSONB,
    image_url TEXT,
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(main_role, '') || ' ' || COALESCE(secondary_role, '')), 'C')
    ) STORED,
    UNIQUE(id, version)
);

-- Abilities (with self-referential parent for crafting subdivisions)
CREATE TABLE parsed_data_abilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('true_ability', 'key_ability', 'crafting_ability', 'gathering_ability')),
    keywords TEXT[],  -- Array of keyword IDs
    range TEXT,
    description TEXT,
    costs JSONB,  -- {{mana: 2, ap: 2, rp: "variable", other: "30 Crafting Points"}}
    requirements TEXT[],
    benefits TEXT[],  -- For key abilities
    associated_abilities JSONB,  -- For key abilities: [{{name, id}}]
    gathering_cost TEXT,  -- For gathering abilities
    gathering_bonus TEXT,  -- For gathering abilities
    parent_ability_id TEXT REFERENCES parsed_data_abilities(id),  -- For crafting subdivisions
    subdivision_index INTEGER,  -- Order within parent ability
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(keywords, ' '), '')), 'C')
    ) STORED,
    UNIQUE(id, version)
);

-- Monster Abilities (separate from player abilities)
CREATE TABLE parsed_data_monster_abilities_list (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('monster_ability', 'monster_active_action')),
    description TEXT,
    keywords TEXT[],  -- Array of keyword IDs (for active actions)
    range TEXT,  -- For active actions
    ap_cost INTEGER,  -- For active actions
    requirements TEXT[],  -- For active actions
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED,
    UNIQUE(id, version)
);

-- Races
CREATE TABLE parsed_data_races (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('primary', 'sub')),
    primary_race TEXT,  -- For sub-races, references the primary race
    description TEXT,
    benefits JSONB,  -- Complex benefits structure
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id, version),
    FOREIGN KEY (primary_race) REFERENCES parsed_data_races(id)
);

-- Items
CREATE TABLE parsed_data_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT,
    cost TEXT,
    burden INTEGER,
    description TEXT,
    activation_cost TEXT,
    crafting_points INTEGER,
    crafting_type TEXT,
    fuel_usage TEXT,
    shell_size TEXT,
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(type, '') || ' ' || COALESCE(subtype, '')), 'C')
    ) STORED,
    UNIQUE(id, version)
);

-- Breakthroughs
CREATE TABLE parsed_data_breakthroughs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cost INTEGER,
    requirements TEXT[],
    description TEXT,
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id, version)
);

-- Monsters
CREATE TABLE parsed_data_monsters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    danger_level TEXT,
    type TEXT,
    hp INTEGER,
    ap INTEGER,
    rp INTEGER,
    mana INTEGER,
    evasion INTEGER,
    guard INTEGER,
    movement INTEGER,
    basic_attacks JSONB,  -- Array of attack objects
    attributes JSONB,  -- {{agility, brawn, etc.}}
    description TEXT,
    lore TEXT,
    strategy TEXT,
    difficulty_to_run TEXT,
    harvestable_materials TEXT[],
    image_url TEXT,
    version TEXT DEFAULT '0.10.1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(lore, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(type, '') || ' ' || COALESCE(danger_level, '')), 'C')
    ) STORED,
    UNIQUE(id, version)
);

-- ============================================
-- Relationship Tables
-- ============================================

-- Class-Ability relationships (which abilities each class gets)
CREATE TABLE parsed_data_class_abilities (
    class_id TEXT REFERENCES parsed_data_classes(id),
    ability_id TEXT REFERENCES parsed_data_abilities(id),
    level_gained INTEGER DEFAULT 1,
    PRIMARY KEY (class_id, ability_id)
);

-- Class-Key Ability relationships
CREATE TABLE parsed_data_class_key_abilities (
    class_id TEXT REFERENCES parsed_data_classes(id),
    key_ability_id TEXT REFERENCES parsed_data_abilities(id),
    PRIMARY KEY (class_id, key_ability_id)
);

-- Monster-Ability relationships
CREATE TABLE parsed_data_monster_abilities (
    monster_id TEXT REFERENCES parsed_data_monsters(id),
    ability_id TEXT REFERENCES parsed_data_monster_abilities_list(id),
    PRIMARY KEY (monster_id, ability_id)
);

-- Monster-Active Action relationships
CREATE TABLE parsed_data_monster_active_actions (
    monster_id TEXT REFERENCES parsed_data_monsters(id),
    action_id TEXT REFERENCES parsed_data_monster_abilities_list(id),
    PRIMARY KEY (monster_id, action_id)
);

-- Race-Ability relationships (racial abilities)
CREATE TABLE parsed_data_race_abilities (
    race_id TEXT REFERENCES parsed_data_races(id),
    ability_id TEXT REFERENCES parsed_data_abilities(id),
    PRIMARY KEY (race_id, ability_id)
);

-- Item-Keyword relationships
CREATE TABLE parsed_data_item_keywords (
    item_id TEXT REFERENCES parsed_data_items(id),
    keyword_id TEXT REFERENCES parsed_data_keywords(id),
    PRIMARY KEY (item_id, keyword_id)
);

-- Ability-Keyword relationships (denormalized from keywords array)
CREATE TABLE parsed_data_ability_keywords (
    ability_id TEXT REFERENCES parsed_data_abilities(id),
    keyword_id TEXT REFERENCES parsed_data_keywords(id),
    PRIMARY KEY (ability_id, keyword_id)
);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to populate ability-keyword relationships from keywords array
CREATE OR REPLACE FUNCTION populate_ability_keywords() RETURNS void AS $$
BEGIN
    INSERT INTO parsed_data_ability_keywords (ability_id, keyword_id)
    SELECT DISTINCT a.id, unnest(a.keywords)
    FROM parsed_data_abilities a
    WHERE a.keywords IS NOT NULL AND array_length(a.keywords, 1) > 0
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parsed_data_classes_updated_at BEFORE UPDATE ON parsed_data_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_abilities_updated_at BEFORE UPDATE ON parsed_data_abilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_races_updated_at BEFORE UPDATE ON parsed_data_races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_items_updated_at BEFORE UPDATE ON parsed_data_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_keywords_updated_at BEFORE UPDATE ON parsed_data_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_breakthroughs_updated_at BEFORE UPDATE ON parsed_data_breakthroughs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_monsters_updated_at BEFORE UPDATE ON parsed_data_monsters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_data_monster_abilities_list_updated_at BEFORE UPDATE ON parsed_data_monster_abilities_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE parsed_data_classes IS 'Player character classes with their attributes, skills, and requirements';
COMMENT ON TABLE parsed_data_abilities IS 'All player abilities including true, key, crafting, and gathering abilities';
COMMENT ON TABLE parsed_data_monster_abilities_list IS 'Monster-specific abilities and active actions';
COMMENT ON TABLE parsed_data_races IS 'Primary races and sub-races with their benefits';
COMMENT ON TABLE parsed_data_items IS 'All game items including equipment, alchemy, artifice, etc.';
COMMENT ON TABLE parsed_data_keywords IS 'Game keywords used by abilities, items, and other mechanics';
COMMENT ON TABLE parsed_data_breakthroughs IS 'Character advancement options with costs and requirements';
COMMENT ON TABLE parsed_data_monsters IS 'Monster stat blocks and information';

""".format(timestamp=datetime.now().isoformat())