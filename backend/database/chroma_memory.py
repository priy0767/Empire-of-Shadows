import chromadb
import os
import hashlib

# 1. Point ChromaDB to save data directly into your local database folder
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_storage")
os.makedirs(DB_DIR, exist_ok=True)

# 2. Initialize the persistent local client
client = chromadb.PersistentClient(path=DB_DIR)

# 3. Create a 'collection' (like a table) just for agent memories
collection = client.get_or_create_collection(name="agent_memories")

def save_memory(agent_id: str, memory_text: str):
    """Converts text into vectors and saves it permanently."""
    # Create a unique ID for this specific memory
    doc_id = f"{agent_id}_{hashlib.md5(memory_text.encode()).hexdigest()}"
    
    collection.add(
        documents=[memory_text],
        metadatas=[{"agent_id": agent_id}],
        ids=[doc_id]
    )
    print(f"[💾 MEMORY SAVED] {agent_id} has permanently recorded this event.")

def search_memory(agent_id: str, query_text: str) -> str:
    """Searches past vectors for meaning related to the new query."""
    results = collection.query(
        query_texts=[query_text],
        n_results=2, # Retrieve the top 2 most relevant past memories
        where={"agent_id": agent_id} # Ensure Thorne doesn't read Ivanov's memory
    )
    
    # If memories exist, bundle them together
    if results['documents'] and results['documents'][0]:
        retrieved_memories = results['documents'][0]
        formatted_memory = " | Past Events: ".join(retrieved_memories)
        print(f"[🔍 MEMORY RECALLED] Found relevant past context for {agent_id}.")
        return f"Past Events: {formatted_memory}"
    
    return "No relevant past memories."