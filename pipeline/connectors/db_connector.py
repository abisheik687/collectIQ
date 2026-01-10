import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

class DBConnector:
    def __init__(self):
        self.connection = None
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', 5432),
                database=os.getenv('DB_NAME', 'collectiq'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'postgres')
            )
            return self.connection
        except Exception as e:
            print(f"Database connection error: {e}")
            return None
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
    
    def execute_query(self, query, params=None):
        """Execute a query"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            return cursor
        except Exception as e:
            print(f"Query execution error: {e}")
            self.connection.rollback()
            return None
