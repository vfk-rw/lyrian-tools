#!/usr/bin/env python3
"""
Base class for exporting parsed YAML data to Google Sheets.

This provides common functionality for all data type exporters.
"""

import logging
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import yaml

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


logger = logging.getLogger(__name__)


class BaseSheetsExporter:
    """Base class for exporting data to Google Sheets."""
    
    def __init__(self, credentials_path: Optional[str] = None, version: str = "0.10.1"):
        """
        Initialize the exporter.
        
        Args:
            credentials_path: Path to Google service account credentials JSON
            version: Game version to export data from
        """
        self.version = version
        self.credentials_path = credentials_path or self._find_credentials()
        self.service = None
        self.spreadsheet_id = None
        
        # Base paths
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.parsed_data_dir = self.project_root / "scraper" / "parsed_data" / version
        
        # Initialize Google Sheets service
        self._init_service()
    
    def _find_credentials(self) -> str:
        """Find Google credentials file."""
        # Check common locations
        possible_paths = [
            Path(__file__).parent.parent.parent.parent / "lctools-app" / "keys" / "gcp.json",
            Path.home() / ".config" / "gcp-credentials.json",
            Path("gcp-credentials.json"),
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"Found credentials at: {path}")
                return str(path)
        
        raise FileNotFoundError(
            "Could not find Google credentials file. "
            "Please provide path via credentials_path parameter."
        )
    
    def _init_service(self):
        """Initialize Google Sheets API service."""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=[
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ]
            )
            self.service = build('sheets', 'v4', credentials=credentials)
            self.drive_service = build('drive', 'v3', credentials=credentials)
            logger.info("Google Sheets and Drive services initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google services: {e}")
            raise
    
    def create_or_update_spreadsheet(self, title: str, spreadsheet_id: str = None, public: bool = True) -> str:
        """
        Create a new Google Spreadsheet or update an existing one.
        
        Args:
            title: Title for the spreadsheet
            spreadsheet_id: Existing spreadsheet ID to update (if None, creates new)
            public: Whether to make the spreadsheet publicly viewable
            
        Returns:
            Spreadsheet ID
        """
        if spreadsheet_id:
            # Update existing spreadsheet
            return self._update_existing_spreadsheet(spreadsheet_id, title, public)
        else:
            # Create new spreadsheet
            return self._create_new_spreadsheet(title, public)
    
    def _create_new_spreadsheet(self, title: str, public: bool) -> str:
        """Create a new spreadsheet."""
        try:
            spreadsheet = {
                'properties': {
                    'title': title
                }
            }
            
            result = self.service.spreadsheets().create(
                body=spreadsheet
            ).execute()
            
            self.spreadsheet_id = result['spreadsheetId']
            logger.info(f"Created spreadsheet: {title} (ID: {self.spreadsheet_id})")
            logger.info(f"URL: https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}")
            
            # Remove default Sheet1
            self._remove_default_sheet()
            
            # Make it publicly viewable if requested
            if public:
                self.make_public()
            
            return self.spreadsheet_id
            
        except HttpError as e:
            logger.error(f"Failed to create spreadsheet: {e}")
            raise
    
    def _update_existing_spreadsheet(self, spreadsheet_id: str, title: str, public: bool) -> str:
        """Update an existing spreadsheet."""
        try:
            self.spreadsheet_id = spreadsheet_id
            
            # Update title
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={
                    'requests': [{
                        'updateSpreadsheetProperties': {
                            'properties': {
                                'title': title
                            },
                            'fields': 'title'
                        }
                    }]
                }
            ).execute()
            
            logger.info(f"Updated spreadsheet: {title} (ID: {self.spreadsheet_id})")
            logger.info(f"URL: https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}")
            
            # Clear all existing sheets except summary
            self._clear_all_sheets_except_summary()
            
            # Make it publicly viewable if requested
            if public:
                self.make_public()
            
            return self.spreadsheet_id
            
        except HttpError as e:
            logger.error(f"Failed to update spreadsheet: {e}")
            raise
    
    def _remove_default_sheet(self):
        """Remove the default 'Sheet1' that gets created, but only after adding other sheets."""
        # We'll remove Sheet1 later after we've added our sheets
        # For now, just log that we'll handle it later
        logger.info("Will remove default Sheet1 after adding our sheets")
    
    def _clear_all_sheets_except_summary(self):
        """Clear all sheets except Summary, or delete them entirely."""
        try:
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            requests = []
            for sheet in spreadsheet['sheets']:
                sheet_title = sheet['properties']['title']
                sheet_id = sheet['properties']['sheetId']
                
                if sheet_title != 'Summary':
                    # Delete non-Summary sheets
                    requests.append({
                        'deleteSheet': {
                            'sheetId': sheet_id
                        }
                    })
            
            if requests:
                self.service.spreadsheets().batchUpdate(
                    spreadsheetId=self.spreadsheet_id,
                    body={'requests': requests}
                ).execute()
                
                logger.info(f"Deleted {len(requests)} existing sheets")
                
        except HttpError as e:
            logger.warning(f"Failed to clear existing sheets: {e}")
            # Don't raise, we'll just overwrite them
    
    def make_public(self):
        """Make the spreadsheet publicly viewable (read-only)."""
        try:
            permission = {
                'type': 'anyone',
                'role': 'reader'
            }
            
            self.drive_service.permissions().create(
                fileId=self.spreadsheet_id,
                body=permission
            ).execute()
            
            logger.info(f"Made spreadsheet publicly viewable")
            
        except HttpError as e:
            if "accessNotConfigured" in str(e) and "drive.googleapis.com" in str(e):
                logger.warning(
                    "Google Drive API is not enabled for this project. "
                    "To make spreadsheets public, you need to enable the Drive API at: "
                    "https://console.developers.google.com/apis/api/drive.googleapis.com/overview"
                )
                logger.warning(f"Spreadsheet created successfully but remains private: {self.spreadsheet_id}")
                return  # Don't raise, just warn
            else:
                logger.error(f"Failed to make spreadsheet public: {e}")
                raise
    
    def add_sheet(self, sheet_name: str):
        """Add a new sheet to the spreadsheet."""
        try:
            request = {
                'addSheet': {
                    'properties': {
                        'title': sheet_name
                    }
                }
            }
            
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={'requests': [request]}
            ).execute()
            
            logger.info(f"Added sheet: {sheet_name}")
            
        except HttpError as e:
            if "already exists" in str(e):
                logger.warning(f"Sheet {sheet_name} already exists")
            else:
                logger.error(f"Failed to add sheet: {e}")
                raise
    
    def clear_sheet(self, sheet_name: str):
        """Clear all data from a sheet."""
        try:
            self.service.spreadsheets().values().clear(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A1:ZZ10000"
            ).execute()
            logger.info(f"Cleared sheet: {sheet_name}")
        except HttpError as e:
            logger.error(f"Failed to clear sheet: {e}")
            raise
    
    def write_data(self, sheet_name: str, data: List[List[Any]], start_cell: str = "A1"):
        """
        Write data to a sheet.
        
        Args:
            sheet_name: Name of the sheet
            data: 2D array of data to write
            start_cell: Starting cell (default: A1)
        """
        if not data:
            logger.warning(f"No data to write to {sheet_name}")
            return
            
        try:
            range_name = f"{sheet_name}!{start_cell}"
            body = {
                'values': data
            }
            
            result = self._execute_with_retry(
                lambda: self.service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=range_name,
                    valueInputOption='RAW',
                    body=body
                ).execute()
            )
            
            logger.info(f"Wrote {result.get('updatedRows', 0)} rows to {sheet_name}")
            
            # Small delay to avoid rate limits
            time.sleep(1)
            
        except HttpError as e:
            logger.error(f"Failed to write data: {e}")
            raise
    
    def format_headers(self, sheet_name: str, num_columns: int):
        """Format the header row with bold text and freeze it."""
        try:
            requests = [
                # Make headers bold
                {
                    'repeatCell': {
                        'range': {
                            'sheetId': self._get_sheet_id(sheet_name),
                            'startRowIndex': 0,
                            'endRowIndex': 1,
                            'startColumnIndex': 0,
                            'endColumnIndex': num_columns
                        },
                        'cell': {
                            'userEnteredFormat': {
                                'textFormat': {
                                    'bold': True
                                }
                            }
                        },
                        'fields': 'userEnteredFormat.textFormat.bold'
                    }
                },
                # Freeze header row
                {
                    'updateSheetProperties': {
                        'properties': {
                            'sheetId': self._get_sheet_id(sheet_name),
                            'gridProperties': {
                                'frozenRowCount': 1
                            }
                        },
                        'fields': 'gridProperties.frozenRowCount'
                    }
                }
            ]
            
            self._execute_with_retry(
                lambda: self.service.spreadsheets().batchUpdate(
                    spreadsheetId=self.spreadsheet_id,
                    body={'requests': requests}
                ).execute()
            )
            
            logger.info(f"Formatted headers in {sheet_name}")
            
            # Small delay to avoid rate limits
            time.sleep(1)
            
        except HttpError as e:
            logger.error(f"Failed to format headers: {e}")
            raise
    
    def _get_sheet_id(self, sheet_name: str) -> int:
        """Get the sheet ID for a given sheet name."""
        try:
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            for sheet in spreadsheet['sheets']:
                if sheet['properties']['title'] == sheet_name:
                    return sheet['properties']['sheetId']
            
            raise ValueError(f"Sheet {sheet_name} not found")
            
        except HttpError as e:
            logger.error(f"Failed to get sheet ID: {e}")
            raise
    
    def auto_resize_columns(self, sheet_name: str):
        """Auto-resize all columns to fit content."""
        try:
            sheet_id = self._get_sheet_id(sheet_name)
            request = {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': sheet_id,
                        'dimension': 'COLUMNS',
                        'startIndex': 0,
                        'endIndex': 50  # Resize first 50 columns
                    }
                }
            }
            
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={'requests': [request]}
            ).execute()
            
            logger.info(f"Auto-resized columns in {sheet_name}")
            
        except HttpError as e:
            logger.error(f"Failed to auto-resize columns: {e}")
            # Don't raise, this is not critical
    
    def load_yaml_file(self, file_path: Path) -> Dict[str, Any]:
        """Load and parse a YAML file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {e}")
            return {}
    
    def get_data_files(self, data_type: str) -> List[Path]:
        """
        Get all YAML files for a specific data type.
        
        Args:
            data_type: Type of data (e.g., 'classes', 'items')
            
        Returns:
            List of file paths
        """
        data_dir = self.parsed_data_dir / data_type
        if not data_dir.exists():
            logger.warning(f"Data directory does not exist: {data_dir}")
            return []
        
        # Get all YAML files, excluding index files
        files = [
            f for f in data_dir.glob("**/*.yaml")
            if not f.name.endswith("_index.yaml")
        ]
        
        return sorted(files)
    
    def export_data_type(self, data_type: str, sheet_name: Optional[str] = None):
        """
        Export a specific data type to a sheet.
        Must be implemented by subclasses.
        
        Args:
            data_type: Type of data to export
            sheet_name: Name for the sheet (defaults to data_type)
        """
        raise NotImplementedError("Subclasses must implement export_data_type")
    
    def create_summary_sheet(self):
        """Create a summary sheet with statistics about the exported data."""
        summary_data = [
            ["Data Type", "Count", "Last Updated"],
            ["", "", ""],  # Empty row
            ["Export Information", "", ""],
            ["Game Version", self.version, ""],
            ["Export Date", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ""],
            ["", "", ""],  # Empty row
        ]
        
        # Add counts for each data type
        data_types = [
            "classes", "abilities", "items", "races", 
            "keywords", "breakthroughs", "monsters", "monster-abilities"
        ]
        
        for data_type in data_types:
            files = self.get_data_files(data_type)
            if files:
                summary_data.append([data_type.title(), len(files), ""])
        
        # Create summary sheet
        self.add_sheet("Summary")
        self.clear_sheet("Summary")
        self.write_data("Summary", summary_data)
        self.format_headers("Summary", 3)
        self.auto_resize_columns("Summary")
        
        # Clean up any default Sheet1 that might still exist
        self._cleanup_default_sheet()
    
    def _execute_with_retry(self, operation, max_retries=3, base_delay=60):
        """
        Execute an operation with exponential backoff retry for rate limits.
        
        Args:
            operation: Function to execute
            max_retries: Maximum number of retries
            base_delay: Base delay in seconds for rate limit errors
        """
        for attempt in range(max_retries + 1):
            try:
                return operation()
            except HttpError as e:
                if e.resp.status == 429:  # Rate limit exceeded
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"Rate limit exceeded. Waiting {delay} seconds before retry {attempt + 1}/{max_retries}")
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"Rate limit exceeded after {max_retries} retries")
                        raise
                else:
                    raise
    
    def _cleanup_default_sheet(self):
        """Clean up the default 'Sheet1' if it still exists and we have other sheets."""
        try:
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            sheets = spreadsheet['sheets']
            sheet1_id = None
            has_other_sheets = False
            
            # Check what sheets we have
            for sheet in sheets:
                title = sheet['properties']['title']
                if title == 'Sheet1':
                    sheet1_id = sheet['properties']['sheetId']
                else:
                    has_other_sheets = True
            
            # Only delete Sheet1 if we have other sheets
            if sheet1_id is not None and has_other_sheets:
                self.service.spreadsheets().batchUpdate(
                    spreadsheetId=self.spreadsheet_id,
                    body={
                        'requests': [{
                            'deleteSheet': {
                                'sheetId': sheet1_id
                            }
                        }]
                    }
                ).execute()
                
                logger.info("Removed default Sheet1")
                
        except HttpError as e:
            logger.warning(f"Failed to cleanup default sheet: {e}")
            # Don't raise, this is not critical