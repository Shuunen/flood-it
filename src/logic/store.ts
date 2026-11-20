import { emptySave, parseSave, serializeSave, type SaveData } from './profiles.ts'

/** Runs one SQL text and gives back the rows of its last query, or the error. */
export type SqlRunner = (sql: string) => { error: string | undefined; rows: unknown[][] }

const SAVE_KEY = 'save'

/** SQL string literal : single quotes doubled. */
export function quote(text: string): string {
  return `'${text.replaceAll("'", "''")}'`
}

const createTable = 'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);'

export function loadSave(run: SqlRunner): SaveData {
  const result = run(`${createTable} SELECT value FROM kv WHERE key = ${quote(SAVE_KEY)};`)
  if (result.error) return emptySave()
  const value = result.rows[0]?.[0]
  return parseSave(typeof value === 'string' ? value : undefined)
}

/** Stores the whole save in one go, true when the database took it. */
export function storeSave(run: SqlRunner, save: SaveData): boolean {
  const sql = `${createTable} INSERT INTO kv (key, value) VALUES (${quote(SAVE_KEY)}, ${quote(serializeSave(save))}) ON CONFLICT (key) DO UPDATE SET value = excluded.value;`
  return run(sql).error === undefined
}
