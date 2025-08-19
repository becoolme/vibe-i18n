import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { I18nHelper } from '../src/I18nHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary test directory
const testDir = path.join(__dirname, 'fixtures');
const localesDir = path.join(testDir, 'locales');

// Test data
const enUSData = {
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "navigation": {
    "home": "Home",
    "about": "About"
  }
};

const zhHansData = {
  "common": {
    "loading": "加载中...",
    "error": "发生错误"
  },
  "navigation": {
    "home": "首页"
    // Missing "about" key for testing
  }
};

function setupTestFiles() {
  // Clean up and create test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(localesDir, { recursive: true });

  // Create test locale files
  fs.writeFileSync(
    path.join(localesDir, 'en-US.json'),
    JSON.stringify(enUSData, null, 2)
  );
  fs.writeFileSync(
    path.join(localesDir, 'zh-hans.json'),
    JSON.stringify(zhHansData, null, 2)
  );
}

function cleanupTestFiles() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
}

function suppressConsoleOutput(fn) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};

  try {
    return fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
}

describe('I18nHelper', () => {
  let helper;

  // Setup before all tests
  setupTestFiles();
  helper = suppressConsoleOutput(() => new I18nHelper(localesDir));

  test('should initialize with custom locales directory', () => {
    assert.strictEqual(helper.getLocalesDir(), localesDir);
    assert.ok(helper.getLocales().includes('en-US'));
    assert.ok(helper.getLocales().includes('zh-hans'));
  });

  test('should scan locales correctly', () => {
    const locales = helper.getLocales();
    assert.strictEqual(locales.length, 2);
    assert.ok(locales.includes('en-US'));
    assert.ok(locales.includes('zh-hans'));
  });

  test('should load locale file correctly', () => {
    const content = helper.loadLocale('en-US');
    assert.deepStrictEqual(content, enUSData);
  });

  test('should get translation value by path', () => {
    const value = helper.get('en-US', 'common.loading');
    assert.strictEqual(value, 'Loading...');

    const nestedValue = helper.get('en-US', 'navigation.home');
    assert.strictEqual(nestedValue, 'Home');

    const nonExistent = helper.get('en-US', 'non.existent.path');
    assert.strictEqual(nonExistent, null);
  });

  test('should set translation value by path', () => {
    suppressConsoleOutput(() => helper.set('en-US', 'test.new.key', 'Test Value'));
    const value = helper.get('en-US', 'test.new.key');
    assert.strictEqual(value, 'Test Value');
  });

  test('should skip setting if key exists when skipIfExists is true', () => {
    const originalValue = helper.get('en-US', 'common.loading');
    const result = suppressConsoleOutput(() => helper.set('en-US', 'common.loading', 'New Loading...', true));
    assert.strictEqual(result, false);

    const unchangedValue = helper.get('en-US', 'common.loading');
    assert.strictEqual(unchangedValue, originalValue);
  });

  test('should check if translation exists', () => {
    assert.strictEqual(helper.has('en-US', 'common.loading'), true);
    assert.strictEqual(helper.has('en-US', 'non.existent'), false);
    assert.strictEqual(helper.has('zh-hans', 'navigation.about'), false);
  });

  test('should get all translations for a path', () => {
    const allValues = helper.getAll('common.loading');
    assert.strictEqual(allValues['en-US'], 'Loading...');
    assert.strictEqual(allValues['zh-hans'], '加载中...');
  });

  test('should find missing translations', () => {
    const missing = helper.getMissing('navigation.about');
    assert.ok(missing.includes('zh-hans'));
    assert.strictEqual(missing.length, 1);

    const noMissing = helper.getMissing('common.loading');
    assert.strictEqual(noMissing.length, 0);
  });

  test('should copy translation from one locale to others', () => {
    suppressConsoleOutput(() => helper.copy('en-US', 'navigation.about', ['zh-hans']));
    const copiedValue = helper.get('zh-hans', 'navigation.about');
    assert.strictEqual(copiedValue, 'About');
  });

  test('should set multiple locales at once', () => {
    const translations = {
      'en-US': 'Contact Us',
      'zh-hans': '联系我们'
    };

    suppressConsoleOutput(() => helper.setMultiple(translations, 'navigation.contact'));

    assert.strictEqual(helper.get('en-US', 'navigation.contact'), 'Contact Us');
    assert.strictEqual(helper.get('zh-hans', 'navigation.contact'), '联系我们');
  });

  test('should batch update multiple translations', () => {
    const updates = {
      'en-US': {
        'footer.copyright': '© 2024 Test',
        'footer.terms': 'Terms of Service'
      },
      'zh-hans': {
        'footer.copyright': '© 2024 测试',
        'footer.terms': '服务条款'
      }
    };

    suppressConsoleOutput(() => helper.batchUpdate(updates));

    assert.strictEqual(helper.get('en-US', 'footer.copyright'), '© 2024 Test');
    assert.strictEqual(helper.get('zh-hans', 'footer.terms'), '服务条款');
  });

  test('should get translation statistics', () => {
    const stats = helper.getStats();
    assert.ok(stats);
    assert.ok(stats['zh-hans']);
    assert.ok(stats['zh-hans'].missing > 0); // Should have missing translations
    assert.ok(stats['zh-hans'].percentage);
  });

  test('should check translation completeness', () => {
    const results = suppressConsoleOutput(() => helper.checkTranslations());

    assert.ok(results);
    assert.ok(results.totalKeys > 0);
    assert.ok(results.locales['zh-hans']);
    assert.ok(results.locales['zh-hans'].missing > 0);
  });

  test('should handle non-existent locale gracefully', () => {
    const value = suppressConsoleOutput(() => helper.get('non-existent', 'some.path'));
    assert.strictEqual(value, null);

    const result = suppressConsoleOutput(() => helper.set('non-existent', 'some.path', 'value'));
    assert.strictEqual(result, false);
  });

  test('should handle malformed JSON gracefully', async () => {
    // Create a malformed JSON file
    const malformedPath = path.join(localesDir, 'malformed.json');
    fs.writeFileSync(malformedPath, '{ invalid json }');

    // Create new helper to scan the malformed file
    const testHelper = suppressConsoleOutput(() => new I18nHelper(localesDir));
    const content = suppressConsoleOutput(() => testHelper.loadLocale('malformed'));
    assert.strictEqual(content, null);

    // Cleanup
    fs.unlinkSync(malformedPath);
  });

  test('should find duplicates across locales', () => {
    // Set same value for different locales
    suppressConsoleOutput(() => helper.set('en-US', 'test.duplicate', 'Same Value'));
    suppressConsoleOutput(() => helper.set('zh-hans', 'test.duplicate', 'Same Value'));

    const duplicates = suppressConsoleOutput(() => helper.findDuplicates());

    assert.ok(duplicates);
    assert.ok(duplicates['test.duplicate']);
    assert.ok(duplicates['test.duplicate'].locales.length >= 2);
  });

  test('should skip content inside code and pre tags', () => {
    // Create test files with code/pre tags
    const testDir = path.join(__dirname, 'code-tag-test');
    const testVueFile = path.join(testDir, 'test.vue');

    const vueContent = `<template>
  <div>
    <h1>This should be detected</h1>
    <code>This should be ignored</code>
    <pre>This should also be ignored</pre>
    <span>This should be detected too</span>
  </div>
</template>`;

    try {
      // Setup test files
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testVueFile, vueContent);

      const testHelper = suppressConsoleOutput(() => new I18nHelper());
      const findings = suppressConsoleOutput(() => testHelper.checkHardcodedStrings(testDir, {
        extensions: ['.vue'],
        verbose: false
      }));

      // Should detect the h1 and span content
      const detectedTexts = findings.map(f => f.text);
      assert.ok(detectedTexts.includes('This should be detected'));
      assert.ok(detectedTexts.includes('This should be detected too'));

      // Should NOT detect the code/pre content
      assert.ok(!detectedTexts.includes('This should be ignored'));
      assert.ok(!detectedTexts.includes('This should also be ignored'));

    } finally {
      // Cleanup
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    }
  });

  test('should convert string to object when setting nested values', () => {
    // Create a test locale with string values
    const testLocaleDir = path.join(__dirname, 'string-conversion-test');
    const testLocalesDir = path.join(testLocaleDir, 'locales');

    if (fs.existsSync(testLocaleDir)) {
      fs.rmSync(testLocaleDir, { recursive: true });
    }
    fs.mkdirSync(testLocalesDir, { recursive: true });

    // Create initial data with string values
    const initialData = {
      "simple": "Simple string",
      "nested": {
        "level1": "Level 1 string"
      },
      "another": "Another string"
    };

    fs.writeFileSync(
      path.join(testLocalesDir, 'test-locale.json'),
      JSON.stringify(initialData, null, 2)
    );

    const testHelper = new I18nHelper(testLocalesDir);

    // Test 1: Convert top-level string to object
    let warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    const result1 = testHelper.set('test-locale', 'simple.child.grandchild', 'New value');
    assert.strictEqual(result1, true);
    assert.ok(warnings.some(w => w.includes('Converting "simple" from string to object')));

    // Verify the structure
    const updated1 = testHelper.get('test-locale', 'simple.child.grandchild');
    assert.strictEqual(updated1, 'New value');

    // Test 2: Convert nested string to object
    warnings = [];
    const result2 = testHelper.set('test-locale', 'nested.level1.level2', 'Another value');
    assert.strictEqual(result2, true);
    assert.ok(warnings.some(w => w.includes('Converting "nested.level1" from string to object')));

    // Verify the structure
    const updated2 = testHelper.get('test-locale', 'nested.level1.level2');
    assert.strictEqual(updated2, 'Another value');

    // Test 3: Convert multiple levels
    warnings = [];
    const result3 = testHelper.set('test-locale', 'another.b.c.d', 'Deep value');
    assert.strictEqual(result3, true);
    assert.ok(warnings.some(w => w.includes('Converting "another" from string to object')));

    // Verify the structure
    const updated3 = testHelper.get('test-locale', 'another.b.c.d');
    assert.strictEqual(updated3, 'Deep value');

    console.warn = originalWarn;

    // Cleanup
    if (fs.existsSync(testLocaleDir)) {
      fs.rmSync(testLocaleDir, { recursive: true });
    }
  });

  test('should convert string to object in setMultiple method', () => {
    // Create a test locale with string values
    const testLocaleDir = path.join(__dirname, 'multiple-conversion-test');
    const testLocalesDir = path.join(testLocaleDir, 'locales');

    if (fs.existsSync(testLocaleDir)) {
      fs.rmSync(testLocaleDir, { recursive: true });
    }
    fs.mkdirSync(testLocalesDir, { recursive: true });

    // Create initial data with string values
    const initialData = {
      "page": "Page string",
      "section": {
        "title": "Section title"
      }
    };

    fs.writeFileSync(
      path.join(testLocalesDir, 'en-US.json'),
      JSON.stringify(initialData, null, 2)
    );

    fs.writeFileSync(
      path.join(testLocalesDir, 'zh-hans.json'),
      JSON.stringify(initialData, null, 2)
    );

    const testHelper = new I18nHelper(testLocalesDir);

    // Test setMultiple with string to object conversion
    let warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    const translations = {
      'en-US': 'English nested value',
      'zh-hans': '中文嵌套值'
    };

    const results = testHelper.setMultiple(translations, 'page.nested.deep');
    assert.strictEqual(results['en-US'], true);
    assert.strictEqual(results['zh-hans'], true);

    // Should have warnings for both locales
    assert.ok(warnings.some(w => w.includes('en-US') && w.includes('Converting "page" from string to object')));
    assert.ok(warnings.some(w => w.includes('zh-hans') && w.includes('Converting "page" from string to object')));

    // Verify the values were set correctly
    const enValue = testHelper.get('en-US', 'page.nested.deep');
    const zhValue = testHelper.get('zh-hans', 'page.nested.deep');
    assert.strictEqual(enValue, 'English nested value');
    assert.strictEqual(zhValue, '中文嵌套值');

    // Test converting at deeper level
    warnings = [];
    const results2 = testHelper.setMultiple({
      'en-US': 'Deep English',
      'zh-hans': '深层中文'
    }, 'section.title.subtitle.text');

    assert.strictEqual(results2['en-US'], true);
    assert.strictEqual(results2['zh-hans'], true);
    assert.ok(warnings.some(w => w.includes('Converting "section.title" from string to object')));

    console.warn = originalWarn;

    // Cleanup
    if (fs.existsSync(testLocaleDir)) {
      fs.rmSync(testLocaleDir, { recursive: true });
    }
  });

  // Cleanup after all tests
  test('cleanup', () => {
    cleanupTestFiles();
    assert.ok(true);
  });
});