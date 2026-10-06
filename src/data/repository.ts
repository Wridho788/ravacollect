import { DomainError, validatePrice } from '../domain/errors';
import type {
  Activity,
  Artwork,
  CreditEntry,
  Listing,
  ListingStatus,
  Purchase,
  Snapshot,
} from '../domain/types';
import type { SqlConnection, SqlRow, SqlValue } from './connection';
import { ARTWORK_FIXTURE, SEED_TIME, SEED_VERSION } from './fixture';
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from './schema';

export type FaultStage =
  | 'seed:after-catalog'
  | 'reset:after-clear'
  | 'purchase:after-purchase'
  | 'purchase:after-debit'
  | 'purchase:after-ownership'
  | 'watchlist:after-write'
  | 'listing:after-write';

/** The native factory never supplies this integration-test seam. */
type FaultHook = (stage: FaultStage) => void | Promise<void>;

function asPurchase(row: SqlRow): Purchase {
  return {
    id: String(row.id),
    operationId: String(row.operationId),
    artworkId: String(row.artworkId),
    priceCreditsSnapshot: Number(row.priceCreditsSnapshot),
    createdAt: String(row.createdAt),
  };
}

export class RavaRepository {
  private readonly connection: SqlConnection;
  private readonly faultHook?: FaultHook;
  private queue: Promise<unknown> = Promise.resolve();
  private ready = false;

  constructor(connection: SqlConnection, faultHook?: FaultHook) {
    this.connection = connection;
    this.faultHook = faultHook;
  }

  private async rows(sql: string, params: SqlValue[] = []): Promise<SqlRow[]> {
    return (await this.connection.execute(sql, params)).rows;
  }

  // Reads join the same queue: they cannot observe uncommitted intermediate writes.
  private serialized<T>(
    work: () => Promise<T>,
    requiresReady = true,
  ): Promise<T> {
    const run = this.queue.then(async () => {
      if (requiresReady && !this.ready) {
        throw new DomainError(
          'migration',
          'Penyimpanan belum siap. Coba buka kembali aplikasi.',
        );
      }
      try {
        return await work();
      } catch (error) {
        if (error instanceof DomainError) {
          throw error;
        }
        throw new DomainError(
          'storage',
          'Perubahan belum tersimpan. Silakan coba lagi.',
        );
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async transaction<T>(work: () => Promise<T>): Promise<T> {
    await this.rows('BEGIN IMMEDIATE');
    try {
      const result = await work();
      await this.rows('COMMIT');
      return result;
    } catch (error) {
      try {
        await this.rows('ROLLBACK');
      } catch {
        this.ready = false;
      }
      throw error;
    }
  }

  private async checkpoint(stage: FaultStage): Promise<void> {
    await this.faultHook?.(stage);
  }

  initialize(): Promise<void> {
    return this.serialized(async () => {
      this.ready = false;
      await this.rows('PRAGMA foreign_keys = ON');
      await this.rows('PRAGMA busy_timeout = 5000');
      await this.transaction(async () => {
        const tables = await this.rows(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
        );
        if (tables.length === 0) {
          for (const statement of SCHEMA_STATEMENTS) {
            await this.rows(statement);
          }
          await this.rows('INSERT INTO metadata (key,value) VALUES (?,?)', [
            'schemaVersion',
            SCHEMA_VERSION,
          ]);
          await this.seed();
          return;
        }
        const expected = [
          'metadata',
          'artworks',
          'purchases',
          'credit_entries',
          'ownership',
          'watchlist',
          'listings',
          'activities',
        ];
        if (
          tables.length !== expected.length ||
          expected.some(name => !tables.some(row => row.name === name))
        ) {
          throw new DomainError(
            'migration',
            'Struktur penyimpanan tidak dikenali. Data lama tetap disimpan.',
          );
        }
        const versions = await this.rows('SELECT key,value FROM metadata');
        if (
          versions.find(r => r.key === 'schemaVersion')?.value !==
            SCHEMA_VERSION ||
          versions.find(r => r.key === 'seedVersion')?.value !== SEED_VERSION
        ) {
          throw new DomainError(
            'migration',
            'Versi penyimpanan tidak didukung. Data lama tetap disimpan.',
          );
        }
        await this.checkIntegrity();
      });
      this.ready = true;
    }, false);
  }

  private async checkIntegrity(): Promise<void> {
    const checks = await this.rows('PRAGMA quick_check');
    const foreignKeys = await this.rows('PRAGMA foreign_key_check');
    const balance = await this.balance();
    const grants = await this.rows(
      "SELECT deltaCredits FROM credit_entries WHERE type = 'seed'",
    );
    const starter = await this.rows(
      "SELECT artworkId FROM ownership WHERE source = 'seed'",
    );
    const catalog = await this.rows('SELECT id FROM artworks');
    const inconsistent = await this.rows(`SELECT p.id FROM purchases p
      LEFT JOIN credit_entries c ON c.purchaseId = p.id
      LEFT JOIN ownership o ON o.purchaseId = p.id
      LEFT JOIN activities a ON a.operationId = p.operationId AND a.type = 'purchase'
      WHERE c.id IS NULL OR c.deltaCredits != -p.priceCreditsSnapshot
        OR c.operationId != p.operationId OR o.artworkId IS NULL OR o.artworkId != p.artworkId
        OR a.id IS NULL OR a.entityId != p.artworkId`);
    if (
      checks.some(row => row.quick_check !== 'ok') ||
      foreignKeys.length > 0 ||
      !Number.isSafeInteger(balance) ||
      balance < 0 ||
      grants.length !== 1 ||
      Number(grants[0]?.deltaCredits) !== 1000 ||
      starter.length !== 1 ||
      starter[0]?.artworkId !== 'owned-orbit' ||
      ARTWORK_FIXTURE.some(
        artwork => !catalog.some(row => row.id === artwork.id),
      ) ||
      inconsistent.length > 0
    ) {
      throw new DomainError(
        'migration',
        'Data penyimpanan perlu diperiksa. Data lama tetap disimpan.',
      );
    }
  }

  private async seed(): Promise<void> {
    for (const artwork of ARTWORK_FIXTURE) {
      await this.rows(
        `INSERT INTO artworks (id,title,creatorName,category,description,assetKey,priceCredits)
        VALUES (?,?,?,?,?,?,?)`,
        [
          artwork.id,
          artwork.title,
          artwork.creatorName,
          artwork.category,
          artwork.description,
          artwork.assetKey,
          artwork.priceCredits,
        ],
      );
    }
    await this.checkpoint('seed:after-catalog');
    await this.rows(
      "INSERT INTO ownership (artworkId,source,purchaseId,acquiredAt) VALUES (?,'seed',NULL,?)",
      ['owned-orbit', SEED_TIME],
    );
    await this.rows(
      `INSERT INTO credit_entries (id,operationId,type,deltaCredits,purchaseId,createdAt)
      VALUES ('seed-credit','seed-grant','seed',1000,NULL,?)`,
      [SEED_TIME],
    );
    await this.rows('INSERT INTO metadata (key,value) VALUES (?,?)', [
      'seedVersion',
      SEED_VERSION,
    ]);
    // No activity is fabricated: the initial grant is visible in the ledger.
  }

  private async balance(): Promise<number> {
    const result = await this.rows(
      'SELECT COALESCE(SUM(deltaCredits),0) AS balance FROM credit_entries',
    );
    return Number(result[0]?.balance ?? 0);
  }

  snapshot(): Promise<Snapshot> {
    return this.serialized(async () => {
      const artworks = (
        await this.rows(`SELECT a.*,
        EXISTS(SELECT 1 FROM ownership o WHERE o.artworkId = a.id) AS owned,
        EXISTS(SELECT 1 FROM watchlist w WHERE w.artworkId = a.id) AS favorite
        FROM artworks a ORDER BY a.rowid`)
      ).map(
        (row): Artwork => ({
          id: String(row.id),
          title: String(row.title),
          creatorName: String(row.creatorName),
          category: String(row.category),
          description: String(row.description),
          assetKey: String(row.assetKey),
          priceCredits: Number(row.priceCredits),
          owned: Number(row.owned) === 1,
          favorite: Number(row.favorite) === 1,
        }),
      );
      const listings = (
        await this.rows(
          'SELECT * FROM listings ORDER BY createdAt DESC, rowid DESC',
        )
      ).map(
        (row): Listing => ({
          id: String(row.id),
          artworkId: String(row.artworkId),
          priceCredits: Number(row.priceCredits),
          description: String(row.description),
          status: row.status as ListingStatus,
          createdAt: String(row.createdAt),
          updatedAt: String(row.updatedAt),
        }),
      );
      const activities = (
        await this.rows(
          'SELECT * FROM activities ORDER BY createdAt DESC, rowid DESC',
        )
      ).map(
        (row): Activity => ({
          id: String(row.id),
          operationId: String(row.operationId),
          type: String(row.type),
          entityId: String(row.entityId),
          summarySnapshot: String(row.summarySnapshot),
          createdAt: String(row.createdAt),
        }),
      );
      const ledger = (
        await this.rows(
          'SELECT * FROM credit_entries ORDER BY createdAt DESC, rowid DESC',
        )
      ).map(
        (row): CreditEntry => ({
          id: String(row.id),
          operationId: String(row.operationId),
          type: row.type as CreditEntry['type'],
          deltaCredits: Number(row.deltaCredits),
          purchaseId: row.purchaseId == null ? null : String(row.purchaseId),
          createdAt: String(row.createdAt),
        }),
      );
      return {
        artworks,
        balance: await this.balance(),
        listings,
        activities,
        ledger,
      };
    });
  }

  private async artwork(id: string): Promise<SqlRow> {
    const row = (
      await this.rows('SELECT * FROM artworks WHERE id = ?', [id])
    )[0];
    if (!row) {
      throw new DomainError('not-found', 'Karya tidak ditemukan.');
    }
    return row;
  }

  private async newId(): Promise<string> {
    return String(
      (await this.rows('SELECT lower(hex(randomblob(16))) AS id'))[0]?.id,
    );
  }

  private async activity(
    operationId: string,
    type: string,
    entityId: string,
    summary: string,
    time: string,
  ): Promise<void> {
    await this.rows(
      `INSERT INTO activities (id,operationId,type,entityId,summarySnapshot,createdAt)
      VALUES (?,?,?,?,?,?)`,
      [await this.newId(), operationId, type, entityId, summary, time],
    );
  }

  buyArtwork(
    artworkId: string,
    operationId: string,
    expectedPrice?: number,
  ): Promise<Purchase> {
    return this.serialized(async () => {
      if (!operationId.trim() || operationId.length > 200) {
        throw new DomainError('validation', 'Identitas pembelian tidak valid.');
      }
      if (expectedPrice !== undefined) {
        validatePrice(expectedPrice);
      }
      return this.transaction(async () => {
        const previous = (
          await this.rows('SELECT * FROM purchases WHERE operationId = ?', [
            operationId,
          ])
        )[0];
        if (previous) {
          if (
            previous.artworkId !== artworkId ||
            (expectedPrice !== undefined &&
              Number(previous.priceCreditsSnapshot) !== expectedPrice)
          ) {
            throw new DomainError(
              'operation-conflict',
              'Identitas pembelian sudah digunakan untuk permintaan berbeda.',
            );
          }
          return asPurchase(previous);
        }
        const artwork = await this.artwork(artworkId);
        if (
          (
            await this.rows(
              'SELECT artworkId FROM ownership WHERE artworkId = ?',
              [artworkId],
            )
          ).length > 0
        ) {
          throw new DomainError(
            'already-owned',
            'Karya ini sudah ada di koleksi kamu.',
          );
        }
        const price = Number(artwork.priceCredits);
        validatePrice(price);
        if (expectedPrice !== undefined && expectedPrice !== price) {
          throw new DomainError(
            'price-changed',
            'Harga berubah. Tinjau kembali pembelian ini.',
          );
        }
        if ((await this.balance()) < price) {
          throw new DomainError(
            'insufficient-credit',
            'Kredit demo belum cukup untuk karya ini.',
          );
        }
        const purchase: Purchase = {
          id: await this.newId(),
          operationId,
          artworkId,
          priceCreditsSnapshot: price,
          createdAt: new Date().toISOString(),
        };
        await this.rows(
          'INSERT INTO purchases (id,operationId,artworkId,priceCreditsSnapshot,createdAt) VALUES (?,?,?,?,?)',
          [purchase.id, operationId, artworkId, price, purchase.createdAt],
        );
        await this.checkpoint('purchase:after-purchase');
        await this.rows(
          `INSERT INTO credit_entries (id,operationId,type,deltaCredits,purchaseId,createdAt)
          VALUES (?,?,'purchase',?,?,?)`,
          [
            await this.newId(),
            operationId,
            -price,
            purchase.id,
            purchase.createdAt,
          ],
        );
        await this.checkpoint('purchase:after-debit');
        await this.rows(
          "INSERT INTO ownership (artworkId,source,purchaseId,acquiredAt) VALUES (?,'purchase',?,?)",
          [artworkId, purchase.id, purchase.createdAt],
        );
        await this.checkpoint('purchase:after-ownership');
        await this.activity(
          operationId,
          'purchase',
          artworkId,
          `Mengoleksi ${String(artwork.title)} · ${price} kredit demo`,
          purchase.createdAt,
        );
        return purchase;
      });
    });
  }

  setFavorite(artworkId: string, favorite: boolean): Promise<void> {
    return this.serialized(() =>
      this.transaction(async () => {
        await this.artwork(artworkId);
        if (favorite) {
          await this.rows(
            'INSERT OR IGNORE INTO watchlist (artworkId) VALUES (?)',
            [artworkId],
          );
        } else {
          await this.rows('DELETE FROM watchlist WHERE artworkId = ?', [
            artworkId,
          ]);
        }
        await this.checkpoint('watchlist:after-write');
      }),
    );
  }

  /** Save edits to the one listing for an artwork; never create a duplicate. */
  saveListing(
    artworkId: string,
    priceCredits: number,
    description: string,
    status: ListingStatus,
  ): Promise<void> {
    return this.serialized(async () => {
      validatePrice(priceCredits);
      const trimmed = description.trim();
      if (
        trimmed.length > 300 ||
        (status !== 'draft' && status !== 'published')
      ) {
        throw new DomainError(
          'validation',
          'Deskripsi maksimal 300 karakter dan status listing harus valid.',
        );
      }
      await this.transaction(async () => {
        const artwork = await this.artwork(artworkId);
        if (
          (
            await this.rows(
              'SELECT artworkId FROM ownership WHERE artworkId = ?',
              [artworkId],
            )
          ).length === 0
        ) {
          throw new DomainError(
            'not-owned',
            'Listing hanya bisa dibuat untuk koleksi milik kamu.',
          );
        }
        const existing = (
          await this.rows('SELECT * FROM listings WHERE artworkId = ?', [
            artworkId,
          ])
        )[0];
        const time = new Date().toISOString();
        if (existing) {
          await this.rows(
            'UPDATE listings SET priceCredits = ?, description = ?, status = ?, updatedAt = ? WHERE artworkId = ?',
            [priceCredits, trimmed, status, time, artworkId],
          );
        } else {
          await this.rows(
            `INSERT INTO listings (id,artworkId,priceCredits,description,status,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?)`,
            [
              await this.newId(),
              artworkId,
              priceCredits,
              trimmed,
              status,
              time,
              time,
            ],
          );
        }
        await this.checkpoint('listing:after-write');
        const action = !existing
          ? 'listing-created'
          : existing.status !== status
          ? status === 'published'
            ? 'listing-published'
            : 'listing-unpublished'
          : 'listing-updated';
        const label = !existing
          ? 'Listing dibuat'
          : existing.status !== status
          ? status === 'published'
            ? 'Listing dipublikasikan'
            : 'Listing menjadi draft'
          : 'Listing diperbarui';
        await this.activity(
          await this.newId(),
          action,
          artworkId,
          `${label}: ${String(
            artwork.title,
          )} · ${priceCredits} kredit demo · ${status}${
            trimmed ? ` · ${trimmed}` : ''
          }`,
          time,
        );
      });
    });
  }

  deleteListing(artworkId: string): Promise<void> {
    return this.serialized(() =>
      this.transaction(async () => {
        const listing = (
          await this.rows('SELECT * FROM listings WHERE artworkId = ?', [
            artworkId,
          ])
        )[0];
        if (!listing) {
          throw new DomainError('not-found', 'Listing tidak ditemukan.');
        }
        const artwork = await this.artwork(artworkId);
        await this.rows('DELETE FROM listings WHERE artworkId = ?', [
          artworkId,
        ]);
        await this.checkpoint('listing:after-write');
        await this.activity(
          await this.newId(),
          'listing-deleted',
          artworkId,
          `Listing dihapus: ${String(artwork.title)} · ${Number(
            listing.priceCredits,
          )} kredit demo · ${String(listing.status)}`,
          new Date().toISOString(),
        );
      }),
    );
  }

  resetDemo(): Promise<void> {
    return this.serialized(() =>
      this.transaction(async () => {
        for (const table of [
          'activities',
          'listings',
          'watchlist',
          'ownership',
          'credit_entries',
          'purchases',
          'artworks',
        ]) {
          await this.rows(`DELETE FROM ${table}`);
        }
        await this.rows("DELETE FROM metadata WHERE key = 'seedVersion'");
        await this.checkpoint('reset:after-clear');
        await this.seed();
      }),
    );
  }
}
