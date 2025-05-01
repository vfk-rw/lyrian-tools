CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    sheet_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_info with UUID foreign key
CREATE TABLE character_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL,
    name TEXT,
    race TEXT,
    sub_race TEXT,
    spirit_core INTEGER,
    last_parsed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_character FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Create character_class_info with UUID foreign key
CREATE TABLE character_class_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL,
    class_name TEXT NOT NULL,
    class_tier INTEGER,
    class_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_character FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Update timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_trigger ON characters;
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();