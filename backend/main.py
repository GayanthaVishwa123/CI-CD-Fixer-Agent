"""FastAPI API for raw and repository CI/CD analysis."""

from __future__ import annotations

import base64
import os
import re
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.agent import LLMProviderError, analyze_configuration
from backend.github_pr import create_github_pr
from backend.models import (
    AnalysisResult,
    PRFixRequest,
    RawAnalysisRequest,
    RepoAnalysisRequest,
    RepoAnalysisResult,
    WorkflowAnalysis,
)

# Root directory (.env) සහ backend/.env දෙකම load කිරීම
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).with_name(".env"), override=True)

app = FastAPI(title="CI/CD Code Analysis & Fixing Agent")

# FRONTEND_ORIGIN array එකක් ලෙස parse කර ගැනීම
origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze/raw", response_model=AnalysisResult)
def analyze_raw(request: RawAnalysisRequest) -> AnalysisResult:
    try:
        return analyze_configuration(request.provider, {"input": request.code})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LLMProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="LLM analysis failed") from exc


def _parse_repo(repo_url: str) -> str:
    value = repo_url.strip().removesuffix(".git").rstrip("/")
    if re.fullmatch(r"[\w.-]+/[\w.-]+", value):
        return value
    match = re.search(r"github\.com/([^/]+/[^/#?]+)", value)
    if not match or not re.fullmatch(r"[\w.-]+/[\w.-]+", match.group(1)):
        raise ValueError("repo_url must be owner/repo or a GitHub repository URL")
    return match.group(1)


def _github_headers(token: str | None) -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    return headers


def _fetch_workflows(repo: str, token: str | None) -> dict[str, str]:
    response = requests.get(
        f"https://api.github.com/repos/{repo}/contents/.github/workflows",
        headers=_github_headers(token),
        timeout=20,
    )
    if response.status_code == 404:
        raise ValueError("repository has no .github/workflows directory")
    response.raise_for_status()
    files: dict[str, str] = {}
    for item in response.json():
        if (
            item.get("type") != "file"
            or Path(item.get("path", "")).suffix.lower() not in {".yml", ".yaml"}
        ):
            continue
        file_response = requests.get(
            item["url"], headers=_github_headers(token), timeout=20
        )
        file_response.raise_for_status()
        content = base64.b64decode(file_response.json()["content"]).decode(
            "utf-8", errors="replace"
        )
        files[item["path"]] = content[:100_000]
    if not files:
        raise ValueError("no workflow files were found")
    return files


@app.post("/api/analyze/repo", response_model=RepoAnalysisResult)
def analyze_repo(request: RepoAnalysisRequest) -> RepoAnalysisResult:
    try:
        repo = _parse_repo(request.repo_url)
        files = _fetch_workflows(repo, request.github_token)
        workflows = [
            WorkflowAnalysis(
                file_path=file_path,
                original_code=content,
                **analyze_configuration(
                    "github_actions", {file_path: content}
                ).model_dump(
                    exclude={"provider", "source_files"}
                ),
            )
            for file_path, content in sorted(files.items())
        ]
        issue_count = sum(len(workflow.issues) for workflow in workflows)
        return RepoAnalysisResult(
            summary=(
                f"Audited {len(workflows)} workflow file(s); "
                f"detected {issue_count} issue(s)."
            ),
            workflows=workflows,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LLMProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502, detail="GitHub API request failed"
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="LLM analysis failed") from exc


@app.post("/api/fix-pr")
def fix_pr(request: PRFixRequest) -> dict[str, str | int]:
    """Create a GitHub pull request for an approved workflow correction."""
    try:
        return create_github_pr(
            _parse_repo(request.repo_name),
            request.file_path,
            request.corrected_yaml,
            request.github_token,
            request.base_branch,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="GitHub PR creation failed") from exc
