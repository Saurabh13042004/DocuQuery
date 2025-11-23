"""
Migration script to add edited_file_path column to documents table
"""
import sqlite3
import sys

def migrate():
    try:
        # Connect to the database
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'edited_file_path' not in columns:
            # Add the column
            cursor.execute("""
                ALTER TABLE documents 
                ADD COLUMN edited_file_path VARCHAR NULL
            """)
            conn.commit()
            print("✅ Migration successful: Added 'edited_file_path' column to documents table")
        else:
            print("ℹ️  Column 'edited_file_path' already exists in documents table")
        
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
