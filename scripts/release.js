#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const VALID_TYPES = ['patch', 'minor', 'major'];

function showUsage() {
  console.log(`
Usage: node scripts/release.js <type>

Types:
  patch  - Bug fixes (1.0.0 -> 1.0.1)
  minor  - New features (1.0.0 -> 1.1.0)
  major  - Breaking changes (1.0.0 -> 2.0.0)

Example:
  node scripts/release.js patch
`);
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output.trim();
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    process.exit(1);
  }
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
}

function hasUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch {
    return true;
  }
}

function getPackageVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return pkg.version;
}

async function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0];

  if (!releaseType || !VALID_TYPES.includes(releaseType)) {
    console.error('❌ Invalid or missing release type');
    showUsage();
    process.exit(1);
  }

  console.log(`🚀 Starting ${releaseType} release process...`);

  // Check current branch
  const currentBranch = getCurrentBranch();
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    console.error(`❌ Please switch to main/master branch (currently on: ${currentBranch})`);
    process.exit(1);
  }

  // Check for uncommitted changes
  if (hasUncommittedChanges()) {
    console.error('❌ You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  // Pull latest changes
  runCommand('git pull origin main', 'Pulling latest changes');

  // Run tests
  runCommand('pnpm test', 'Running tests');

  // Build project
  runCommand('pnpm run build', 'Building project');

  // Test CLI functionality
  console.log('\n🔄 Testing CLI functionality...');
  runCommand('node bin/cli.js --help > /dev/null', 'Testing help command');
  runCommand('node bin/cli.js init --dir ./test-release-temp', 'Testing init command');
  runCommand('node bin/cli.js locales --dir ./test-release-temp', 'Testing locales command');
  runCommand('rm -rf ./test-release-temp', 'Cleaning up test files');
  console.log('✅ CLI functionality test completed');

  // Get current version
  const currentVersion = getPackageVersion();
  console.log(`📦 Current version: ${currentVersion}`);

  // Update version
  const newVersion = runCommand(`pnpm version ${releaseType} --no-git-tag-version`, `Bumping ${releaseType} version`);
  console.log(`📦 New version: ${newVersion}`);

  // Update changelog (if exists)
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    console.log('📝 Please update CHANGELOG.md with the new version changes');
    console.log('   Press Enter when ready to continue...');

    // Wait for user input
    console.log('Waiting 3 seconds before continuing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Commit version bump
  runCommand(`git add package.json pnpm-lock.yaml`, 'Staging version files');
  runCommand(`git commit -m "Release ${newVersion}"`, 'Committing version bump');

  // Create git tag
  runCommand(`git tag -a ${newVersion} -m "Release ${newVersion}"`, 'Creating git tag');

  // Push changes and tag
  runCommand(`git push origin main`, 'Pushing changes');
  runCommand(`git push origin ${newVersion}`, 'Pushing tag');

  console.log(`\n🎉 Release ${newVersion} completed successfully!`);
  console.log('\n📋 What happens next:');
  console.log('1. GitHub Actions will automatically run tests');
  console.log('2. If tests pass, the package will be published to NPM');
  console.log('3. A GitHub release will be created');
  console.log('4. The published package will be tested');
  console.log('\n🔗 Monitor the release progress at:');
  console.log('   https://github.com/becoolme/vibe-i18n/actions');
  console.log('\n📦 Once published, users can install with:');
  console.log(`   pnpm add -g vibei18n@${newVersion.replace('v', '')}`);
  console.log(`   npx vibei18n@${newVersion.replace('v', '')} --help`);
}

main().catch(error => {
  console.error('\n❌ Release process failed:', error.message);
  process.exit(1);
});