from langchain_ollama import OllamaLLM

def translate_to_english(raw_text: str) -> str:
    """
    Simulates the Bhashini API pipeline.
    Translates incoming multilingual text into English for the Agent's brain.
    """
    print(f"[🌐 BHASHINI] Intercepted raw transmission: '{raw_text}'")
    
    # We use our local LLM to handle the actual translation work
    llm = OllamaLLM(model="llama3")
    
    prompt = f"""You are a professional Bhashini translation API. 
    Translate the following text to English. 
    Respond ONLY with the final English translation. Do not include notes, quotes, or conversational text.
    
    Text to translate: "{raw_text}"
    """
    
    translation = llm.invoke(prompt).strip()
    
    # Clean up any accidental quotes the LLM might add
    if translation.startswith('"') and translation.endswith('"'):
        translation = translation[1:-1]
        
    print(f"[🌐 BHASHINI] Translated to English: '{translation}'")
    return translationl