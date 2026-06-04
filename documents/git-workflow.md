# Git Workflow

## Branches
- main: production, no direct pushes.
- develop: development branch.
- Feature branches: feature/short-description.
- Bugfix branches: fix/short-description.

## Commits
- Use Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:.
- Commit message in English.
- One commit = one logical change.

## Pull Requests
- PR title must describe the change.
- PR description must include: what, why, how to test.
- PR must be linked to a task.

## Review
- Minimum 1 approval before merge.
- All review comments must be resolved.
- Reviewer checks: code style, tests, accessibility, security.

## Forbidden
- Direct push to main or develop.
- Merge without approval.
- Merge with failing tests.
