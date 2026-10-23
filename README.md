# CI/CD Code Analysis & Fixing Agent

Full-stack AI tooling for finding and fixing issues in CI/CD configuration
before they break a pipeline. The application combines deterministic
`actionlint` checks for GitHub Actions workflows with an LLM analysis.

## Features

- Paste and analyze GitHub Actions, GitLab CI, or Jenkins configuration.
- Search a GitHub repository by URL or `owner/repo`.
- Fetch and analyze every file in `.github/workflows`.
- Report syntax errors, security risks, deprecated actions, unsafe shell usage,
  permissions issues, and performance concerns.
- Compare the original configuration with the suggested corrected version.
- Use Gemini, Groq, OpenAI, or Anthropic as the analysis provider.

## Project structure

- `frontend/`: Next.js App Router, TypeScript, Tailwind CSS, and Alatsi font
- `backend/`: FastAPI, Pydantic, LLM integrations, GitHub REST API, and
  actionlint integration

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- An API key for the selected LLM provider
- `actionlint` on `PATH` for deterministic GitHub Actions checks (optional;
  analysis continues without it)

## Configuration

Create `backend/.env` and set the provider and matching API key:

```dotenv
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key
LLM_MODEL=gemini-3.5-flash-lite
FRONTEND_ORIGIN=http://localhost:3000
```

Use one of the following API key variables when changing `LLM_PROVIDER`:

- `GEMINI_API_KEY` for `gemini`
- `GROQ_API_KEY` for `groq`
- `OPENAI_API_KEY` for `openai`
- `ANTHROPIC_API_KEY` for `anthropic`

Install actionlint using the instructions in its
[official repository](https://github.com/rhysd/actionlint), then verify it:

```bash
actionlint -version
```

## Run the backend

```bash
cd /path/to/cicd-fixer-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

The backend exposes:

- `GET /health`: health check
- `POST /api/analyze/raw`: analyze pasted configuration
- `POST /api/analyze/repo`: fetch and analyze GitHub workflows

## Run the frontend

In another terminal:

```bash
cd /path/to/cicd-fixer-agent/frontend
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev
```

Open <http://localhost:3000>.

In the **Repo Inspector** tab, enter a public GitHub repository as either
`owner/repo` or a full GitHub URL. A GitHub token is optional for public
repositories and is used only for GitHub API requests.

## Security

Never commit `backend/.env`, API keys, or GitHub tokens. Workflow content is
treated as untrusted input and is not allowed to override the analysis
instructions.
