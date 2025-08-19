# Missing Translation Checker - Usage Example

This tool helps you identify translation keys used in your Vue.js, React, or other frontend projects that are missing from your translation files.

## Features

✅ Scans all Vue, JSX, and TSX files for `$t()` usage  
✅ Compares with your base translation file (default: `en-US.json`)  
✅ Shows detailed missing translation report  
✅ Groups results by file and section  
✅ Provides JSON format for easy copy-paste  
✅ Returns exit code 1 if missing translations (useful for CI/CD)

## Usage

### Basic Usage
```bash
# Check missing translations in current directory
npx vibei18n missing-translations

# Check specific directory
npx vibei18n missing-translations /path/to/project

# Use verbose output (shows all missing keys per file)
npx vibei18n missing-translations --verbose

# Use different base locale
npx vibei18n missing-translations --base-locale zh-hans

# Check specific file extensions
npx vibei18n missing-translations --ext vue,tsx,jsx
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Check missing translations
  run: npx vibei18n missing-translations
  # This will fail the build if there are missing translations
```

## Example Output

```
🔍 Checking for missing translations...
📁 Directory: /path/to/project
📄 Extensions: .vue, .jsx, .tsx
🔑 Found 841 unique translation keys in 39 files
📚 Found 934 keys in en-US.json

============================================================
📊 MISSING TRANSLATIONS REPORT
============================================================

✅ Keys found in en-US.json: 650
❌ Keys missing in en-US.json: 191
📝 Total keys used in project: 841

🔴 MISSING TRANSLATION KEYS:
----------------------------------------

📄 pages/convert-png-to-webp.vue:
   ❌ convertPngToWebp.benefits.title
   ❌ convertPngToWebp.benefits.performance.title
   ❌ convertPngToWebp.benefits.sizeReduction.title
   ... and 19 more

📋 JSON FORMAT (for easy copy-paste):
----------------------------------------
{
  "convertPngToWebp.benefits.title": "",
  "convertPngToWebp.benefits.performance.title": "",
  "convertPngToWebp.benefits.sizeReduction.title": "",
  // ... more keys
}

📈 STATISTICS BY SECTION:
----------------------------------------
   apiDocs: 146 keys (33 missing)
   convertPngToWebp: 42 keys (24 missing)
   resizeImage: 43 keys ✅
   // ... more sections
```

## Integration with Existing Tools

You can also use this programmatically:

```javascript
import { I18nHelper } from 'vibei18n';

const helper = new I18nHelper('./i18n/locales');
const results = helper.checkMissingTranslations('./src', {
  extensions: ['.vue', '.jsx'],
  baseLocale: 'en-US',
  verbose: true
});

console.log(`Found ${results.missingKeys} missing translations`);
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose, -v` | Show all missing keys per file | `false` |
| `--extensions, --ext` | File extensions to scan | `.vue,.jsx,.tsx` |
| `--base-locale` | Base locale to compare against | `en-US` |

## How it Works

1. **Scans Files**: Recursively finds all files with specified extensions
2. **Extracts Keys**: Uses regex to find all `$t('key')` and `{{ $t('key') }}` patterns
3. **Loads Base Locale**: Reads your base translation file (e.g., `en-US.json`)
4. **Compares**: Checks which keys exist in code but not in translations
5. **Reports**: Shows detailed breakdown by file and section

## Supported Patterns

The tool recognizes these i18n patterns:
- `$t('key.path')`
- `$t("key.path")`
- `{{ $t('key.path') }}`
- `{{ $t("key.path") }}`

## Pro Tips

1. **Run in CI/CD**: Add this to your build pipeline to catch missing translations early
2. **Use with pre-commit hooks**: Ensure translations are complete before commits
3. **Regular audits**: Run periodically to maintain translation completeness
4. **Copy-paste JSON**: Use the JSON output to quickly add missing keys to your translation files

## Related Commands

- `npx vibei18n check` - General translation completeness check
- `npx vibei18n hardcode-check` - Find hardcoded strings that should be translated
- `npx vibei18n set <locale> <path> <value>` - Add individual translations
- `npx vibei18n setMultiple <path> <json>` - Set translations for multiple locales at once

### setMultiple Command Examples

```bash
# Set the same key in multiple languages at once
npx vibei18n setMultiple page.title '{"zh-hans":"标题","fr-FR":"Titre","es-ES":"Título"}'

# Skip if the key already exists (useful for adding new translations without overwriting)
npx vibei18n setMultiple page.subtitle '{"zh-hans":"副标题","fr-FR":"Sous-titre"}' --skip-if-exists

# Bulk add missing translations from the missing-translations report
npx vibei18n setMultiple convertPngToWebp.benefits.title '{"zh-hans":"PNG to WebP 转换优势","fr-FR":"Avantages de la conversion PNG vers WebP","es-ES":"Beneficios de convertir PNG a WebP"}'
```

This is particularly useful for:
- **Bulk translation updates**: When you have translations ready for multiple languages
- **New feature rollouts**: Adding new translation keys across all supported languages
- **Translation workflow**: Working with translators who provide JSON files with multiple language pairs
- **CI/CD integration**: Automated translation updates from translation management systems