import { open } from '@op-engineering/op-sqlite';
import type { SqlConnection } from './connection';
import { RavaRepository } from './repository';

/** Call once at app startup. Initialization errors are handled by the recovery UI. */
export function createNativeRepository(): RavaRepository {
  const database = open({ name: 'ravacollect.sqlite' });
  const connection: SqlConnection = {
    async execute(sql, params = []) {
      const result = await database.execute(sql, params);
      return { rows: result.rows ?? [] };
    },
  };
  return new RavaRepository(connection);
}
