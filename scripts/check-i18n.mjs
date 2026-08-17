#!/usr/bin/env node
/**
 * Every translation key the code asks for must exist, in all three locales.
 *
 * next-intl throws at render time for a key it cannot resolve, which means a missing
 * message is not a missing word — it is a red error overlay on whatever page happens to
 * use it, in whichever language the reader picked. That is exactly how `common.navMenu`
 * shipped for the length of one hot reload.
 *
 * Two checks, both cheap enough to run before every commit:
 *   1. the three catalogues have identical key sets;
 *   2. every literal `t('…')` in the codebase resolves against its namespace.
 *
 * Dynamic keys (`t(\`badge.${x}\`)`) are skipped — they cannot be checked statically,
 * and the catalogues being identical is what keeps them honest.
 *
 *   node scripts/check-i18n.mjs      # or: npm run check:i18n
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(root, 'messages');
const locales = fs.readdirSync(messagesDir).filter((d) => fs.statSync(path.join(messagesDir, d)).isDirectory());
const reference = locales.includes('en') ? 'en' : locales[0];

let problems = 0;
const fail = (message) => {
  console.error(`  ✗ ${message}`);
  problems++;
};

/** `{ error: { required: '…' } }` → `['error.required']`, the shape next-intl looks up. */
function flatten(value, prefix = '', out = new Set()) {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, full, out);
    else out.add(full);
  }
  return out;
}

// ---- 1. The catalogues agree ------------------------------------------------
const catalogues = {};
for (const locale of locales) {
  catalogues[locale] = {};
  for (const file of fs.readdirSync(path.join(messagesDir, locale))) {
    if (!file.endsWith('.json')) continue;
    const full = path.join(messagesDir, locale, file);
    try {
      catalogues[locale][file.replace(/\.json$/, '')] = flatten(JSON.parse(fs.readFileSync(full, 'utf8')));
    } catch (err) {
      fail(`${locale}/${file} is not valid JSON — ${err.message}`);
    }
  }
}

const namespaces = new Set(locales.flatMap((l) => Object.keys(catalogues[l])));
for (const namespace of [...namespaces].sort()) {
  const missingFile = locales.filter((l) => !catalogues[l][namespace]);
  if (missingFile.length) {
    fail(`namespace "${namespace}" is missing for: ${missingFile.join(', ')}`);
    continue;
  }
  const union = new Set(locales.flatMap((l) => [...catalogues[l][namespace]]));
  for (const locale of locales) {
    const missing = [...union].filter((key) => !catalogues[locale][namespace].has(key));
    if (missing.length) fail(`${locale}/${namespace}.json is missing: ${missing.join(', ')}`);
  }
}

// ---- 2. Every literal lookup resolves ---------------------------------------
function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'scripts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

let lookups = 0;
for (const file of sourceFiles(root)) {
  const src = fs.readFileSync(file, 'utf8');
  const bindings = new Map();
  for (const match of src.matchAll(
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*['"]([\w.]+)['"]\s*\)/g,
  )) {
    bindings.set(match[1], match[2]);
  }

  for (const [binding, namespace] of bindings) {
    const keys = catalogues[reference][namespace];
    const where = path.relative(root, file).replace(/\\/g, '/');
    if (!keys) {
      fail(`unknown namespace "${namespace}" used in ${where}`);
      continue;
    }
    for (const match of src.matchAll(new RegExp(`\\b${binding}\\(\\s*['"]([\\w.]+)['"]`, 'g'))) {
      lookups++;
      if (!keys.has(match[1])) fail(`${namespace}.${match[1]} does not exist — used in ${where}`);
    }
  }
}

if (problems > 0) {
  console.error(`\ni18n check failed: ${problems} problem${problems === 1 ? '' : 's'}\n`);
  process.exit(1);
}

console.log(
  `i18n OK — ${namespaces.size} namespaces × ${locales.length} locales, ${lookups} literal lookups all resolve`,
);
