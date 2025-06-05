#!/bin/bash
# Deploy generated SQL files to Supabase
# Usage: ./deploy.sh [--local] [--project-ref <ref>] [--db-password <password>]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
LOCAL=false
PROJECT_REF=""
DB_PASSWORD=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            LOCAL=true
            shift
            ;;
        --project-ref)
            PROJECT_REF="$2"
            shift 2
            ;;
        --db-password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--local] [--project-ref <ref>] [--db-password <password>]"
            echo "  --local: Deploy to local Supabase development database"
            echo "  --project-ref: Supabase project reference (for remote deployment)"
            echo "  --db-password: Database password (for remote deployment)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Find the latest migration files
OUTPUT_DIR="$(dirname "$0")/output"
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}Error: Output directory not found: $OUTPUT_DIR${NC}"
    exit 1
fi

# Get the latest timestamp
LATEST_TIMESTAMP=$(ls "$OUTPUT_DIR"/*.sql 2>/dev/null | sed -E 's/.*_([0-9]{8}_[0-9]{6})\.sql$/\1/' | sort -u | tail -n 1)

if [ -z "$LATEST_TIMESTAMP" ]; then
    echo -e "${RED}Error: No migration files found${NC}"
    exit 1
fi

echo -e "${GREEN}Using migration files with timestamp: $LATEST_TIMESTAMP${NC}"

# Function to execute SQL file
execute_sql() {
    local file=$1
    echo -e "${YELLOW}Executing: $(basename "$file")${NC}"
    
    if [ "$LOCAL" = true ]; then
        # Local deployment
        supabase db push --file "$file"
    else
        # Remote deployment
        CMD="supabase db execute --file \"$file\""
        if [ -n "$PROJECT_REF" ]; then
            CMD="$CMD --project-ref $PROJECT_REF"
        fi
        if [ -n "$DB_PASSWORD" ]; then
            CMD="$CMD --db-password $DB_PASSWORD"
        fi
        eval $CMD
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully executed: $(basename "$file")${NC}"
    else
        echo -e "${RED}❌ Failed to execute: $(basename "$file")${NC}"
        return 1
    fi
}

# Execute files in order
echo -e "${GREEN}Starting deployment...${NC}"

# 1. Schema
SCHEMA_FILE="$OUTPUT_DIR/01_schema_${LATEST_TIMESTAMP}.sql"
if [ -f "$SCHEMA_FILE" ]; then
    execute_sql "$SCHEMA_FILE" || exit 1
fi

# 2. Data files (in alphabetical order)
for DATA_FILE in "$OUTPUT_DIR"/02_data_*_"${LATEST_TIMESTAMP}".sql; do
    if [ -f "$DATA_FILE" ]; then
        execute_sql "$DATA_FILE" || exit 1
    fi
done

# 3. Relationships
RELATIONSHIPS_FILE="$OUTPUT_DIR/03_relationships_${LATEST_TIMESTAMP}.sql"
if [ -f "$RELATIONSHIPS_FILE" ]; then
    execute_sql "$RELATIONSHIPS_FILE" || exit 1
fi

# 4. Indexes
INDEXES_FILE="$OUTPUT_DIR/04_indexes_${LATEST_TIMESTAMP}.sql"
if [ -f "$INDEXES_FILE" ]; then
    execute_sql "$INDEXES_FILE" || exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"