import { SIZES } from '../logic/board.ts'
import { emptySave, MAX_NAME_LENGTH, MAX_PROFILES } from '../logic/profiles.ts'
import {
  BOARD,
  cellRect,
  dropRect,
  HOME_BUTTON,
  HOME_SETTINGS,
  HOME_START,
  HOME_SWITCH,
  homeSize,
  colorSwatch,
  NAME_CANCEL,
  NAME_DELETE,
  NAME_ERASE,
  NAME_OK,
  NEW_GAME_BUTTON,
  NEW_PLAYER_CHIP,
  NEXT_PAGE,
  PLAYER_CHIP,
  PREVIOUS_PAGE,
  profileChip,
  profileEdit,
  RESTART_BUTTON,
  SETTINGS_BACK,
  sizeButton,
  SWITCH_BUTTON,
  themeCard,
  WIN_AGAIN,
  type Rect,
} from './layout.ts'
import { createState, floodFrames, floodStagger, isBigWin, nowMs, step, type GameState } from './state.ts'

/** A little driver : keeps the frame counter and lets a test press keys and click like a player. */
function driver(initial: GameState) {
  let frame = 1
  let state = initial
  const api = {
    click(rect: Rect, at = { x: 0.5, y: 0.5 }) {
      const pointer = { x: rect.x + rect.width * at.x, y: rect.y + rect.height * at.y }
      state = step(state, { keys: [], pointer: { ...pointer, down: true } }, frame)
      frame += 1
      state = step(state, { keys: [], pointer: { ...pointer, down: false } }, frame)
      frame += 1
      return state
    },
    get frame() {
      return frame
    },
    idle(frames: number) {
      for (let index = 0; index < frames; index += 1) {
        state = step(state, { keys: [] }, frame)
        frame += 1
      }
      return state
    },
    press(...keys: string[]) {
      for (const key of keys) {
        state = step(state, { keys: [key] }, frame)
        frame += 1
        state = step(state, { keys: [] }, frame)
        frame += 1
      }
      return state
    },
    type(text: string) {
      return api.press(...text)
    },
    get state() {
      return state
    },
    set state(value: GameState) {
      state = value
    },
  }
  return api
}

function fresh() {
  return driver(createState(emptySave(), 1_000_000, 7))
}

/** A player called Ada, on the home screen. */
function home() {
  const game = fresh()
  game.type('Ada')
  game.press('Enter')
  return game
}

/** A player called Ada, on a puzzle. */
function ada() {
  const game = home()
  game.press('Enter')
  return game
}

/** A tiny puzzle that one move solves : the top left cell is 0, the three others are 1. */
function almostWon(game: ReturnType<typeof driver>, seed = '2x2x2_0111') {
  game.state = { ...game.state, cells: [0, 1, 1, 1], colors: 2, dist: [], height: 2, moves: 0, prev: [0, 1, 1, 1], seed, width: 2 }
}

function wonWith(game: ReturnType<typeof driver>) {
  const result = game.state.win
  if (!result) throw new Error('nobody won yet')
  return result
}

/** Plays and wins the tiny puzzle, then waits for the celebration. */
function win(game: ReturnType<typeof driver>, seed?: string) {
  almostWon(game, seed)
  game.press('2')
  game.idle((game.state.win?.at ?? 0) - game.frame + 2)
}

describe('starting', () => {
  it('asks for a name when nobody played here yet', () => {
    const { state } = fresh()
    expect(state.phase).toBe('players')
    expect(state.naming).toBe(true)
    expect(state.cells).toHaveLength(49)
    expect(state.colors).toBe(4)
  })

  it('opens on the home screen for the last player, with the size they chose', () => {
    const save = ada().state.save
    const state = createState({ ...save, lastSize: 'm' }, 5, 9)
    expect(state.phase).toBe('home')
    expect(state.sizeId).toBe('m')
    expect(state.colors).toBe(5)
  })

  it('shows the players when nobody is selected yet', () => {
    const save = { ...ada().state.save, lastPlayerId: '' }
    const state = createState(save, 5, 9)
    expect(state.phase).toBe('players')
    expect(state.naming).toBe(false)
  })

  it('does not change anything on an idle frame', () => {
    const { state } = ada()
    expect(step(state, { keys: [] }, 5000)).toBe(state)
  })

  it('counts time from the start of the session', () => {
    const { state } = fresh()
    expect(nowMs(state, 120)).toBe(1_002_000)
  })
})

describe('typing a name', () => {
  it('types, erases and creates a player, then shows the home screen', () => {
    const game = fresh()
    game.type('Adx')
    expect(game.state.draft).toBe('Adx')
    expect(game.state.cue.kind).toBe('type')
    game.press('Backspace')
    expect(game.state.draft).toBe('Ad')
    expect(game.state.cue.kind).toBe('back')
    game.press('a', 'Enter')
    expect(game.state.phase).toBe('home')
    expect(game.state.save.profiles.map(profile => profile.name)).toStrictEqual(['Ada'])
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[0].id)
    expect(game.state.saveRev).toBeGreaterThan(0)
    expect(game.state.cue.kind).toBe('select')
    expect(game.state.draft).toBe('')
  })

  it('understands every way the erase key may be named', () => {
    const game = fresh()
    game.type('abcdefg')
    for (const key of ['Backspace', 'backspace', 'NumpadBackspace', '\b', '\u007F', 'Delete']) game.press(key)
    expect(game.state.draft).toBe('a')
  })

  it('erases with the arrow and with the erase button', () => {
    const game = fresh()
    game.type('abcd')
    game.press('ArrowLeft')
    expect(game.state.draft).toBe('abc')
    game.click(NAME_ERASE)
    expect(game.state.draft).toBe('ab')
    game.press('\u007F')
    expect(game.state.draft).toBe('a')
  })

  it('ignores the keys that are not letters and stops at the maximum length', () => {
    const game = fresh()
    game.press('Shift', 'F1', '!', 'ArrowLeft')
    expect(game.state.draft).toBe('')
    game.type('x'.repeat(MAX_NAME_LENGTH + 5))
    expect(game.state.draft).toHaveLength(MAX_NAME_LENGTH)
  })

  it('erases while backspace is held', () => {
    const game = fresh()
    game.type('abcdefgh')
    for (let frame = 0; frame < 40; frame += 1) game.state = step(game.state, { keys: ['Backspace'] }, game.frame + frame)
    expect(game.state.draft.length).toBeLessThan(8)
    expect(game.state.draft.length).toBeGreaterThan(0)
  })

  it('refuses an empty name, with an error cue', () => {
    const game = fresh()
    game.press('Enter')
    expect(game.state.error).toBe('Please type a name')
    expect(game.state.cue.kind).toBe('error')
    expect(game.state.phase).toBe('players')
    game.press('a')
    expect(game.state.error).toBe('')
  })

  it('refuses a name that is taken', () => {
    const game = home()
    game.press('p', 'n')
    game.type('ada')
    game.press('Enter')
    expect(game.state.error).toBe('That name is already taken')
    expect(game.state.save.profiles).toHaveLength(1)
  })

  it('can not be cancelled when there is nobody yet, but can after', () => {
    const game = fresh()
    game.press('Escape')
    expect(game.state.naming).toBe(true)
    game.click(NAME_CANCEL)
    expect(game.state.naming).toBe(true)
    game.type('Bo')
    game.click(NAME_OK)
    expect(game.state.phase).toBe('home')
    game.press('p', 'n')
    game.type('Zed')
    game.press('Escape')
    expect(game.state.naming).toBe(false)
    expect(game.state.draft).toBe('')
    game.press('n')
    game.type('Zed')
    game.click(NAME_CANCEL)
    expect(game.state.naming).toBe(false)
    game.press('n')
    game.click({ height: 10, width: 10, x: 0, y: 0 })
    expect(game.state.naming).toBe(true)
  })

  it('creates a player with the ok button', () => {
    const game = fresh()
    game.type('Zoe')
    game.click(NAME_OK)
    expect(game.state.phase).toBe('home')
    expect(game.state.save.profiles[0].name).toBe('Zoe')
  })
})

describe('the home screen', () => {
  it('starts a puzzle with the key or the button', () => {
    const game = home()
    const first = game.state.seed
    game.press('Enter')
    expect(game.state.phase).toBe('play')
    expect(game.state.seed).not.toBe(first)
    expect(game.state.cue.kind).toBe('newgame')
    game.press('h')
    game.click(HOME_START)
    expect(game.state.phase).toBe('play')
    game.press('h')
    game.press(' ')
    expect(game.state.phase).toBe('play')
  })

  it('chooses the board size before starting', () => {
    const game = home()
    game.click(homeSize(1))
    expect(game.state.sizeId).toBe('m')
    expect(game.state.save.lastSize).toBe('m')
    expect(game.state.phase).toBe('home')
    game.click(homeSize(1))
    expect(game.state.cue.kind).toBe('tap')
    game.press('3')
    expect(game.state.sizeId).toBe('l')
    game.click({ height: 4, width: 4, x: 3, y: 3 })
    game.press('x')
    game.click(HOME_START)
    expect(game.state.cells).toHaveLength(196)
  })

  it('opens the players from the button, the chip or the key and comes back home', () => {
    const game = home()
    game.click(HOME_SWITCH)
    expect(game.state.phase).toBe('players')
    game.press('Escape')
    expect(game.state.phase).toBe('home')
    game.click(PLAYER_CHIP)
    expect(game.state.phase).toBe('players')
    game.press('Tab')
    game.press('p')
    expect(game.state.phase).toBe('players')
  })
})

describe('the settings', () => {
  it('opens from the home screen with the button or the key, and goes back', () => {
    const game = home()
    game.click(HOME_SETTINGS)
    expect(game.state.phase).toBe('settings')
    game.click(SETTINGS_BACK)
    expect(game.state.phase).toBe('home')
    game.press('s')
    expect(game.state.phase).toBe('settings')
    game.press('Escape')
    expect(game.state.phase).toBe('home')
    game.press('s', 'Enter')
    expect(game.state.phase).toBe('home')
    game.press('s', 'h')
    expect(game.state.phase).toBe('home')
  })

  it('chooses the theme by clicking its card, with the arrows or with the number keys', () => {
    const game = home()
    expect(game.state.save.theme).toBe('ocean')
    game.press('s')
    game.click(themeCard(1))
    expect(game.state.save.theme).toBe('sunset')
    expect(game.state.cue.kind).toBe('select')
    expect(game.state.saveRev).toBeGreaterThan(0)
    game.click(themeCard(1))
    expect(game.state.cue.kind).toBe('tap')
    game.press('ArrowRight')
    expect(game.state.save.theme).toBe('aurora')
    game.press('ArrowRight')
    expect(game.state.save.theme).toBe('ocean')
    game.press('ArrowLeft')
    expect(game.state.save.theme).toBe('aurora')
    game.press('ArrowLeft', 'ArrowLeft')
    expect(game.state.save.theme).toBe('ocean')
    game.press('3')
    expect(game.state.save.theme).toBe('aurora')
    game.press('x')
    game.click({ height: 4, width: 4, x: 3, y: 3 })
    expect(game.state.phase).toBe('settings')
  })
})

describe('playing', () => {
  it('floods with the water buttons, the number keys and the cells', () => {
    const game = ada()
    const first = game.state
    const other = (first.cells[0] + 1) % first.colors
    game.click(dropRect(other, first.colors))
    expect(game.state.moves).toBe(1)
    expect(game.state.cells[0]).toBe(other)
    expect(game.state.cue.kind).toBe('move')
    expect(game.state.prev).toStrictEqual(first.cells)
    expect(game.state.moveAt).toBeGreaterThan(0)
    const again = (game.state.cells[0] + 1) % first.colors
    game.press(String(again + 1))
    expect(game.state.moves).toBe(2)
    const cell = game.state.cells.findIndex(color => color !== game.state.cells[0])
    game.click(cellRect(cell, first.width, first.height))
    expect(game.state.moves).toBe(3)
    expect(game.state.cells[0]).toBe(game.state.cells[cell])
  })

  it('answers with an error cue when the color changes nothing', () => {
    const game = ada()
    game.press(String(game.state.cells[0] + 1))
    expect(game.state.moves).toBe(0)
    expect(game.state.cue.kind).toBe('error')
  })

  it('ignores keys without a color and clicks next to everything', () => {
    const game = ada()
    const before = game.state
    game.press('9', '0', 'x')
    game.click({ height: 10, width: 10, x: 1, y: 1 })
    expect(game.state.moves).toBe(0)
    expect(game.state.cells).toBe(before.cells)
  })

  it('restarts the same puzzle, and starts another one', () => {
    const game = ada()
    const seed = game.state.seed
    const color = (game.state.cells[0] + 1) % game.state.colors
    game.press(String(color + 1))
    game.press('r')
    expect(game.state.moves).toBe(0)
    expect(game.state.seed).toBe(seed)
    game.press(String(color + 1))
    game.click(RESTART_BUTTON)
    expect(game.state.moves).toBe(0)
    game.click(RESTART_BUTTON)
    expect(game.state.cue.kind).toBe('error')
    game.press('N')
    expect(game.state.seed).not.toBe(seed)
    expect(game.state.cue.kind).toBe('newgame')
    const second = game.state.seed
    game.click(NEW_GAME_BUTTON)
    expect(game.state.seed).not.toBe(second)
  })

  it('refuses to start from a broken seed', () => {
    const game = ada()
    game.state = { ...game.state, moves: 1, seed: 'broken' }
    expect(() => game.press('r')).toThrow('broken seed')
  })

  it('does not restart an untouched puzzle with the key', () => {
    const game = ada()
    const before = game.state.newGameAt
    game.press('r')
    expect(game.state.newGameAt).toBe(before)
  })

  it('goes home with the key, escape or the button', () => {
    const game = ada()
    game.press('h')
    expect(game.state.phase).toBe('home')
    game.press('Enter', 'Escape')
    expect(game.state.phase).toBe('home')
    game.press('Enter')
    game.click(HOME_BUTTON)
    expect(game.state.phase).toBe('home')
  })

  it('changes the board size and remembers it', () => {
    const game = ada()
    game.click(sizeButton(1))
    expect(game.state.sizeId).toBe('m')
    expect(game.state.cells).toHaveLength(100)
    expect(game.state.save.lastSize).toBe('m')
    game.click(sizeButton(1))
    expect(game.state.cue.kind).toBe('tap')
    game.click(sizeButton(2))
    expect(game.state.colors).toBe(SIZES[2].colors)
    game.click(sizeButton(0))
    expect(game.state.cells).toHaveLength(49)
  })
})

describe('winning', () => {
  it('saves the score of a first win on a puzzle and celebrates once the water has crossed the board', () => {
    const game = ada()
    almostWon(game)
    game.press('2')
    const { state } = game
    expect(state.phase).toBe('won')
    expect(state.win?.moves).toBe(1)
    expect(state.win?.newBest).toBe(false)
    expect(state.win?.celebrated).toBe(false)
    expect(state.save.profiles[0].best['2x2x2_0111']).toBe(1)
    expect(state.win?.at).toBe(state.moveAt + floodFrames(state.maxDist, 2))
    expect(game.state.cue.kind).toBe('move')
    game.idle(state.win?.at ?? 0)
    expect(game.state.win?.celebrated).toBe(true)
    expect(game.state.cue.kind).toBe('win')
    expect(game.state.cue.data).toBe(1)
  })

  it('celebrates big when the same puzzle is solved in fewer moves than before', () => {
    const game = ada()
    game.state = { ...game.state, save: { ...game.state.save, profiles: game.state.save.profiles.map(profile => ({ ...profile, best: { '2x2x2_0111': 5 } })) } }
    win(game)
    expect(game.state.win?.newBest).toBe(true)
    expect(game.state.win?.previousBest).toBe(5)
    expect(isBigWin(wonWith(game))).toBe(true)
    expect(game.state.cue.kind).toBe('best')
    expect(game.state.save.profiles[0].best['2x2x2_0111']).toBe(1)
  })

  it('celebrates a plain win when the best score is not beaten', () => {
    const game = ada()
    win(game)
    game.press('r')
    game.state = { ...game.state, cells: [0, 0, 1, 1], dist: [], moves: 0, prev: [0, 0, 1, 1], seed: '2x2x2_0011' }
    almostWon(game)
    game.state = { ...game.state, moves: 1 }
    game.press('2')
    expect(game.state.win?.newBest).toBe(false)
    expect(game.state.win?.previousBest).toBe(1)
    game.idle(game.state.win?.at ?? 0)
    expect(game.state.cue.kind).toBe('win')
    expect(isBigWin(wonWith(game))).toBe(false)
  })

  it('counts beating the best of another player as a big win too', () => {
    const game = ada()
    win(game)
    game.press('p', 'n')
    game.type('Bob')
    game.press('Enter')
    expect(game.state.phase).toBe('play')
    expect(game.state.seed).toBe('2x2x2_0111')
    game.state = { ...game.state, cells: [0, 1, 1, 1], colors: 2, dist: [], moves: 1, prev: [0, 1, 1, 1] }
    game.press('2')
    expect(game.state.win?.moves).toBe(2)
    expect(game.state.win?.record).toBe(1)
    expect(game.state.win?.house).toBe(false)
  })

  it('offers to try again, only once the water settled', () => {
    const game = ada()
    almostWon(game)
    game.press('2')
    game.press(' ', 'Enter')
    game.click(WIN_AGAIN)
    expect(game.state.phase).toBe('won')
    game.idle((game.state.win?.at ?? 0) - game.frame + 2)
    game.press('Enter')
    expect(game.state.phase).toBe('play')
    expect(game.state.seed).toBe('2x2x2_0111')
    expect(game.state.moves).toBe(0)
    expect(game.state.win).toBeUndefined()
    win(game)
    game.click(WIN_AGAIN)
    expect(game.state.seed).toBe('2x2x2_0111')
    expect(game.state.phase).toBe('play')
    win(game)
    game.press(' ')
    expect(game.state.seed).toBe('2x2x2_0111')
  })

  it('keeps the new puzzle and home actions of the board available behind the win card', () => {
    const game = ada()
    win(game)
    game.click(NEW_GAME_BUTTON)
    expect(game.state.seed).not.toBe('2x2x2_0111')
    expect(game.state.phase).toBe('play')
    win(game)
    game.click(HOME_BUTTON)
    expect(game.state.phase).toBe('home')
    game.press('Enter')
    win(game)
    game.press('h')
    expect(game.state.phase).toBe('home')
  })

  it('still lets the player switch from the win screen', () => {
    const game = ada()
    win(game)
    game.click(SWITCH_BUTTON)
    expect(game.state.phase).toBe('players')
  })

  it('measures how long a flood takes, slower per cell on small boards', () => {
    expect(floodFrames(0, 7)).toBeGreaterThan(0)
    expect(floodFrames(10, 7)).toBeGreaterThan(floodFrames(5, 7))
    expect(floodStagger(7)).toBeGreaterThan(floodStagger(14))
    expect(floodStagger(100)).toBe(3)
  })
})

describe('switching players', () => {
  function twoPlayers() {
    const game = ada()
    game.press('p', 'n')
    game.type('Bob')
    game.press('Enter')
    return game
  }

  it('opens the list on the current player and goes back to the puzzle', () => {
    const game = ada()
    game.press('Tab')
    expect(game.state.phase).toBe('players')
    expect(game.state.naming).toBe(false)
    const seed = game.state.seed
    game.press('Escape')
    expect(game.state.phase).toBe('play')
    expect(game.state.seed).toBe(seed)
    game.click(PLAYER_CHIP)
    game.press('Enter')
    expect(game.state.phase).toBe('play')
    expect(game.state.seed).toBe(seed)
    game.click(SWITCH_BUTTON)
    expect(game.state.phase).toBe('players')
  })

  it('resumes a won puzzle when the same player is picked again', () => {
    const game = ada()
    almostWon(game)
    game.press('2')
    game.press('p')
    game.press('Enter')
    expect(game.state.phase).toBe('won')
  })

  it('gives the same puzzle to the next player, who plays it from the start', () => {
    const game = twoPlayers()
    expect(game.state.save.profiles.map(profile => profile.name)).toStrictEqual(['Ada', 'Bob'])
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[1].id)
    expect(game.state.phase).toBe('play')
    game.press('p')
    expect(game.state.selected).toBe(1)
    game.press('ArrowLeft')
    expect(game.state.selected).toBe(0)
    game.press('ArrowLeft', 'ArrowUp')
    expect(game.state.selected).toBe(0)
    game.press('ArrowDown')
    expect(game.state.selected).toBe(2)
    game.press('ArrowRight', 'ArrowDown')
    expect(game.state.selected).toBe(2)
    game.press('ArrowUp', 'ArrowUp')
    expect(game.state.selected).toBe(0)
    const { seed } = game.state
    game.press('Enter')
    expect(game.state.phase).toBe('play')
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[0].id)
    expect(game.state.seed).toBe(seed)
    expect(game.state.moves).toBe(0)
    expect(game.state.cue.kind).toBe('select')
  })

  it('stays on the home screen when the player is changed from there', () => {
    const game = home()
    game.press('p', 'n')
    game.type('Bob')
    game.press('Enter')
    expect(game.state.phase).toBe('home')
    game.press('p', 'ArrowLeft', 'Enter')
    expect(game.state.phase).toBe('home')
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[0].id)
    game.press('p', 'Enter')
    expect(game.state.phase).toBe('home')
  })

  it('picks a player by clicking the chip, and starts naming from the new player chip', () => {
    const game = twoPlayers()
    game.press('p')
    game.click(profileChip(0))
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[0].id)
    game.press('p')
    game.click(NEW_PLAYER_CHIP)
    expect(game.state.naming).toBe(true)
    game.press('Escape')
    game.press('ArrowDown', 'ArrowDown', 'Enter')
    expect(game.state.naming).toBe(true)
  })

  it('refuses to leave the list while nobody is selected', () => {
    const save = { ...ada().state.save, lastPlayerId: '' }
    const game = driver(createState(save, 5, 9))
    game.press('Escape', 'Tab')
    expect(game.state.phase).toBe('players')
    game.click({ height: 4, width: 4, x: 3, y: 3 })
    expect(game.state.phase).toBe('players')
  })

  it('ignores the other keys on the player list', () => {
    const game = ada()
    game.press('p')
    const before = game.state
    game.press('x', 'F5')
    expect(game.state.selected).toBe(before.selected)
    expect(game.state.phase).toBe('players')
  })

  it('pages through many players', () => {
    const game = ada()
    for (let index = 1; index < 11; index += 1) {
      game.press('p', 'n')
      game.type(`P${String.fromCodePoint(97 + index)}`)
      game.press('Enter')
    }
    expect(game.state.save.profiles).toHaveLength(11)
    game.press('p')
    expect(game.state.selected).toBe(10)
    game.click(PREVIOUS_PAGE)
    expect(game.state.selected).toBe(0)
    game.click(PREVIOUS_PAGE)
    expect(game.state.selected).toBe(0)
    game.click(NEXT_PAGE)
    expect(game.state.selected).toBe(8)
    game.click(NEXT_PAGE)
    expect(game.state.selected).toBe(8)
    game.click(profileChip(1))
    expect(game.state.save.lastPlayerId).toBe(game.state.save.profiles[9].id)
    expect(MAX_PROFILES).toBeGreaterThan(11)
  })
})

describe('managing players', () => {
  /** Ada and Bob, on the player list with Ada selected. */
  function listOfTwo() {
    const game = ada()
    game.press('p', 'n')
    game.type('Bob')
    game.press('Enter')
    game.press('p', 'ArrowLeft')
    return game
  }

  it('gives a color to a new player, chosen with the arrows or the swatches', () => {
    const game = home()
    game.press('p', 'n')
    expect(game.state.draftColor).toBe(1)
    game.press('ArrowDown')
    expect(game.state.draftColor).toBe(2)
    game.press('ArrowUp', 'ArrowUp', 'ArrowUp')
    expect(game.state.draftColor).toBe(5)
    game.click(colorSwatch(3))
    expect(game.state.draftColor).toBe(3)
    game.type('Zed')
    game.press('Enter')
    expect(game.state.save.profiles[1].color).toBe(3)
  })

  it('opens the form of a player with the edit button or the key', () => {
    const game = listOfTwo()
    game.click(profileEdit(1))
    expect(game.state.naming).toBe(true)
    expect(game.state.editing).toBe(game.state.save.profiles[1].id)
    expect(game.state.draft).toBe('Bob')
    expect(game.state.draftColor).toBe(game.state.save.profiles[1].color)
    game.press('Escape')
    expect(game.state.naming).toBe(false)
    expect(game.state.editing).toBe('')
    game.press('ArrowLeft', 'e')
    expect(game.state.draft).toBe('Ada')
    game.click(NAME_CANCEL)
    expect(game.state.naming).toBe(false)
    game.press('ArrowDown', 'ArrowDown', 'e')
    expect(game.state.naming).toBe(false)
  })

  it('renames a player and changes their color', () => {
    const game = listOfTwo()
    game.press('e')
    game.press('ArrowLeft', 'ArrowLeft', 'ArrowLeft')
    game.type('Eve')
    game.click(colorSwatch(4))
    game.press('Enter')
    const [first, second] = game.state.save.profiles
    expect(first.name).toBe('Eve')
    expect(first.color).toBe(4)
    expect(second.name).toBe('Bob')
    expect(game.state.naming).toBe(false)
    expect(game.state.editing).toBe('')
    expect(game.state.cue.kind).toBe('select')
    expect(game.state.phase).toBe('players')
    expect(game.state.saveRev).toBeGreaterThan(0)
  })

  it('refuses a name that another player has, or no name', () => {
    const game = listOfTwo()
    game.press('e')
    for (let index = 0; index < 3; index += 1) game.click(NAME_ERASE)
    game.click(NAME_OK)
    expect(game.state.error).toBe('Please type a name')
    game.type('bob')
    game.press('Enter')
    expect(game.state.error).toBe('That name is already taken')
    expect(game.state.save.profiles[0].name).toBe('Ada')
    expect(game.state.naming).toBe(true)
  })

  it('asks to be sure before deleting, and a key cancels the question', () => {
    const game = listOfTwo()
    game.press('e')
    game.click(NAME_DELETE)
    expect(game.state.confirmDelete).toBe(true)
    expect(game.state.save.profiles).toHaveLength(2)
    game.press('x')
    expect(game.state.confirmDelete).toBe(false)
    game.click(NAME_DELETE)
    game.click(colorSwatch(2))
    expect(game.state.confirmDelete).toBe(false)
    game.click(NAME_DELETE)
    game.click(NAME_ERASE)
    expect(game.state.confirmDelete).toBe(false)
    expect(game.state.save.profiles).toHaveLength(2)
  })

  it('deletes a player, who may be the one playing', () => {
    const game = listOfTwo()
    game.press('ArrowRight', 'e')
    game.click(NAME_DELETE)
    game.click(NAME_DELETE)
    expect(game.state.save.profiles.map(profile => profile.name)).toStrictEqual(['Ada'])
    expect(game.state.naming).toBe(false)
    expect(game.state.selected).toBe(0)
    expect(game.state.cue.kind).toBe('back')
    expect(game.state.save.lastPlayerId).toBe('')
    game.press('Escape')
    expect(game.state.phase).toBe('players')
  })

  it('asks for a new player when the last one is deleted', () => {
    const game = home()
    game.press('p', 'e')
    game.click(NAME_DELETE)
    game.click(NAME_DELETE)
    expect(game.state.save.profiles).toHaveLength(0)
    expect(game.state.naming).toBe(true)
    expect(game.state.editing).toBe('')
    expect(game.state.draft).toBe('')
  })

  it('has nothing to delete while a new player is made', () => {
    const game = home()
    game.press('p', 'n')
    game.click(NAME_DELETE)
    expect(game.state.confirmDelete).toBe(false)
    expect(game.state.save.profiles).toHaveLength(1)
  })
})

describe('layout', () => {
  it('keeps the board inside the stage and cells inside the board', () => {
    expect(BOARD.x + BOARD.width).toBeLessThan(1920)
    const last = cellRect(48, 7, 7)
    expect(last.x + last.width).toBeCloseTo(BOARD.x + BOARD.width)
    expect(last.y + last.height).toBeCloseTo(BOARD.y + BOARD.height)
  })
})
