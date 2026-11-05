#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const args = process.argv.slice(2);
const checkStagedOnly = args.includes('--staged');

const SECRET_PATTERNS = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Database Connection String with Credentials', regex: /(postgres|mysql|mongodb|mongodb\+srv):\/\/[^:\s]+:[^@\s]+@/ },
  { name: 'Generic Hardcoded Secret/Token', regex: /(secret|api_key|apikey|private_key|auth_token)\s*[:=]\s*["'][a-zA-Z0-9_\-\.]{24,}["']/i },
];

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  'reports',
  'docs',
  '.agents',
  'skills-lock.json',
  'package-lock.json',
  '.env.example',
  'scripts/scan-secrets.mjs',
];

function getFilesToScan() {
  const gitBin = fs.existsSync('/usr/bin/git') ? '/usr/bin/git' : 'git';
  const execOptions = {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin' },
  };

  if (checkStagedOnly) {
    try {
      const output = execSync(`${gitBin} diff --cached --name-only --diff-filter=ACMR`, execOptions); // NOSONAR
      return output.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  try {
    const output = execSync(`${gitBin} ls-files`, execOptions); // NOSONAR
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

console.log(`[SecretScanner] Scanning ${checkStagedOnly ? 'staged files' : 'tracked files in repository'}...`);

const files = getFilesToScan();
let violations = 0;

for (const relPath of files) {
  if (IGNORED_PATHS.some((ign) => relPath.startsWith(ign))) {
    continue;
  }

  // Check if .env file is tracked
  if (/^\.env($|\..+)/.test(path.basename(relPath)) && relPath !== '.env.example') {
    console.error(`[CRITICAL] Tracked environment file detected: ${relPath}`);
    violations++;
    continue;
  }

  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) continue;

  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue; // Skip binaries and >2MB

    const content = fs.readFileSync(fullPath, 'utf8');

    for (const { name, regex } of SECRET_PATTERNS) {
      if (regex.test(content)) {
        console.error(`[VIOLATION] ${name} detected in: ${relPath}`);
        violations++;
      }
    }
  } catch {
    // Non-text file or unreadable, ignore
  }
}

if (violations > 0) {
  console.error(`\n[FAILED] Secret scan found ${violations} security violation(s). Commit/Push BLOCKED.`);
  process.exit(1);
} else {
  console.log('[PASSED] No exposed secrets found in scanned files.');
  process.exit(0);
}
