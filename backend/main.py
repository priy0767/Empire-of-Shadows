import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- LANGCHAIN IMPORTS ---
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Import our geopolitical database logic
from database.neo4j_graph import fetch_graph_data, execute_system_failure, reset_database
from database.cooldowns import init_cooldown_db, check_and_apply_cooldown

# 1. LOAD ENVIRONMENT VARIABLES
load_dotenv()

# 2. CONFIGURE API KEYS (Pulled from .env)
# Using a list comprehension to filter out None values in case a key isn't set
API_KEYS = [
    os.getenv("GEMINI_API_KEY_PATEL"),
    os.getenv("GROK_API_KEY_PATEL"),
    os.getenv("GEMINI_API_KEY_RICHA"),
    os.getenv("GROQ_API_KEY_JAI"),
    os.getenv("XAI_API_KEY_RICHA")
]
API_KEYS = [key for key in API_KEYS if key] # Only keep keys that exist

def get_next_api_key():
    """Selects a random API key to distribute the AI load."""
    if not API_KEYS:
        return None
    return random.choice(API_KEYS)

def call_llm_with_langchain(api_key: str, system_prompt: str, user_prompt: str) -> str:
    """Uses LangChain to route the prompt to the correct AI provider."""
    if not api_key:
        return "No active neural link found. The agent remains silent."

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    try:
        # Groq/Llama routing
        if api_key.startswith("gsk_"):
            llm = ChatGroq(api_key=api_key, model_name="llama-3.1-8b-instant")
        # xAI routing
        elif api_key.startswith("xai-"):
            llm = ChatOpenAI(api_key=api_key, base_url="https://api.x.ai/v1", model="grok-4.3")
        # Google Gemini routing
        elif api_key.startswith("AIza"):
            llm = ChatGoogleGenerativeAI(google_api_key=api_key, model="gemini-flash-latest")
        else:
            return "Error: Unknown API Key format."
            
        response = llm.invoke(messages)
        
        if isinstance(response.content, list):
            return response.content[0].get('text', str(response.content))
        return response.content
        
    except Exception as e:
        print(f"[❌ LANGCHAIN ERROR] Failed to connect: {e}")
        return "The transmission was intercepted. The agent remains silent."

# --- APP SETUP ---
app = FastAPI(title="Empire of Shadows - Global War Room")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Runs once when you start the server."""
    print("[💾 SQLITE] Initializing Cooldown Ledger...")
    init_cooldown_db()
    print("[🚀 SERVER] Geopolitical Engine Online.")


# --- API ENDPOINTS ---

@app.get("/api/graph")
def get_graph():
    """React calls this to draw the 2D Tactical Map."""
    return fetch_graph_data()

class SabotageRequest(BaseModel):
    country_id: str

@app.post("/ops/sabotage")
def execute_sabotage(req: SabotageRequest):
    """Triggered by the 'System Failure' button in the React UI."""
    country = req.country_id
    
    # 1. Check SQLite Cooldowns
    is_allowed, seconds_left = check_and_apply_cooldown(country)
    if not is_allowed:
        print(f"[⏳ BLOCKED] Cannot attack {country} yet. Cooldown: {seconds_left}s")
        raise HTTPException(
            status_code=429, 
            detail=f"Global scrutiny is too high. {country} is locked for {seconds_left} seconds."
        )
    
    # 2. Execute the attack on Neo4j
    execute_system_failure(country)
    return {"status": "success", "message": f"Operation successful. {country} infrastructure compromised."}

class WhisperRequest(BaseModel):
    source_country: str
    target_country: str
    message: str

@app.post("/ops/whisper")
def trigger_whisper(req: WhisperRequest):
    """Triggered to send back-channel intelligence."""
    active_key = get_next_api_key()
    print(f"\n[🗣️ SIGNAL LEAK] {req.source_country} whispers to {req.target_country}...")
    
    system_prompt = f"""
    You are the central intelligence AI for {req.target_country}.
    You just received a back-channel whisper from {req.source_country}.
    Respond with a brief, paranoid, and strategic inner monologue (max 3 sentences) about how you will react to this intelligence. Do not break character.
    """
    user_prompt = f"The whisper from {req.source_country} says: '{req.message}'"
    
    simulated_reaction = call_llm_with_langchain(active_key, system_prompt, user_prompt)
    return {"status": "success", "action_taken": simulated_reaction}

@app.post("/ops/auto")
def execute_auto_chatter():
    """Simulates random geopolitical chatter and tension between nations."""
    graph = fetch_graph_data()
    links = graph["links"]
    if not links:
        return {"status": "skipped", "message": "No active diplomatic links found."}
        
    random_link = random.choice(links)
    source = random_link["source"]
    target = random_link["target"]
    rel_type = random_link["type"]
    
    active_key = get_next_api_key()
    
    system_prompt = f"""
    You are the central intelligence AI for {source}. 
    You currently have a '{rel_type}' relationship with {target}.
    Generate a very brief, highly realistic geopolitical inner monologue (1-2 sentences). 
    What are you secretly planning regarding {target}? Do not break character.
    """
    user_prompt = "Generate your current strategic assessment."
    
    simulated_thought = call_llm_with_langchain(active_key, system_prompt, user_prompt)
    
    return {
        "status": "success",
        "source": source,
        "target": target,
        "type": rel_type,
        "action_taken": simulated_thought
    }

@app.post("/ops/reset")
def trigger_global_reset():
    """Wipes the Neo4j database and re-seeds it to the starting state."""
    try:
        reset_database()
        return {"status": "success", "message": "Global timeline reset. Board wiped."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))