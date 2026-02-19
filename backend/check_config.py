from config import settings
import sys
import os

print(f"Current Working Directory: {os.getcwd()}")
print(f"AI_REPO_KEY: {settings.AI_REPO_KEY[:10]}...")
print(f"AI_ERROR_KEY: {settings.AI_ERROR_KEY[:10]}...")
print(f"AI_FIX_KEY: {settings.AI_FIX_KEY[:10]}...")
print(f"AI_VERIFY_KEY: {settings.AI_VERIFY_KEY[:10]}...")
print(f"GITHUB_TOKEN: {settings.GITHUB_TOKEN[:10]}...")
