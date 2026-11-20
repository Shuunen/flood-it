import {
  addProfile,
  bestOn,
  cleanName,
  COLOR_COUNT,
  defaultColor,
  deleteProfile,
  nextColor,
  updateProfile,
  emptySave,
  findProfile,
  houseRecord,
  isNameCharacter,
  leaderboard,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
  parseSave,
  recordWin,
  selectProfile,
  serializeSave,
  setTheme,
  solvedCount,
  type SaveData,
} from './profiles.ts'

const SEED_A = '7x7x4_' + '0'.repeat(49)
const SEED_B = '7x7x4_' + '1'.repeat(49)

function withPlayers(...names: string[]): SaveData {
  let save = emptySave()
  for (const [index, name] of names.entries()) {
    const added = addProfile(save, name, 1000 + index)
    if ('save' in added) save = added.save
  }
  return save
}

describe('names', () => {
  it('cleans a name', () => {
    expect(cleanName('  Ada \t  Lovelace\n')).toBe('Ada Lovelace')
    expect(cleanName('x'.repeat(40))).toHaveLength(MAX_NAME_LENGTH)
    expect(cleanName('   ')).toBe('')
    expect(cleanName(`${'a'.repeat(MAX_NAME_LENGTH - 1)} b`)).toBe('a'.repeat(MAX_NAME_LENGTH - 1))
  })

  it('accepts the keys a name is made of', () => {
    for (const key of ['a', 'Z', '7', ' ', '-', '_', '.', "'", 'é', 'ß']) expect(isNameCharacter(key)).toBe(true)
    for (const key of ['Enter', 'Backspace', '!', '/', '', 'ab']) expect(isNameCharacter(key)).toBe(false)
  })
})

describe('profiles', () => {
  it('adds a player and makes it the current one', () => {
    const added = addProfile(emptySave(), '  Ada ', 5000)
    if (!('profile' in added)) throw new Error('should add')
    expect(added.profile.name).toBe('Ada')
    expect(added.profile.id.startsWith('ada-')).toBe(true)
    expect(added.save.lastPlayerId).toBe(added.profile.id)
    expect(findProfile(added.save, added.profile.id)).toBe(added.profile)
    expect(findProfile(added.save, 'nope')).toBeUndefined()
  })

  it('gives an id to a name without letters', () => {
    const added = addProfile(emptySave(), '...', 1)
    expect('profile' in added && added.profile.id.startsWith('player-')).toBe(true)
  })

  it('refuses an empty name, a taken name and too many players', () => {
    expect(addProfile(emptySave(), '  ', 1)).toStrictEqual({ error: 'Please type a name' })
    expect(addProfile(withPlayers('Ada'), 'ADA', 2)).toStrictEqual({ error: 'That name is already taken' })
    const crowd = withPlayers(...Array.from({ length: MAX_PROFILES }, (_unused, index) => `Player ${index}`))
    expect(addProfile(crowd, 'One more', 2)).toStrictEqual({ error: 'Too many players here' })
  })

  it('gives colors, the least used first', () => {
    expect(nextColor(emptySave())).toBe(0)
    let save = withPlayers('Ada', 'Bob')
    expect(save.profiles.map(profile => profile.color)).toStrictEqual([0, 1])
    expect(nextColor(save)).toBe(2)
    const added = addProfile(save, 'Cleo', 5, 4)
    if ('save' in added) save = added.save
    expect(save.profiles[2].color).toBe(4)
    expect(defaultColor('Ada')).toBe(defaultColor('Ada'))
    expect(defaultColor('Ada')).toBeLessThan(COLOR_COUNT)
  })

  it('renames a player and changes their color, keeping their scores', () => {
    let save = withPlayers('Ada', 'Bob')
    const [ada, bob] = save.profiles.map(profile => profile.id)
    save = recordWin(save, ada, 's', 9, SEED_A, 1).save
    const renamed = updateProfile(save, ada, '  Ada L  ', 3)
    if (!('save' in renamed)) throw new Error('should rename')
    expect(renamed.save.profiles[0].name).toBe('Ada L')
    expect(renamed.save.profiles[0].color).toBe(3)
    expect(renamed.save.profiles[0].best[SEED_A]).toBe(9)
    expect(renamed.save.profiles[0].id).toBe(ada)
    expect(renamed.save.profiles[1].name).toBe('Bob')
    expect(updateProfile(save, ada, 'Ada', 2)).toHaveProperty('save')
    expect(updateProfile(save, ada, 'bob', 2)).toStrictEqual({ error: 'That name is already taken' })
    expect(updateProfile(save, bob, '   ', 2)).toStrictEqual({ error: 'Please type a name' })
  })

  it('deletes a player and forgets who plays when it was them', () => {
    const save = withPlayers('Ada', 'Bob')
    const [ada, bob] = save.profiles.map(profile => profile.id)
    const withoutBob = deleteProfile(save, bob)
    expect(withoutBob.profiles.map(profile => profile.name)).toStrictEqual(['Ada'])
    expect(withoutBob.lastPlayerId).toBe('')
    const withoutAda = deleteProfile({ ...save, lastPlayerId: bob }, ada)
    expect(withoutAda.lastPlayerId).toBe(bob)
    expect(deleteProfile(save, 'ghost').profiles).toHaveLength(2)
  })

  it('remembers who plays and when', () => {
    const save = withPlayers('Ada', 'Bob')
    const id = save.profiles[0].id
    const next = selectProfile(save, id, 'm', 9999)
    expect(next.lastPlayerId).toBe(id)
    expect(next.lastSize).toBe('m')
    expect(findProfile(next, id)?.lastPlayedAt).toBe(9999)
    expect(next.profiles[1].lastPlayedAt).toBe(1001)
  })
})

describe('scores', () => {
  it('records a first win on a puzzle without a best to beat', () => {
    const save = withPlayers('Ada')
    const result = recordWin(save, save.profiles[0].id, 's', 14, SEED_A, 2000)
    expect(result.newBest).toBe(false)
    expect(result.house).toBe(false)
    expect(result.previousBest).toBeUndefined()
    expect(result.record).toBeUndefined()
    expect(result.save.profiles[0].best[SEED_A]).toBe(14)
    expect(bestOn(result.save.profiles[0], SEED_A)).toBe(14)
    expect(bestOn(result.save.profiles[0], SEED_B)).toBeUndefined()
    expect(bestOn(undefined, SEED_A)).toBeUndefined()
    expect(result.save.profiles[0].wins.s).toBe(1)
    expect(result.save.profiles[0].history).toHaveLength(1)
  })

  it('only celebrates a best when the same puzzle needs less moves', () => {
    let save = withPlayers('Ada')
    const id = save.profiles[0].id
    save = recordWin(save, id, 's', 14, SEED_A, 1).save
    const same = recordWin(save, id, 's', 14, SEED_A, 2)
    expect(same.newBest).toBe(false)
    expect(same.previousBest).toBe(14)
    const worse = recordWin(same.save, id, 's', 20, SEED_A, 3)
    expect(worse.newBest).toBe(false)
    expect(worse.save.profiles[0].best[SEED_A]).toBe(14)
    expect(worse.save.profiles[0].wins.s).toBe(3)
    const better = recordWin(worse.save, id, 's', 11, SEED_A, 4)
    expect(better.newBest).toBe(true)
    expect(better.previousBest).toBe(14)
    expect(better.save.profiles[0].best[SEED_A]).toBe(11)
  })

  it('keeps the puzzles apart', () => {
    let save = withPlayers('Ada')
    const id = save.profiles[0].id
    save = recordWin(save, id, 's', 14, SEED_A, 1).save
    const other = recordWin(save, id, 's', 30, SEED_B, 2)
    expect(other.newBest).toBe(false)
    expect(other.previousBest).toBeUndefined()
    expect(other.save.profiles[0].best).toStrictEqual({ [SEED_A]: 14, [SEED_B]: 30 })
  })

  it('tells a house record on a puzzle from a personal best', () => {
    let save = withPlayers('Ada', 'Bob')
    const [ada, bob] = save.profiles.map(profile => profile.id)
    save = recordWin(save, ada, 's', 12, SEED_A, 1).save
    const slower = recordWin(save, bob, 's', 15, SEED_A, 2)
    expect(slower.house).toBe(false)
    expect(slower.record).toBe(12)
    const faster = recordWin(slower.save, bob, 's', 10, SEED_A, 3)
    expect(faster.house).toBe(true)
    expect(faster.newBest).toBe(true)
    expect(houseRecord(faster.save, SEED_A)).toBe(10)
    expect(recordWin(faster.save, ada, 's', 10, SEED_A, 4).house).toBe(false)
    expect(houseRecord(faster.save, SEED_B)).toBeUndefined()
    const firstTimeRecord = recordWin(faster.save, bob, 's', 8, SEED_B, 5)
    expect(firstTimeRecord.house).toBe(false)
    const ownRecordOnNewSeedForAda = recordWin(firstTimeRecord.save, ada, 's', 6, SEED_B, 6)
    expect(ownRecordOnNewSeedForAda.house).toBe(true)
    expect(ownRecordOnNewSeedForAda.newBest).toBe(false)
  })

  it('forgets the oldest puzzles and trims the history', () => {
    let save = withPlayers('Ada')
    const id = save.profiles[0].id
    for (let game = 0; game < 420; game += 1) save = recordWin(save, id, 'm', 30 - (game % 5), `10x10x5_${game}`, game).save
    expect(save.profiles[0].history).toHaveLength(30)
    expect(Object.keys(save.profiles[0].best)).toHaveLength(400)
    expect(save.profiles[0].best['10x10x5_0']).toBeUndefined()
    expect(save.profiles[0].best['10x10x5_419']).toBeDefined()
    expect(solvedCount(save.profiles[0])).toBe(420)
    expect(solvedCount(undefined)).toBe(0)
  })

  it('ignores a win of somebody unknown', () => {
    const save = withPlayers('Ada')
    expect(recordWin(save, 'ghost', 's', 3, SEED_A, 1)).toStrictEqual({ house: false, newBest: false, previousBest: undefined, record: undefined, save })
  })

  it('ranks the best scores of a puzzle, lowest first', () => {
    let save = withPlayers('Cleo', 'Ada', 'Bob', 'Dan')
    const [cleo, ada, bob] = save.profiles.map(profile => profile.id)
    save = recordWin(save, cleo, 's', 12, SEED_A, 1).save
    save = recordWin(save, ada, 's', 12, SEED_A, 2).save
    save = recordWin(save, bob, 's', 9, SEED_A, 3).save
    expect(leaderboard(save, SEED_A, 10).map(row => row.name)).toStrictEqual(['Bob', 'Ada', 'Cleo'])
    expect(leaderboard(save, SEED_A, 2)).toHaveLength(2)
    expect(leaderboard(save, SEED_B, 5)).toStrictEqual([])
  })
})

describe('saving', () => {
  it('round trips a save', () => {
    let save = withPlayers('Ada', 'Bob')
    save = recordWin(save, save.profiles[0].id, 'm', 21, '10x10x5_1', 50).save
    save = selectProfile(save, save.profiles[1].id, 'm', 60)
    expect(parseSave(serializeSave(save))).toStrictEqual(save)
  })

  it('starts fresh when there is nothing or the save is broken', () => {
    expect(parseSave(undefined)).toStrictEqual(emptySave())
    expect(parseSave('')).toStrictEqual(emptySave())
    expect(parseSave('{not json')).toStrictEqual(emptySave())
    expect(parseSave('42')).toStrictEqual(emptySave())
    expect(parseSave('null')).toStrictEqual(emptySave())
    expect(parseSave('{"profiles": 3}')).toStrictEqual(emptySave())
  })

  it('repairs a save that was edited by hand', () => {
    const broken = JSON.stringify({
      lastPlayerId: 'gone',
      lastSize: 'huge',
      profiles: [
        {
          best: { [SEED_A]: 9.7, '7x7x4_x': 3, [SEED_B]: -4, s: 5, m: 'ten' },
          createdAt: 5,
          history: [{ at: 1, moves: 9, seed: 's', size: 's' }, { moves: 'many' }, null, { at: 1, moves: 9, seed: 's', size: 'huge' }],
          id: 'ada-1',
          name: '  Ada  ',
          wins: { s: 2.7, m: null },
        },
        { id: 'bob-2', name: 'Bob', lastPlayedAt: 77 },
        { id: '', name: 'No id' },
        { id: 'blank', name: '   ' },
        { id: 7, name: 'Number id' },
        { id: 'noname' },
        'text',
        null,
      ],
    })
    const save = parseSave(broken)
    expect(save.lastPlayerId).toBe('')
    expect(save.lastSize).toBe('s')
    expect(save.profiles.map(profile => profile.id)).toStrictEqual(['ada-1', 'bob-2'])
    expect(save.profiles[0]).toStrictEqual({ best: { [SEED_A]: 9 }, color: defaultColor('Ada'), createdAt: 5, history: [{ at: 1, moves: 9, seed: 's', size: 's' }], id: 'ada-1', lastPlayedAt: 5, name: 'Ada', wins: { s: 2 } })
    expect(save.profiles[1].lastPlayedAt).toBe(77)
    expect(save.profiles[1].createdAt).toBe(0)
    expect(parseSave('{"profiles":[{"id":"a","name":"A","history":"nope","best":"nope"}]}').profiles[0].history).toStrictEqual([])
  })

  it('keeps a valid color and repairs a wrong one', () => {
    const save = parseSave(
      JSON.stringify({
        profiles: [
          { color: 4, id: 'a', name: 'A' },
          { color: 99, id: 'b', name: 'B' },
          { color: 1.5, id: 'c', name: 'C' },
        ],
      }),
    )
    expect(save.profiles[0].color).toBe(4)
    expect(save.profiles[1].color).toBe(defaultColor('B'))
    expect(save.profiles[2].color).toBe(defaultColor('C'))
  })

  it('remembers the theme, and falls back to the ocean for an unknown one', () => {
    const save = setTheme(emptySave(), 'aurora')
    expect(save.theme).toBe('aurora')
    expect(parseSave(serializeSave(save)).theme).toBe('aurora')
    expect(parseSave(JSON.stringify({ profiles: [], theme: 'disco' })).theme).toBe('ocean')
    expect(parseSave(JSON.stringify({ profiles: [] })).theme).toBe('ocean')
    expect(emptySave().theme).toBe('ocean')
  })

  it('keeps the last player and size when they are valid', () => {
    const save = parseSave(JSON.stringify({ lastPlayerId: 'bob-2', lastSize: 'l', profiles: [{ id: 'bob-2', name: 'Bob' }] }))
    expect(save.lastPlayerId).toBe('bob-2')
    expect(save.lastSize).toBe('l')
  })
})
