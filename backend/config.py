import os
from dotenv import load_dotenv

# Load .env from root or backend
load_dotenv(".env")
load_dotenv("backend/.env")
load_dotenv("../.env")

def get_ai_key(key_name: str) -> str:
    """
    Dynamically fetches the API key from environment variables.
    Falls back to GEMINI_API_KEY if the specific key is missing.
    """
    val = os.getenv(key_name)
    if not val:
        val = os.getenv("GEMINI_API_KEY")
    return val or ""

def get_github_token() -> str:
    return os.getenv("GITHUB_TOKEN") or ""

class Settings:
    @property
    def AI_REPO_KEY(self): return get_ai_key("AI_REPO_KEY")
    @property
    def AI_ERROR_KEY(self): return get_ai_key("AI_ERROR_KEY")
    @property
    def AI_FIX_KEY(self): return get_ai_key("AI_FIX_KEY")
    @property
    def AI_VERIFY_KEY(self): return get_ai_key("AI_VERIFY_KEY")
    @property
    def GITHUB_TOKEN(self): return get_ai_key("GITHUB_TOKEN")
    
    app_name: str = "FiXora"

settings = Settings()
