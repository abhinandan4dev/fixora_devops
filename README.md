# ⚡ FiXora: Autonomous CI/CD Healing Agent

FiXora is a production-grade, multi-agent AI pipeline designed to autonomously detect, analyze, and repair broken code in CI/CD environments. It doesn't just find bugs—it understands the project stack, parses terminal logs, and executes surgical code repairs using the Gemini Pro API.

![FiXora Header](https://raw.githubusercontent.com/AnishPratapsingh/healer/main/docs/assets/banner_placeholder.png)

## 🚀 Key Features

- **Multi-Agent Orchestration**: Four specialized AI layers (Repo, Error, Fix, and Verify) working in concert.
- **Micro-Surgical Repairs**: Direct code modification with logic error identification and automated recovery.
- **Dynamic Configuration**: Hot-reloadable API keys and environment settings without server restarts.
- **Glassmorphism Dashboard**: A premium Material 3 interface with real-time telemetry and a "Fix Ledger."
- **Safety & Integrity**: Strict diff limits and PS3 formatting compliance ensure code reliability.
- **Rate-Limit Optimized**: Merged AI calls and iteration cooldowns to maximize Gemini Free Tier utility.

## 🛠️ Architecture

FiXora operates in a 4-layer iterative loop:

1.  **RepoAgent (Analysis)**: Scans the filesystem to detect language (Python, JS, Java), test frameworks, and Docker configurations.
2.  **ErrorAgent (Parsing)**: Analyzes test logs using AI or deterministic regex to extract structured error data (file, line, type).
3.  **FixAgent (Repair)**: Rewrites code directly in the target branch or provides detailed fallback documentation if quota is hit.
4.  **VerifyAgent (Judgment)**: Contextually decides whether to continue the repair loop or finalize based on success/exhaustion.

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker (for isolated test execution)
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/abhinandan4dev/fixora_devops.git
cd healer
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
GITHUB_TOKEN=your_github_classic_token
GEMINI_API_KEY=your_shared_gemini_key

# Optional: Specific keys for each agent to bypass rate limits
# AI_REPO_KEY=...
# AI_ERROR_KEY=...
# AI_FIX_KEY=...
# AI_VERIFY_KEY=...
```

### 3. Launch the Engine
```bash
# Install dependencies and start both Frontend & Backend
npm run dev
```

## 📊 Dashboard Usage

1.  **Launch Sequence**: Enter your GitHub repo URL, Team Name, and Commander (Leader) name.
2.  **Telemetry Stream**: Watch real-time logs as the agent clones, analyzes, and tests your code.
3.  **Fix Ledger**: Review surgical repairs applied by the AI. Clear distinction between `AI REPAIRED` and `ANNOTATED`.
4.  **Execution Report**: Download the full JSON report (PS3 format) once the sequence completes.

## 🛡️ Technical Specs

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion.
- **Backend**: FastAPI + Python Git + Docker SDK + Pydantic.
- **AI Model**: Google Gemini 2.0 Flash (Optimized with Tag-Based XML responses).
- **Communication**: Shared Event Hub for real-time status polling.

---

*Designed for high-integrity autonomous operations. Built by Antigravity AI.*
