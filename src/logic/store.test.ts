import { addProfile, emptySave } from './profiles.ts'
import { loadSave, quote, storeSave, type SqlRunner } from './store.ts'

/** A tiny fake database : remembers the last stored value and answers selects with it. */
function fakeDatabase(options: { failing?: boolean; value?: unknown } = {}) {
  const sqls: string[] = []
  let stored: unknown = options.value
  const run: SqlRunner = sql => {
    sqls.push(sql)
    if (options.failing) return { error: 'disk full', rows: [] }
    const insert = /VALUES \('save', '(?<json>.*)'\) ON CONFLICT/u.exec(sql)
    if (insert?.groups) stored = insert.groups.json.replaceAll("''", "'")
    return { error: undefined, rows: stored === undefined ? [] : [[stored]] }
  }
  return { run, sqls }
}

describe('store', () => {
  it('quotes single quotes', () => {
    expect(quote("O'Neil")).toBe("'O''Neil'")
  })

  it('loads a fresh save from an empty database', () => {
    expect(loadSave(fakeDatabase().run)).toStrictEqual(emptySave())
  })

  it('stores a save and loads it back, names with quotes included', () => {
    const database = fakeDatabase()
    const added = addProfile(emptySave(), "D'Artagnan", 10)
    if (!('save' in added)) throw new Error('should add')
    expect(storeSave(database.run, added.save)).toBe(true)
    expect(database.sqls[0]).toContain('CREATE TABLE IF NOT EXISTS')
    expect(loadSave(database.run)).toStrictEqual(added.save)
  })

  it('falls back to a fresh save when the database fails or holds something odd', () => {
    expect(loadSave(fakeDatabase({ failing: true }).run)).toStrictEqual(emptySave())
    expect(loadSave(fakeDatabase({ value: 12 }).run)).toStrictEqual(emptySave())
  })

  it('says when the database refused the save', () => {
    expect(storeSave(fakeDatabase({ failing: true }).run, emptySave())).toBe(false)
  })
})
