import sqlite3
from datetime import datetime, timedelta
import os

DB_PATH = "local_ledger.db"

def init_cooldown_db():
    """Sets up the local SQLite ledger to track Sabotage cooldowns."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cooldowns (
            country_id TEXT PRIMARY KEY,
            last_hit TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def check_and_apply_cooldown(country_id: str) -> tuple[bool, int]:
    """
    Checks if a country can be sabotaged. 
    Returns (is_allowed, seconds_remaining).
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT last_hit FROM cooldowns WHERE country_id = ?", (country_id,))
    row = cursor.fetchone()
    
    now = datetime.now()
    cooldown_seconds = 60 # 1 minute cooldown per country
    
    if row:
        last_hit = datetime.fromisoformat(row[0])
        time_passed = (now - last_hit).total_seconds()
        
        if time_passed < cooldown_seconds:
            conn.close()
            return False, int(cooldown_seconds - time_passed)
            
    # If allowed, update the timestamp to NOW
    cursor.execute("""
        INSERT INTO cooldowns (country_id, last_hit) 
        VALUES (?, ?) 
        ON CONFLICT(country_id) DO UPDATE SET last_hit=excluded.last_hit
    """, (country_id, now.isoformat()))
    
    conn.commit()
    conn.close()
    return True, 0