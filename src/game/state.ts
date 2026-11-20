import { createRng, createSeed, hashText, isSolved, parseSeed, playMove, SIZES, sizeById, type SizeId } from '../logic/board.ts'
import { addProfile, COLOR_COUNT, deleteProfile, findProfile, isNameCharacter, MAX_NAME_LENGTH, nextColor, recordWin, selectProfile, setTheme, THEME_IDS, updateProfile, type SaveData, type ThemeId } from '../logic/profiles.ts'
import {
  cellAt,
  dropAt,
  HOME_BUTTON,
  HOME_SETTINGS,
  HOME_START,
  HOME_SWITCH,
  homeSizeAt,
  inside,
  colorAt,
  NAME_CANCEL,
  NAME_DELETE,
  NAME_ERASE,
  NAME_OK,
  NEW_GAME_BUTTON,
  NEW_PLAYER_CHIP,
  NEXT_PAGE,
  PLAYER_CHIP,
  PREVIOUS_PAGE,
  PROFILES_PER_PAGE,
  profileAt,
  profileEdit,
  RESTART_BUTTON,
  SETTINGS_BACK,
  sizeAt,
  SWITCH_BUTTON,
  themeAt,
  WIN_AGAIN,
} from './layout.ts'

const FPS = 60
/** frames the water takes to cross a cell once it flows in, a bit less on bigger boards where cells are smaller */
export function floodStagger(width: number): number {
  return Math.max(3, Math.round(49 / width))
}

/** frames the surface keeps moving once the water has reached the last cell */
const FLOOD_SETTLE = 16
const BACKSPACE_DELAY = 24
const BACKSPACE_REPEAT = 3

type Phase = 'home' | 'play' | 'players' | 'settings' | 'won'
type CueKind = 'back' | 'best' | 'error' | 'move' | 'newgame' | 'select' | 'tap' | 'type' | 'win'
/** A sound to play : a new id means a new cue, `data` is its strength. */
type Cue = { data: number; id: number; kind: CueKind }

export type Win = {
  /** the frame the celebration starts, once the last flood has reached the whole board */
  at: number
  celebrated: boolean
  house: boolean
  moves: number
  newBest: boolean
  previousBest: number | undefined
  /** the best score anybody had on this puzzle before this win */
  record: number | undefined
}

export type GameState = {
  absorbed: number
  cells: number[]
  colors: number
  cue: Cue
  /** steps of the last flood from the top left cell, -1 outside of it */
  dist: number[]
  down: boolean
  draft: string
  error: string
  errorAt: number
  from: Phase
  games: number
  heldBackspace: number
  height: number
  keys: string[]
  maxDist: number
  /** the frame the last move was played on */
  moveAt: number
  moves: number
  naming: boolean
  /** a click on delete asks to be sure, the next one deletes */
  confirmDelete: boolean
  /** the color chosen in the form of a player */
  draftColor: number
  /** the player whose form is open, nobody when a new player is made */
  editing: string
  newGameAt: number
  nonce: number
  phase: Phase
  /** the cells before the last move */
  prev: number[]
  save: SaveData
  /** goes up each time the save changed and must be written */
  saveRev: number
  seed: string
  selected: number
  sizeId: SizeId
  startMs: number
  width: number
  win: Win | undefined
}

export type StepInput = { keys: readonly string[]; pointer?: { down: boolean; x: number; y: number } }

/** How long the picture of a flood lasts, from the click to the last cell being full. */
export function floodFrames(maxDist: number, width: number): number {
  return (maxDist + 1) * floodStagger(width) + FLOOD_SETTLE
}

/** A win worth the big party : the player beat their own best on this puzzle, or the best of everybody. */
export function isBigWin(win: Win): boolean {
  return win.newBest || win.house
}

export function nowMs(state: GameState, frame: number): number {
  return state.startMs + Math.floor((frame * 1000) / FPS)
}

function withCue(state: GameState, kind: CueKind, data = 0): GameState {
  return { ...state, cue: { data, id: state.cue.id + 1, kind } }
}

function boardOf(seed: string) {
  const board = parseSeed(seed)
  if (!board) throw new Error(`broken seed ${seed}`)
  return board
}

function startBoard(state: GameState, seed: string, frame: number): GameState {
  const board = boardOf(seed)
  return {
    ...state,
    absorbed: 0,
    cells: board.cells,
    colors: board.colors,
    dist: [],
    height: board.height,
    maxDist: 0,
    moveAt: -10_000,
    moves: 0,
    newGameAt: frame,
    phase: 'play',
    prev: board.cells,
    seed,
    width: board.width,
    win: undefined,
  }
}

function newGame(state: GameState, frame: number): GameState {
  const size = sizeById(state.sizeId)
  const seed = createSeed(size, createRng(hashText(`${state.nonce}:${state.games}`)))
  return withCue(startBoard({ ...state, games: state.games + 1 }, seed, frame), 'newgame')
}

function restart(state: GameState, frame: number): GameState {
  return withCue(startBoard(state, state.seed, frame), 'newgame')
}

export function createState(save: SaveData, startMs: number, nonce: number): GameState {
  const size = sizeById(save.lastSize)
  const seed = createSeed(size, createRng(hashText(`${nonce}:0`)))
  const hasPlayer = findProfile(save, save.lastPlayerId) !== undefined
  const base: GameState = {
    absorbed: 0,
    cells: [],
    colors: size.colors,
    cue: { data: 0, id: 0, kind: 'tap' },
    dist: [],
    down: false,
    draft: '',
    error: '',
    errorAt: -10_000,
    from: 'home',
    games: 1,
    heldBackspace: 0,
    height: size.height,
    keys: [],
    maxDist: 0,
    moveAt: -10_000,
    moves: 0,
    confirmDelete: false,
    draftColor: nextColor(save),
    editing: '',
    naming: save.profiles.length === 0,
    newGameAt: 0,
    nonce,
    phase: 'play',
    prev: [],
    save,
    saveRev: 0,
    seed,
    selected: 0,
    sizeId: size.id,
    startMs,
    width: size.width,
    win: undefined,
  }
  const started = startBoard(base, seed, 0)
  return { ...started, phase: hasPlayer ? 'home' : 'players', selected: 0 }
}

// ---------------------------------------------------------------- playing

function playerId(state: GameState): string {
  return state.save.lastPlayerId
}

function makeMove(state: GameState, color: number, frame: number): GameState {
  if (state.phase !== 'play' || color < 0 || color >= state.colors) return state
  const move = playMove(state.cells, state.width, state.height, color)
  if (!move) return withCue(state, 'error')
  const moves = state.moves + 1
  const flooded = move.dist.filter(step => step !== -1).length
  const moved = withCue({ ...state, absorbed: move.absorbed, cells: move.cells, dist: move.dist, maxDist: move.maxDist, moveAt: frame, moves, prev: state.cells }, 'move', flooded / state.cells.length)
  if (!isSolved(move.cells)) return moved
  const result = recordWin(state.save, playerId(state), state.sizeId, moves, state.seed, nowMs(state, frame))
  const win: Win = { at: frame + floodFrames(move.maxDist, state.width), celebrated: false, house: result.house, moves, newBest: result.newBest, previousBest: result.previousBest, record: result.record }
  return { ...moved, phase: 'won', save: result.save, saveRev: state.saveRev + 1, win }
}

function chooseSize(state: GameState, size: SizeId, frame: number): GameState {
  if (size === state.sizeId) return withCue(state, 'tap')
  const save = selectProfile(state.save, playerId(state), size, nowMs(state, frame))
  return newGame({ ...state, save, saveRev: state.saveRev + 1, sizeId: size }, frame)
}

function openPlayers(state: GameState): GameState {
  const index = state.save.profiles.findIndex(profile => profile.id === playerId(state))
  return withCue({ ...state, draft: '', error: '', from: state.phase, naming: state.save.profiles.length === 0, phase: 'players', selected: Math.max(index, 0) }, 'tap')
}

function goHome(state: GameState): GameState {
  return withCue({ ...state, phase: 'home' }, 'tap')
}

function celebrated(state: GameState): boolean {
  return state.phase === 'won' && state.win?.celebrated === true
}

/** The keys and buttons that work whatever is on the board : new puzzle, same puzzle again, players, home. */
function stepGameKey(state: GameState, key: string, frame: number): GameState {
  const lower = key.toLowerCase()
  if (lower === 'n') return newGame(state, frame)
  if ((lower === 'r' && (state.moves > 0 || state.phase === 'won')) || (celebrated(state) && (key === 'Enter' || key === ' '))) return restart(state, frame)
  if (lower === 'p' || key === 'Tab') return openPlayers(state)
  if (lower === 'h' || key === 'Escape') return goHome(state)
  if (/^[1-9]$/u.test(key)) return makeMove(state, Number(key) - 1, frame)
  return state
}

function stepGameClick(state: GameState, click: { x: number; y: number }, frame: number): GameState {
  if (celebrated(state) && inside(WIN_AGAIN, click.x, click.y)) return restart(state, frame)
  if (inside(PLAYER_CHIP, click.x, click.y) || inside(SWITCH_BUTTON, click.x, click.y)) return openPlayers(state)
  if (inside(HOME_BUTTON, click.x, click.y)) return goHome(state)
  if (inside(NEW_GAME_BUTTON, click.x, click.y)) return newGame(state, frame)
  if (inside(RESTART_BUTTON, click.x, click.y)) return state.moves > 0 || state.phase === 'won' ? restart(state, frame) : withCue(state, 'error')
  const size = sizeAt(click.x, click.y, SIZES.length)
  if (size !== -1) return chooseSize(state, SIZES[size].id, frame)
  const drop = dropAt(click.x, click.y, state.colors)
  if (drop !== -1) return makeMove(state, drop, frame)
  const cell = cellAt(click.x, click.y, state.width, state.height)
  return cell === -1 ? state : makeMove(state, state.cells[cell], frame)
}

function stepGame(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[], frame: number): GameState {
  let next = state
  for (const key of pressed) next = stepGameKey(next, key, frame)
  return click ? stepGameClick(next, click, frame) : next
}

// ---------------------------------------------------------------- the settings

function openSettings(state: GameState): GameState {
  return withCue({ ...state, phase: 'settings' }, 'tap')
}

function chooseTheme(state: GameState, theme: ThemeId): GameState {
  if (theme === state.save.theme) return withCue(state, 'tap')
  return withCue({ ...state, save: setTheme(state.save, theme), saveRev: state.saveRev + 1 }, 'select')
}

function stepSettingsKey(state: GameState, key: string): GameState {
  const index = THEME_IDS.indexOf(state.save.theme)
  if (key === 'Escape' || key === 'Enter' || key.toLowerCase() === 'h') return goHome(state)
  if (key === 'ArrowLeft') return chooseTheme(state, THEME_IDS[(index + THEME_IDS.length - 1) % THEME_IDS.length])
  if (key === 'ArrowRight') return chooseTheme(state, THEME_IDS[(index + 1) % THEME_IDS.length])
  if (/^[1-3]$/u.test(key)) return chooseTheme(state, THEME_IDS[Number(key) - 1])
  return state
}

function stepSettings(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[]): GameState {
  let next = state
  for (const key of pressed) next = stepSettingsKey(next, key)
  if (!click) return next
  if (inside(SETTINGS_BACK, click.x, click.y)) return goHome(next)
  const index = themeAt(click.x, click.y, THEME_IDS.length)
  return index === -1 ? next : chooseTheme(next, THEME_IDS[index])
}

// ---------------------------------------------------------------- the home screen

function chooseHomeSize(state: GameState, size: SizeId, frame: number): GameState {
  if (size === state.sizeId) return withCue(state, 'tap')
  const save = selectProfile(state.save, playerId(state), size, nowMs(state, frame))
  return withCue({ ...state, save, saveRev: state.saveRev + 1, sizeId: size }, 'tap')
}

function stepHomeKey(state: GameState, key: string, frame: number): GameState {
  if (key === 'Enter' || key === ' ') return newGame(state, frame)
  if (key.toLowerCase() === 'p' || key === 'Tab') return openPlayers(state)
  if (key.toLowerCase() === 's') return openSettings(state)
  if (/^[1-3]$/u.test(key)) return chooseHomeSize(state, SIZES[Number(key) - 1].id, frame)
  return state
}

function stepHome(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[], frame: number): GameState {
  let next = state
  for (const key of pressed) next = stepHomeKey(next, key, frame)
  if (!click) return next
  if (inside(HOME_START, click.x, click.y)) return newGame(next, frame)
  if (inside(PLAYER_CHIP, click.x, click.y) || inside(HOME_SWITCH, click.x, click.y)) return openPlayers(next)
  if (inside(HOME_SETTINGS, click.x, click.y)) return openSettings(next)
  const size = homeSizeAt(click.x, click.y, SIZES.length)
  return size === -1 ? next : chooseHomeSize(next, SIZES[size].id, frame)
}

// ---------------------------------------------------------------- choosing a player

/** Who plays changed : from the home screen it stays there, from a puzzle the new player takes the same puzzle on. */
function welcome(state: GameState, frame: number): GameState {
  return withCue(state.from === 'home' ? { ...state, phase: 'home' } : restart(state, frame), 'select')
}

function pickProfile(state: GameState, index: number, frame: number): GameState {
  const profile = state.save.profiles[index]
  const resume = profile.id === playerId(state)
  const save = selectProfile(state.save, profile.id, state.sizeId, nowMs(state, frame))
  const next: GameState = { ...state, draft: '', error: '', naming: false, save, saveRev: state.saveRev + 1 }
  return resume ? withCue({ ...next, phase: state.from }, 'select') : welcome(next, frame)
}

function closeForm(state: GameState): GameState {
  return { ...state, confirmDelete: false, draft: '', editing: '', error: '', naming: false }
}

function createProfile(state: GameState, frame: number): GameState {
  const added = addProfile(state.save, state.draft, nowMs(state, frame), state.draftColor)
  if ('error' in added) return withCue({ ...state, error: added.error, errorAt: frame }, 'error')
  const next: GameState = { ...closeForm(state), save: added.save, saveRev: state.saveRev + 1, selected: added.save.profiles.length - 1 }
  return welcome(next, frame)
}

function saveEdit(state: GameState, frame: number): GameState {
  const updated = updateProfile(state.save, state.editing, state.draft, state.draftColor)
  if ('error' in updated) return withCue({ ...state, error: updated.error, errorAt: frame }, 'error')
  return withCue({ ...closeForm(state), save: updated.save, saveRev: state.saveRev + 1 }, 'select')
}

function submitForm(state: GameState, frame: number): GameState {
  return state.editing === '' ? createProfile(state, frame) : saveEdit(state, frame)
}

function startNaming(state: GameState): GameState {
  return withCue({ ...state, confirmDelete: false, draft: '', draftColor: nextColor(state.save), editing: '', error: '', naming: true, selected: state.save.profiles.length }, 'tap')
}

function removeEdited(state: GameState): GameState {
  const save = deleteProfile(state.save, state.editing)
  const next: GameState = { ...closeForm(state), save, saveRev: state.saveRev + 1, selected: Math.min(state.selected, Math.max(save.profiles.length - 1, 0)) }
  return withCue(save.profiles.length === 0 ? startNaming(next) : next, 'back')
}

function startEditing(state: GameState, index: number): GameState {
  const profile = state.save.profiles[index]
  return withCue({ ...state, confirmDelete: false, draft: profile.name, draftColor: profile.color, editing: profile.id, error: '', naming: true, selected: index }, 'tap')
}

function leavePlayers(state: GameState): GameState {
  if (findProfile(state.save, playerId(state))) return withCue({ ...state, naming: false, phase: state.from }, 'back')
  return state
}

function cycleColor(state: GameState, direction: number): GameState {
  return withCue({ ...state, draftColor: (state.draftColor + direction + COLOR_COUNT) % COLOR_COUNT }, 'tap')
}

function typeKey(state: GameState, key: string, frame: number): GameState {
  if (key === 'Escape') return state.save.profiles.length > 0 ? withCue(closeForm(state), 'back') : state
  if (key === 'Enter') return submitForm(state, frame)
  if (key === 'Backspace' || key === 'Delete' || key === 'ArrowLeft') return withCue({ ...state, draft: state.draft.slice(0, -1), error: '' }, 'back')
  if (key === 'ArrowUp' || key === 'ArrowDown') return cycleColor(state, key === 'ArrowUp' ? -1 : 1)
  if (isNameCharacter(key) && state.draft.length < MAX_NAME_LENGTH) return withCue({ ...state, draft: state.draft + key, error: '' }, 'type')
  return state
}

function typeName(state: GameState, pressed: readonly string[], frame: number): GameState {
  let next = state.confirmDelete && pressed.length > 0 ? { ...state, confirmDelete: false } : state
  for (const key of pressed) next = typeKey(next, key, frame)
  return next
}

function clickForm(state: GameState, click: { x: number; y: number }, frame: number): GameState {
  if (inside(NAME_OK, click.x, click.y)) return submitForm(state, frame)
  if (inside(NAME_ERASE, click.x, click.y)) return withCue({ ...state, confirmDelete: false, draft: state.draft.slice(0, -1), error: '' }, 'back')
  if (inside(NAME_CANCEL, click.x, click.y) && state.save.profiles.length > 0) return withCue(closeForm(state), 'back')
  if (inside(NAME_DELETE, click.x, click.y) && state.editing !== '') return state.confirmDelete ? removeEdited(state) : withCue({ ...state, confirmDelete: true }, 'error')
  const color = colorAt(click.x, click.y, COLOR_COUNT)
  return color === -1 ? state : withCue({ ...state, confirmDelete: false, draftColor: color }, 'tap')
}

function stepNaming(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[], frame: number): GameState {
  const next = typeName(state, pressed, frame)
  return click ? clickForm(next, click, frame) : next
}

function moveSelection(state: GameState, key: string): GameState {
  const last = state.save.profiles.length
  const step = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
  const size = key === 'ArrowUp' || key === 'ArrowDown' ? 2 : 1
  const selected = Math.min(last, Math.max(0, state.selected + step * size))
  return selected === state.selected ? state : withCue({ ...state, selected }, 'tap')
}

function listKey(state: GameState, key: string, frame: number): GameState {
  if (key === 'Escape' || key === 'Tab') return leavePlayers(state)
  if (key === 'Enter') return state.selected === state.save.profiles.length ? startNaming(state) : pickProfile(state, state.selected, frame)
  if (key.toLowerCase() === 'n') return startNaming(state)
  if (key.toLowerCase() === 'e' && state.selected < state.save.profiles.length) return startEditing(state, state.selected)
  if (key.startsWith('Arrow')) return moveSelection(state, key)
  return state
}

function stepList(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[], frame: number): GameState {
  let next = state
  for (const key of pressed) next = listKey(next, key, frame)
  if (!click) return next
  const count = next.save.profiles.length
  const pageStart = Math.floor(Math.min(next.selected, Math.max(count - 1, 0)) / PROFILES_PER_PAGE) * PROFILES_PER_PAGE
  const visible = Math.min(PROFILES_PER_PAGE, count - pageStart)
  const slot = profileAt(click.x, click.y, visible)
  if (slot !== -1) return inside(profileEdit(slot), click.x, click.y) ? startEditing(next, pageStart + slot) : pickProfile(next, pageStart + slot, frame)
  if (inside(NEW_PLAYER_CHIP, click.x, click.y)) return startNaming(next)
  if (inside(PREVIOUS_PAGE, click.x, click.y) && pageStart > 0) return withCue({ ...next, selected: pageStart - PROFILES_PER_PAGE }, 'tap')
  if (inside(NEXT_PAGE, click.x, click.y) && pageStart + PROFILES_PER_PAGE < count) return withCue({ ...next, selected: pageStart + PROFILES_PER_PAGE }, 'tap')
  return next
}

// ---------------------------------------------------------------- one frame

/** Raea may name the erase key in several ways, depending on the machine : they all mean Backspace. */
function normalizeKey(key: string): string {
  return /backspace$/iu.test(key) || key === '\b' || key === '\u007F' ? 'Backspace' : key
}

function sameKeys(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index])
}

function stepScreen(state: GameState, click: { x: number; y: number } | undefined, pressed: readonly string[], frame: number): GameState {
  if (state.phase === 'home') return stepHome(state, click, pressed, frame)
  if (state.phase === 'settings') return stepSettings(state, click, pressed)
  if (state.phase !== 'players') return stepGame(state, click, pressed, frame)
  return state.naming ? stepNaming(state, click, pressed, frame) : stepList(state, click, pressed, frame)
}

/** One frame of the whole game : who is playing, the board, the typing of a name. Pure, as raea wants it. */
export function step(state: GameState, input: StepInput, frame: number): GameState {
  const pointer = input.pointer
  const down = pointer?.down === true
  const click = pointer !== undefined && pointer.down && !state.down ? { x: pointer.x, y: pointer.y } : undefined
  const keys = input.keys.map(key => normalizeKey(key))
  const pressed = keys.filter(key => !state.keys.includes(key))
  const held = keys.includes('Backspace') ? state.heldBackspace + 1 : 0
  if (held > BACKSPACE_DELAY && (held - BACKSPACE_DELAY) % BACKSPACE_REPEAT === 0) pressed.push('Backspace')
  let next = stepScreen(state, click, pressed, frame)
  if (next.win && !next.win.celebrated && frame >= next.win.at) next = withCue({ ...next, win: { ...next.win, celebrated: true } }, isBigWin(next.win) ? 'best' : 'win', next.win.moves)
  if (next === state && sameKeys(state.keys, keys) && state.down === down && state.heldBackspace === held) return state
  return { ...next, down, heldBackspace: held, keys }
}
