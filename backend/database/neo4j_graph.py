from neo4j import GraphDatabase

# --- CLOUD NEO4J CREDENTIALS (YOUR ORIGINAL WORKING SETUP) ---
URI = "neo4j+ssc://2e1d57cd.databases.neo4j.io"
AUTH = ("2e1d57cd", "a-ogDGfsBER1o5o-gsF_BqiqxHRIew1mD0b54YYAd1s") 

def get_driver():
    """Establishes connection to Neo4j Cloud."""
    return GraphDatabase.driver(URI, auth=AUTH)

def seed_database():
    """Injects the Big Five nations into the global simulation."""
    query = """
    MERGE (usa:Agent {id: 'USA', name: 'United States', faction: 'Western', val: 25})
    MERGE (chn:Agent {id: 'China', name: 'China', faction: 'Eastern', val: 22})
    MERGE (rus:Agent {id: 'Russia', name: 'Russia', faction: 'Eastern', val: 18})
    MERGE (irn:Agent {id: 'Iran', name: 'Iran', faction: 'Middle East', val: 12})
    MERGE (ksa:Agent {id: 'Saudi_Arabia', name: 'Saudi Arabia', faction: 'Middle East', val: 15})

    // Initial Global Tensions & Alliances
    MERGE (usa)-[:RELATION {type: 'trade'}]->(ksa)
    MERGE (usa)-[:RELATION {type: 'conflict'}]->(irn)
    MERGE (usa)-[:RELATION {type: 'trade'}]->(chn)
    MERGE (rus)-[:RELATION {type: 'trade'}]->(irn)
    MERGE (rus)-[:RELATION {type: 'trade'}]->(chn)
    MERGE (irn)-[:RELATION {type: 'conflict'}]->(ksa)
    
    // THIS MAKES SURE EVERYONE IS CONNECTED (The 5x5 Grid)
    WITH usa, chn, rus, irn, ksa
    MATCH (a:Agent), (b:Agent)
    WHERE a.id <> b.id AND NOT (a)-[:RELATION]-(b)
    MERGE (a)-[:RELATION {type: 'neutral'}]->(b)
    """
    try:
        with get_driver().session() as session:
            session.run(query)
            print("[🌐 NEO4J] Global Order synced and seeded.")
    except Exception as e:
        print(f"[❌ NEO4J ERROR] Could not connect: {e}")

def fetch_graph_data():
    """Pulls all nations and diplomatic links for the React Map."""
    nodes_dict = {}
    links = []
    query = "MATCH (n:Agent) OPTIONAL MATCH (n)-[r:RELATION]->(m:Agent) RETURN n, r, m"
    
    with get_driver().session() as session:
        results = session.run(query)
        for record in results:
            n = record["n"]
            if n["id"] not in nodes_dict:
                nodes_dict[n["id"]] = {"id": n["id"], "name": n["name"], "faction": n["faction"], "val": n["val"]}
            r = record["r"]
            m = record["m"]
            if r and m:
                # Decide if the line should be green (safe) or red (bad)
                rel_type = r["type"]
                status = "safe" if rel_type in ["trade", "neutral"] else "bad"
                
                links.append({
                    "source": n["id"], 
                    "target": m["id"], 
                    "type": rel_type,
                    "status": status  # The React frontend reads this!
                })
                
    return {"nodes": list(nodes_dict.values()), "links": links}

def execute_system_failure(target_country_id: str):
    """
    THE INVINCIBLE HAND STRIKES: 
    Drains the country's Influence (val) and turns all 'trade' into 'conflict'.
    """
    query = """
    MATCH (a:Agent {id: $id})
    SET a.val = CASE WHEN a.val > 5 THEN a.val - 5 ELSE 0 END
    WITH a
    OPTIONAL MATCH (a)-[r:RELATION {type: 'trade'}]-(partner)
    SET r.type = 'conflict'
    RETURN a.name, a.val
    """
    try:
        with get_driver().session() as session:
            result = session.run(query, id=target_country_id)
            record = result.single()
            if record:
                print(f"[💥 SABOTAGE] {record[0]} hit by System Failure! Influence dropped to: {record[1]}")
    except Exception as e:
        print(f"[❌ NEO4J ERROR] Sabotage failed: {e}")

def reset_database():
    """Wipes the global board clean and restarts the simulation."""
    try:
        with get_driver().session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        print("[🌐 NEO4J] Board wiped. Initiating global reset...")
        seed_database()
    except Exception as e:
        print(f"[❌ NEO4J ERROR] Failed to reset: {e}")