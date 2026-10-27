import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const requireModule = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (id) => mocks[id] ?? requireModule(id) });
  return exports;
}
const domain = load('src/lib/domain.ts');
const evolution = load('src/lib/evolution.ts', { '@/lib/domain': domain });
const { analyzeRecipe } = load('src/lib/recipe-analysis.ts', { '@/lib/evolution': evolution });
const brew = (id, rating, date, coffee = 'a', method = 'v60') => ({ id, rating, brewed_at: date, coffee: { id: coffee }, method });
test('isolates coffee and method and prefers newest tied best, not latest unrated', () => {
  const result = analyzeRecipe([
    brew('latest', null, '2026-10-04'), brew('other', 10, '2026-10-05', 'b'),
    brew('old', 9, '2026-10-01'), brew('new', 9, '2026-10-03'),
    brew('espresso', 10, '2026-10-06', 'a', 'espresso'),
  ], 'a', 'v60');
  assert.equal(result.best.id, 'new');
  assert.equal(result.latest.id, 'latest');
  assert.equal(result.previous.id, 'new');
  assert.equal(result.ratedCount, 2);
  assert.equal(result.group.attempts.length, 3);
});
test('unrated and empty groups never invent a best recipe', () => {
  assert.equal(analyzeRecipe([brew('one', null, '2026-10-01')], 'a', 'v60').best, null);
  const empty = analyzeRecipe([], 'a', 'v60');
  assert.equal(empty.group, null);
  assert.equal(empty.latest, null);
  assert.equal(empty.previous, null);
});
