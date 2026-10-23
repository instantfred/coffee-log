import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const requireModule = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Load the actual TypeScript modules with only framework/database boundaries mocked.
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(testDirectory, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, require: (id) => id in mocks ? mocks[id] : requireModule(id), Date, FormData,
  });
  return exports;
}
const domain = load('src/lib/domain.ts');
const grinderId = '123e4567-e89b-42d3-a456-426614174000';

function setup(grinder, existing = {}) {
  let saved;
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from(table) {
      if (table === 'grinders') return {
        select() { return this; },
        eq(key, value) { if (key === 'user_id') assert.equal(value, 'owner'); return this; },
        maybeSingle: async () => ({ data: grinder }),
      };
      return {
        select() { return this; },
        maybeSingle: async () => ({ data: existing }),
        insert: async (row) => { saved = row; return {}; },
        update(row) { saved = row; return this; },
        eq() { return this; },
      };
    },
  };
  const actions = load('src/app/(app)/brews/actions.ts', {
    '@/lib/domain': domain,
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath() {} },
    'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`); } },
  });
  return { actions, saved: () => saved };
}
function brewForm(extra = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ method: 'v60', coffee_id: '', brewed_at: '', flavor_notes: '', comments: '', ...extra })) data.set(key, value);
  return data;
}

test('click grinder saves zero clicks and discards general setting', async () => {
  const ctx = setup({ id: grinderId, name: 'C2', grind_type: 'clicks' });
  await assert.rejects(ctx.actions.createBrew({}, brewForm({ grinder_id: grinderId, grind_clicks: '0', grind_size: 'Fina' })), /redirect/);
  assert.equal(ctx.saved().grind_clicks, 0);
  assert.equal(ctx.saved().grind_size, null);
  assert.equal(ctx.saved().grinder_name, 'C2');
});

test('missing, negative, fractional and invalid clicks cannot be saved', async () => {
  for (const value of ['', '-1', '2.5', 'abc', '2147483648']) {
    const ctx = setup({ id: grinderId, name: 'C2', grind_type: 'clicks' });
    const result = await ctx.actions.createBrew({}, brewForm({ grinder_id: grinderId, grind_clicks: value }));
    assert.ok(result.error);
    assert.equal(ctx.saved(), undefined);
  }
});

test('a missing or foreign grinder cannot be assigned', async () => {
  const ctx = setup(null);
  const result = await ctx.actions.createBrew({}, brewForm({ grinder_id: grinderId, grind_clicks: '24' }));
  assert.ok(result.error);
  assert.equal(ctx.saved(), undefined);
});

test('editing from clicks to general clears clicks', async () => {
  const ctx = setup({ id: grinderId, name: 'General', grind_type: 'general' });
  await assert.rejects(ctx.actions.updateBrew({}, brewForm({ id: 'brew', grinder_id: grinderId, grind_size: 'Media', grind_clicks: '24' })), /redirect/);
  assert.equal(ctx.saved().grind_size, 'Media');
  assert.equal(ctx.saved().grind_clicks, null);
});

test('legacy brews can keep general grind without a grinder', async () => {
  const ctx = setup(null);
  await assert.rejects(ctx.actions.updateBrew({}, brewForm({ id: 'brew', grind_size: 'Media-fina' })), /redirect/);
  assert.equal(ctx.saved().grind_size, 'Media-fina');
  assert.equal(ctx.saved().grinder_id, null);
  assert.equal(ctx.saved().grind_clicks, null);
});

test('recipe evolution distinguishes equal clicks from different grinders', () => {
  const { buildRecipes } = load('src/lib/evolution.ts', { '@/lib/domain': domain });
  const base = { method: 'v60', grind_size: null, grind_clicks: 24, rating: null };
  const recipes = buildRecipes([
    { ...base, brewed_at: '2026-01-01', grinder_name: 'C2' },
    { ...base, brewed_at: '2026-01-02', grinder_name: 'K6' },
  ]);
  const change = recipes[0].attempts[1].changes[0];
  assert.equal(change.from, 'C2 · 24 clics');
  assert.equal(change.to, 'K6 · 24 clics');
  assert.equal(domain.formatGrind({ grind_size: 'Media' }), 'Media');
});


test('archived grinders cannot be assigned to new brews', async () => {
  const ctx = setup({ id: grinderId, name: 'C2', grind_type: 'clicks', archived: true });
  const result = await ctx.actions.createBrew({}, brewForm({ grinder_id: grinderId, grind_clicks: '24' }));
  assert.ok(result.error);
  assert.equal(ctx.saved(), undefined);
});

test('historical brew keeps archived grinder, original name and original adjustment type', async () => {
  const ctx = setup(
    { id: grinderId, name: 'Renamed', grind_type: 'general', archived: true },
    { grinder_id: grinderId, grinder_name: 'C2', grind_clicks: 24 },
  );
  await assert.rejects(ctx.actions.updateBrew({}, brewForm({ id: 'brew', grinder_id: grinderId, grind_clicks: '25' })), /redirect/);
  assert.equal(ctx.saved().grinder_name, 'C2');
  assert.equal(ctx.saved().grind_clicks, 25);
  assert.equal(ctx.saved().grind_size, null);
});

test('another archived grinder cannot be assigned while editing a brew', async () => {
  const ctx = setup({ id: grinderId, name: 'Sold', grind_type: 'clicks', archived: true }, { grinder_id: 'other' });
  const result = await ctx.actions.updateBrew({}, brewForm({ id: 'brew', grinder_id: grinderId, grind_clicks: '24' }));
  assert.ok(result.error);
  assert.equal(ctx.saved(), undefined);
});

function managementSetup(row = { id: grinderId }) {
  const filters = [];
  let saved;
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from(table) {
      assert.equal(table, 'grinders');
      return {
        update(value) { saved = value; return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        select() { return this; },
        maybeSingle: async () => ({ data: row }),
      };
    },
  };
  const actions = load('src/app/(app)/grinders/actions.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath() {} },
    'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`); } },
  });
  return { actions, filters, saved: () => saved };
}

test('deleting a grinder archives only the authenticated owner’s active row', async () => {
  const ctx = managementSetup();
  await assert.rejects(ctx.actions.deleteGrinder(brewForm({ id: grinderId })), /redirect/);
  assert.equal(ctx.saved().archived, true);
  assert.deepEqual(ctx.filters, [['id', grinderId], ['user_id', 'owner'], ['archived', false]]);
});

test('editing validates and saves grinder name and type with owner filtering', async () => {
  const ctx = managementSetup();
  await assert.rejects(ctx.actions.updateGrinder({}, brewForm({ id: grinderId, name: '  K6  ', grind_type: 'clicks' })), /redirect/);
  assert.equal(ctx.saved().name, 'K6');
  assert.equal(ctx.saved().grind_type, 'clicks');
  assert.deepEqual(ctx.filters, [['id', grinderId], ['user_id', 'owner'], ['archived', false]]);
});

test('editing unavailable grinders reports an error', async () => {
  const ctx = managementSetup(null);
  const result = await ctx.actions.updateGrinder({}, brewForm({ id: grinderId, name: 'K6', grind_type: 'general' }));
  assert.ok(result.error);
});


test('editing a brew preserves historical satisfaction when the field is omitted', async () => {
  const ctx = setup(null, { grinder_id: null, satisfaction: 5 });
  await assert.rejects(ctx.actions.updateBrew({}, brewForm({ id: 'brew', rating: '8', grind_size: 'Media' })), /redirect/);
  assert.equal(ctx.saved().satisfaction, 5);
  assert.equal(ctx.saved().rating, 8);
});


test('brew date initial markup matches across server and browser timezones', () => {
  const React = requireModule('react');
  const { renderToStaticMarkup } = requireModule('react-dom/server');
  const { BrewDateInput } = load('src/components/brew-date-input.tsx', {
    '@/components/ui/field': { Input: React.forwardRef(function TestInput(props, ref) { return React.createElement('input', { ...props, ref }); }) },
  });
  const originalTimezone = process.env.TZ;
  try {
    for (const brewedAt of [undefined, '2026-10-23T08:30:00.000Z']) {
      process.env.TZ = 'UTC';
      const server = renderToStaticMarkup(React.createElement(BrewDateInput, { brewedAt }));
      process.env.TZ = 'America/Costa_Rica';
      const browser = renderToStaticMarkup(React.createElement(BrewDateInput, { brewedAt }));
      assert.equal(server, browser);
      assert.ok(server.includes(brewedAt ? 'value="2026-10-23T08:30"' : 'value=""'));
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
