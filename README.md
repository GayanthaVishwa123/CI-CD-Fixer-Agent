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
- Create approval-gated GitHub pull requests for corrected workflow files.
- Show a success card with the PR number, branch, and GitHub link after creation.

## Project structure

- `frontend/`: Next.js App Router, TypeScript, Tailwind CSS, and Alatsi font
- `backend/`: FastAPI, Pydantic, LLM integrations, PyGithub, MCP tools, and
  actionlint integration
- `backend/test_main.py`: focused tests for repository parsing and GitHub
  workflow retrieval
- `frontend/components/`: analysis findings, code comparison, and pull request
  success UI
- `ISSUES.md`: tracked roadmap for Docker, Azure, authentication, scanners,
  optimization analysis, testing, and streaming

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- An API key for the selected LLM provider
- A GitHub token with permission to read workflows, create branches, update
  repository contents, and create pull requests
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

The GitHub token is entered in the Repo Inspector UI and is sent only for
GitHub API operations. For a fine-grained token, grant access to the target
repository with **Contents: Read and write** and **Pull requests: Read and
write** permissions.

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

`backend/requirements.txt` includes runtime dependencies and the test tools
`pytest`, `pytest-asyncio`, `pytest-mock`, and `httpx`. The file uses minimum
version constraints and supports Python 3.10 or newer.

The backend exposes:

- `GET /health`: health check
- `POST /api/analyze/raw`: analyze pasted configuration
- `POST /api/analyze/repo`: fetch and analyze each GitHub workflow
- `POST /api/fix-pr`: create an approval-gated GitHub branch, commit one
  corrected workflow, and open a pull request

Repository analysis returns `status: "AWAITING_USER_CONFIRMATION"` and never
writes files. The dashboard displays each dynamically discovered workflow's
findings and corrected YAML. If `.github/workflows/` has no `.yml` or `.yaml`
files, analysis stops with an explicit error.

After approval, `/api/fix-pr` accepts one exact workflow path and corrected YAML:

```json
{
  "repo_name": "owner/repository",
  "file_path": ".github/workflows/actual-workflow.yml",
  "corrected_yaml": "name: CI\n...",
  "github_token": "github-token",
  "base_branch": "main"
}
```

The backend revalidates that the workflow exists, creates a unique branch named
`fix/cicd-security-<timestamp>-<unique-id>`, updates the workflow through
PyGithub, and opens a pull request against `main` by default. It never writes
local files or invents workflow names.

On success, the API returns:

```json
{
  "status": "success",
  "pr_url": "https://github.com/owner/repository/pull/123",
  "pr_number": 123,
  "branch": "fix/cicd-security-20261025170000-a1b2c3d4",
  "base_branch": "main",
  "file_path": ".github/workflows/actual-workflow.yml"
}
```

## Run the MCP server

The MCP server uses stdio and exposes `analyze_raw_cicd_config`,
`analyze_github_repo`, and `create_github_pr` for MCP clients such as VS Code.

```bash
cd /path/to/cicd-fixer-agent
.venv/bin/python -m backend.mcp_server
```

Configure the client to launch the command from the repository root. The
server reads `backend/.env` for the selected LLM API key. The
`create_github_pr` tool accepts `repo_name`, `file_path`, `corrected_yaml`,
`github_token`, and optional `base_branch` arguments.

## Run the frontend

In another terminal:

```bash
cd /path/to/cicd-fixer-agent/frontend
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev
```

Open <http://localhost:3000>.

In the **Repo Inspector** tab, enter a GitHub repository as either `owner/repo`
or a full GitHub URL, then enter a token before creating a PR. Select
**Approve & Create Pull Request** for the exact workflow file you want to
remediate. The dashboard then hides the approval form and displays
**SuccessCard** with a link to the generated pull request. Use **Audit Another
Repo** to reset the dashboard.

## Run tests

Run the focused backend tests from the repository root:

```bash
.venv/bin/pytest -q backend/test_main.py
```

The tests do not call GitHub or an LLM. GitHub HTTP responses are mocked, and
the suite covers repository URL validation, malformed workflow responses,
Base64 content containing line breaks, and filtering of non-workflow files.

To validate the frontend:

```bash
cd frontend
npm run lint
npm run build
```

The frontend lint currently reports a warning about loading Google Fonts from
`app/layout.tsx`; it does not fail the lint command.

## Current implementation status

The current application provides raw configuration analysis, repository
workflow analysis, deterministic `actionlint` integration, and
approval-gated GitHub pull request creation. The broader architecture roadmap
is tracked in [ISSUES.md](ISSUES.md). Docker orchestration, Azure Terraform
deployment, GitHub App authentication, multi-CI scanners, cost optimization
findings, and SSE streaming should be treated as planned work until their
corresponding implementation is merged.

## Security

Never commit `backend/.env`, API keys, or GitHub tokens. Workflow content is
treated as untrusted input and is not allowed to override the analysis
instructions. The agent uses only paths returned by dynamic discovery and
never creates or overwrites local workflow files during remediation.
