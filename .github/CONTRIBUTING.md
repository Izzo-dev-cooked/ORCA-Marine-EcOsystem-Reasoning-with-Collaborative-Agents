# Contributing to ORCA

Thank you for helping improve ORCA, the marine ecosystem intelligence platform.

## Before you start

1. Search existing issues and pull requests before opening a new one.
2. For substantial changes, open an issue first so the approach can be discussed.
3. Never commit API keys, passwords, personal data, or production credentials.

## Local development

1. Create and activate a Python 3.12 virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and add only the credentials required for the feature.
4. Run the application with `python ui.py`.
5. Run the checks described in the pull request template before submitting.

## Pull requests

- Keep each pull request focused and explain the user or operator impact.
- Include tests or a reproducible verification step for behavior changes.
- Update documentation and `.env.example` when configuration changes.
- Use a clear title and link related issues.
- Be respectful and follow the Code of Conduct.

## Commit messages

Use a short imperative subject, for example `Add marine alert health check`. Keep unrelated changes in separate commits.
