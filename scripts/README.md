# Development Scripts

This directory contains scripts to help maintain code quality and consistency during development.

## Available Scripts

### Lint Scripts

#### `npm run lint`
Run all formatting checks (whitespace and line endings).

#### `npm run lint:whitespace`
Check for trailing whitespace in source files.

#### `npm run lint:whitespace:fix`
Automatically remove trailing whitespace from source files.

#### `npm run lint:line-endings`
Check for consistent line endings (LF only, no CRLF).

### Usage Examples

```bash
# Check for formatting issues
npm run lint

# Fix trailing whitespace automatically
npm run lint:whitespace:fix

# Check only whitespace issues
npm run lint:whitespace

# Check only line endings
npm run lint:line-endings
```

## Git Pre-commit Hook (Optional)

You can set up automatic pre-commit checks to catch formatting issues before they reach CI:

```bash
# Option 1: Copy the pre-commit hook
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Option 2: Create a symlink (recommended for development)
ln -sf ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
```

With the pre-commit hook installed, git will automatically run formatting checks before each commit and prevent commits with formatting issues.

## File Coverage

The scripts check the following file types and directories:

### Directories
- `src/` - Source code
- `bin/` - Executables
- `test/` - Test files
- `scripts/` - Development scripts
- `.github/` - GitHub workflows

### File Types
- `*.js` - JavaScript files
- `*.json` - JSON files
- `*.md` - Markdown files
- `*.yml`, `*.yaml` - YAML files

## CI Integration

The CI pipeline automatically runs these checks using `npm run lint`. This ensures consistent formatting across all contributions.

## Troubleshooting

### "Permission denied" errors
Make sure scripts are executable:
```bash
chmod +x scripts/*.sh
```

### macOS vs Linux differences
The scripts are designed to work on both macOS (using BSD `sed`) and Linux (using GNU `sed`). The OS detection is automatic.

### Manual fixes
If the automatic fix scripts don't work for some reason, you can manually fix trailing whitespace:

```bash
# Remove trailing whitespace manually
find src bin test scripts .github -name "*.js" -o -name "*.json" -o -name "*.yml" | xargs sed -i 's/[[:space:]]*$//'
```