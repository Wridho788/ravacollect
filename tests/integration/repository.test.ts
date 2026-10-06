import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import type { SqlConnection, SqlValue } from '../../src/data/connection';
import { RavaRepository } from '../../src/data/repository';
import { DomainError } from '../../src/domain/errors';

function createHarness(filename = ':memory:') {
  const database = new DatabaseSync(filename);
  const connection: SqlConnection = {
    async execute(sql: string, params: SqlValue[] = []) {
      const statement = database.prepare(sql);
      return { rows: statement.all(...params) };
    },
  };
  let fault: string | undefined;
  const repository = new RavaRepository(connection, stage => {
    if (stage === fault) {
      throw new Error(`Injected storage failure at ${stage}`);
    }
  });
  return {
    database,
    connection,
    repository,
    setFault: (stage?: string) => {
      fault = stage;
    },
  };
}

const hasCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;

test('fixture, purchase, idempotent replay, ownership, and insufficient credit', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  const initial = await repository.snapshot();
  assert.equal(initial.balance, 1000);
  assert.equal(initial.ledger.length, 1);
  assert.equal(initial.activities.length, 0);
  assert.deepEqual(
    initial.artworks.filter(a => a.owned).map(a => a.id),
    ['owned-orbit'],
  );
  const purchase = await repository.buyArtwork('art-lumen', 'operation-1', 250);
  assert.deepEqual(
    await repository.buyArtwork('art-lumen', 'operation-1', 250),
    purchase,
  );
  await assert.rejects(
    repository.buyArtwork('art-tide', 'operation-1'),
    hasCode('operation-conflict'),
  );
  await assert.rejects(
    repository.buyArtwork('art-lumen', 'operation-2'),
    hasCode('already-owned'),
  );
  await assert.rejects(
    repository.buyArtwork('owned-orbit', 'operation-3'),
    hasCode('already-owned'),
  );
  await assert.rejects(
    repository.buyArtwork('art-premium', 'operation-4'),
    hasCode('insufficient-credit'),
  );
  const bought = await repository.snapshot();
  assert.equal(bought.balance, 750);
  assert.deepEqual(
    bought.ledger.map(e => e.deltaCredits).sort((a, b) => a - b),
    [-250, 1000],
  );
  assert.equal(bought.activities.length, 1);
  assert.equal(bought.artworks.filter(a => a.owned).length, 2);
  await repository.buyArtwork('art-tide', 'operation-5');
  assert.equal((await repository.snapshot()).balance, 350);
});

for (const stage of [
  'purchase:after-purchase',
  'purchase:after-debit',
  'purchase:after-ownership',
]) {
  test(`failed purchase rolls back all state at ${stage}, then same operation retries`, async t => {
    const { database, repository, setFault } = createHarness();
    t.after(() => database.close());
    await repository.initialize();
    const before = await repository.snapshot();
    setFault(stage);
    await assert.rejects(
      repository.buyArtwork('art-lumen', 'retryable'),
      hasCode('storage'),
    );
    assert.deepEqual(await repository.snapshot(), before);
    assert.equal(
      database.prepare('SELECT COUNT(*) AS count FROM purchases').get()?.count,
      0,
    );
    setFault();
    await repository.buyArtwork('art-lumen', 'retryable');
    assert.equal((await repository.snapshot()).balance, 750);
  });
}

test('two concurrent purchases cannot overspend 1000 credits', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  database
    .prepare('UPDATE artworks SET priceCredits = ? WHERE id = ?')
    .run(700, 'art-lumen');
  database
    .prepare('UPDATE artworks SET priceCredits = ? WHERE id = ?')
    .run(600, 'art-tide');
  const results = await Promise.allSettled([
    repository.buyArtwork('art-lumen', 'concurrent-a'),
    repository.buyArtwork('art-tide', 'concurrent-b'),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const failed = results.find(r => r.status === 'rejected');
  assert.ok(
    failed?.status === 'rejected' &&
      hasCode('insufficient-credit')(failed.reason),
  );
  const state = await repository.snapshot();
  assert.equal(state.balance, 300);
  assert.equal(state.ledger.length, 2);
  assert.equal(state.activities.length, 1);
});

test('double submit replays once and queued reads cannot see partial purchase', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  const [first, read, second] = await Promise.all([
    repository.buyArtwork('art-lumen', 'double-submit'),
    repository.snapshot(),
    repository.buyArtwork('art-lumen', 'double-submit'),
  ]);
  assert.deepEqual(first, second);
  assert.equal(read.balance, 750);
  assert.equal(read.activities.length, 1);
  assert.equal(read.artworks.find(a => a.id === 'art-lumen')?.owned, true);
});

test('stale confirmation price is rejected without a write', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  const before = await repository.snapshot();
  await assert.rejects(
    repository.buyArtwork('art-lumen', 'stale', 240),
    hasCode('price-changed'),
  );
  assert.deepEqual(await repository.snapshot(), before);
});

test('watchlist changes are idempotent and failure rolls back', async t => {
  const { database, repository, setFault } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  await repository.setFavorite('art-lumen', true);
  await repository.setFavorite('art-lumen', true);
  assert.equal(
    (await repository.snapshot()).artworks.filter(a => a.favorite).length,
    1,
  );
  setFault('watchlist:after-write');
  await assert.rejects(
    repository.setFavorite('art-lumen', false),
    hasCode('storage'),
  );
  assert.equal(
    (await repository.snapshot()).artworks.find(a => a.id === 'art-lumen')
      ?.favorite,
    true,
  );
  setFault();
  await repository.setFavorite('art-lumen', false);
  assert.equal(
    (await repository.snapshot()).artworks.filter(a => a.favorite).length,
    0,
  );
});

test('listing lifecycle preserves balance, ownership and immutable history', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  await repository.saveListing(
    'owned-orbit',
    300,
    '  First description  ',
    'draft',
  );
  let state = await repository.snapshot();
  assert.equal(state.listings[0]?.description, 'First description');
  const firstActivity = state.activities[0];
  await repository.saveListing(
    'owned-orbit',
    450,
    'Published description',
    'published',
  );
  await repository.saveListing(
    'owned-orbit',
    500,
    'Unpublished description',
    'draft',
  );
  state = await repository.snapshot();
  assert.equal(state.listings.length, 1);
  assert.equal(state.listings[0]?.priceCredits, 500);
  assert.deepEqual(
    state.activities.find(a => a.id === firstActivity?.id),
    firstActivity,
  );
  await repository.deleteListing('owned-orbit');
  state = await repository.snapshot();
  assert.equal(state.balance, 1000);
  assert.equal(state.listings.length, 0);
  assert.equal(state.artworks.find(a => a.id === 'owned-orbit')?.owned, true);
  assert.equal(state.activities.length, 4);
});

test('listing validation rejects unowned artwork and invalid values', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  const before = await repository.snapshot();
  await assert.rejects(
    repository.saveListing('art-lumen', 300, '', 'draft'),
    hasCode('not-owned'),
  );
  for (const price of [
    0,
    -1,
    0.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    await assert.rejects(
      repository.saveListing('owned-orbit', price, '', 'draft'),
      hasCode('validation'),
    );
  }
  await assert.rejects(
    repository.saveListing('owned-orbit', 1, 'x'.repeat(301), 'draft'),
    hasCode('validation'),
  );
  assert.deepEqual(await repository.snapshot(), before);
});

test('listing write/history rollback covers create, edit and delete', async t => {
  const { database, repository, setFault } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  let before = await repository.snapshot();
  setFault('listing:after-write');
  await assert.rejects(
    repository.saveListing('owned-orbit', 300, '', 'draft'),
    hasCode('storage'),
  );
  assert.deepEqual(await repository.snapshot(), before);
  setFault();
  await repository.saveListing('owned-orbit', 300, 'Original', 'published');
  before = await repository.snapshot();
  setFault('listing:after-write');
  await assert.rejects(
    repository.saveListing('owned-orbit', 400, 'Changed', 'draft'),
    hasCode('storage'),
  );
  assert.deepEqual(await repository.snapshot(), before);
  await assert.rejects(
    repository.deleteListing('owned-orbit'),
    hasCode('storage'),
  );
  assert.deepEqual(await repository.snapshot(), before);
});

test('SQLite failure writing activity rolls back purchase and listing changes', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  const before = await repository.snapshot();
  database.exec(`CREATE TRIGGER fail_activity BEFORE INSERT ON activities
    BEGIN SELECT RAISE(ABORT, 'Simulated disk write failure'); END`);
  await assert.rejects(
    repository.buyArtwork('art-lumen', 'activity-failure'),
    hasCode('storage'),
  );
  assert.deepEqual(await repository.snapshot(), before);
  await assert.rejects(
    repository.saveListing('owned-orbit', 300, '', 'published'),
    hasCode('storage'),
  );
  assert.deepEqual(await repository.snapshot(), before);
  database.exec('DROP TRIGGER fail_activity');
  await repository.buyArtwork('art-lumen', 'activity-failure');
  assert.equal((await repository.snapshot()).balance, 750);
});

test('seed and reset commit atomically; reset restores exact fixture', async t => {
  const { database, repository, setFault } = createHarness();
  t.after(() => database.close());
  setFault('seed:after-catalog');
  await assert.rejects(repository.initialize(), hasCode('storage'));
  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
      )
      .get()?.count,
    0,
  );
  setFault();
  await repository.initialize();
  const fixture = await repository.snapshot();
  await repository.buyArtwork('art-lumen', 'before-reset');
  await repository.setFavorite('art-tide', true);
  await repository.saveListing('art-lumen', 300, 'Demo', 'published');
  const modified = await repository.snapshot();
  setFault('reset:after-clear');
  await assert.rejects(repository.resetDemo(), hasCode('storage'));
  assert.deepEqual(await repository.snapshot(), modified);
  setFault('seed:after-catalog');
  await assert.rejects(repository.resetDemo(), hasCode('storage'));
  assert.deepEqual(await repository.snapshot(), modified);
  setFault();
  await repository.resetDemo();
  assert.deepEqual(await repository.snapshot(), fixture);
});

test('unknown schema and seed versions preserve all existing data', async t => {
  const { database, connection, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  await repository.buyArtwork('art-lumen', 'persist');
  for (const key of ['schemaVersion', 'seedVersion']) {
    const prior = database
      .prepare('SELECT value FROM metadata WHERE key = ?')
      .get(key)?.value;
    database
      .prepare('UPDATE metadata SET value = ? WHERE key = ?')
      .run('future', key);
    const reopened = new RavaRepository(connection);
    await assert.rejects(reopened.initialize(), hasCode('migration'));
    assert.equal(
      database.prepare('SELECT COUNT(*) AS count FROM purchases').get()?.count,
      1,
    );
    assert.equal(
      database
        .prepare('SELECT SUM(deltaCredits) AS balance FROM credit_entries')
        .get()?.balance,
      750,
    );
    database
      .prepare('UPDATE metadata SET value = ? WHERE key = ?')
      .run(prior as string, key);
  }
});

test('closing and reopening a database file retains purchase, listing and favorite state', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'ravacollect-sqlite-'));
  const filename = join(directory, 'persist.sqlite');
  const { database, repository } = createHarness(filename);
  let currentDatabase = database;
  t.after(() => {
    currentDatabase.close();
    unlinkSync(filename);
    rmdirSync(directory);
  });
  await repository.initialize();
  await repository.buyArtwork('art-lumen', 'persist');
  await repository.setFavorite('art-tide', true);
  await repository.saveListing('art-lumen', 300, 'Saved', 'published');
  const saved = await repository.snapshot();
  database.close();
  const reopened = createHarness(filename);
  currentDatabase = reopened.database;
  await reopened.repository.initialize();
  assert.deepEqual(await reopened.repository.snapshot(), saved);
});

test('an unknown database is never replaced by a seed', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  database.exec(
    "CREATE TABLE previous_data (value TEXT); INSERT INTO previous_data VALUES ('keep me')",
  );
  await assert.rejects(repository.initialize(), hasCode('migration'));
  assert.equal(
    database.prepare('SELECT value FROM previous_data').get()?.value,
    'keep me',
  );
  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
      )
      .get()?.count,
    1,
  );
});

test('safe integer price boundary round-trips without loss', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  await repository.saveListing(
    'owned-orbit',
    Number.MAX_SAFE_INTEGER,
    '',
    'draft',
  );
  assert.equal(
    (await repository.snapshot()).listings[0]?.priceCredits,
    9007199254740991,
  );
  await assert.rejects(
    repository.saveListing(
      'owned-orbit',
      Number.MAX_SAFE_INTEGER + 1,
      '',
      'draft',
    ),
    hasCode('validation'),
  );
  assert.equal(
    (await repository.snapshot()).listings[0]?.priceCredits,
    9007199254740991,
  );
});

test('inconsistent known schema enters recovery without silently repairing data', async t => {
  const { database, connection, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  await repository.buyArtwork('art-lumen', 'integrity');
  database.exec("DELETE FROM activities WHERE type = 'purchase'");
  const reopened = new RavaRepository(connection);
  await assert.rejects(reopened.initialize(), hasCode('migration'));
  await assert.rejects(reopened.snapshot(), hasCode('migration'));
  assert.equal(
    database
      .prepare('SELECT SUM(deltaCredits) AS balance FROM credit_entries')
      .get()?.balance,
    750,
  );
  assert.equal(
    database.prepare('SELECT COUNT(*) AS count FROM purchases').get()?.count,
    1,
  );
});

test('database constraints reject fractional credits and invalid foreign keys', async t => {
  const { database, repository } = createHarness();
  t.after(() => database.close());
  await repository.initialize();
  assert.throws(() =>
    database
      .prepare('UPDATE artworks SET priceCredits = 0.5 WHERE id = ?')
      .run('art-lumen'),
  );
  assert.throws(() =>
    database
      .prepare('INSERT INTO watchlist (artworkId) VALUES (?)')
      .run('missing'),
  );
  assert.throws(() =>
    database
      .prepare(
        "INSERT INTO listings VALUES ('bad','art-lumen',300,'','draft','now','now')",
      )
      .run(),
  );
  assert.throws(() =>
    database
      .prepare(
        "INSERT INTO credit_entries VALUES ('bad','bad','seed',9007199254740991,NULL,'now')",
      )
      .run(),
  );
});
