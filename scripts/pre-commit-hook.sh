#!/usr/bin/env bash

# Pre-commit hook to check code formatting
# This can be used as a git pre-commit hook to catch issues before committing

set -e

echo "🔍 Running pre-commit checks..."

# Run lint checks
if ! npm run lint > /dev/null 2>&1; then
  echo "❌ Lint checks failed!"
  echo ""
  echo "Please fix the formatting issues and try again."
  echo "You can run:"
  echo "  npm run lint:whitespace:fix  # Fix trailing whitespace"
  echo "  npm run lint                 # Check all formatting"
  echo ""
  exit 1
fi

echo "✅ All pre-commit checks passed!"