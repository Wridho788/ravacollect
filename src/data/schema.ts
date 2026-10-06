export const SCHEMA_VERSION = '1';

// typeof guards reject SQLite's otherwise permissive storage of fractional values.
const price =
  "INTEGER NOT NULL CHECK(typeof(priceCredits) = 'integer' AND priceCredits BETWEEN 1 AND 9007199254740991)";

export const SCHEMA_STATEMENTS = [
  'CREATE TABLE metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)',
  `CREATE TABLE artworks (
    id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, creatorName TEXT NOT NULL,
    category TEXT NOT NULL, description TEXT NOT NULL, assetKey TEXT NOT NULL,
    priceCredits ${price}
  )`,
  `CREATE TABLE purchases (
    id TEXT PRIMARY KEY NOT NULL, operationId TEXT NOT NULL UNIQUE,
    artworkId TEXT NOT NULL UNIQUE REFERENCES artworks(id),
    priceCreditsSnapshot INTEGER NOT NULL CHECK(typeof(priceCreditsSnapshot) = 'integer' AND priceCreditsSnapshot BETWEEN 1 AND 9007199254740991),
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE credit_entries (
    id TEXT PRIMARY KEY NOT NULL, operationId TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('seed','purchase')),
    deltaCredits INTEGER NOT NULL CHECK(typeof(deltaCredits) = 'integer' AND deltaCredits BETWEEN -9007199254740991 AND 9007199254740991),
    purchaseId TEXT UNIQUE REFERENCES purchases(id), createdAt TEXT NOT NULL,
    CHECK((type = 'seed' AND deltaCredits > 0 AND purchaseId IS NULL) OR
          (type = 'purchase' AND deltaCredits < 0 AND purchaseId IS NOT NULL))
  )`,
  `CREATE TABLE ownership (
    artworkId TEXT PRIMARY KEY NOT NULL REFERENCES artworks(id),
    source TEXT NOT NULL CHECK(source IN ('seed','purchase')),
    purchaseId TEXT UNIQUE REFERENCES purchases(id), acquiredAt TEXT NOT NULL,
    CHECK((source = 'seed' AND purchaseId IS NULL) OR
          (source = 'purchase' AND purchaseId IS NOT NULL))
  )`,
  'CREATE TABLE watchlist (artworkId TEXT PRIMARY KEY NOT NULL REFERENCES artworks(id))',
  `CREATE TABLE listings (
    id TEXT PRIMARY KEY NOT NULL,
    artworkId TEXT NOT NULL UNIQUE REFERENCES ownership(artworkId),
    priceCredits ${price}, description TEXT NOT NULL CHECK(length(description) <= 300),
    status TEXT NOT NULL CHECK(status IN ('draft','published')),
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE activities (
    id TEXT PRIMARY KEY NOT NULL, operationId TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, entityId TEXT NOT NULL,
    summarySnapshot TEXT NOT NULL, createdAt TEXT NOT NULL
  )`,
  `CREATE TRIGGER credit_balance_guard BEFORE INSERT ON credit_entries
    WHEN COALESCE((SELECT SUM(deltaCredits) FROM credit_entries),0) + NEW.deltaCredits < 0
      OR COALESCE((SELECT SUM(deltaCredits) FROM credit_entries),0) + NEW.deltaCredits > 9007199254740991
    BEGIN SELECT RAISE(ABORT, 'Invalid credit balance'); END`,
];
