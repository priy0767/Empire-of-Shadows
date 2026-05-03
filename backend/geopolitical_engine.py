import os
import time
import sqlite3
from groq import Groq
from dotenv import load_dotenv

# ==========================================
# 1. SETUP & INITIALIZATION
# ==========================================

# Load environment variables
load_dotenv()

# Initialize Groq Client safely
# Using the key name we defined in the .env file
client = Groq(api_key=os.getenv("GROQ_API_KEY_MAIN")) 

def init_db():
    """Initializes the local SQLite database to store intel reports."""
    print("[💾 SQLITE] Initializing Cooldown Ledger...")
    conn = sqlite3.connect('empire_ledger.db')
    cursor = conn.cursor()
    
    # Create a table to store the agent chat logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS intel_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            sender TEXT,
            target TEXT,
            content TEXT
        )
    ''')
    conn.commit()
    return conn

# ==========================================
# 2. THE UNBREAKABLE API FUNCTION
# ==========================================

def safe_agent_chatter(messages, model="llama-3.1-8b-instant", max_retries=3):
    """
    Safely sends a message to Groq. Prevents 'Too Many Requests' 
    errors and retries if they happen, keeping the simulation alive.
    """
    for attempt in range(max_retries):
        try:
            # 1. Attempt the API call
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            
            # 2. MANDATORY DELAY: 2.1 seconds prevents exceeding 30 RPM
            time.sleep(2.1) 
            
            # Return the generated text
            return response.choices[0].message.content

        except Exception as e:
            error_msg = str(e)
            
            # 3. Catch Rate Limit (429) and wait
            if "429" in error_msg or "Too Many Requests" in error_msg:
                wait_time = 5 * (attempt + 1) 
                print(f"[⏳ ENGINE PAUSED] Rate limit hit. Cooling down for {wait_time}s...")
                time.sleep(wait_time)
            else:
                # Catch any other weird errors (like internet dropping)
                print(f"[❌ SYSTEM ERROR] {error_msg}")
                break 
    
    return "Error: Agent unreachable."

# ==========================================
# 3. DISPATCHER / MAIN ENGINE
# ==========================================

def main():
    # Start the local database
    db_conn = init_db()
    cursor = db_conn.cursor()
    
    print("[🚀 SERVER] Geopolitical Engine Online.")
    print("INFO:     Application startup complete.\n")

    # Agent System Prompts
    usa_system = "You are the central intelligence AI for the USA. Write a brief, highly classified strategic assessment."
    iran_system = "You are the central intelligence AI for Iran. Write a brief, highly classified strategic assessment."

    # Queue of actions
    actions_queue = [
        {
            "sender": "USA",
            "target": "Saudi_Arabia",
            "context": "trade",
            "messages": [
                {"role": "system", "content": usa_system},
                {"role": "user", "content": "Generate a strategic assessment regarding Saudi Arabia focusing on energy and trade."}
            ]
        },
        {
            "sender": "Iran",
            "target": "Saudi_Arabia",
            "context": "conflict",
            "messages": [
                {"role": "system", "content": iran_system},
                {"role": "user", "content": "Generate a strategic assessment regarding Saudi Arabia focusing on regional proxies and cyber warfare."}
            ]
        }
    ]

    # Run the simulation loop
    for action in actions_queue:
        sender = action["sender"]
        target = action["target"]
        
        print(f"--- 🤖 AUTONOMOUS CHATTER: {sender} -> {target} ({action['context']}) ---")
        print(f"[⚡ ROUTING] Sending prompt to {sender} Agent...")
        
        # Safely trigger the agent
        intel_report = safe_agent_chatter(action["messages"])
        
        # Print the result to the console
        print(f"\n[{sender} - SECRET INTEL]:\n{intel_report}\n")
        
        # Save the result to the local SQLite database
        cursor.execute("INSERT INTO intel_logs (sender, target, content) VALUES (?, ?, ?)", 
                       (sender, target, intel_report))
        db_conn.commit()
        
        print("INFO:     Log successfully saved to local SQLite database.\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()