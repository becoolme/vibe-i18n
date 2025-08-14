# Security Policy

## Supported Versions

We support the following versions of vibei18n with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in vibei18n, please report it to us privately.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send an email to [security@becoolme.dev] with:
   - A clear description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (if you have them)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Investigation**: We will investigate and confirm the vulnerability within 5 business days
- **Fix Timeline**: We aim to release a fix within 30 days of confirmation
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

### Security Best Practices for Users

When using vibei18n:

1. **Keep Updated**: Always use the latest version of vibei18n
2. **Validate Input**: Be cautious when processing untrusted locale files
3. **File Permissions**: Ensure proper file permissions on your locale directories
4. **CI/CD Security**: Use secure secrets management for NPM tokens in CI/CD

### Known Security Considerations

- **File System Access**: vibei18n reads and writes locale files - ensure proper permissions
- **Command Injection**: Be careful when using dynamic paths in CLI commands
- **Dependency Security**: We regularly audit dependencies for known vulnerabilities

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in the changelog with [SECURITY] prefix
- Announced in the GitHub Releases page

## Bug Bounty

We currently do not offer a paid bug bounty program, but we greatly appreciate security researchers who help improve our project's security.