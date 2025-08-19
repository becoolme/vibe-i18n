#!/usr/bin/env bash

# Check for trailing whitespace in source files
# Exit with code 1 if found, 0 if clean

set -e

echo "🔍 Checking for trailing whitespace..."

# Define file patterns to check
PATTERNS=(
  --include="*.js"
  --include="*.json" 
  --include="*.md"
  --include="*.yml"
  --include="*.yaml"
)

# Check for trailing whitespace
if grep -r "[[:space:]]$" src/ bin/ test/ scripts/ .github/ README*.md "${PATTERNS[@]}" 2>/dev/null; then
  echo ""
  echo "❌ Found trailing whitespace in the files above"
  echo "💡 Run 'npm run lint:whitespace:fix' to automatically fix this"
  exit 1
else
  echo "✅ No trailing whitespace found"
  exit 0
fi