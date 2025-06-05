#!/usr/bin/env python3
"""
Deploy generated SQL files to Supabase using the Supabase CLI.

This script automates the deployment of migration files to Supabase
in the correct order: schema → data → relationships → indexes.

Prerequisites:
- Supabase CLI installed (npm install -g supabase)
- Supabase project initialized (supabase init)
- Logged in to Supabase (supabase login)
"""

import argparse
import logging
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SupabaseDeployer:
    """Deploy SQL files to Supabase using the CLI."""
    
    def __init__(self, project_ref: Optional[str] = None, db_password: Optional[str] = None):
        self.project_ref = project_ref
        self.db_password = db_password
        self.output_dir = Path(__file__).parent / "output"
        
    def check_supabase_cli(self) -> bool:
        """Check if Supabase CLI is installed and accessible."""
        try:
            result = subprocess.run(
                ["supabase", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Supabase CLI found: {result.stdout.strip()}")
            return True
        except subprocess.CalledProcessError:
            logger.error("Supabase CLI not found. Please install it with: npm install -g supabase")
            return False
        except FileNotFoundError:
            logger.error("Supabase CLI not found in PATH")
            return False
            
    def get_latest_migration_files(self) -> List[Path]:
        """Get the latest set of migration files."""
        if not self.output_dir.exists():
            logger.error(f"Output directory not found: {self.output_dir}")
            return []
            
        # Find latest timestamp
        timestamps = set()
        for file in self.output_dir.glob("*.sql"):
            # Extract timestamp from filename (e.g., 01_schema_20250605_031142.sql)
            parts = file.stem.split('_')
            if len(parts) >= 3:
                timestamp = '_'.join(parts[-2:])  # Get last two parts as timestamp
                timestamps.add(timestamp)
                
        if not timestamps:
            logger.error("No migration files found")
            return []
            
        latest_timestamp = sorted(timestamps)[-1]
        logger.info(f"Using migration files with timestamp: {latest_timestamp}")
        
        # Get files in order
        file_patterns = [
            f"01_schema_{latest_timestamp}.sql",
            f"02_data_*_{latest_timestamp}.sql",
            f"03_relationships_{latest_timestamp}.sql",
            f"04_indexes_{latest_timestamp}.sql"
        ]
        
        files = []
        for pattern in file_patterns:
            if '*' in pattern:
                # Handle glob pattern for data files
                matching_files = sorted(self.output_dir.glob(pattern))
                files.extend(matching_files)
            else:
                file_path = self.output_dir / pattern
                if file_path.exists():
                    files.append(file_path)
                    
        return files
        
    def execute_sql_file(self, file_path: Path, local: bool = False) -> bool:
        """Execute a SQL file using Supabase CLI."""
        logger.info(f"Executing: {file_path.name}")
        
        if local:
            # Execute against local development database
            cmd = ["supabase", "db", "push", "--file", str(file_path)]
        else:
            # Execute against remote database
            cmd = ["supabase", "db", "execute", "--file", str(file_path)]
            
            if self.project_ref:
                cmd.extend(["--project-ref", self.project_ref])
            if self.db_password:
                cmd.extend(["--db-password", self.db_password])
                
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            if result.stdout:
                logger.debug(f"Output: {result.stdout}")
                
            logger.info(f"✅ Successfully executed: {file_path.name}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to execute {file_path.name}")
            logger.error(f"Error: {e.stderr}")
            return False
            
    def deploy_all(self, local: bool = False, dry_run: bool = False) -> bool:
        """Deploy all migration files in order."""
        # Check CLI availability
        if not self.check_supabase_cli():
            return False
            
        # Get latest migration files
        files = self.get_latest_migration_files()
        if not files:
            logger.error("No migration files found to deploy")
            return False
            
        logger.info(f"Found {len(files)} migration files to deploy")
        
        if dry_run:
            logger.info("DRY RUN - Would execute the following files:")
            for file in files:
                logger.info(f"  - {file.name}")
            return True
            
        # Execute files in order
        success_count = 0
        for file in files:
            if self.execute_sql_file(file, local=local):
                success_count += 1
            else:
                logger.error(f"Stopping deployment due to error in {file.name}")
                break
                
        logger.info(f"\nDeployment summary: {success_count}/{len(files)} files executed successfully")
        return success_count == len(files)
        
    def reset_tables(self, local: bool = False) -> bool:
        """Drop all parsed_data_ tables (useful for clean redeploy)."""
        logger.warning("⚠️  This will DROP all parsed_data_ tables!")
        
        drop_sql = """
        -- Drop all parsed_data_ tables
        DO $$ 
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE tablename LIKE 'parsed_data_%' AND schemaname = 'public') 
            LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                RAISE NOTICE 'Dropped table: %', r.tablename;
            END LOOP;
        END $$;
        """
        
        # Create temporary SQL file
        temp_file = self.output_dir / "temp_drop_tables.sql"
        temp_file.write_text(drop_sql)
        
        try:
            result = self.execute_sql_file(temp_file, local=local)
            return result
        finally:
            # Clean up temp file
            if temp_file.exists():
                temp_file.unlink()


def main():
    """Main entry point for the deployment tool."""
    parser = argparse.ArgumentParser(
        description="Deploy YAML to Supabase migration files using Supabase CLI"
    )
    parser.add_argument(
        "--project-ref",
        help="Supabase project reference (e.g., abcdefghijklmnop)"
    )
    parser.add_argument(
        "--db-password",
        help="Database password for the Supabase project"
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Deploy to local Supabase development database"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what files would be deployed without executing"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all parsed_data_ tables before deploying (CAUTION!)"
    )
    
    args = parser.parse_args()
    
    # Create deployer
    deployer = SupabaseDeployer(
        project_ref=args.project_ref,
        db_password=args.db_password
    )
    
    try:
        # Handle reset if requested
        if args.reset and not args.dry_run:
            response = input("Are you sure you want to DROP all parsed_data_ tables? (yes/no): ")
            if response.lower() == 'yes':
                logger.info("Dropping existing tables...")
                if not deployer.reset_tables(local=args.local):
                    logger.error("Failed to reset tables")
                    sys.exit(1)
            else:
                logger.info("Reset cancelled")
                
        # Deploy migrations
        if deployer.deploy_all(local=args.local, dry_run=args.dry_run):
            logger.info("✅ Deployment completed successfully!")
        else:
            logger.error("❌ Deployment failed")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("\nDeployment cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()