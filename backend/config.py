import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    app_name: str = "FiXora"
    
    class Config:
        env_file = ".env"

settings = Settings()
