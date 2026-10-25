"""Pydantic request and response models."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Provider = Literal["github_actions", "gitlab_ci", "jenkins"]
Severity = Literal["high", "medium", "low"]


class RawAnalysisRequest(BaseModel):
    code: str = Field(min_length=1, max_length=100_000)
    provider: Provider


class RepoAnalysisRequest(BaseModel):
    repo_url: str = Field(min_length=1)
    github_token: str | None = None


class Issue(BaseModel):
    severity: Severity
    title: str
    explanation: str
    recommendation: str
    line: int | None = None


class WorkflowAnalysis(BaseModel):
    file_path: str
    original_code: str
    fixed_code: str
    summary: str
    health_score: int = Field(ge=0, le=100)
    issues: list["Issue"]


class PRFixRequest(BaseModel):
    repo_name: str = Field(min_length=3)
    file_path: str = Field(min_length=1)
    corrected_yaml: str = Field(min_length=1, max_length=100_000)
    github_token: str = Field(min_length=1)
    base_branch: str = Field(default="main", min_length=1)


class AnalysisResult(BaseModel):
    summary: str
    health_score: int = Field(ge=0, le=100)
    issues: list[Issue]
    fixed_code: str
    provider: Provider
    source_files: dict[str, str] = Field(default_factory=dict)


class RepoAnalysisResult(BaseModel):
    status: Literal["AWAITING_USER_CONFIRMATION"] = "AWAITING_USER_CONFIRMATION"
    summary: str
    workflows: list[WorkflowAnalysis]
