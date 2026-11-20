import { native } from 'raea/native'
import type { SaveData } from '../logic/profiles.ts'
import { loadSave, storeSave, type SqlRunner } from '../logic/store.ts'

/** Where the scores live : `FLOOD_IT_DB` when set, else a database in the player's home folder. */
function databasePath(): string {
  const custom = native('host.env', { name: 'FLOOD_IT_DB' })
  if (custom) return custom
  const folder = `${native('host.env', { name: 'HOME' }) ?? '.'}/.flood-it`
  // opening a folder as a file system makes it when it is missing
  native('fs.open', { root: folder })
  return `${folder}/flood-it.db`
}

export type Session = {
  /** a random number for this launch, so two launches do not play the same boards */
  nonce: number
  /** writes the save when it changed since the last write */
  persist: (save: SaveData, revision: number) => void
  save: SaveData
  startMs: number
}

/** Opens the scores database, reads the save and the clock. The game itself stays pure, everything impure is here. */
export function openSession(): Session {
  const path = databasePath()
  const run: SqlRunner = sql => {
    try {
      const answer = native('sqlite.exec', { path, sql })
      return { error: answer.error ?? undefined, rows: answer.sets.at(-1)?.rows ?? [] }
    } catch (error) {
      return { error: String(error), rows: [] }
    }
  }
  const clock = run("SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000, abs(random()) % 4294967296;").rows[0] ?? []
  const forced = native('host.env', { name: 'FLOOD_IT_NONCE' })
  let written = 0
  return {
    nonce: forced ? Number(forced) : Number(clock[1] ?? 1),
    persist(save, revision) {
      // a revision seen again, or an older one (the game was rewound), must not overwrite the newer save
      if (revision <= written) return
      written = revision
      storeSave(run, save)
    },
    save: loadSave(run),
    startMs: Number(clock[0] ?? 0),
  }
}
