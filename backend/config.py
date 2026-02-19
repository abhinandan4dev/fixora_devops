import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AI Layer Keys (optional — falls back to deterministic mode if not set)
    AI_REPO_KEY: str = ""
    AI_ERROR_KEY: str = ""
    AI_FIX_KEY: str = ""
    AI_VERIFY_KEY: str = ""

    # GitHub
    GITHUB_TOKEN: str = ""

    # App
    app_name: str = "FiXora"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")


settings = Settings()
