from datetime import datetime, timezone
from unittest.mock import patch

import pytest

from poller.poller import GitHubClient, GitHubError


class Response:
    def __init__(self, payload=None, status=200, headers=None):
        self.payload = payload
        self.status_code = status
        self.headers = headers or {}

    def json(self):
        return self.payload


class Session:
    def __init__(self, handler):
        self.headers = {}
        self.calls = []
        self.handler = handler

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self.handler(url.removeprefix("https://api.github.com"), kwargs.get("params") or {})


def test_paginate_does_not_follow_remote_link():
    def handler(path, params):
        assert path == "/users/dev/repos"
        if params["page"] == 1:
            return Response([{"id": 1}], headers={"Link": '<https://evil.invalid/leak>; rel="next"'})
        return Response([{"id": 2}])
    session = Session(handler)
    client = GitHubClient(token="secret", session=session)
    assert client._list("/users/dev/repos", limit=5) == [{"id": 1}, {"id": 2}]
    assert all(url.startswith("https://api.github.com/") for url, _ in session.calls)
    assert all(kwargs["allow_redirects"] is False for _, kwargs in session.calls)


def test_rate_limit_is_actionable_without_echoing_token():
    client = GitHubClient(token="very-secret", session=Session(lambda *_: Response({}, 403, {"X-RateLimit-Remaining": "0"})))
    with pytest.raises(GitHubError) as error:
        client.profile("dev")
    assert error.value.status_code == 429
    assert "rate limit" in str(error.value)
    assert "very-secret" not in str(error.value)


def test_sync_counts_authored_commits_once_and_prs_separately(monkeypatch):
    monkeypatch.setenv("GITHUB_MAX_REPOS", "1")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    commit = {"sha": "abc", "author": {"login": "dev"}, "commit": {"author": {"date": now}, "message": "Build API\nDetails"}}
    other = {**commit, "sha": "other", "author": {"login": "someone-else"}}
    raw_repo = {"id": 1, "owner": {"login": "dev"}, "name": "api", "default_branch": "main", "language": "Python"}
    pr = {"id": 10, "number": 2, "title": "Add a route", "user": {"login": "dev"}, "repository_url": "https://api.github.com/repos/dev/api", "pull_request": {}, "created_at": now}
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev", "public_repos": 3})
        if path == "/users/dev/repos":
            return Response([raw_repo], headers={"Link": '<https://api.github.com/repos?page=2>; rel="next"'})
        if path.endswith("/languages"):
            return Response({"Python": 1200})
        if "/git/trees/" in path:
            return Response({"tree": [{"path": "backend/main.py"}]})
        if path.endswith("/commits"):
            assert params["author"] == "dev"
            assert params["sha"] == "main"
            return Response([commit, commit, other])
        if path == "/search/issues":
            assert "is:public" in params["q"]
            return Response({"items": [pr, pr, {**pr, "id": 11, "user": {"login": "someone-else"}}], "total_count": 3})
        raise AssertionError(path)
    with patch("poller.poller._classify", return_value=["backend"]):
        result = GitHubClient(session=Session(handler)).sync("dev")
    assert len(result["events"]) == 2
    assert result["repositories"][0]["commits"] == 1
    assert result["repositories"][0]["pull_requests"] == 1
    assert result["coverage"]["truncated"] is True
    assert result["events"][0]["title"] == "Build API"
    assert all(event["skills"] == ["backend"] for event in result["events"])


def test_no_private_repositories_without_opt_in(monkeypatch):
    monkeypatch.delenv("GITHUB_INCLUDE_PRIVATE", raising=False)
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev"})
        if path == "/users/dev/repos":
            return Response([{"id": 1, "owner": {"login": "dev"}, "name": "secret", "private": True}])
        if path == "/search/issues":
            assert "is:public" in params["q"]
            return Response({"items": [], "total_count": 0})
        raise AssertionError(path)
    result = GitHubClient(token="secret", session=Session(handler)).sync("dev")
    assert result["repositories"] == []
    assert result["coverage"]["includes_private"] is False


def test_request_budget_stops_before_network(monkeypatch):
    monkeypatch.setenv("GITHUB_REQUEST_BUDGET", "1")
    session = Session(lambda *_: Response({"login": "dev"}))
    client = GitHubClient(session=session)
    client.profile("dev")
    with pytest.raises(GitHubError, match="budget"):
        client.profile("dev")
    assert len(session.calls) == 1


def test_invalid_username_never_touches_network():
    session = Session(lambda *_: Response({}))
    with pytest.raises(GitHubError) as error:
        GitHubClient(session=session).profile("dev/../../evil")
    assert error.value.status_code == 422
    assert session.calls == []


def test_partial_commit_pagination_preserves_prior_events_without_token(monkeypatch):
    monkeypatch.setenv("GITHUB_MAX_REPOS", "1")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    commit = {"sha": "saved", "author": {"login": "dev"}, "commit": {"author": {"date": now}, "message": "Keep this event"}}
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev"})
        if path == "/users/dev/repos":
            return Response([{"id": 1, "owner": {"login": "dev"}, "name": "api", "default_branch": "main"}])
        if path.endswith("/languages"):
            return Response({"Python": 10})
        if "/git/trees/" in path:
            return Response({"tree": []})
        if path.endswith("/commits"):
            if params["page"] == 1:
                return Response([commit], headers={"Link": '<https://api.github.com/repos/dev/api/commits?page=2>; rel="next"'})
            return Response({"message": "very-secret-token"}, 429)
        if path == "/search/issues":
            return Response({"items": [], "total_count": 0})
        raise AssertionError(path)
    result = GitHubClient(token="very-secret-token", session=Session(handler)).sync("dev")
    assert len(result["events"]) == 1
    assert result["events"][0]["title"] == "Keep this event"
    assert result["coverage"]["truncated"] is True
    assert any("partial" in notice for notice in result["notices"])
    assert "very-secret-token" not in str(result)


@pytest.mark.parametrize("payload", [None, [], {"items": None}, {"items": ["not-an-object"]}, {"items": [], "total_count": "bad"}])
def test_malformed_search_collections_raise_controlled_error(payload):
    client = GitHubClient(session=Session(lambda *_: Response(payload)))
    with pytest.raises(GitHubError, match="invalid"):
        client._list("/search/issues", search=True)


@pytest.mark.parametrize("stage,payload", [("languages", []), ("tree", []), ("tree", {"tree": None}), ("tree", {"tree": ["bad"]})])
def test_malformed_repository_evidence_is_reported_without_crashing(stage, payload):
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev"})
        if path == "/users/dev/repos":
            return Response([{"owner": {"login": "dev"}, "name": "api", "default_branch": "main"}])
        if path.endswith("/languages"):
            return Response(payload if stage == "languages" else {"Python": 10})
        if "/git/trees/" in path:
            return Response(payload if stage == "tree" else {"tree": []})
        if path.endswith("/commits"):
            return Response([])
        if path == "/search/issues":
            return Response({"items": [], "total_count": 0})
        raise AssertionError(path)
    result = GitHubClient(session=Session(handler)).sync("dev")
    assert result["coverage"]["truncated"] is True
    assert any("invalid" in notice for notice in result["notices"])


def test_local_tree_path_cap_marks_coverage_incomplete():
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev"})
        if path == "/users/dev/repos":
            return Response([{"owner": {"login": "dev"}, "name": "app", "default_branch": "main"}])
        if path.endswith("/languages"):
            return Response({})
        if "/git/trees/" in path:
            return Response({"tree": [{"path": f"src/{i}.py"} for i in range(10001)], "truncated": False})
        if path.endswith("/commits"):
            return Response([])
        if path == "/search/issues":
            return Response({"items": [], "total_count": 0})
        raise AssertionError(path)
    result = GitHubClient(session=Session(handler)).sync("dev")
    assert result["coverage"]["truncated"] is True
    assert any("10,000-path limit" in notice for notice in result["notices"])


def test_explicit_private_opt_in_uses_authenticated_repository_endpoint(monkeypatch):
    monkeypatch.setenv("GITHUB_INCLUDE_PRIVATE", "true")
    def handler(path, params):
        if path == "/users/dev":
            return Response({"login": "dev"})
        if path == "/user/repos":
            return Response([{"id": 1, "owner": {"login": "dev"}, "name": "private-api", "private": True}])
        if path.endswith("/languages"):
            return Response({})
        if path.endswith("/commits"):
            return Response([])
        if path == "/search/issues":
            assert "is:public" not in params["q"]
            return Response({"items": [], "total_count": 0})
        raise AssertionError(path)
    result = GitHubClient(token="secret", session=Session(handler)).sync("dev")
    assert result["repositories"][0]["name"] == "private-api"
    assert result["coverage"]["includes_private"] is True
