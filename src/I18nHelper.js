import fs from 'fs';
import path from 'path';

export class I18nHelper {
  /**
   * Create a new I18nHelper instance
   * @param {string|null} localesDir - Custom locales directory path. If null, uses default i18n/locales
   */
  constructor(localesDir = null) {
    this.localesDir = localesDir || path.join(process.cwd(), 'i18n', 'locales');
    this.locales = this.scanLocales();
  }

  /**
   * Scan the locales directory to get available locales
   * @returns {Array<string>} Array of locale codes
   */
  scanLocales() {
    try {
      if (!fs.existsSync(this.localesDir)) {
        console.warn(`⚠️  Locales directory not found: ${this.localesDir}`);
        return [];
      }

      const files = fs.readdirSync(this.localesDir);
      const locales = files
        .filter(file => {
          // Include .js and .json files, but exclude index.* files
          const ext = path.extname(file);
          const name = path.basename(file, ext);
          return (ext === '.js' || ext === '.json') && !name.startsWith('index');
        })
        .map(file => path.basename(file, path.extname(file)))
        .sort(); // Sort for consistent ordering

      if (locales.length === 0) {
        console.warn(`⚠️  No locale files found in: ${this.localesDir}`);
      }

      return locales;
    } catch (error) {
      console.error(`❌ Error scanning locales directory: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the list of available locales
   * @returns {Array<string>} Array of locale codes
   */
  getLocales() {
    return [...this.locales];
  }

  /**
   * Get the locales directory path
   * @returns {string} The locales directory path
   */
  getLocalesDir() {
    return this.localesDir;
  }

  /**
   * Load a locale file (supports both .js and .json)
   * @param {string} locale - The locale code (e.g., 'en-US')
   * @returns {Object} The parsed content of the locale file
   */
  loadLocale(locale) {
    // Try .json first, then .js
    const jsonPath = path.join(this.localesDir, `${locale}.json`);
    const jsPath = path.join(this.localesDir, `${locale}.js`);
    
    if (fs.existsSync(jsonPath)) {
      try {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (error) {
        console.error(`❌ Error parsing JSON file ${locale}.json: ${error.message}`);
        return null;
      }
    } else if (fs.existsSync(jsPath)) {
      console.warn(`⚠️  JS files are detected but read-only for ${locale}. Editing operations will create/update .json files.`);
      try {
        // For now, we'll read JS files as text and try to extract the content
        // This is a simple implementation - in a real scenario you might want to use a proper parser
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Try to extract module.exports or export default content
        if (jsContent.includes('module.exports')) {
          // CommonJS format - this is a simple regex, not a full parser
          const match = jsContent.match(/module\.exports\s*=\s*(\{[\s\S]*\});?\s*$/m);
          if (match) {
            return JSON.parse(match[1]);
          }
        } else if (jsContent.includes('export default')) {
          // ES module format - extract the default export object
          const match = jsContent.match(/export\s+default\s+(\{[\s\S]*\});?\s*$/m);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
        
        console.warn(`⚠️  Could not parse JS file ${locale}.js. Please use .json format for full support.`);
        return null;
      } catch (error) {
        console.error(`❌ Error reading JS file ${locale}.js: ${error.message}`);
        return null;
      }
    } else {
      console.error(`❌ Locale file not found: ${locale}.json or ${locale}.js`);
      return null;
    }
  }

  /**
   * Save a locale file
   * @param {string} locale - The locale code
   * @param {Object} content - The content to save
   */
  saveLocale(locale, content) {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`✅ Updated ${locale}.json`);
  }

  /**
   * Get a translation value by path
   * @param {string} locale - The locale code
   * @param {string} path - The dot-separated path (e.g., 'compressJpg.hero.title')
   * @returns {*} The value at the specified path
   */
  get(locale, path) {
    const content = this.loadLocale(locale);
    if (!content) return null;

    const keys = path.split('.');
    let current = content;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Set a translation value by path
   * @param {string} locale - The locale code
   * @param {string} path - The dot-separated path
   * @param {*} value - The value to set
   * @param {boolean} skipIfExists - Skip if the key already exists (default: false)
   */
  set(locale, path, value, skipIfExists = false) {
    const content = this.loadLocale(locale);
    if (!content) return false;

    const keys = path.split('.');
    let current = content;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    
    // Check if should skip
    if (skipIfExists && lastKey in current) {
      console.log(`ℹ️  ${locale}: ${path} already exists, skipping`);
      return false;
    }
    
    // Set the value
    current[lastKey] = value;
    this.saveLocale(locale, content);
    return true;
  }

  /**
   * Set translations for multiple locales at once
   * @param {Object} translations - Object with locale codes as keys and values to set
   * @param {string} path - The dot-separated path
   * @param {boolean} skipIfExists - Skip if the key already exists
   */
  setMultiple(translations, path, skipIfExists = false) {
    const results = {};
    for (const [locale, value] of Object.entries(translations)) {
      if (this.locales.includes(locale)) {
        results[locale] = this.set(locale, path, value, skipIfExists);
      } else {
        console.warn(`⚠️  Unknown locale: ${locale}`);
        results[locale] = false;
      }
    }
    return results;
  }

  /**
   * Get translations from all locales for a specific path
   * @param {string} path - The dot-separated path
   * @returns {Object} Object with locale codes as keys and translation values
   */
  getAll(path) {
    const results = {};
    for (const locale of this.locales) {
      const value = this.get(locale, path);
      if (value !== null) {
        results[locale] = value;
      }
    }
    return results;
  }

  /**
   * Check if a translation key exists
   * @param {string} locale - The locale code
   * @param {string} path - The dot-separated path
   * @returns {boolean} True if the key exists
   */
  has(locale, path) {
    return this.get(locale, path) !== null;
  }

  /**
   * Check which locales are missing a translation key
   * @param {string} path - The dot-separated path
   * @returns {Array} Array of locale codes that don't have the key
   */
  getMissing(path) {
    const missing = [];
    for (const locale of this.locales) {
      if (!this.has(locale, path)) {
        missing.push(locale);
      }
    }
    return missing;
  }

  /**
   * Copy a translation from one locale to others
   * @param {string} sourceLocale - The source locale
   * @param {string} path - The dot-separated path
   * @param {Array} targetLocales - Array of target locale codes (default: all except source)
   */
  copy(sourceLocale, path, targetLocales = null) {
    const sourceValue = this.get(sourceLocale, path);
    if (sourceValue === null) {
      console.error(`❌ Source path not found: ${path} in ${sourceLocale}`);
      return false;
    }

    const targets = targetLocales || this.locales.filter(l => l !== sourceLocale);
    const results = {};
    
    for (const locale of targets) {
      results[locale] = this.set(locale, path, sourceValue);
    }
    
    return results;
  }

  /**
   * Merge an object of translations into a locale
   * @param {string} locale - The locale code
   * @param {Object} translations - Object with paths as keys and translations as values
   * @param {boolean} skipIfExists - Skip if keys already exist
   */
  merge(locale, translations, skipIfExists = false) {
    for (const [path, value] of Object.entries(translations)) {
      this.set(locale, path, value, skipIfExists);
    }
  }

  /**
   * Batch update multiple locales with different translations
   * @param {Object} updates - Object with locale codes as keys, each containing path-value pairs
   * @param {boolean} skipIfExists - Skip if keys already exist
   * 
   * Example:
   * helper.batchUpdate({
   *   'en-US': { 'page.title': 'Title', 'page.desc': 'Description' },
   *   'zh-hans': { 'page.title': '标题', 'page.desc': '描述' }
   * })
   */
  batchUpdate(updates, skipIfExists = false) {
    for (const [locale, translations] of Object.entries(updates)) {
      if (this.locales.includes(locale)) {
        console.log(`📝 Updating ${locale}...`);
        this.merge(locale, translations, skipIfExists);
      } else {
        console.warn(`⚠️  Unknown locale: ${locale}`);
      }
    }
  }

  /**
   * Get statistics about translation completeness
   * @returns {Object} Statistics for each locale
   */
  getStats() {
    const baseLocale = 'en-US';
    const baseContent = this.loadLocale(baseLocale);
    if (!baseContent) return null;

    const stats = {};
    const basePaths = this._getAllPaths(baseContent);
    
    for (const locale of this.locales) {
      if (locale === baseLocale) continue;
      
      const missing = [];
      for (const path of basePaths) {
        if (!this.has(locale, path)) {
          missing.push(path);
        }
      }
      
      stats[locale] = {
        total: basePaths.length,
        complete: basePaths.length - missing.length,
        missing: missing.length,
        percentage: ((basePaths.length - missing.length) / basePaths.length * 100).toFixed(1) + '%',
        missingPaths: missing
      };
    }
    
    return stats;
  }

  /**
   * Check translation completeness with detailed reporting
   * Enhanced version of check-translations.js functionality
   * @param {boolean} detailed - Show detailed missing keys breakdown
   * @returns {Object} Comprehensive check results
   */
  checkTranslations(detailed = false) {
    console.log('🔍 Checking translation completeness...\n');
    
    const baseLocale = 'en-US';
    const baseContent = this.loadLocale(baseLocale);
    if (!baseContent) {
      console.error('❌ en-US.json not found!');
      return null;
    }

    const basePaths = this._getAllPaths(baseContent);
    console.log(`📋 Found ${basePaths.length} keys in ${baseLocale}.json\n`);

    const results = {
      totalKeys: basePaths.length,
      locales: {},
      summary: {
        total: 0,
        complete: 0,
        incomplete: 0,
        totalMissing: 0
      },
      sectionsAnalysis: {},
      suggestions: []
    };

    const missingByLocale = {};
    let totalMissing = 0;

    // Check each locale
    for (const locale of this.locales) {
      if (locale === baseLocale) continue;

      const content = this.loadLocale(locale);
      if (!content) {
        console.error(`❌ Error reading ${locale}.json`);
        continue;
      }

      const missing = [];
      for (const path of basePaths) {
        if (!this.has(locale, path)) {
          missing.push(path);
        }
      }

      results.locales[locale] = {
        total: basePaths.length,
        complete: basePaths.length - missing.length,
        missing: missing.length,
        percentage: ((basePaths.length - missing.length) / basePaths.length * 100).toFixed(1) + '%',
        missingPaths: missing
      };

      if (missing.length > 0) {
        console.log(`🔴 ${locale}: Missing ${missing.length} keys`);
        missingByLocale[locale] = missing;
        totalMissing += missing.length;

        if (detailed) {
          // Group missing keys by section
          const groupedKeys = {};
          for (const key of missing) {
            const section = key.split('.')[0];
            if (!groupedKeys[section]) {
              groupedKeys[section] = [];
            }
            groupedKeys[section].push(key);
          }

          for (const [section, keys] of Object.entries(groupedKeys)) {
            console.log(`   📂 ${section}: ${keys.length} missing`);
            if (detailed) {
              keys.slice(0, 5).forEach(key => console.log(`      - ${key}`));
              if (keys.length > 5) {
                console.log(`      ... and ${keys.length - 5} more`);
              }
            }
          }
          console.log('');
        }
      } else {
        console.log(`✅ ${locale}: Complete`);
      }

      results.summary.total++;
    }

    results.summary.complete = results.summary.total - Object.keys(missingByLocale).length;
    results.summary.incomplete = Object.keys(missingByLocale).length;
    results.summary.totalMissing = totalMissing;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total locales checked: ${results.summary.total}`);
    console.log(`   Complete locales: ${results.summary.complete}`);
    console.log(`   Incomplete locales: ${results.summary.incomplete}`);
    console.log(`   Total missing keys: ${results.summary.totalMissing}`);

    if (totalMissing > 0) {
      // Most commonly missing sections
      console.log('\n🔧 Most commonly missing sections:');
      const sectionCounts = {};
      Object.values(missingByLocale).flat().forEach(key => {
        const section = key.split('.')[0];
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      });

      const topSections = Object.entries(sectionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      topSections.forEach(([section, count]) => {
        console.log(`   ${section}: ${count} missing across locales`);
      });

      results.sectionsAnalysis = sectionCounts;

      // Generate suggestions
      console.log('\n💡 Suggestions:');
      const prioritySections = ['homepage.seo', 'homepage.cta', 'footer.tools', 'creditsPage'];
      
      for (const section of prioritySections) {
        const affectedLocales = Object.entries(missingByLocale)
          .filter(([, keys]) => keys.some(key => key.startsWith(section)))
          .map(([locale]) => locale);
        
        if (affectedLocales.length > 0) {
          const suggestion = `${section} missing in: ${affectedLocales.join(', ')}`;
          console.log(`   🎯 ${suggestion}`);
          results.suggestions.push(suggestion);
        }
      }

      console.log('\n📝 Next steps:');
      console.log('   1. Use vibei18n to add missing translations:');
      console.log('      npx vibei18n set <locale> <path> <value>');
      console.log('   2. Use batchUpdate for multiple translations');
      console.log('   3. Re-run check: npx vibei18n check');
    } else {
      console.log('\n🎉 All translations are complete!');
    }

    return results;
  }

  /**
   * Find and report duplicate translation values across locales
   * @returns {Object} Report of potential duplicates
   */
  findDuplicates() {
    console.log('🔍 Checking for duplicate translations...\n');
    
    const baseContent = this.loadLocale('en-US');
    if (!baseContent) return null;

    const basePaths = this._getAllPaths(baseContent);
    const duplicates = {};

    for (const path of basePaths) {
      const values = {};
      
      for (const locale of this.locales) {
        const value = this.get(locale, path);
        if (value) {
          if (!values[value]) {
            values[value] = [];
          }
          values[value].push(locale);
        }
      }

      // Find values shared across multiple locales
      Object.entries(values).forEach(([value, locales]) => {
        if (locales.length > 1) {
          duplicates[path] = { value, locales };
        }
      });
    }

    if (Object.keys(duplicates).length > 0) {
      console.log('⚠️  Potential duplicate translations found:');
      Object.entries(duplicates).forEach(([path, { value, locales }]) => {
        console.log(`   ${path}:`);
        console.log(`     Value: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
        console.log(`     Locales: ${locales.join(', ')}\n`);
      });
    } else {
      console.log('✅ No duplicate translations found.');
    }

    return duplicates;
  }

  /**
   * Check for hardcoded strings in Vue and JS files
   * @param {string} projectDir - The project directory to scan (defaults to current working directory)
   * @param {Object} options - Options for the scan
   * @returns {Array} Array of hardcoded string findings
   */
  checkHardcodedStrings(projectDir = process.cwd(), options = {}) {
    const {
      extensions = ['.vue', '.jsx'],
      excludeDirs = ['node_modules', '.git', 'dist', 'build', '.nuxt', '.output'],
      excludeFiles = [],
      minLength = 2,
      maxLength = 200,
      includeComments = false,
      verbose = false
    } = options;

    console.log('🔍 Scanning for hardcoded strings...');
    console.log(`📁 Directory: ${projectDir}`);
    console.log(`📄 Extensions: ${extensions.join(', ')}`);
    
    const findings = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(projectDir, fullPath);
          
          // Skip excluded directories
          if (excludeDirs.some(excluded => relativePath.includes(excluded))) {
            continue;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            // Check if file has target extension
            const ext = path.extname(item);
            if (extensions.includes(ext) && !excludeFiles.includes(item)) {
              this._scanFile(fullPath, relativePath, findings, { minLength, maxLength, includeComments, verbose });
            }
          }
        }
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️  Could not scan directory ${dir}: ${error.message}`);
        }
      }
    };

    scanDirectory(projectDir);
    
    // Sort findings by file and line number
    findings.sort((a, b) => {
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      return a.line - b.line;
    });

    this._reportHardcodedFindings(findings, verbose);
    
    return findings;
  }

  /**
   * Helper function to get all paths in an object
   * @private
   */
  _getAllPaths(obj, prefix = '') {
    const paths = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...this._getAllPaths(value, path));
      } else {
        paths.push(path);
      }
    }
    
    return paths;
  }

  /**
   * Scan a single file for hardcoded strings
   * @private
   */
  _scanFile(filePath, relativePath, findings, options) {
    const { minLength, maxLength, includeComments, verbose } = options;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const lineNumber = lineNum + 1;
        
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Find hardcoded strings
        const stringFindings = this._extractStringsFromLine(line, lineNumber, relativePath, {
          minLength,
          maxLength,
          includeComments
        });
        
        findings.push(...stringFindings);
      }
    } catch (error) {
      if (verbose) {
        console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Extract hardcoded strings from a line of code
   * @private
   */
  _extractStringsFromLine(line, lineNumber, filePath, options) {
    const { minLength, maxLength, includeComments } = options;
    const findings = [];
    
    // Skip lines that are already using i18n
    if (this._isI18nLine(line)) {
      return findings;
    }
    
    // Skip comments unless specified
    if (!includeComments && this._isCommentLine(line)) {
      return findings;
    }
    
    // For Vue files and JSX/TSX files, focus on template content between tags
    if (filePath.endsWith('.vue') || filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      return this._extractVueTemplateContent(line, lineNumber, filePath, options);
    }
    
    // For other files, check quoted strings but skip attributes
    return this._extractJSContent(line, lineNumber, filePath, options);
  }

  /**
   * Extract content from Vue template tags (not attributes)
   * @private
   */
  _extractVueTemplateContent(line, lineNumber, filePath, options) {
    const { minLength, maxLength } = options;
    const findings = [];
    
    // Pattern to match text content between HTML tags
    // This captures text that's not inside attribute quotes
    const tagContentPatterns = [
      // Text between opening and closing tags: <tag>text</tag>
      />([^<]+)</g,
      // Text in self-closing scenarios or mixed content
      // But be careful not to match attribute values
    ];
    
    for (const pattern of tagContentPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const textContent = match[1].trim();
        const startCol = match.index + 1;
        
        // Skip empty content or whitespace
        if (!textContent || textContent.length < minLength || textContent.length > maxLength) {
          continue;
        }
        
        // Skip Vue template expressions
        if (textContent.includes('{{') || textContent.includes('}}') || textContent.startsWith('v-')) {
          continue;
        }
        
        // Skip content inside <code> or <pre> tags
        if (this._isInsideCodeOrPreTag(line, startCol)) {
          continue;
        }
        
        // Check if this looks like user-facing text
        if (this._isUserFacingText(textContent)) {
          findings.push({
            file: filePath,
            line: lineNumber,
            column: startCol,
            text: textContent,
            fullMatch: match[0],
            context: line.trim(),
            category: 'template-content',
            severity: 'high'
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Extract content from JS/TS files
   * @private
   */
  _extractJSContent(line, lineNumber, filePath, options) {
    const { minLength, maxLength } = options;
    const findings = [];
    
    // Only look for strings that are clearly not attributes or technical values
    const patterns = [
      // Double quoted strings
      /"([^"\\]*(\\.[^"\\]*)*)"/g,
      // Single quoted strings  
      /'([^'\\]*(\\.[^'\\]*)*)'/g,
      // Template literals (basic)
      /`([^`\\]*(\\.[^`\\]*)*)`/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const stringContent = match[1];
        const startCol = match.index;
        
        // Skip if string is too short or too long
        if (stringContent.length < minLength || stringContent.length > maxLength) {
          continue;
        }
        
        // Skip if this looks like an attribute or technical value
        if (this._isAttributeContext(line, startCol)) {
          continue;
        }
        
        // Skip content inside <code> or <pre> tags (for JSX/TSX files)
        if (this._isInsideCodeOrPreTag(line, startCol)) {
          continue;
        }
        
        // Skip certain patterns that are likely not user-facing text
        if (this._shouldSkipString(stringContent, line)) {
          continue;
        }
        
        // Check if this looks like user-facing text
        if (this._isUserFacingText(stringContent)) {
          findings.push({
            file: filePath,
            line: lineNumber,
            column: startCol + 1,
            text: stringContent,
            fullMatch: match[0],
            context: line.trim(),
            category: this._categorizeString(stringContent, line),
            severity: this._getSeverity(stringContent, line)
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Check if a line is already using i18n
   * @private
   */
  _isI18nLine(line) {
    const i18nPatterns = [
      /\$t\s*\(/,           // $t()
      /\{\{\s*\$t\s*\(/,    // {{ $t()
      /useI18n\s*\(/,       // useI18n()
      /\.t\s*\(/,           // .t()
      /i18n\./,             // i18n.
      /\$i18n\./,           // $i18n.
      /t\s*\(/              // t() function
    ];
    
    return i18nPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Check if a line is a comment
   * @private
   */
  _isCommentLine(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*') ||
           trimmed.startsWith('<!--');
  }

  /**
   * Check if text is inside code or pre tags
   * @private
   */
  _isInsideCodeOrPreTag(line, position) {
    // Get the part of the line before the current position
    const beforeText = line.substring(0, position);
    // Get the part of the line after the current position
    const afterText = line.substring(position);
    
    // Check for code tags - look for opening and closing tags
    const lastCodeOpen = Math.max(
      beforeText.lastIndexOf('<code>'),
      beforeText.lastIndexOf('<code ')
    );
    const lastCodeClose = beforeText.lastIndexOf('</code>');
    const nextCodeClose = afterText.indexOf('</code>');
    
    // Check for pre tags - look for opening and closing tags
    const lastPreOpen = Math.max(
      beforeText.lastIndexOf('<pre>'),
      beforeText.lastIndexOf('<pre ')
    );
    const lastPreClose = beforeText.lastIndexOf('</pre>');
    const nextPreClose = afterText.indexOf('</pre>');
    
    // If we're inside an open code tag
    if (lastCodeOpen !== -1 && lastCodeOpen > lastCodeClose) {
      // And there's a closing tag ahead on this line or we're between tags
      if (nextCodeClose !== -1 || lastCodeClose === -1) {
        return true;
      }
    }
    
    // If we're inside an open pre tag
    if (lastPreOpen !== -1 && lastPreOpen > lastPreClose) {
      // And there's a closing tag ahead on this line or we're between tags
      if (nextPreClose !== -1 || lastPreClose === -1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a string is in attribute context (should be skipped)
   * @private
   */
  _isAttributeContext(line, position) {
    // Get the part of the line before the string
    const beforeString = line.substring(0, position);
    
    // Check if we're inside an HTML attribute
    const lastOpenTag = beforeString.lastIndexOf('<');
    const lastCloseTag = beforeString.lastIndexOf('>');
    
    // If we're inside a tag (after < but before >)
    if (lastOpenTag > lastCloseTag) {
      return true;
    }
    
    // Check for common attribute patterns
    const attributePatterns = [
      /\s(class|className|id|style|src|href|alt|title|data-[\w-]+|v-[\w-]+|:[\w-]+|@[\w-]+)\s*=\s*["']?$/,
      /\s(to|from|name|type|value|placeholder|aria-[\w-]+)\s*=\s*["']?$/
    ];
    
    return attributePatterns.some(pattern => pattern.test(beforeString));
  }

  /**
   * Determine if a string should be skipped
   * @private
   */
  _shouldSkipString(str, line) {
    // Skip URLs
    if (/^https?:\/\//.test(str)) return true;
    
    // Skip file paths
    if (/^[\.\/\\]/.test(str) || str.includes('/') && str.includes('.')) return true;
    
    // Skip technical terms and formats
    if (/^[A-Z_]+$/.test(str)) return true; // ALL_CAPS constants
    if (/^[a-z][a-zA-Z]*$/.test(str) && str.length < 4) return true; // Short camelCase
    
    // Skip numbers and technical values
    if (/^\d+(\.\d+)?(%|px|em|rem|vh|vw|ms|s)?$/.test(str)) return true;
    
    // Skip colors
    if (/^#[0-9a-fA-F]{3,8}$/.test(str)) return true;
    
    // Skip event names
    if (/^(click|change|input|submit|load|error|resize|scroll)$/.test(str)) return true;
    
    // Skip HTTP methods and status
    if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/.test(str)) return true;
    
    // Skip common technical terms
    const technicalTerms = [
      'utf8', 'utf-8', 'json', 'xml', 'html', 'css', 'js', 'ts',
      'vue', 'nuxt', 'node', 'npm', 'yarn', 'webpack', 'vite',
      'localhost', 'true', 'false', 'null', 'undefined',
      'image', 'video', 'audio', 'text', 'application',
      'jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'avif',
      'error', 'warning', 'info', 'debug', 'log'
    ];
    
    if (technicalTerms.includes(str.toLowerCase())) return true;
    
    // Skip single characters
    if (str.length === 1) return true;
    
    return false;
  }

  /**
   * Check if string looks like user-facing text
   * @private
   */
  _isUserFacingText(str) {
    // Must contain letters
    if (!/[a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(str)) {
      return false;
    }
    
    // Likely user-facing if it contains spaces and multiple words
    if (/\s/.test(str) && str.split(/\s+/).length > 1) {
      return true;
    }
    
    // Likely user-facing if it contains common UI words
    const uiWords = [
      'upload', 'download', 'submit', 'cancel', 'save', 'delete', 'edit', 'create',
      'login', 'logout', 'register', 'search', 'filter', 'sort', 'refresh',
      'next', 'previous', 'back', 'forward', 'home', 'settings', 'profile',
      'help', 'about', 'contact', 'privacy', 'terms', 'faq',
      'loading', 'success', 'failed', 'complete', 'processing',
      'welcome', 'hello', 'goodbye', 'thanks', 'please', 'sorry'
    ];
    
    const lowerStr = str.toLowerCase();
    if (uiWords.some(word => lowerStr.includes(word))) {
      return true;
    }
    
    // Chinese, Japanese, Korean text is likely user-facing
    if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(str)) {
      return true;
    }
    
    // Longer strings with mixed case are likely user-facing
    if (str.length > 6 && /[a-z]/.test(str) && /[A-Z]/.test(str)) {
      return true;
    }
    
    return false;
  }

  /**
   * Categorize the type of string
   * @private
   */
  _categorizeString(str, line) {
    if (line.includes('<title>') || line.includes('title:') || line.includes('title =')) {
      return 'title';
    }
    if (line.includes('placeholder') || line.includes('hint')) {
      return 'placeholder';
    }
    if (line.includes('button') || line.includes('btn') || line.includes('click')) {
      return 'button';
    }
    if (line.includes('label') || line.includes('text')) {
      return 'label';
    }
    if (line.includes('error') || line.includes('warning')) {
      return 'message';
    }
    if (line.includes('description') || line.includes('desc')) {
      return 'description';
    }
    
    return 'text';
  }

  /**
   * Get severity level for the finding
   * @private
   */
  _getSeverity(str, line) {
    // High priority - user interface elements
    if (line.includes('title') || line.includes('button') || line.includes('label')) {
      return 'high';
    }
    
    // Medium priority - content text
    if (str.length > 20 || /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(str)) {
      return 'medium';
    }
    
    // Low priority - short text
    return 'low';
  }

  /**
   * Report hardcoded string findings
   * @private
   */
  _reportHardcodedFindings(findings, verbose) {
    if (findings.length === 0) {
      console.log('✅ No hardcoded strings found!');
      return;
    }

    console.log(`\n🔴 Found ${findings.length} potential hardcoded strings:\n`);

    // Group by file
    const fileGroups = {};
    findings.forEach(finding => {
      if (!fileGroups[finding.file]) {
        fileGroups[finding.file] = [];
      }
      fileGroups[finding.file].push(finding);
    });

    // Report by severity
    const severityOrder = ['high', 'medium', 'low'];
    const severityColors = {
      high: '🔴',
      medium: '🟡', 
      low: '🟢'
    };

    for (const [file, fileFindings] of Object.entries(fileGroups)) {
      console.log(`📄 ${file}:`);
      
      const sortedFindings = fileFindings.sort((a, b) => {
        const aIndex = severityOrder.indexOf(a.severity);
        const bIndex = severityOrder.indexOf(b.severity);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.line - b.line;
      });

      for (const finding of sortedFindings) {
        const icon = severityColors[finding.severity] || '⚪';
        console.log(`   ${icon} Line ${finding.line}:${finding.column} [${finding.category}] "${finding.text}"`);
        
        if (verbose) {
          console.log(`      Context: ${finding.context}`);
        }
      }
      console.log('');
    }

    // Summary
    const summary = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Summary:');
    for (const severity of severityOrder) {
      if (summary[severity]) {
        const icon = severityColors[severity];
        console.log(`   ${icon} ${severity}: ${summary[severity]} items`);
      }
    }
    
    console.log('\n💡 Suggestions:');
    console.log('   1. Convert high priority items to i18n first');
    console.log('   2. Use $t() or {{ $t() }} for Vue templates');
    console.log('   3. Use t() function in script sections');
    console.log('   4. Add translations to locale files');
  }
}

export default I18nHelper;