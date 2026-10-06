export type SqlValue = string | number | null;
export type SqlRow = Record<string, unknown>;

/** Each repository owns one connection. No other code may use it concurrently. */
export interface SqlConnection {
  execute(sql: string, params?: SqlValue[]): Promise<{ rows: SqlRow[] }>;
}
