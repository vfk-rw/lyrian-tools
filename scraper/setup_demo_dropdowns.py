#!/usr/bin/env python3
"""
Set up data validation dropdowns for the demo spreadsheet - Version 3.

This script uses helper sheets with static ranges for validation.
"""

import logging
import sys
import json
import requests
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from exporters.sheets.base_sheets_exporter import BaseSheetsExporter
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Config file for loading demo spreadsheet ID
CONFIG_FILE = Path(__file__).parent / ".sheets_config.json"
SOURCE_SPREADSHEET_ID = "1l_IhI6LaEW7eqISHoK2bUYLlMvb9a37JbPhoI-vuXq0"


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


def setup_dropdowns():
    """Set up data validation dropdowns for the demo spreadsheet."""
    
    # Load the demo spreadsheet ID from config
    demo_spreadsheet_id = load_demo_spreadsheet_id()
    if not demo_spreadsheet_id:
        logger.error("No demo spreadsheet ID found in config. Run create_demo_sheet_v3.py first.")
        raise Exception("No demo spreadsheet ID found in config. Run create_demo_sheet_v3.py first.")
    
    # Initialize the exporter with the demo spreadsheet
    exporter = BaseSheetsExporter(version="demo")
    exporter.spreadsheet_id = demo_spreadsheet_id
    
    logger.info(f"Setting up dropdowns for demo spreadsheet: {demo_spreadsheet_id}")
    
    # Grant IMPORTRANGE permissions first
    grant_importrange_permission(exporter)
    
    # Wait a moment for permissions to propagate
    import time
    time.sleep(2)
    
    # Set up class dropdown using helper sheet
    setup_class_dropdown_v3(exporter)
    
    # Set up ability dropdown using helper sheet
    setup_ability_dropdown_v3(exporter)
    
    logger.info("Dropdowns set up successfully!")


def grant_importrange_permission(exporter):
    """Grant IMPORTRANGE permission using the undocumented Google API endpoint."""
    
    try:
        # Get credentials and create an authenticated session
        credentials = service_account.Credentials.from_service_account_file(
            exporter.credentials_path,
            scopes=[
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
        )
        
        # Refresh token to get access token
        credentials.refresh(Request())
        access_token = credentials.token
        
        # Use the undocumented endpoint to grant IMPORTRANGE permission
        url = f"https://docs.google.com/spreadsheets/d/{exporter.spreadsheet_id}/externaldata/addimportrangepermissions"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'donorDocId': SOURCE_SPREADSHEET_ID
        }
        
        response = requests.post(url, headers=headers, data=data)
        
        if response.status_code == 200:
            logger.info("Successfully granted IMPORTRANGE permission")
        else:
            logger.warning(f"IMPORTRANGE permission request returned status {response.status_code}: {response.text}")
            
    except Exception as e:
        logger.error(f"Failed to grant IMPORTRANGE permission: {e}")
        # Don't raise, continue with setup


def setup_class_dropdown_v3(exporter):
    """Set up the class dropdown using helper sheet range."""
    
    try:
        # Get the sheet ID for Class Lookup
        class_sheet_id = exporter._get_sheet_id("Class Lookup")
        
        # Get the sheet ID for the helper sheet
        helper_sheet_id = exporter._get_sheet_id("_ClassList")
        
        # Set up data validation for cell A6 using helper sheet range
        # We'll use a large range to account for the IMPORTRANGE expansion
        requests = [
            {
                'setDataValidation': {
                    'range': {
                        'sheetId': class_sheet_id,
                        'startRowIndex': 5,  # Row 6 (0-indexed)
                        'endRowIndex': 6,
                        'startColumnIndex': 0,  # Column A
                        'endColumnIndex': 1
                    },
                    'rule': {
                        'condition': {
                            'type': 'ONE_OF_RANGE',
                            'values': [
                                {
                                    'userEnteredValue': f'=_ClassList!A2:A200'  # Use helper sheet range
                                }
                            ]
                        },
                        'showCustomUi': True,
                        'strict': False
                    }
                }
            }
        ]
        
        exporter._execute_with_retry(
            lambda: exporter.service.spreadsheets().batchUpdate(
                spreadsheetId=exporter.spreadsheet_id,
                body={'requests': requests}
            ).execute()
        )
        
        logger.info("Set up class dropdown using helper sheet range in Class Lookup sheet")
        
    except Exception as e:
        logger.error(f"Failed to set up class dropdown: {e}")


def setup_ability_dropdown_v3(exporter):
    """Set up the ability dropdown using helper sheet range."""
    
    try:
        # Get the sheet ID for Ability Lookup
        ability_sheet_id = exporter._get_sheet_id("Ability Lookup")
        
        # Get the sheet ID for the helper sheet
        helper_sheet_id = exporter._get_sheet_id("_AbilityList")
        
        # Set up data validation for cell A6 using helper sheet range
        # We'll use a large range to account for the IMPORTRANGE expansion
        requests = [
            {
                'setDataValidation': {
                    'range': {
                        'sheetId': ability_sheet_id,
                        'startRowIndex': 5,  # Row 6 (0-indexed)
                        'endRowIndex': 6,
                        'startColumnIndex': 0,  # Column A
                        'endColumnIndex': 1
                    },
                    'rule': {
                        'condition': {
                            'type': 'ONE_OF_RANGE',
                            'values': [
                                {
                                    'userEnteredValue': f'=_AbilityList!A2:A1000'  # Use helper sheet range
                                }
                            ]
                        },
                        'showCustomUi': True,
                        'strict': False
                    }
                }
            }
        ]
        
        exporter._execute_with_retry(
            lambda: exporter.service.spreadsheets().batchUpdate(
                spreadsheetId=exporter.spreadsheet_id,
                body={'requests': requests}
            ).execute()
        )
        
        logger.info("Set up ability dropdown using helper sheet range in Ability Lookup sheet")
        
    except Exception as e:
        logger.error(f"Failed to set up ability dropdown: {e}")


def main():
    """Main function."""
    try:
        setup_dropdowns()
        
        demo_id = load_demo_spreadsheet_id()
        print(f"\n✅ Helper sheet-based dropdowns set up successfully!")
        print(f"📊 Demo URL: https://docs.google.com/spreadsheets/d/{demo_id}")
        print(f"\n🎯 How to test:")
        print(f"1. Go to the 'Class Lookup' tab")
        print(f"2. Click on cell A6 and you should see a dropdown arrow")
        print(f"3. Select a class and watch the tier/details auto-populate")
        print(f"4. Do the same in the 'Ability Lookup' tab")
        print(f"\n🔧 V3 Approach: Using helper sheets with static ranges for validation")
        print(f"📋 Helper sheets: _ClassList, _AbilityList (contain IMPORTRANGE data)")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to set up dropdowns: {e}")
        print(f"\n❌ Failed to set up dropdowns: {e}")
        return False


if __name__ == "__main__":
    main()