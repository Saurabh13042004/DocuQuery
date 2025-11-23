"""
Migration script to add edited_file_path column to documents table in SQLiteCloud
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

load_dotenv()

def migrate():
    try:
        # Get the SQLiteCloud connection string
        sqlite_cloud_url = os.environ.get("SQLITE_CLOUD_URL")
        
        if not sqlite_cloud_url:
            print("❌ SQLITE_CLOUD_URL not found in environment variables")
            return False
        
        # Create engine and connection
        engine = create_engine(sqlite_cloud_url)
        
        with engine.connect() as connection:
            # Check which columns exist
            inspector = inspect(engine)
            existing_columns = [col['name'] for col in inspector.get_columns('documents')]
            
            # List of required columns
            required_columns = ['edited_file_path', 'user_id']
            migrations_applied = 0
            
            # Add missing columns
            for column in required_columns:
                if column not in existing_columns:
                    try:
                        if column == 'edited_file_path':
                            connection.execute(text("""
                                ALTER TABLE documents 
                                ADD COLUMN edited_file_path VARCHAR NULL
                            """))
                            print(f"✅ Added 'edited_file_path' column")
                            migrations_applied += 1
                        elif column == 'user_id':
                            connection.execute(text("""
                                ALTER TABLE documents 
                                ADD COLUMN user_id INTEGER
                            """))
                            print(f"✅ Added 'user_id' column")
                            migrations_applied += 1
                    except Exception as col_error:
                        print(f"⚠️  Could not add column '{column}': {col_error}")
                else:
                    print(f"ℹ️  Column '{column}' already exists")
            
            connection.commit()
            
            if migrations_applied > 0:
                print(f"\n✅ Migration successful: Applied {migrations_applied} changes to documents table")
            else:
                print("ℹ️  All required columns already exist")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
