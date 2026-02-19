"""
AI Layer 1: Repository Analyzer
Detects language, test framework, Docker, CI config, project root.
Falls back to filesystem heuristics if AI key is absent or call fails.
"""

import os
import json
import logging
from typing import Dict

from config import settings
from services.ai_client import call_ai

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"python", "javascript", "java_gradle", "java_maven"}


class RepoAgent:
    def __init__(self):
        pass

    def analyze(self, repo_path: str) -> Dict:
        """
        Returns a stack info dict. Tries AI first, falls back to filesystem scan.
        """
        # --- Filesystem scan (always runs to collect raw data) ---
        info = self._filesystem_scan(repo_path)

        # --- AI enhancement (optional) ---
        key = settings.AI_REPO_KEY
        if key:
            ai_result = self._ai_analyze(info, repo_path, key)
            if ai_result:
                info.update(ai_result)

        logger.info(f"RepoAgent: Analysis Result -> {info}")
        return info

    # ── Filesystem Scan ──────────────────────────────────────────────────────

    def _filesystem_scan(self, repo_path: str) -> Dict:
        info = {
            "language": "unknown",
            "test_framework": "unknown",
            "project_root": ".",
            "has_docker": False,
            "docker_image": "node:18-slim",
            "test_command": "sh -c 'echo No test framework detected && exit 1'",
            "ci_config": None,
            "total_files": 0,
        }

        for root, dirs, files in os.walk(repo_path):
            # Skip non-project dirs
            for skip in (".git", "node_modules", "__pycache__", ".venv", "venv"):
                if skip in dirs:
                    dirs.remove(skip)
            info["total_files"] += len(files)

            for file in files:
                f_lower = file.lower()
                rel_root = os.path.relpath(root, repo_path)

                # Language detection (priority: gradle > maven > python > js/package.json > java > js/extension)
                if f_lower == "build.gradle" or f_lower == "build.gradle.kts":
                    info["language"] = "java_gradle"
                    info["project_root"] = rel_root
                    info["docker_image"] = "gradle:7.6-jdk17"
                    info["test_command"] = "sh -c 'chmod +x gradlew && ./gradlew test'"
                    info["test_framework"] = "junit"

                elif f_lower == "pom.xml" and info["language"] not in ("java_gradle",):
                    info["language"] = "java_maven"
                    info["project_root"] = rel_root
                    info["docker_image"] = "maven:3.9-eclipse-temurin-17"
                    info["test_command"] = "mvn test -q"
                    info["test_framework"] = "junit"

                elif f_lower in ("requirements.txt", "setup.py", "pyproject.toml") \
                        and info["language"] == "unknown":
                    info["language"] = "python"
                    info["project_root"] = rel_root
                    info["docker_image"] = "python:3.9-slim"
                    info["test_command"] = "sh -c 'pip install -r requirements.txt -q && pip install pytest -q && pytest -v --tb=long --rootdir=/app'"

                elif f_lower == "package.json" \
                        and info["language"] not in ("java_gradle", "java_maven", "python"):
                    info["language"] = "javascript"
                    info["project_root"] = rel_root
                    info["docker_image"] = "node:18-slim"
                    info["test_command"] = "sh -c 'npm ci --silent && npm test'"

                # Java detection by extension (when no build file found)
                elif f_lower.endswith(".java") and info["language"] == "unknown":
                    info["language"] = "java_gradle"
                    info["project_root"] = rel_root
                    info["docker_image"] = "gradle:7.6-jdk17"
                    info["test_command"] = "sh -c 'chmod +x gradlew && ./gradlew test'"
                    info["test_framework"] = "junit"

                # JS/TS detection by extension (when no package.json found)
                elif f_lower.endswith((".js", ".jsx", ".ts", ".tsx")) \
                        and info["language"] == "unknown":
                    info["language"] = "javascript"
                    info["project_root"] = rel_root
                    info["docker_image"] = "node:18-slim"
                    # No package.json — just syntax-check all JS files
                    info["test_command"] = "sh -c 'find . -name \"*.js\" -o -name \"*.jsx\" | xargs -I{} node --check {} 2>&1'"

                # Test framework refinement
                if f_lower.startswith("test_") or f_lower.endswith("_test.py"):
                    info["test_framework"] = "pytest"
                if f_lower.endswith((".test.js", ".spec.js", ".test.ts", ".spec.ts")):
                    info["test_framework"] = "jest"

                # Docker
                if f_lower == "dockerfile":
                    info["has_docker"] = True

        # CI config
        if os.path.exists(os.path.join(repo_path, ".github", "workflows")):
            info["ci_config"] = "github-actions"

        return info

    # ── AI Layer ─────────────────────────────────────────────────────────────

    def _ai_analyze(self, fs_info: Dict, repo_path: str, api_key: str) -> Dict | None:
        prompt = (
            f"You are a CI/CD repository analyzer. Given this filesystem analysis:\n"
            f"{json.dumps(fs_info, indent=2)}\n\n"
            f"Return ONLY a JSON object with keys: language, test_framework, "
            f"docker_image, test_command. Use only known, safe values."
        )
        raw = call_ai(api_key, prompt)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("RepoAgent: AI returned non-JSON, using filesystem result.")
            return None
