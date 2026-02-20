<div align="center">
  <img src="frontend/public/logo.jpeg" alt="Fixora Logo" width="180" />

  # ⚡ Fixora: Autonomous CI/CD Healing Engine
  **A Multi-Agent System for Self-Repairing Deployment Pipelines**

  <p>
    <a href="https://fixora.vercel.app"><img src="https://img.shields.io/badge/Live-Dashboard-6366F1?style=for-the-badge&logo=vercel" alt="Vercel Deployment" /></a>
    <a href="https://github.com/abhinandan4dev/fixora_devops"><img src="https://img.shields.io/badge/Engine-Railway-black?style=for-the-badge&logo=railway" alt="Railway Deployment" /></a>
  </p>
</div>

---

## 🔬 Abstract

In modern DevOps ecosystems, CI/CD pipelines frequently fail due to syntax errors, broken dependencies, or logic regressions. **Fixora** introduces an autonomous, multi-agent remediation engine designed to intercept pipeline failures, deeply analyze test telemetry, autonomously patch source code, and dynamically push verified fixes directly to the origin repository. By combining abstract syntax tree (AST) heuristics with Large Language Models (LLMs), Fixora achieves zero-human-intervention code repair.

---

## 🏛️ System Architecture

Fixora utilizes a distributed microservices architecture consisting of a high-performance React frontend and an iterative Python backend engine. 

### Architecture Flowchart

```mermaid
graph TD
    A[User Triggers Telemetry via Dashboard] -->|API Request| B(FastAPI Backend)
    B --> C{Iteration Controller}
    
    subgraph Autonomous Loop [The Repair Loop]
        C -->|Clone| D[GitService]
        D --> E((Layer 1: RepoAgent))
        E -->|Scan Stack| F[Hybrid Docker/Local Executor]
        F -->|Capture Logs| G((Layer 2: ErrorAgent))
        G -->|Extract Stacktrace| H((Layer 3: FixAgent))
        H -->|Apply AST Patch| I[Commit to FS]
        I -->|Re-Run| F
        F -->|Check Pass/Fail| J((Layer 4: VerifyAgent))
    end
    
    J -->|Verified| K[GitService: Push to Github]
    K --> L[WebSocket/Polling Status Update]
    L --> A
```

---

## 🧠 The Multi-Agent Neural Engine

Fixora delegates distinct cognitive tasks to specialized sub-agents to bypass token limits and prevent context degradation.

### 1. `RepoAgent` (Contextual Initialization)
* **Function**: Scans the repository filesystem using strict heuristics (e.g., detecting `pom.xml`, `package.json`, `reqs.txt`) to determine the exact build toolchain and testing framework.
* **Fallback Mechanics**: If LLM endpoints fail, defaults to hardcore structural analysis.

### 2. `DockerExecutor` & Hybrid Fallback Engine
* **The Problem**: Traditional PaaS environments (like Railway/Heroku) restrict Docker-in-Docker execution, making test orchestration impossible.
* **The Fixora Solution**: Implements a highly resilient `Hybrid Executor`. It natively tests for the Docker daemon; if unavailable, the engine gracefully transitions into a sandboxed `Local Subprocess` executor, automatically resolving absolute vs. relative volume paths to perfectly target the local cloned repository.

### 3. `ErrorAgent` (Telemetry Extraction)
* **Function**: Ingests massive CI/CD crash logs (`pytest`, `npm test`) and isolates the failing assertions using strict regex and JSON coercion. It strips ANSI encodings and isolates the exact file and line number.

### 4. `FixAgent` (The Core Editor)
* **Function**: Employs Google Gemini 2.0 Flash to analyze the isolated error against the true source code file. Uses strict boundary boxes and XML-style parsing to prevent hallucinated artifacts.
* **Diff Safety Limits**: Automatically rejects catastrophic rewrites (limits modifications to >30% line diffs), ensuring destructive interference is blocked before committing.

### 5. `VerifyAgent` (Loop Arbitrator)
* **Function**: Analyzes iteration drift. Detects if the pipeline is caught in an infinite patching loop (e.g., oscillating between two states) and violently breaks the iteration chain if limits are breached.

---

## 🛡️ Key DevOps Innovations

### 1. Zero-Friction Git Identity Simulation
Cloud containers have no persistent local state for GitHub authentication. Fixora dynamically constructs a virtual git identity (`bot@fixora.ai`) during runtime via `repo.config_writer()`. It intercepts the `Push` layer by injecting a remote-authorized URL `https://{GITHUB_TOKEN}@github.com...` perfectly bypassing SSH and 2FA constraints organically.

### 2. CORS-Immune Split Deployment
Fixora is built for edge networks. The **Frontend** lives on Vercel's global CDN while the **Engine** heavily computes on Railway. We bypassed deep browser Pre-Flight limitations by injecting pure HTTP `OPTIONS` catchers into the FastAPI matrix, resolving the notorious `502 Bad Gateway` and `Method Not Allowed` failures seen in fractured architectures.

### 3. Rate-Limit Hardening (The "429 Protocol")
When communicating with Google API gateways:
* Implements dynamic API Key pooling (`GEMINI_API_KEY`, `AI_REPO_KEY`, etc.).
* Enforces `1.5s` cooldown locks between sub-agent invocations.
* Fails gracefully to inline code annotations `"annotated"` if the API goes offline, ensuring the user gets a documented bug trace even if the AI cannot write code.

---

## 🚀 Deployment Specifications

* **Frontend Engine**: Vite + React 19 + Framer Motion + TailwindCSS (v4.0 Alpha)
* **Backend Runtime**: Python 3.12 (Upgraded to handle explicit Union Sub-Typing `str | None` required by modern agents).
* **REST Framework**: FastAPI + Uvicorn Async Workers

### Running Locally
```bash
# Terminal 1 - The AI Engine
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 2 - The UI
cd frontend
npm install
npm run dev
```

---

<p align="center">
  <b>Fixora</b> — Built for developers who sleep, while their pipelines heal themselves.
</p>
