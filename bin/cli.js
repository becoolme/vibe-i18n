#!/usr/bin/env node

import { I18nHelper } from '../dist/index.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

function showHelp() {
  console.log(`
vibei18n - Translation management CLI tool

Usage:
  npx vibei18n <command> [options]

Commands:
  get <locale> <path>                     Get a translation value
  set <locale> <path> <value>             Set a translation value
  setMultiple <path> <json>               Set translations for multiple locales at once
  getAll <path>                           Get values from all locales
  has <locale> <path>                     Check if a translation exists
  missing <path>                          List locales missing a translation
  stats [--verbose]                       Show translation statistics
  check [--detailed|-d]                   Comprehensive translation completeness check
  duplicates                              Find duplicate translations across locales
  missing-translations [options] [dir]    Check for missing translations by comparing $t() usage
  locales                                 List available locales from directory scan
  hardcode-check [options] [dir]          Check for hardcoded strings in project files
  init [--dir <path>]                     Initialize locales directory structure

Options for hardcode-check:
  --verbose, -v                          Show detailed output
  --extensions, --ext <ext1,ext2>        File extensions to scan (default: .vue,.jsx)

Options for missing-translations:
  --verbose, -v                          Show detailed output
  --extensions, --ext <ext1,ext2>        File extensions to scan (default: .vue,.jsx,.tsx)
  --base-locale <locale>                 Base locale to compare against (default: auto-detect)

Options for setMultiple:
  --skip-if-exists                       Skip setting if the key already exists

Options for init:
  --dir <path>                           Specify locales directory (default: ./i18n/locales)

Examples:
  npx vibei18n get zh-hans compressJpg.hero.title
  npx vibei18n set zh-hans page.title "页面标题"
  npx vibei18n setMultiple page.title '{"zh-hans":"标题","fr-FR":"Titre","es-ES":"Título"}'
  npx vibei18n getAll compressJpg.hero.title
  npx vibei18n missing compressJpg.seo.title
  npx vibei18n stats --verbose
  npx vibei18n check --detailed
  npx vibei18n duplicates
  npx vibei18n missing-translations --verbose
  npx vibei18n missing-translations --ext vue,tsx --base-locale zh-hans
  npx vibei18n hardcode-check --verbose
  npx vibei18n hardcode-check --ext vue,tsx,jsx
  npx vibei18n hardcode-check --extensions .vue,.ts --verbose
  npx vibei18n init --dir ./locales
  `);
}

async function createInitialStructure(localesDir) {
  const fs = await import('fs');
  const path = await import('path');

  // Create locales directory if it doesn't exist
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
    console.log(`✅ Created locales directory: ${localesDir}`);
  }

  // Create initial en.json if it doesn't exist
  const enPath = path.join(localesDir, 'en.json');
  if (!fs.existsSync(enPath)) {
    const initialContent = {
      "common": {
        "loading": "Loading...",
        "error": "An error occurred",
        "success": "Success!"
      },
      "navigation": {
        "home": "Home",
        "about": "About",
        "contact": "Contact"
      }
    };

    fs.writeFileSync(enPath, JSON.stringify(initialContent, null, 2), 'utf8');
    console.log(`✅ Created initial en.json file`);
  }

  console.log(`\n🎉 Locales structure initialized!`);
  console.log(`📁 Directory: ${localesDir}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Add more locale files (e.g., zh-hans.json, fr-FR.json)`);
  console.log(`   2. Use 'npx vibei18n check' to verify completeness`);
  console.log(`   3. Use 'npx vibei18n hardcode-check' to find hardcoded strings`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const [command, ...rest] = args;

  // Handle --dir option for custom locales directory
  let localesDir = null;
  const dirIndex = rest.findIndex(arg => arg === '--dir');
  if (dirIndex !== -1 && dirIndex + 1 < rest.length) {
    localesDir = rest[dirIndex + 1];
    // Remove --dir and its value from args
    rest.splice(dirIndex, 2);
  }

  // Initialize helper
  const helper = new I18nHelper(localesDir);

  try {
    switch (command) {
      case 'init': {
        const targetDir = localesDir || './i18n/locales';
        await createInitialStructure(targetDir);
        break;
      }

      case 'get': {
        if (rest.length < 2) {
          console.error('Usage: npx vibei18n get <locale> <path>');
          process.exit(1);
        }
        const getValue = helper.get(rest[0], rest[1]);
        console.log(getValue !== null ? JSON.stringify(getValue, null, 2) : 'Not found');
        break;
      }

      case 'set': {
        if (rest.length < 3) {
          console.error('Usage: npx vibei18n set <locale> <path> <value>');
          process.exit(1);
        }
        let setValue;
        try {
          setValue = JSON.parse(rest[2]);
        } catch {
          setValue = rest[2];
        }
        helper.set(rest[0], rest[1], setValue);
        break;
      }

      case 'setMultiple': {
        if (rest.length < 2) {
          console.error('Usage: npx vibei18n setMultiple <path> <json>');
          console.error('Example: npx vibei18n setMultiple page.title \'{"zh-hans":"标题","fr-FR":"Titre"}\'');
          process.exit(1);
        }

        let translations;
        try {
          translations = JSON.parse(rest[1]);
        } catch (error) {
          console.error(`❌ Invalid JSON format: ${error.message}`);
          console.error('Example: npx vibei18n setMultiple page.title \'{"zh-hans":"标题","fr-FR":"Titre"}\'');
          process.exit(1);
        }

        if (typeof translations !== 'object' || Array.isArray(translations)) {
          console.error('❌ Translations must be a JSON object with locale codes as keys');
          console.error('Example: npx vibei18n setMultiple page.title \'{"zh-hans":"标题","fr-FR":"Titre"}\'');
          process.exit(1);
        }

        const skipIfExists = rest.includes('--skip-if-exists');
        const results = helper.setMultiple(translations, rest[0], skipIfExists);

        console.log(`\n📝 Setting translations for "${rest[0]}":`);
        let successCount = 0;
        let failCount = 0;

        for (const [locale, success] of Object.entries(results)) {
          if (success) {
            console.log(`   ✅ ${locale}: "${translations[locale]}"`);
            successCount++;
          } else {
            console.log(`   ❌ ${locale}: Failed`);
            failCount++;
          }
        }

        console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed`);

        if (failCount > 0) {
          process.exit(1);
        }
        break;
      }

      case 'getAll': {
        if (rest.length < 1) {
          console.error('Usage: npx vibei18n getAll <path>');
          process.exit(1);
        }
        const allValues = helper.getAll(rest[0]);
        console.log(JSON.stringify(allValues, null, 2));
        break;
      }

      case 'has': {
        if (rest.length < 2) {
          console.error('Usage: npx vibei18n has <locale> <path>');
          process.exit(1);
        }
        // Convert boolean to string to avoid ANSI color codes
        const result = helper.has(rest[0], rest[1]);
        process.stdout.write(result ? 'true' : 'false');
        process.stdout.write('\n');
        break;
      }

      case 'missing': {
        if (rest.length < 1) {
          console.error('Usage: npx vibei18n missing <path>');
          process.exit(1);
        }
        const missing = helper.getMissing(rest[0]);
        if (missing.length > 0) {
          console.log('Missing in:', missing.join(', '));
        } else {
          console.log('All locales have this translation');
        }
        break;
      }

      case 'stats': {
        const stats = helper.getStats();
        if (!stats) {
          console.error('No base locale (en) found');
          process.exit(1);
        }
        console.log('Translation Statistics:');
        console.log('='.repeat(50));
        for (const [locale, stat] of Object.entries(stats)) {
          console.log(`\n${locale}:`);
          console.log(`  Complete: ${stat.complete}/${stat.total} (${stat.percentage})`);
          if (stat.missing > 0) {
            console.log(`  Missing: ${stat.missing} keys`);
            if (rest[0] === '--verbose') {
              console.log(`  Missing paths:`);
              stat.missingPaths.slice(0, 10).forEach(p => console.log(`    - ${p}`));
              if (stat.missingPaths.length > 10) {
                console.log(`    ... and ${stat.missingPaths.length - 10} more`);
              }
            }
          }
        }
        break;
      }

      case 'check': {
        // Check if no translation files exist
        if (helper.getLocales().length === 0) {
          console.error('No locale files found');
          console.log('💡 Run "npx vibei18n init" to create initial structure');
          process.exit(1);
        }

        const detectedBaseLocale = helper.detectBaseLocale();
        if (!detectedBaseLocale) {
          console.error('No base locale found');
          console.log('💡 Run "npx vibei18n init" to create initial structure');
          process.exit(1);
        }

        const detailed = rest.includes('--detailed') || rest.includes('-d');
        helper.checkTranslations(detailed);
        break;
      }

      case 'duplicates': {
        helper.findDuplicates();
        break;
      }

      case 'locales': {
        console.log(`Available locales (scanned from ${helper.getLocalesDir()}):`);
        const locales = helper.getLocales();
        if (locales.length > 0) {
          locales.forEach(locale => console.log(`  - ${locale}`));
          console.log(`\nTotal: ${locales.length} locales found`);
        } else {
          console.log('  No locale files found');
        }
        break;
      }

      case 'missing-translations': {
        const verbose = rest.includes('--verbose') || rest.includes('-v');

        // Parse extensions parameter
        let extensions = ['.vue', '.jsx', '.tsx']; // default
        const extIndex = rest.findIndex(arg => arg === '--extensions' || arg === '--ext');
        if (extIndex !== -1 && extIndex + 1 < rest.length) {
          extensions = rest[extIndex + 1].split(',').map(ext => ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim());
        }

        // Parse base locale parameter
        let baseLocale = null; // will be auto-detected
        const localeIndex = rest.findIndex(arg => arg === '--base-locale');
        if (localeIndex !== -1 && localeIndex + 1 < rest.length) {
          baseLocale = rest[localeIndex + 1];
        }

        // Find project directory
        const nonFlagArgs = rest.filter((arg, index) =>
          !arg.startsWith('--') &&
          !(extIndex !== -1 && index === extIndex + 1) && // exclude extension value
          !(localeIndex !== -1 && index === localeIndex + 1) // exclude base-locale value
        );
        const projectDir = nonFlagArgs[0] || process.cwd();

        const results = helper.checkMissingTranslations(projectDir, {
          extensions,
          baseLocale,
          verbose
        });

        if (results && results.missingKeys > 0) {
          process.exit(1); // Exit with error code if there are missing translations
        }
        break;
      }

      case 'hardcode-check': {
        const verbose = rest.includes('--verbose') || rest.includes('-v');

        // Parse extensions parameter first
        let extensions = ['.vue', '.jsx']; // default
        const extIndex = rest.findIndex(arg => arg === '--extensions' || arg === '--ext');
        if (extIndex !== -1 && extIndex + 1 < rest.length) {
          extensions = rest[extIndex + 1].split(',').map(ext => ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim());
        }

        // Find project directory (must be after removing extension args)
        const nonFlagArgs = rest.filter((arg, index) =>
          !arg.startsWith('--') &&
          !(extIndex !== -1 && index === extIndex + 1) // exclude extension value
        );
        const projectDir = nonFlagArgs[0] || process.cwd();

        const findings = helper.checkHardcodedStrings(projectDir, { verbose, extensions });

        if (findings.length === 0) {
          console.log('✅ No hardcoded strings found!');
        } else {
          console.log(`\n📊 Found ${findings.length} potential hardcoded strings:\n`);

          // Group by severity
          const grouped = findings.reduce((acc, finding) => {
            if (!acc[finding.severity]) acc[finding.severity] = [];
            acc[finding.severity].push(finding);
            return acc;
          }, {});

          // Show high severity first
          ['high', 'medium', 'low'].forEach(severity => {
            if (grouped[severity]) {
              console.log(`🔴 ${severity.toUpperCase()} priority (${grouped[severity].length} items):`);
              grouped[severity].forEach(finding => {
                console.log(`  📄 ${finding.file}:${finding.line}`);
                console.log(`     "${finding.text}" (${finding.category})`);
                if (verbose && finding.context) {
                  console.log(`     Context: ${finding.context}`);
                }
                console.log('');
              });
            }
          });

          // Print summary at the end
          console.log('═'.repeat(50));
          console.log('📊 Summary:');
          ['high', 'medium', 'low'].forEach(severity => {
            if (grouped[severity]) {
              const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
              console.log(`   ${icon} ${severity}: ${grouped[severity].length} items`);
            }
          });
          console.log('═'.repeat(50));
          console.log(`\n💡 Total hardcoded strings found: ${findings.length}`);

          // Group by file for statistics
          const fileStats = {};
          findings.forEach(finding => {
            if (!fileStats[finding.file]) {
              fileStats[finding.file] = 0;
            }
            fileStats[finding.file]++;
          });

          // Show top files with most hardcoded strings
          const sortedFiles = Object.entries(fileStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          if (sortedFiles.length > 0) {
            console.log('\n📁 Top files with hardcoded strings:');
            sortedFiles.forEach(([file, count]) => {
              console.log(`   • ${file}: ${count} strings`);
            });
          }

          console.log('\n💡 Suggestions:');
          console.log('   1. Convert high priority items to i18n first');
          console.log('   2. Use $t() or {{ $t() }} for Vue templates');
          console.log('   3. Use t() function in script sections');
          console.log('   4. Add translations to locale files\n');
        }
        break;
      }

      default: {
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
