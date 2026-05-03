import chromadb
from typing import TypedDict
from langgraph.graph import StateGraph, END
import hashlib

# 🛑 SWAPPED: Import Groq instead of Ollama
from langchain_groq import ChatGroq

chroma_client = chromadb.PersistentClient(path="./database/chroma_db")

class AgentState(TypedDict):
    agent_id: str
    incoming_message: str
    memory_context: str
    reflection: str
    final_action: str

def perceive(state: AgentState):
    agent = state["agent_id"]
    message = state["incoming_message"]
    print(f"[🧠 {agent} - PERCEIVE] Searching local vector memory for context...")
    
    collection = chroma_client.get_or_create_collection(name=agent.lower())
    results = collection.query(query_texts=[message], n_results=1)
    
    memory_context = "No relevant past memories."
    if results['documents'] and results['documents'][0]:
        memory_context = results['documents'][0][0]
        print(f"[🔍 MEMORY RECALLED] Found relevant past context for {agent}.")
        
    return {"memory_context": memory_context}

def reflect(state: AgentState):
    agent = state["agent_id"]
    print(f"[🤔 {agent} - REFLECT] Consulting the cloud LLM...")
    
    # 🛑 SWAPPED: Using Groq
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    
    prompt = f"""You are {agent}, a powerful leader in a cyberpunk city.
    You just received this message: "{state['incoming_message']}"
    Your past memory regarding this: "{state['memory_context']}"
    
    Based on your paranoia and goals, write a 1-sentence internal monologue reacting to this message.
    RULE: Use very simple, basic, everyday English. Do not use advanced vocabulary, poetic words, or big words. Keep it easy to understand, like a normal angry or nervous person speaking.
    """
    
    # Extracted .content from Groq's response object
    reflection = llm.invoke(prompt).content.strip()
    
    if reflection.startswith('"') and reflection.endswith('"'):
        reflection = reflection[1:-1]
        
    print(f"   -> Inner Monologue: {reflection}")
    return {"reflection": reflection}

def act(state: AgentState):
    agent = state["agent_id"]
    print(f"[⚙️ {agent} - ACT] Formulating final action...")
    
    # 🛑 SWAPPED: Using Groq
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    
    prompt = f"""You are {agent}.
    You received: "{state['incoming_message']}"
    Your thought: "{state['reflection']}"
    
    What is your next physical action? Write exactly 1 short sentence describing what you do next.
    RULE: Use very simple, everyday English.
    """
    
    # Extracted .content
    action = llm.invoke(prompt).content.strip()
    
    collection = chroma_client.get_or_create_collection(name=agent.lower())
    mem_id = hashlib.md5(state['incoming_message'].encode()).hexdigest()
    
    collection.add(
        documents=[f"Message: {state['incoming_message']} | Thought: {state['reflection']} | Action: {action}"],
        ids=[f"mem_{mem_id}"]
    )
    
    print(f"   -> Action Taken: {action}")
    print(f"[💾 MEMORY SAVED] {agent} has permanently recorded this event.")
    return {"final_action": action}

# --- BUILD THE LANGGRAPH BRAIN ---
workflow = StateGraph(AgentState)

workflow.add_node("perceive", perceive)
workflow.add_node("reflect", reflect)
workflow.add_node("act", act)

workflow.set_entry_point("perceive")
workflow.add_edge("perceive", "reflect")
workflow.add_edge("reflect", "act")
workflow.add_edge("act", END)

agent_app = workflow.compile()