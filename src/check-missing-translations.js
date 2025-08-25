#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Extract all $t() function calls from Vue files and compare with translation files
 */
class MissingTranslationChecker {
  constructor(projectPath, localesPath = 'i18n/locales', defaultLocale = null) {
    this.projectPath = projectPath;
    this.localesPath = path.join(projectPath, localesPath);
    this.defaultLocale = defaultLocale;
    this.detectedLocale = null; // Will be set by detectBaseLocale
  }

  /**
   * Detect the base locale file automatically
   * @returns {string|null}
   */
  detectBaseLocale() {
    if (this.detectedLocale) return this.detectedLocale;

    if (this.defaultLocale) {
      this.detectedLocale = this.defaultLocale;
      return this.detectedLocale;
    }

    const possibleBaseLocales = ['en', 'en-US', 'en-GB', 'en_US', 'en_GB'];

    try {
      const files = fs.readdirSync(this.localesPath);
      const availableLocales = files
        .filter(file => file.endsWith('.json') || file.endsWith('.js'))
        .map(file => path.basename(file, path.extname(file)));

      for (const locale of possibleBaseLocales) {
        if (availableLocales.includes(locale)) {
          this.detectedLocale = locale;
          return this.detectedLocale;
        }
      }

      // If no English locale found, use the first available locale
      if (availableLocales.length > 0) {
        console.warn(`⚠️  No English locale found, using ${availableLocales[0]} as base`);
        this.detectedLocale = availableLocales[0];
        return this.detectedLocale;
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return null;
  }

  /**
   * Extract $t() keys from a string content
   */
  extractTKeys(content) {
    const keys = new Set();

    // Match $t('key'), $t("key"), and {{ $t('key') }} patterns
    const patterns = [
      /\$t\s*\(\s*['"](.*?)['"]\s*\)/g,
      /\{\{\s*\$t\s*\(\s*['"](.*?)['"]\s*\)\s*\}\}/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }

    return Array.from(keys);
  }

  /**
   * Recursively find all .vue files in a directory
   */
  findVueFiles(dir, files = []) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip common directories that don't contain source files
        if (['node_modules', 'dist', '.nuxt', '.output', '.git'].includes(entry)) {
          continue;
        }
        this.findVueFiles(fullPath, files);
      } else if (entry.endsWith('.vue')) {
        files.push(path.relative(this.projectPath, fullPath));
      }
    }

    return files;
  }

  /**
   * Scan all Vue files in the project for $t() usage
   */
  scanProjectForTKeys() {
    console.log('🔍 Scanning Vue files for $t() usage...');

    const vueFiles = this.findVueFiles(this.projectPath);
    const allKeys = new Set();
    const fileKeyMap = {};

    for (const file of vueFiles) {
      const fullPath = path.join(this.projectPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const keys = this.extractTKeys(content);

      if (keys.length > 0) {
        fileKeyMap[file] = keys;
        keys.forEach(key => allKeys.add(key));
      }
    }

    console.log(`📄 Found ${vueFiles.length} Vue files`);
    console.log(`🔑 Found ${allKeys.size} unique translation keys`);

    return {
      allKeys: Array.from(allKeys).sort(),
      fileKeyMap
    };
  }

  /**
   * Load default language file
   */
  loadDefaultTranslations() {
    const baseLocale = this.detectBaseLocale();
    if (!baseLocale) {
      console.error('❌ No base locale found');
      return null;
    }

    const baseLocaleFile = path.join(this.localesPath, `${baseLocale}.json`);
    try {
      const content = fs.readFileSync(baseLocaleFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading base locale file (${baseLocaleFile}):`, error.message);
      return null;
    }
  }

  /**
   * Get all translation keys from a nested object
   */
  getAllTranslationKeys(obj, prefix = '') {
    const keys = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.getAllTranslationKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  /**
   * Check if a translation key exists in the translations object
   */
  hasTranslationKey(translations, key) {
    const keys = key.split('.');
    let current = translations;

    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return false;
      }
      current = current[k];
    }

    return current !== undefined && current !== null && current !== '';
  }

  /**
   * Main function to check missing translations
   */
  checkMissingTranslations() {
    console.log('🚀 Starting missing translation check...\n');

    // 1. Scan project for $t() keys
    const { allKeys, fileKeyMap } = this.scanProjectForTKeys();

    // 2. Load default translations
    const defaultTranslations = this.loadDefaultTranslations();
    if (!defaultTranslations) {
      return;
    }

    // 3. Get all existing translation keys
    const baseLocale = this.detectBaseLocale();
    const existingKeys = this.getAllTranslationKeys(defaultTranslations);
    console.log(`📚 Found ${existingKeys.length} keys in ${baseLocale}.json\n`);

    // 4. Find missing keys
    const missingKeys = [];
    const foundKeys = [];

    for (const key of allKeys) {
      if (this.hasTranslationKey(defaultTranslations, key)) {
        foundKeys.push(key);
      } else {
        missingKeys.push(key);
      }
    }

    // 5. Report results
    this.reportResults(missingKeys, foundKeys, fileKeyMap, allKeys);

    return {
      missingKeys,
      foundKeys,
      allKeys,
      fileKeyMap
    };
  }

  /**
   * Report the results
   */
  reportResults(missingKeys, foundKeys, fileKeyMap, allKeys) {
    console.log('=' .repeat(60));
    console.log('📊 TRANSLATION CHECK RESULTS');
    console.log('=' .repeat(60));

    console.log(`\n✅ Keys found in ${baseLocale}.json: ${foundKeys.length}`);
    console.log(`❌ Keys missing in ${baseLocale}.json: ${missingKeys.length}`);
    console.log(`📝 Total keys used in project: ${allKeys.length}`);

    if (missingKeys.length > 0) {
      console.log('\n🔴 MISSING TRANSLATION KEYS:');
      console.log('-' .repeat(40));

      // Group missing keys by file
      const missingByFile = {};
      for (const [file, keys] of Object.entries(fileKeyMap)) {
        const fileMissing = keys.filter(key => missingKeys.includes(key));
        if (fileMissing.length > 0) {
          missingByFile[file] = fileMissing;
        }
      }

      for (const [file, keys] of Object.entries(missingByFile)) {
        console.log(`\n📄 ${file}:`);
        for (const key of keys) {
          console.log(`   ❌ ${key}`);
        }
      }

      console.log('\n📋 ALL MISSING KEYS (for easy copy-paste):');
      console.log('-' .repeat(40));
      missingKeys.forEach(key => {
        console.log(`"${key}": "",`);
      });

      console.log('\n💡 SUGGESTIONS:');
      console.log('-' .repeat(40));
      console.log(`1. Add missing keys to ${baseLocale}.json`);
      console.log('2. Use the vibei18n CLI to manage translations:');
      console.log('   npx vibei18n set en "key.path" "Translation value"');
      console.log('3. Run this check again after adding translations');
    } else {
      console.log('\n🎉 All translation keys are properly defined!');
    }

    // Show some statistics
    console.log('\n📈 STATISTICS:');
    console.log('-' .repeat(40));

    const keysBySection = {};
    allKeys.forEach(key => {
      const section = key.split('.')[0];
      if (!keysBySection[section]) {
        keysBySection[section] = [];
      }
      keysBySection[section].push(key);
    });

    console.log('Keys by section:');
    Object.entries(keysBySection)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([section, keys]) => {
        const missing = keys.filter(key => missingKeys.includes(key)).length;
        const status = missing > 0 ? `(${missing} missing)` : '✅';
        console.log(`   ${section}: ${keys.length} keys ${status}`);
      });
  }
}

// CLI usage
if (process.argv[1].endsWith('check-missing-translations.js')) {
  const projectPath = process.argv[2] || process.cwd();
  const localesPath = process.argv[3] || 'i18n/locales';
  const defaultLocale = process.argv[4] || null; // auto-detect if not specified

  const checker = new MissingTranslationChecker(projectPath, localesPath, defaultLocale);
  checker.checkMissingTranslations();
}

export { MissingTranslationChecker };