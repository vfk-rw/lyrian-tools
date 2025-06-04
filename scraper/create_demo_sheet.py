#!/usr/bin/env python3
"""
Create a demo Google Spreadsheet showing IMPORTRANGE usage with dropdowns.

This creates helper sheets with IMPORTRANGE data for validation.
"""

import logging
import sys
import json
from pathlib import Path
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from exporters.sheets.base_sheets_exporter import BaseSheetsExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Source spreadsheet ID (the main export)
SOURCE_SPREADSHEET_ID = "1l_IhI6LaEW7eqISHoK2bUYLlMvb9a37JbPhoI-vuXq0"

# Config file for saving demo spreadsheet ID
CONFIG_FILE = Path(__file__).parent / ".sheets_config.json"


def load_demo_spreadsheet_id():
    """Load the demo spreadsheet ID from config file."""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('demo', {}).get('spreadsheet_id')
    except Exception as e:
        logger.warning(f"Failed to load demo config: {e}")
    return None


def save_demo_spreadsheet_id(spreadsheet_id):
    """Save the demo spreadsheet ID to config file."""
    try:
        config = {}
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        
        config['demo'] = {
            'spreadsheet_id': spreadsheet_id,
            'last_updated': datetime.now().isoformat()
        }
        
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
            
        logger.info(f"Saved demo spreadsheet ID to config: {spreadsheet_id}")
        
    except Exception as e:
        logger.error(f"Failed to save demo config: {e}")


def create_demo_spreadsheet():
    """Create or update the demo spreadsheet with IMPORTRANGE dropdowns."""
    
    # Initialize the exporter
    exporter = BaseSheetsExporter(version="demo")
    
    # Check if we have an existing demo spreadsheet ID
    existing_demo_id = load_demo_spreadsheet_id()
    
    # Create or update spreadsheet
    title = "LC TTRPG Data - IMPORTRANGE Demo"
    spreadsheet_id = exporter.create_or_update_spreadsheet(title, existing_demo_id, public=True)
    
    # Save the demo spreadsheet ID for future use
    save_demo_spreadsheet_id(spreadsheet_id)
    
    # Create helper sheets first (for validation data)
    create_helper_sheets(exporter)
    
    # Create the demo sheets
    create_class_lookup_demo_v3(exporter)
    create_ability_lookup_demo_v3(exporter)
    create_instructions_sheet_v3(exporter)
    
    # Clean up default Sheet1
    exporter._cleanup_default_sheet()
    
    logger.info(f"Demo spreadsheet created: {spreadsheet_id}")
    logger.info(f"URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
    
    return spreadsheet_id


def create_helper_sheets(exporter):
    """Create hidden helper sheets with IMPORTRANGE data for validation."""
    
    # Helper sheet for class names
    exporter.add_sheet("_ClassList")
    class_data = [
        ["Class Names"],  # Header
        [f'=IMPORTRANGE("{SOURCE_SPREADSHEET_ID}", "Classes!B2:B")']  # Import class names
    ]
    exporter.write_data("_ClassList", class_data)
    
    # Helper sheet for ability names  
    exporter.add_sheet("_AbilityList")
    ability_data = [
        ["Ability Names"],  # Header
        [f'=IMPORTRANGE("{SOURCE_SPREADSHEET_ID}", "All Abilities!B2:B")']  # Import ability names
    ]
    exporter.write_data("_AbilityList", ability_data)
    
    logger.info("Created helper sheets for dropdown validation")


def write_formulas_to_cells(exporter, sheet_name, formulas):
    """Write formulas to specific cells using the Sheets API."""
    try:
        requests = []
        for cell_ref, formula in formulas.items():
            # Convert cell reference like "B6" to row/col indices
            col_letter = ''.join(filter(str.isalpha, cell_ref))
            row_num = int(''.join(filter(str.isdigit, cell_ref)))
            
            # Convert column letter to index (A=0, B=1, etc.)
            col_index = ord(col_letter.upper()) - ord('A')
            row_index = row_num - 1  # Convert to 0-based
            
            sheet_id = exporter._get_sheet_id(sheet_name)
            
            requests.append({
                'updateCells': {
                    'range': {
                        'sheetId': sheet_id,
                        'startRowIndex': row_index,
                        'endRowIndex': row_index + 1,
                        'startColumnIndex': col_index,
                        'endColumnIndex': col_index + 1
                    },
                    'rows': [
                        {
                            'values': [
                                {
                                    'userEnteredValue': {
                                        'formulaValue': formula
                                    }
                                }
                            ]
                        }
                    ],
                    'fields': 'userEnteredValue'
                }
            })
        
        if requests:
            exporter._execute_with_retry(
                lambda: exporter.service.spreadsheets().batchUpdate(
                    spreadsheetId=exporter.spreadsheet_id,
                    body={'requests': requests}
                ).execute()
            )
            logger.info(f"Successfully wrote {len(formulas)} formulas to {sheet_name}")
            
    except Exception as e:
        logger.error(f"Failed to write formulas to {sheet_name}: {e}")


def create_instructions_sheet_v3(exporter):
    """Create an instructions sheet explaining how to use the demo."""
    
    instructions_data = [
        ["LC TTRPG Data - IMPORTRANGE Demo (V3)", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["This spreadsheet demonstrates how to use IMPORTRANGE to pull data", "", "", "", "", ""],
        ["from the main LC data export into your own custom sheets.", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["📊 Source Data:", f"https://docs.google.com/spreadsheets/d/{SOURCE_SPREADSHEET_ID}", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["🎯 How to Use:", "", "", "", "", ""],
        ["1. Go to the 'Class Lookup' tab", "", "", "", "", ""],
        ["2. Click on cell A6 to see the dropdown", "", "", "", "", ""],
        ["3. Choose a class from the dropdown", "", "", "", "", ""],
        ["4. Watch the tier automatically populate!", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["5. Go to the 'Ability Lookup' tab", "", "", "", "", ""],
        ["6. Choose an ability from the dropdown", "", "", "", "", ""],
        ["7. See all ability details auto-populate", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["🔧 Technical Details:", "", "", "", "", ""],
        ["- Uses IMPORTRANGE() to pull data from main export", "", "", "", "", ""],
        ["- Helper sheets cache the IMPORTRANGE data for dropdowns", "", "", "", "", ""],
        ["- INDEX/MATCH formulas populate related data", "", "", "", "", ""],
        ["- Updates automatically when source data changes", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["📝 Copy This Pattern:", "", "", "", "", ""],
        ["Feel free to copy these formulas into your own sheets!", "", "", "", "", ""],
        ["Just replace the spreadsheet ID with your own export.", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["🛠️ V3 Changes:", "", "", "", "", ""],
        ["- Added helper sheets for better dropdown validation", "", "", "", "", ""],
        ["- Improved formula execution and display", "", "", "", "", ""],
        ["- Fixed IMPORTRANGE permission issues", "", "", "", "", ""],
    ]
    
    exporter.add_sheet("Instructions")
    exporter.write_data("Instructions", instructions_data)
    
    # Format the header
    try:
        sheet_id = exporter._get_sheet_id("Instructions")
        requests = [
            {
                'repeatCell': {
                    'range': {
                        'sheetId': sheet_id,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': 1
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'textFormat': {
                                'bold': True,
                                'fontSize': 16
                            }
                        }
                    },
                    'fields': 'userEnteredFormat.textFormat'
                }
            }
        ]
        
        exporter._execute_with_retry(
            lambda: exporter.service.spreadsheets().batchUpdate(
                spreadsheetId=exporter.spreadsheet_id,
                body={'requests': requests}
            ).execute()
        )
        
    except Exception as e:
        logger.warning(f"Failed to format instructions header: {e}")


def create_class_lookup_demo_v3(exporter):
    """Create a sheet demonstrating class dropdown with auto-populated tier."""
    
    # Headers and initial setup - NO FORMULAS in the data
    demo_data = [
        ["Class Lookup Demo (V3)", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["Instructions: Select a class from the dropdown below and watch the tier auto-populate!", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["Select Class", "Tier", "Difficulty", "Main Role", "Secondary Role", "Requirements"],
        ["", "", "", "", "", ""],  # Row 6 - this is where the dropdown will be
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["Formula Reference:", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["Data Validation (A6):", "Range from _ClassList helper sheet", "", "", "", ""],
        ["Tier Formula (B6):", "=IFERROR(INDEX(...), \"\")", "", "", "", ""],
        ["Difficulty Formula (C6):", "=IFERROR(INDEX(...), \"\")", "", "", "", ""],
        ["Main Role Formula (D6):", "=IFERROR(INDEX(...), \"\")", "", "", "", ""],
        ["Secondary Role Formula (E6):", "=IFERROR(INDEX(...), \"\")", "", "", "", ""],
        ["Requirements Formula (F6):", "=IFERROR(INDEX(...), \"\")", "", "", "", ""],
    ]
    
    exporter.add_sheet("Class Lookup")
    exporter.write_data("Class Lookup", demo_data)
    
    # Now write the actual formulas to row 6
    formulas = {
        'B6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!C2:C"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!B2:B"),0)),"")',
        'C6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!D2:D"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!B2:B"),0)),"")',
        'D6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!E2:E"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!B2:B"),0)),"")',
        'E6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!F2:F"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!B2:B"),0)),"")',
        'F6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!G2:G"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","Classes!B2:B"),0)),"")'
    }
    
    write_formulas_to_cells(exporter, "Class Lookup", formulas)


def create_ability_lookup_demo_v3(exporter):
    """Create a sheet demonstrating ability dropdown with auto-populated details."""
    
    # Headers and initial setup - NO FORMULAS in the data
    demo_data = [
        ["Ability Lookup Demo (V3)", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Instructions: Select an ability from the dropdown and see all details populate!", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Select Ability", "Type", "Keywords", "Range", "Requirements", "Combined Costs", "Mana", "AP", "RP", "Description"],
        ["", "", "", "", "", "", "", "", "", ""],  # Row 6 - dropdown row
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Formula Reference:", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Data Validation (A6):", "Range from _AbilityList helper sheet", "", "", "", "", "", "", "", ""],
        ["Type Formula (B6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Keywords Formula (C6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Range Formula (D6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Requirements Formula (E6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Combined Costs Formula (F6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Mana Formula (G6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["AP Formula (H6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["RP Formula (I6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
        ["Description Formula (J6):", "=IFERROR(INDEX(...), \"\")", "", "", "", "", "", "", "", ""],
    ]
    
    exporter.add_sheet("Ability Lookup")
    exporter.write_data("Ability Lookup", demo_data)
    
    # Now write the actual formulas to row 6 (updated column references)
    formulas = {
        'B6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!C2:C"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Type
        'C6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!D2:D"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Keywords
        'D6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!E2:E"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Range
        'E6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!G2:G"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Requirements
        'F6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!H2:H"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Combined Costs (NEW)
        'G6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!I2:I"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # Mana
        'H6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!J2:J"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # AP
        'I6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!K2:K"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")',   # RP
        'J6': f'=IFERROR(INDEX(IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!F2:F"),MATCH(A6,IMPORTRANGE("{SOURCE_SPREADSHEET_ID}","All Abilities!B2:B"),0)),"")'    # Description
    }
    
    write_formulas_to_cells(exporter, "Ability Lookup", formulas)


def main():
    """Main function to create the demo spreadsheet."""
    try:
        spreadsheet_id = create_demo_spreadsheet()
        
        existing_id = load_demo_spreadsheet_id()
        if existing_id and existing_id == spreadsheet_id:
            print(f"\n✅ Demo spreadsheet updated successfully!")
            print(f"📊 URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
            print(f"🔄 Using existing demo (ID saved in config)")
        else:
            print(f"\n✅ Demo spreadsheet created successfully!")
            print(f"📊 URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
            print(f"🔗 Spreadsheet ID: {spreadsheet_id}")
            print(f"💾 Demo ID saved to config for future updates")
        
        print(f"\n📝 Next Steps:")
        print(f"1. Run setup_demo_dropdowns.py to configure dropdowns using helper sheets")
        print(f"2. Open the spreadsheet and test the dropdowns")
        print(f"3. Grant IMPORTRANGE permissions when prompted")
        print(f"\n💡 V3 Changes: Added helper sheets for better dropdown validation")
        
        return spreadsheet_id
        
    except Exception as e:
        logger.error(f"Failed to create demo spreadsheet: {e}")
        print(f"\n❌ Failed to create demo spreadsheet: {e}")
        return None


if __name__ == "__main__":
    main()