"""MCP tools for auditing CI/CD workflow configurations."""

from __future__ import annotations

import os
from typing import Any

from mcp.server.mcpserver import MCPServer

from backend.agent import (
    LLMProviderError,
    analyze_configuration,
)
from backend.github_pr import create_github_pr as _create_github_pr
from backend.main import _fetch_workflows, _parse_repo

SUPPORTED_LLM_PROVIDERS = {"gemini", "groq", "openai", "anthropic"}
mcp = MCPServer(
    name="cicd-fixer",
    instructions=(
        "Audit CI/CD workflows for syntax errors, security risks, deprecated "
        "steps, and safer corrected configuration."
    ),
)


def _validate_provider(provider: str) -> str:
    value = provider.strip().lower()
    if value not in SUPPORTED_LLM_PROVIDERS:
        supported = ", ".join(sorted(SUPPORTED_LLM_PROVIDERS))
        raise ValueError(f"provider must be one of: {supported}")
    return value


def _result_payload(result: Any) -> dict[str, Any]:
    return result.model_dump(mode="json")


@mcp.tool()
def analyze_raw_cicd_config(
    raw_config: str, provider: str = "gemini"
) -> dict[str, Any]:
    """Analyze a raw GitHub Actions workflow and return findings plus fixed YAML."""
    if not raw_config.strip():
        raise ValueError("raw_config must not be empty")
    llm_provider = _validate_provider(provider)
    try:
        result = analyze_configuration(
            "github_actions",
            {"workflow.yml": raw_config},
            llm_provider=llm_provider,
        )
    except (ValueError, LLMProviderError):
        raise
    return _result_payload(result)


@mcp.tool()
def create_github_pr(
    repo_name: str,
    file_path: str,
    corrected_yaml: str,
    github_token: str,
    base_branch: str = "main",
) -> dict[str, str | int]:
    """Create a branch, commit an existing workflow correction, and open a PR."""
    return _create_github_pr(
        repo_name, file_path, corrected_yaml, github_token, base_branch
    )


@mcp.tool()
def analyze_github_repo(owner_repo: str, provider: str = "gemini") -> dict[str, Any]:
    """Fetch and analyze all GitHub Actions workflows in owner/repo."""
    llm_provider = _validate_provider(provider)
    repo = _parse_repo(owner_repo)
    files = _fetch_workflows(repo, os.getenv("GITHUB_TOKEN"))
    try:
        result = analyze_configuration(
            "github_actions",
            files,
            llm_provider=llm_provider,
        )
    except (ValueError, LLMProviderError):
        raise
    return _result_payload(result)


if __name__ == "__main__":
    mcp.run()
