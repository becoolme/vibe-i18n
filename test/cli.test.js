import { test, describe } from 'node:test';
import assert from 'node:assert';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths - use timestamp to ensure uniqueness
const testDir = path.join(__dirname, `cli-fixtures-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
const localesDir = path.join(testDir, 'locales');
const cliPath = path.join(__dirname, '..', 'bin', 'cli.js');

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
  
  // Add a small delay to ensure file system operations complete
  // This helps with race conditions on some systems
  const start = Date.now();
  while (Date.now() - start < 10) {
    // Small synchronous delay
  }
}

function cleanupTestFiles() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
    // Add a small delay to ensure cleanup completes
    const start = Date.now();
    while (Date.now() - start < 10) {
      // Small synchronous delay
    }
  }
}

describe('CLI Commands', () => {

  test('should show help when no command provided', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath}`);
      assert.ok(stdout.includes('vibei18n - Translation management CLI tool'));
      assert.ok(stdout.includes('Commands:'));
    } catch (error) {
      // CLI might exit with code 0 or 1, both are acceptable for help
      assert.ok(error.stdout.includes('vibei18n - Translation management CLI tool'));
    }
  });

  test('should show help with --help flag', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert.ok(stdout.includes('vibei18n - Translation management CLI tool'));
    assert.ok(stdout.includes('Commands:'));
  });

  test('should list available locales', async () => {
    setupTestFiles(); // Ensure test files exist
    const { stdout } = await execAsync(`node ${cliPath} locales --dir ${localesDir}`);
    assert.ok(stdout.includes('Available locales'));
    assert.ok(stdout.includes('en-US'));
  });

  test('should get translation value', async () => {
    setupTestFiles(); // Ensure test files exist
    const { stdout } = await execAsync(`node ${cliPath} get en-US common.loading --dir ${localesDir}`);
    assert.ok(stdout.includes('Loading...'));
  });

  test('should set translation value', async () => {
    cleanupTestFiles();
    setupTestFiles(); // Ensure test files exist
    await execAsync(`node ${cliPath} set en-US test.new "New Test Value" --dir ${localesDir}`);
    
    // Verify the value was set
    const { stdout } = await execAsync(`node ${cliPath} get en-US test.new --dir ${localesDir}`);
    assert.ok(stdout.includes('New Test Value'));
  });

  test('should check if translation exists', async () => {
    // Clean up and ensure fresh test files
    cleanupTestFiles();
    setupTestFiles();
    
    try {
      const { stdout, stderr } = await execAsync(`node ${cliPath} has en-US common.loading --dir ${localesDir}`);
      
      // Better error message if assertion fails
      if (stdout.trim() !== 'true') {
        throw new Error(`Expected 'true', got '${stdout.trim()}'. stderr: '${stderr}'. Test dir: ${testDir}`);
      }
      assert.ok(stdout.trim() === 'true');
      
      const { stdout: stdout2 } = await execAsync(`node ${cliPath} has en-US non.existent --dir ${localesDir}`);
      assert.ok(stdout2.trim() === 'false');
    } catch (error) {
      // Check if test files exist for debugging
      const enUSPath = path.join(localesDir, 'en-US.json');
      const fileExists = fs.existsSync(enUSPath);
      const fileContent = fileExists ? fs.readFileSync(enUSPath, 'utf8') : 'FILE DOES NOT EXIST';
      
      console.error(`Test failed. File exists: ${fileExists}`);
      console.error(`File content: ${fileContent}`);
      console.error(`Test directory: ${testDir}`);
      throw error;
    }
  });

  test('should get all translations for a path', async () => {
    setupTestFiles(); // Ensure test files exist
    const { stdout } = await execAsync(`node ${cliPath} getAll common.loading --dir ${localesDir}`);
    const result = JSON.parse(stdout);
    assert.ok(result['en-US'] === 'Loading...');
  });

  test('should find missing translations', async () => {
    cleanupTestFiles();
    setupTestFiles(); // Ensure test files exist
    // Create another locale file with missing translations
    const zhHansData = {
      "common": {
        "loading": "加载中..."
        // Missing "error" key
      }
    };
    fs.writeFileSync(
      path.join(localesDir, 'zh-hans.json'),
      JSON.stringify(zhHansData, null, 2)
    );

    const { stdout } = await execAsync(`node ${cliPath} missing common.error --dir ${localesDir}`);
    assert.ok(stdout.includes('zh-hans'));
  });

  test('should show translation statistics', async () => {
    setupTestFiles(); // Ensure test files exist
    const { stdout } = await execAsync(`node ${cliPath} stats --dir ${localesDir}`);
    assert.ok(stdout.includes('Translation Statistics'));
  });

  test('should check translation completeness', async () => {
    setupTestFiles(); // Ensure test files exist
    const { stdout } = await execAsync(`node ${cliPath} check --dir ${localesDir}`);
    assert.ok(stdout.includes('Checking translation completeness'));
    assert.ok(stdout.includes('Summary:'));
  });

  test('should handle unknown command gracefully', async () => {
    try {
      await execAsync(`node ${cliPath} unknowncommand --dir ${localesDir}`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.stderr.includes('Unknown command') || error.stdout.includes('Unknown command'));
    }
  });

  test('should handle missing arguments gracefully', async () => {
    try {
      await execAsync(`node ${cliPath} get --dir ${localesDir}`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.stderr.includes('Usage:') || error.stdout.includes('Usage:'));
    }
  });

  // Cleanup after tests
  test('cleanup CLI tests', () => {
    cleanupTestFiles();
    assert.ok(true);
  });
});