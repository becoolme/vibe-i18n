# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive GitHub CI/CD workflows
- Automated testing across multiple Node.js versions and platforms
- Security auditing and vulnerability checks
- Automated dependency updates with Dependabot
- Pull request validation and auto-commenting
- Release automation with GitHub Actions

### Changed
- Improved hardcoded string detection to skip `<code>` and `<pre>` tags
- Enhanced JSX/TSX support for template content extraction
- Fixed CLI output formatting to avoid ANSI color codes in test environments

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of vibei18n CLI tool
- i18n translation management functionality
- Support for Vue.js, React JSX/TSX files
- Hardcoded string detection with smart filtering
- Translation completeness checking
- Duplicate translation detection
- CLI commands for all major operations
- Comprehensive test suite
- Full documentation

### Features
- `init` - Initialize locales directory structure
- `check` - Check translation completeness with detailed reporting
- `hardcode-check` - Find hardcoded strings in source code
- `get/set` - Read and write individual translations
- `stats` - Show translation statistics
- `duplicates` - Find duplicate translations across locales
- `locales` - List available locales

### Supported File Types
- Vue.js single file components (`.vue`)
- React JSX files (`.jsx`)
- TypeScript JSX files (`.tsx`)
- JSON locale files
- JavaScript locale files (read-only)

### CLI Usage
```bash
# Global installation
npm install -g vibei18n

# Direct usage
npx vibei18n --help
npx vibei18n init
npx vibei18n check --detailed
npx vibei18n hardcode-check --verbose
```