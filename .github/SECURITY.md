# Security Policy

## Supported versions

Security fixes are provided for the latest version on the `main` branch. Older deployments may not receive fixes.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting feature for this repository, or contact the maintainers privately through the repository owner profile.

Please include:

- A concise description of the issue and its impact.
- Steps or a minimal example to reproduce it.
- Affected files, endpoints, versions, or deployment settings.
- Any suggested mitigation.

Please redact secrets and personal data. We will acknowledge a report as soon as practical, investigate it, and coordinate a fix and disclosure timeline with the reporter.

## Secret handling

Never commit `.env` files, API keys, credentials, or user data. If a secret is exposed, revoke or rotate it immediately and report the incident privately.
