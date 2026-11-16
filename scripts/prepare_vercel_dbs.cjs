'use strict';
// Build-only compression: keep large immutable SQLite question data outside the
// Vercel Function uncompressed package limit. Never modify the source DB files.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const base = path.resolve(__dirname, '../data');
const names = [
  'fresh_samhita_questions.sqlite',
  'phase2_fresh_questions.sqlite',
  'subjectwise_fresh.sqlite',
  'testseries_fresh.sqlite',
  'tagwise_fresh.sqlite',
  'previous_years_fresh.sqlite',
  'portal_sessions.sqlite',
];
let total = 0;
for (const name of names) {
  const original = path.join(base, name);
  const archive = original + '.gz';
  if (fs.existsSync(archive) && fs.statSync(archive).size > 0) {
    console.log('[Vercel SQL] Existing archive: ' + name);
    total++;
    continue;
  }
  if (!fs.existsSync(original) || fs.statSync(original).size === 0) {
    throw new Error('Required SQLite file missing: ' + original);
  }
  const buffer = fs.readFileSync(original);
  if (buffer.toString('ascii', 0, 16) !== 'SQLite format 3\0') {
    throw new Error('Not a valid SQLite header: ' + original);
  }
  const compressed = zlib.gzipSync(buffer, { level: 6 });
  fs.writeFileSync(archive, compressed);
  console.log('[Vercel SQL] ' + name + ': ' + buffer.length + ' -> ' + compressed.length + ' bytes');
  total++;
}
if (total !== names.length) throw new Error('Missing SQL datasets');
console.log('[Vercel SQL] Verified all ' + total + ' database archives');
