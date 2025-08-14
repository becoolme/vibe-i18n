# Vibe i18n

[![CI](https://github.com/becoolme/vibe-i18n/workflows/CI/badge.svg)](https://github.com/becoolme/vibe-i18n/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vibei18n.svg)](https://badge.fury.io/js/vibei18n)
[![Node.js Version](https://img.shields.io/node/v/vibei18n)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful i18n translation management CLI tool for Vue.js, Nuxt.js, and other JavaScript projects. Designed for AI agents to efficiently manage translations without reading large locale files, saving tokens and preventing file corruption.

## Features

- 🚀 **CLI-first approach** - Use `npx vibei18n` to manage translations
- 📁 **Smart locale scanning** - Automatically discovers locale files
- 🔍 **Translation completeness checking** - Find missing translations
- 🔧 **Hardcoded string detection** - Scan your codebase for hardcoded strings
- 📊 **Detailed statistics** - Get insights into translation coverage
- 🎯 **Duplicate detection** - Find duplicate translations across locales
- 💻 **Programmatic API** - Use as a library in your Node.js projects
- 🌐 **Multiple formats** - Support for JSON and JS locale files

## AI Agent Integration

For AI agents working with translations, use the CLI commands instead of reading/writing files directly to ensure data integrity and proper validation:

### Prompt for AI Agents:
```
When working with vibei18n translations, ALWAYS use the CLI commands instead of reading or modifying locale files directly. This ensures proper validation, formatting, and prevents corruption.

Available commands for translation management:
- Get translation: npx vibei18n get <locale> <key>
- Set translation: npx vibei18n set <locale> <key> <value>
- Check if exists: npx vibei18n has <locale> <key>
- Get all locales for key: npx vibei18n getAll <key>
- Find missing: npx vibei18n missing <key>
- Check completeness: npx vibei18n check --detailed
- Show statistics: npx vibei18n stats
- List locales: npx vibei18n locales

Example workflow:
1. Check current state: npx vibei18n stats
2. Get specific translation: npx vibei18n get en-US common.loading
3. Update translation: npx vibei18n set zh-hans common.loading "加载中..."
4. Verify change: npx vibei18n get zh-hans common.loading
```

## Quick Start

1. **Initialize your locales structure:**
```bash
npx vibei18n init
```
   Creates `i18n/locales` directory with example files. Skip if directory exists.

2. **Check translation completeness:**
```bash
npx vibei18n check --detailed
```

3. **Find hardcoded strings in your code:**
```bash
npx vibei18n hardcode-check --verbose
```

4. **Add a new translation:**
```bash
npx vibei18n set zh-hans page.title "页面标题"
```

## CLI Commands

### Basic Operations

```bash
# Get a translation value
npx vibei18n get en-US common.loading

# Set a translation value
npx vibei18n set zh-hans page.title "页面标题"

# Check if translation exists
npx vibei18n has en-US common.loading

# Get all translations for a key
npx vibei18n getAll common.loading

# Find missing translations
npx vibei18n missing page.title
```

### Analysis Commands

```bash
# Check translation completeness
npx vibei18n check --detailed

# Show translation statistics
npx vibei18n stats --verbose

# Find duplicate translations
npx vibei18n duplicates

# List available locales
npx vibei18n locales
```

### Hardcoded String Detection

```bash
# Basic scan for hardcoded strings
npx vibei18n hardcode-check

# Verbose output with context
npx vibei18n hardcode-check --verbose

# Scan specific file types
npx vibei18n hardcode-check --ext vue,tsx,jsx

# Scan specific directory
npx vibei18n hardcode-check ./src --verbose
```

### Initialization

```bash
# Initialize default structure (./i18n/locales)
npx vibei18n init

# Initialize with custom directory
npx vibei18n init --dir ./locales
```

The `init` command creates the initial locales directory structure with example files. By default, it creates an `i18n/locales` directory in your current working directory. If the directory already exists, you can choose to skip the initialization or overwrite existing files.

## Custom Locales Directory

By default, vibei18n looks for locale files in `./i18n/locales`. You can specify a custom directory:

```bash
npx vibei18n check --dir ./my-locales
npx vibei18n stats --dir ./custom/path/locales
```

## Programmatic Usage

You can also use vibei18n as a library in your Node.js projects:

```javascript
import { I18nHelper } from 'vibei18n';

// Initialize with default directory (./i18n/locales)
const helper = new I18nHelper();

// Or specify custom directory
const helper = new I18nHelper('./custom/locales');

// Get all available locales
const locales = helper.getLocales();
console.log('Available locales:', locales);

// Get a translation
const value = helper.get('en-US', 'common.loading');
console.log('Translation:', value);

// Set a translation
helper.set('zh-hans', 'page.title', '页面标题');

// Check completeness
const results = helper.checkTranslations(true);
console.log('Missing translations:', results.summary.totalMissing);

// Batch update multiple translations
helper.batchUpdate({
  'en-US': {
    'page.title': 'Page Title',
    'page.description': 'Page Description'
  },
  'zh-hans': {
    'page.title': '页面标题',
    'page.description': '页面描述'
  }
});

// Find hardcoded strings
const findings = helper.checkHardcodedStrings('./src', {
  extensions: ['.vue', '.js', '.ts'],
  verbose: true
});
```

## File Structure

vibei18n expects locale files in JSON format:

```
i18n/
  locales/
    en-US.json
    zh-hans.json
    fr-FR.json
    ...
```

Example locale file (`en-US.json`):
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "page": {
    "title": "Page Title",
    "description": "Page Description"
  }
}
```

## Hardcoded String Detection

The hardcoded string detection feature helps you find text that should be internationalized:

- **Smart filtering** - Skips technical strings, URLs, file paths, and content inside `<code>` and `<pre>` tags
- **Context awareness** - Distinguishes between HTML attributes and content
- **Priority levels** - High/Medium/Low priority classification
- **Multiple formats** - Supports Vue, JSX, TypeScript, and more

Example output:
```
🔴 HIGH priority (3 items):
  📄 src/components/Header.vue:15
     "Welcome to our site" (title)

🟡 MEDIUM priority (2 items):
  📄 src/pages/About.vue:8
     "Learn more about our company" (description)
```

## Configuration

### Supported File Extensions

For hardcoded string detection, vibei18n supports:
- `.vue` (Vue.js components)
- `.jsx` (React JSX)
- `.tsx` (TypeScript JSX)
- `.js` (JavaScript)
- `.ts` (TypeScript)

### Excluded Directories

By default, these directories are excluded from scanning:
- `node_modules`
- `.git`
- `dist`
- `build`
- `.nuxt`
- `.output`

## Best Practices

1. **Start with initialization:**
   ```bash
   npx vibei18n init
   ```

2. **Regular completeness checks:**
   ```bash
   npx vibei18n check --detailed
   ```

3. **Find hardcoded strings early:**
   ```bash
   npx vibei18n hardcode-check --verbose
   ```

4. **Use batch updates for efficiency:**
   ```bash
   # Use the programmatic API for complex operations
   node your-translation-script.js
   ```

5. **Keep translations organized:**
   - Use nested objects for logical grouping
   - Follow consistent naming conventions
   - Use descriptive key names

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see LICENSE file for details.

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/becoolme/vibe-i18n/issues)
- 📚 **Documentation**: This README and inline help (`npx vibei18n --help`)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/becoolme/vibe-i18n/discussions)

---

Made with ❤️ for the internationalization community.