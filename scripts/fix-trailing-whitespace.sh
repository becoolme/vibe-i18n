#!/usr/bin/env bash

# Fix trailing whitespace in source files

set -e

echo "🔧 Fixing trailing whitespace..."

# Define directories and file patterns to fix
DIRECTORIES=("src" "bin" "test" "scripts" ".github")
FILE_PATTERNS=("*.js" "*.json" "*.md" "*.yml" "*.yaml")

fixed_count=0

for dir in "${DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "📁 Processing directory: $dir/"
    
    for pattern in "${FILE_PATTERNS[@]}"; do
      # Find and fix files matching the pattern
      while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
          # Check if file has trailing whitespace
          if grep -q "[[:space:]]$" "$file" 2>/dev/null; then
            echo "  🔧 Fixing: $file"
            # Remove trailing whitespace (macOS compatible)
            if [[ "$OSTYPE" == "darwin"* ]]; then
              sed -i '' 's/[[:space:]]*$//' "$file"
            else
              sed -i 's/[[:space:]]*$//' "$file"
            fi
            ((fixed_count++))
          fi
        fi
      done < <(find "$dir" -name "$pattern" -type f -print0 2>/dev/null || true)
    done
  fi
done

# Also check root level markdown files
for file in README*.md; do
  if [ -f "$file" ] && grep -q "[[:space:]]$" "$file" 2>/dev/null; then
    echo "  🔧 Fixing: $file"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/[[:space:]]*$//' "$file"
    else
      sed -i 's/[[:space:]]*$//' "$file"
    fi
    ((fixed_count++))
  fi
done

if [ $fixed_count -eq 0 ]; then
  echo "✅ No trailing whitespace found to fix"
else
  echo "✅ Fixed trailing whitespace in $fixed_count file(s)"
  echo "💡 Don't forget to commit these changes!"
fi