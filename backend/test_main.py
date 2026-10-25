from unittest.mock import Mock

import pytest

from backend.main import _fetch_workflows, _parse_repo


def test_parse_repo_accepts_github_url() -> None:
    assert _parse_repo("https://github.com/example/project.git") == "example/project"


def test_parse_repo_rejects_non_github_url() -> None:
    with pytest.raises(ValueError, match="owner/repo"):
        _parse_repo("https://gitlab.com/example/project")


def test_fetch_workflows_rejects_non_directory_response(monkeypatch) -> None:
    response = Mock(status_code=200)
    response.raise_for_status.return_value = None
    response.json.return_value = {"type": "file"}
    monkeypatch.setattr("backend.main.requests.get", lambda *args, **kwargs: response)

    with pytest.raises(ValueError, match="directory listing"):
        _fetch_workflows("example/project", None)


def test_fetch_workflows_decodes_yaml_and_ignores_other_files(monkeypatch) -> None:
    directory = Mock(status_code=200)
    directory.raise_for_status.return_value = None
    directory.json.return_value = [
        {"type": "dir", "path": ".github/workflows/nested"},
        {"type": "file", "path": ".github/workflows/README.md", "url": "ignored"},
        {
            "type": "file",
            "path": ".github/workflows/ci.yml",
            "url": "https://api.github.test/ci.yml",
        },
    ]
    file_response = Mock(status_code=200)
    file_response.raise_for_status.return_value = None
    file_response.json.return_value = {"content": "bmFt\nZTogQ0kK\n"}
    responses = iter([directory, file_response])
    monkeypatch.setattr(
        "backend.main.requests.get", lambda *args, **kwargs: next(responses)
    )

    assert _fetch_workflows("example/project", None) == {
        ".github/workflows/ci.yml": "name: CI\n"
    }
