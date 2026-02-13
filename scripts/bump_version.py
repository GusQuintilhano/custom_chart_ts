#!/usr/bin/env python3
"""
Version bumping script for Custom Charts (aligned with dataviz-api).

Automates:
1. Bump version (major, minor, patch)
2. Update package.json (root)
3. Update VERSION file
4. Update CHANGELOG.md (new version section + compare links)
5. Optional: git commit, tag (vX.Y.Z), push

Usage:
    python scripts/bump_version.py [major|minor|patch] [--no-commit] [--no-tag] [--no-push]

Tag: annotated tag v{version}. For signed tags, configure GPG and use:
    git config user.signingkey <your-gpg-key-id>
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


REPO_CHANGELOG_BASE = "https://code.ifoodcorp.com.br/ifood/data/viz/custom_charts"
VERSIONED_FILES = ["package.json", "VERSION", "CHANGELOG.md"]


def get_current_version() -> str:
    """Read current version from VERSION file, fallback to package.json."""
    version_path = Path("VERSION")
    if version_path.exists():
        version = version_path.read_text(encoding="utf-8").strip()
        if version:
            return version

    pkg_path = Path("package.json")
    if not pkg_path.exists():
        raise FileNotFoundError("VERSION and package.json not found")

    data = json.loads(pkg_path.read_text(encoding="utf-8"))
    version = data.get("version")
    if not version:
        raise ValueError("package.json has no 'version' field")
    return version


def bump_version(version: str, bump_type: str) -> str:
    """Bump version using semantic versioning."""
    parts = version.split(".")
    if len(parts) != 3:
        raise ValueError(f"Invalid version format: {version} (expected X.Y.Z)")

    major, minor, patch = map(int, parts)

    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "patch":
        patch += 1
    else:
        raise ValueError(f"Invalid bump type: {bump_type}. Use major, minor, or patch")

    return f"{major}.{minor}.{patch}"


def update_package_json(new_version: str) -> None:
    """Update version in root package.json."""
    pkg_path = Path("package.json")
    if not pkg_path.exists():
        print("⚠ Warning: package.json not found, skipping")
        return

    data = json.loads(pkg_path.read_text(encoding="utf-8"))
    data["version"] = new_version
    pkg_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"✓ Updated package.json to version {new_version}")


def update_version_file(new_version: str) -> None:
    """Update VERSION file."""
    Path("VERSION").write_text(f"{new_version}\n", encoding="utf-8")
    print(f"✓ Updated VERSION to {new_version}")


def update_changelog(new_version: str) -> None:
    """Add new version section to CHANGELOG and update compare links."""
    changelog_path = Path("CHANGELOG.md")
    if not changelog_path.exists():
        print("⚠ Warning: CHANGELOG.md not found, skipping")
        return

    content = changelog_path.read_text(encoding="utf-8")

    if "## [Unreleased]" not in content:
        print("⚠ Warning: No [Unreleased] section in CHANGELOG.md")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    content = content.replace(
        "## [Unreleased]",
        f"## [Unreleased]\n\n## [{new_version}] - {today}",
    )

    # Update links at the bottom (Keep a Changelog format)
    unreleased_link_pattern = r"\[Unreleased\]:\s*(https://[^\s]+)"
    match = re.search(unreleased_link_pattern, content)

    if match:
        base_url = match.group(1)
        if "/compare/" in base_url:
            base_url = base_url.split("/compare/")[0]
        version_link = f"[{new_version}]: {base_url}/releases/tag/v{new_version}\n"
        new_unreleased_link = f"[Unreleased]: {base_url}/compare/v{new_version}...HEAD\n"
        content = re.sub(unreleased_link_pattern, new_unreleased_link, content)
        content = re.sub(
            r"(\[Unreleased\]:\s*https://[^\s]+\n)",
            version_link + r"\1",
            content,
        )
    else:
        # Append links section if missing
        content = content.rstrip()
        if not content.endswith("]"):
            content += "\n"
        content += f"\n[{new_version}]: {REPO_CHANGELOG_BASE}/releases/tag/v{new_version}\n"
        content += f"[Unreleased]: {REPO_CHANGELOG_BASE}/compare/v{new_version}...HEAD\n"

    changelog_path.write_text(content, encoding="utf-8")
    print(f"✓ Updated CHANGELOG.md with version {new_version}")


def check_git_status() -> None:
    """Warn if there are uncommitted changes outside versioned files."""
    try:
        subprocess.run(["git", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        raise SystemExit("✗ git not available") from None

    result = subprocess.run(
        ["git", "status", "--porcelain"],
        check=True,
        capture_output=True,
        text=True,
    )
    uncommitted = [
        line
        for line in result.stdout.strip().split("\n")
        if line and not any(line.endswith(f) or f in line for f in VERSIONED_FILES)
    ]
    if uncommitted:
        print("⚠ Uncommitted changes (outside version files):")
        for line in uncommitted[:5]:
            print(f"  {line}")
        if len(uncommitted) > 5:
            print(f"  ... and {len(uncommitted) - 5} more")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != "y":
            raise SystemExit("Aborted by user")


def git_commit(version: str) -> None:
    """Create git commit with version changes."""
    subprocess.run(
        ["git", "add"] + VERSIONED_FILES,
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["git", "commit", "-m", f"chore: bump version to {version}"],
        check=True,
        capture_output=True,
    )
    print(f"✓ Created git commit for version {version}")


def git_tag(version: str, signed: bool = False) -> None:
    """Create annotated (or signed) tag v{version}."""
    tag_name = f"v{version}"
    cmd = ["git", "tag", "-a", tag_name, "-m", f"Release {version}"]
    if signed:
        cmd = ["git", "tag", "-s", "-a", tag_name, "-m", f"Release {version}"]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"✓ Created tag {tag_name}")
    except subprocess.CalledProcessError as e:
        msg = (e.stderr or b"").decode()
        print(f"✗ Error creating tag: {msg}")
        if "gpg" in msg.lower() or "sign" in msg.lower():
            print("  Configure GPG: git config user.signingkey <key-id>")
        raise


def git_push(push_commit: bool = True, push_tag: bool = True) -> None:
    """Push branch and tags."""
    if push_commit:
        subprocess.run(["git", "push"], check=True, capture_output=True)
        print("✓ Pushed commits")
    if push_tag:
        subprocess.run(["git", "push", "--tags"], check=True, capture_output=True)
        print("✓ Pushed tags")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bump version and update package.json, VERSION, CHANGELOG.md"
    )
    parser.add_argument(
        "bump_type",
        choices=["major", "minor", "patch"],
        help="Bump type: major, minor, or patch",
    )
    parser.add_argument("--no-commit", action="store_true", help="Do not create git commit")
    parser.add_argument("--no-tag", action="store_true", help="Do not create git tag")
    parser.add_argument("--no-push", action="store_true", help="Do not push to remote")
    parser.add_argument("--signed", action="store_true", help="Create signed tag (requires GPG)")

    args = parser.parse_args()

    try:
        if not args.no_commit:
            check_git_status()

        current = get_current_version()
        print(f"Current version: {current}")

        new_version = bump_version(current, args.bump_type)
        print(f"New version: {new_version}\n")

        update_package_json(new_version)
        update_version_file(new_version)
        update_changelog(new_version)

        if not args.no_commit:
            git_commit(new_version)

        if not args.no_tag:
            git_tag(new_version, signed=args.signed)

        if not args.no_push:
            git_push(push_tag=not args.no_tag)

        print(f"\n✓ Version bumped to {new_version}")
        if args.no_push:
            print("  Run: git push && git push --tags")

    except KeyboardInterrupt:
        print("\n✗ Aborted", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
