"""Bounded, read-only GitHub REST ingestion.

Counts are authored commits on the default branch of scanned repositories and
PRs created by the account. This is evidence of practice, not proficiency.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
import os
import re
from urllib.parse import quote

import requests
from dotenv import load_dotenv

load_dotenv()
LOG = logging.getLogger(__name__)
API = "https://api.github.com"
USERNAME = re.compile(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\Z")
REPO_NAME = re.compile(r"[A-Za-z0-9_.-]+\Z")


class GitHubError(Exception):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


def _bounded_env(name, default, minimum=1, maximum=100):
    try:
        return min(maximum, max(minimum, int(os.getenv(name, default))))
    except ValueError:
        return default


def _object(value, label):
    if not isinstance(value, dict):
        raise GitHubError(f"GitHub returned an invalid {label}.")
    return value


def _string(value, default=""):
    return value if isinstance(value, str) else default


def _classify(repo, languages, paths):
    from ml.topics import classify_repository
    return classify_repository(repo, languages, paths=paths)


class GitHubClient:
    def __init__(self, token=None, session=None):
        self.token = token
        self.session = session or requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "CodePulse/1.0",
        })
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"
        self.requests = 0
        self.budget = _bounded_env("GITHUB_REQUEST_BUDGET", 400 if token else 50, maximum=1000)
        self.notices = []
        self.truncated = False

    def _get(self, path, params=None):
        if not path.startswith("/") or path.startswith("//"):
            raise GitHubError("Invalid GitHub API path.")
        if self.requests >= self.budget:
            raise GitHubError("The sync request budget was reached. Results may be incomplete; sync again later or configure authenticated access.", 429)
        self.requests += 1
        try:
            response = self.session.get(API + path, params=params, timeout=(5, 20), allow_redirects=False)
        except requests.RequestException as exc:
            raise GitHubError("GitHub could not be reached. Check your connection and try again.") from exc
        if response.status_code == 404:
            raise GitHubError("GitHub account or repository was not found, or is not accessible.", 404)
        if response.status_code == 401:
            raise GitHubError("GitHub authentication expired. Reconnect your GitHub account.", 401)
        if response.status_code in (403, 429):
            remaining = response.headers.get("X-RateLimit-Remaining")
            if remaining == "0" or response.status_code == 429 or response.headers.get("Retry-After"):
                raise GitHubError("GitHub's API rate limit was reached. Wait for the limit to reset, or connect with GitHub OAuth for a higher limit.", 429)
            raise GitHubError("GitHub denied access. Check the account's authorization and repository permissions.", 403)
        if response.status_code == 409:
            raise GitHubError("This GitHub repository is empty.", 409)
        if not 200 <= response.status_code < 300:
            raise GitHubError("GitHub returned an unexpected response. Try syncing again later.")
        try:
            return response.json(), response.headers
        except ValueError as exc:
            raise GitHubError("GitHub returned an invalid response.") from exc

    def _list(self, path, params=None, *, limit=200, search=False):
        """Paginate numerically; never follow a remote Link URL with credentials."""
        result = []
        params = dict(params or {})
        per_page = min(100, max(1, limit))
        page = 1
        while True:
            try:
                data, headers = self._get(path, {**params, "per_page": per_page, "page": page})
                if search:
                    data = _object(data, "search response")
                items = data.get("items", []) if search else data
                if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
                    raise GitHubError("GitHub returned an invalid collection.")
                if search and (not isinstance(data.get("total_count", 0), int) or data.get("total_count", 0) < 0):
                    raise GitHubError("GitHub returned an invalid search count.")
            except GitHubError as exc:
                # Keep already imported pages if a later page fails or hits a limit.
                if not result:
                    raise
                self.truncated = True
                self.notices.append(f"An imported collection is partial: {exc}")
                return result
            room = limit - len(result)
            result.extend(items[:room])
            more = 'rel="next"' in headers.get("Link", "")
            if search:
                more = more or data.get("total_count", 0) > page * per_page
                if data.get("incomplete_results"):
                    self.truncated = True
                    self.notices.append("GitHub marked the pull-request search as incomplete.")
            if len(result) >= limit:
                if more or len(items) > room:
                    self.truncated = True
                return result
            if not more or not items:
                return result
            page += 1

    def profile(self, username=None):
        if username is not None and not USERNAME.fullmatch(username):
            raise GitHubError("Enter a valid GitHub username.", 422)
        data, _ = self._get("/user" if username is None else f"/users/{quote(username, safe='')}")
        if not isinstance(data, dict) or not USERNAME.fullmatch(_string(data.get("login"))):
            raise GitHubError("GitHub returned an invalid account.")
        profile = {key: data.get(key) for key in ("login", "name", "avatar_url", "html_url", "bio", "public_repos")}
        for key in ("name", "avatar_url", "bio"):
            profile[key] = _string(profile[key])
        profile["html_url"] = f"https://github.com/{profile['login']}"
        if not isinstance(profile["public_repos"], int) or profile["public_repos"] < 0:
            profile["public_repos"] = 0
        return profile

    def sync(self, username):
        profile = self.profile(username)
        username = profile["login"]
        now = datetime.now(timezone.utc)
        since = (now - timedelta(days=180)).isoformat().replace("+00:00", "Z")
        include_private = bool(self.token) and os.getenv("GITHUB_INCLUDE_PRIVATE", "false").lower() == "true"
        max_repos = _bounded_env("GITHUB_MAX_REPOS", 12, maximum=100)
        max_commits = _bounded_env("GITHUB_MAX_COMMITS_PER_REPO", 200, maximum=1000)
        max_prs = _bounded_env("GITHUB_MAX_PULL_REQUESTS", 200, maximum=1000)
        if include_private:
            # /user/repos is required to see private repositories. It returns only
            # the authenticated user's accessible repositories; owner is checked below.
            raw_repos = self._list("/user/repos", {"affiliation": "owner", "sort": "pushed", "direction": "desc"}, limit=max_repos)
        else:
            raw_repos = self._list(f"/users/{username}/repos", {"type": "owner", "sort": "pushed", "direction": "desc"}, limit=max_repos)
        repositories, events, seen = [], [], set()
        scanned = 0
        for raw in raw_repos:
            if not isinstance(raw.get("owner"), dict):
                self.truncated = True
                self.notices.append("A repository with invalid owner metadata was skipped.")
                continue
            if _string(raw["owner"].get("login")).lower() != username.lower():
                continue
            if raw.get("private") and not include_private:
                continue
            name = _string(raw.get("name"))
            if not REPO_NAME.fullmatch(name) or name in (".", ".."):
                self.truncated = True
                self.notices.append("A repository with an invalid name was skipped.")
                continue
            full_name = f"{username}/{name}"
            repo_path = f"/repos/{username}/{quote(name, safe='')}"
            repo = {
                "id": raw.get("id", full_name), "name": name, "full_name": full_name,
                "description": _string(raw.get("description")), "html_url": f"https://github.com/{full_name}",
                "language": _string(raw.get("language")) or None, "languages": {},
                "stars": raw.get("stargazers_count", 0) if isinstance(raw.get("stargazers_count", 0), int) else 0,
                "updated_at": _string(raw.get("pushed_at")) or _string(raw.get("updated_at")),
                "fork": bool(raw.get("fork")), "archived": bool(raw.get("archived")),
                "skills": [], "commits": 0, "pull_requests": 0,
                "topics": [v for v in raw.get("topics", []) if isinstance(v, str)] if isinstance(raw.get("topics"), list) else [],
            }
            repositories.append(repo)
            try:
                languages, _ = self._get(repo_path + "/languages")
                languages = _object(languages, "language response")
                repo["languages"] = {key: value for key, value in languages.items() if isinstance(value, (int, float)) and value >= 0}
                paths = []
                # A tree provides path evidence without fetching source content.
                branch = _string(raw.get("default_branch"))
                if branch:
                    try:
                        tree, _ = self._get(repo_path + "/git/trees/" + quote(branch, safe=""), {"recursive": "1"})
                        tree = _object(tree, "file-tree response")
                        entries = tree.get("tree", [])
                        if not isinstance(entries, list) or any(not isinstance(item, dict) for item in entries):
                            raise GitHubError("GitHub returned an invalid file-tree collection.")
                        paths = [_string(item.get("path")) for item in entries[:10000]]
                        if tree.get("truncated") or len(entries) > 10000:
                            self.truncated = True
                            self.notices.append(f"File-path evidence for {name} was truncated by GitHub or the local 10,000-path limit.")
                    except GitHubError as exc:
                        if exc.status_code in (401, 403, 429):
                            raise
                        if exc.status_code not in (404, 409):
                            self.truncated = True
                            self.notices.append(f"File-path evidence for {name} was unavailable: {exc}")
                repo["skills"] = _classify(repo, repo["languages"], paths)
                commits = self._list(repo_path + "/commits", {"author": username, "since": since, "sha": branch} if branch else {"author": username, "since": since}, limit=max_commits)
                for item in commits:
                    # GitHub's author filter is authoritative for email aliases;
                    # reject any explicit mismatched account returned upstream.
                    author = _object(item.get("author") or {}, "commit author")
                    if author.get("login") and _string(author["login"]).lower() != username.lower():
                        continue
                    sha = _string(item.get("sha"))
                    key = (full_name, sha)
                    if not sha or key in seen:
                        continue
                    commit = _object(item.get("commit"), "commit")
                    commit_author = _object(commit.get("author") or {}, "commit author metadata")
                    committer = _object(commit.get("committer") or {}, "committer metadata")
                    date = _string(commit_author.get("date")) or _string(committer.get("date"))
                    if not date or date < since:
                        continue
                    seen.add(key)
                    repo["commits"] += 1
                    events.append({
                        "id": f"commit:{full_name}:{sha}", "type": "commit",
                        "title": (_string(commit.get("message")) or "Commit").splitlines()[0],
                        "repo": full_name, "url": f"https://github.com/{full_name}/commit/{quote(sha, safe='')}",
                        "date": date, "skills": list(repo["skills"]),
                    })
                scanned += 1
            except GitHubError as exc:
                # Empty repositories return 409 from the commit endpoint.
                if exc.status_code == 409:
                    scanned += 1
                    continue
                if exc.status_code == 404:
                    self.truncated = True
                    self.notices.append(f"Some data for {name} was unavailable.")
                    continue
                self.truncated = True
                self.notices.append(f"Sync stopped while scanning {name}: {exc}")
                if exc.status_code in (429, 401, 403):
                    break
        by_name = {repo["full_name"].lower(): repo for repo in repositories}
        try:
            query = f"type:pr author:{username} created:>={since[:10]}"
            if not include_private:
                query += " is:public"
            prs = self._list("/search/issues", {"q": query, "sort": "created", "order": "desc"}, limit=max_prs, search=True)
            for item in prs:
                user = _object(item.get("user") or {}, "pull-request author")
                if _string(user.get("login")).lower() != username.lower():
                    continue
                # Only process actual PRs; issue search can otherwise inflate this count.
                if "pull_request" not in item:
                    continue
                repo_url = _string(item.get("repository_url"))
                match = re.fullmatch(r"https://api\.github\.com/repos/([A-Za-z0-9-]+)/([A-Za-z0-9_.-]+)", repo_url)
                if not match:
                    continue
                full_name = f"{match.group(1)}/{match.group(2)}"
                repo = by_name.get(full_name.lower())
                if not isinstance(item.get("id"), int) or not isinstance(item.get("number"), int):
                    raise GitHubError("GitHub returned an invalid pull-request identifier.")
                identifier = f"pr:{item['id']}"
                if identifier in seen:
                    continue
                date = _string(item.get("created_at"))
                if not date or date[:10] < since[:10]:
                    continue
                seen.add(identifier)
                if repo:
                    repo["pull_requests"] += 1
                events.append({
                    "id": identifier, "type": "pull_request", "title": _string(item.get("title")) or "Pull request",
                    "repo": full_name, "url": f"https://github.com/{full_name}/pull/{item.get('number', 0)}",
                    "date": date, "skills": list(repo["skills"]) if repo else [],
                })
        except GitHubError as exc:
            self.truncated = True
            self.notices.append(f"Pull requests could not be fully imported: {exc}")
        available = profile.get("public_repos") or len(raw_repos)
        if not include_private and available > len(raw_repos):
            self.truncated = True
        self.notices.append("Commits cover the default branch of scanned owned repositories over 180 days. Pull requests cover authored PRs; PRs in unscanned repositories remain unclassified.")
        self.notices.append("Skills are inferred from repository languages and file paths, not changed-line analysis. Language shares describe repository bytes, not time spent.")
        if self.truncated:
            self.notices.append("This is a bounded import and some activity may be missing. Repository, commit, PR, and API-request limits are configurable on the server.")
        return {
            "profile": profile, "repositories": repositories, "events": events,
            "synced_at": now.isoformat().replace("+00:00", "Z"),
            "notices": list(dict.fromkeys(self.notices)),
            "coverage": {
                "since": since, "repositories_scanned": scanned, "repositories_available": available,
                "repository_limit": max_repos, "commit_limit_per_repository": max_commits,
                "pull_request_limit": max_prs, "requests": self.requests, "request_budget": self.budget,
                "truncated": self.truncated, "includes_private": include_private,
                "commit_branch": "default", "skill_evidence": "repository languages and file paths",
            },
        }
