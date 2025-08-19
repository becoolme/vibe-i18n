#!/usr/bin/env bash

# Check for consistent line endings (LF only, no CRLF)
# Exit with code 1 if CRLF found, 0 if all LF

set -e

echo "🔍 Checking for consistent line endings..."

# Check JavaScript files for CRLF line endings
crlf_files=()

# Check in multiple directories
for dir in src bin test scripts; do
  if [ -d "$dir" ]; then
    while IFS= read -r -d '' file; do
      if file "$file" | grep -q "CRLF"; then
        crlf_files+=("$file")
      fi
    done < <(find "$dir" -name "*.js" -type f -print0 2>/dev/null || true)
  fi
done

if [ ${#crlf_files[@]} -gt 0 ]; then
  echo "❌ Found CRLF line endings in:"
  for file in "${crlf_files[@]}"; do
    echo "   $file"
  done
  echo ""
  echo "💡 Please convert these files to use LF line endings"
  echo "   You can use: dos2unix filename or your editor's line ending settings"
  exit 1
else
  echo "✅ Line endings are consistent (LF)"
  exit 0
fi