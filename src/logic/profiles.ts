import { hashText, type SizeId } from './board.ts'

export const MAX_NAME_LENGTH = 14
export const MAX_PROFILES = 24
/** how many colors a player can pick from */
export const COLOR_COUNT = 6
/** the looks of the game, each has its own colors and music */
export const THEME_IDS = ['ocean', 'sunset', 'aurora'] as const
export type ThemeId = (typeof THEME_IDS)[number]
const MAX_HISTORY = 30
/** how many puzzles a player keeps a best score for, the oldest ones are forgotten first */
const MAX_RECORDS = 400
const seedPattern = /^\d+x\d+x\d+_\d+$/u

type ScoreEntry = { at: number; moves: number; seed: string; size: SizeId }

export type Profile = {
  /** fewest moves the player needed to solve a puzzle, by puzzle (its seed) */
  best: Partial<Record<string, number>>
  /** the water color of the player, an index of the palette */
  color: number
  createdAt: number
  history: ScoreEntry[]
  id: string
  lastPlayedAt: number
  name: string
  /** how many games the player won, by board size */
  wins: Partial<Record<SizeId, number>>
}

export type SaveData = { lastPlayerId: string; lastSize: SizeId; profiles: Profile[]; theme: ThemeId; version: 1 }

export type WinResult = {
  /** the win beats the best score anybody had on this puzzle */
  house: boolean
  /** the win beats the player's own best score on this puzzle (a first win on a puzzle has nothing to beat) */
  newBest: boolean
  /** the player's best on this puzzle before this win, if any */
  previousBest: number | undefined
  /** the best score anybody had on this puzzle before this win, if any */
  record: number | undefined
  save: SaveData
}

export function emptySave(): SaveData {
  return { lastPlayerId: '', lastSize: 's', profiles: [], theme: 'ocean', version: 1 }
}

/** Keeps a name short, on one line and without odd spaces. */
export function cleanName(raw: string): string {
  return raw
    .normalize('NFC')
    .replaceAll(/\p{Cc}/gu, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim()
}

/** Can this key press be typed into a name ? */
export function isNameCharacter(key: string): boolean {
  return [...key].length === 1 && /^[\p{L}\p{N} _.'-]$/u.test(key)
}

export function findProfile(save: SaveData, id: string): Profile | undefined {
  return save.profiles.find(profile => profile.id === id)
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
      .replaceAll(/^-|-$/gu, '') || 'player'
  )
}

/** The color of a player nobody chose one for : always the same for the same name. */
export function defaultColor(name: string): number {
  return hashText(name) % COLOR_COUNT
}

/** The color the fewest players have, to give to the next one. */
export function nextColor(save: SaveData): number {
  const used = Array.from({ length: COLOR_COUNT }, (_unused, color) => save.profiles.filter(profile => profile.color === color).length)
  return used.indexOf(Math.min(...used))
}

/** Why a name can not be used, or nothing when it can. `ignoreId` is the player being renamed. */
function nameProblem(save: SaveData, name: string, ignoreId: string): string {
  if (name.length === 0) return 'Please type a name'
  if (save.profiles.some(profile => profile.id !== ignoreId && profile.name.toLowerCase() === name.toLowerCase())) return 'That name is already taken'
  return ''
}

export function addProfile(save: SaveData, rawName: string, now: number, color = nextColor(save)): { error: string } | { profile: Profile; save: SaveData } {
  const name = cleanName(rawName)
  const problem = nameProblem(save, name, '') || (save.profiles.length >= MAX_PROFILES ? 'Too many players here' : '')
  if (problem) return { error: problem }
  const profile: Profile = { best: {}, color, createdAt: now, history: [], id: `${slug(name)}-${now.toString(36)}`, lastPlayedAt: now, name, wins: {} }
  return { profile, save: { ...save, lastPlayerId: profile.id, profiles: [...save.profiles, profile] } }
}

/** Gives a player another name and color, their scores stay with them. */
export function updateProfile(save: SaveData, id: string, rawName: string, color: number): { error: string } | { save: SaveData } {
  const name = cleanName(rawName)
  const problem = nameProblem(save, name, id)
  if (problem) return { error: problem }
  return { save: { ...save, profiles: save.profiles.map(profile => (profile.id === id ? { ...profile, color, name } : profile)) } }
}

/** Removes a player and everything they scored. */
export function deleteProfile(save: SaveData, id: string): SaveData {
  return { ...save, lastPlayerId: save.lastPlayerId === id ? '' : save.lastPlayerId, profiles: save.profiles.filter(profile => profile.id !== id) }
}

/** Remembers who plays now and which board size they chose. */
export function selectProfile(save: SaveData, id: string, size: SizeId, now: number): SaveData {
  return { ...save, lastPlayerId: id, lastSize: size, profiles: save.profiles.map(profile => (profile.id === id ? { ...profile, lastPlayedAt: now } : profile)) }
}

/** The fewest moves this player needed on a puzzle, if they solved it. */
export function bestOn(profile: Profile | undefined, seed: string): number | undefined {
  return profile?.best[seed]
}

/** The fewest moves anybody made on a puzzle, if anybody solved it. */
export function houseRecord(save: SaveData, seed: string): number | undefined {
  const all = save.profiles.map(profile => profile.best[seed]).filter((moves): moves is number => moves !== undefined)
  return all.length > 0 ? Math.min(...all) : undefined
}

function keepRecent(best: Partial<Record<string, number>>): Partial<Record<string, number>> {
  return Object.fromEntries(Object.entries(best).slice(-MAX_RECORDS))
}

/** Writes down a solved puzzle : the player's best on it only gets lower, their wins and history grow. */
export function recordWin(save: SaveData, profileId: string, size: SizeId, moves: number, seed: string, now: number): WinResult {
  const profile = findProfile(save, profileId)
  if (!profile) return { house: false, newBest: false, previousBest: undefined, record: undefined, save }
  const previousBest = profile.best[seed]
  const record = houseRecord(save, seed)
  const improved = previousBest === undefined || moves < previousBest
  const { [seed]: _forgotten, ...others } = profile.best
  const updated: Profile = {
    ...profile,
    best: improved ? keepRecent({ ...others, [seed]: moves }) : profile.best,
    history: [...profile.history, { at: now, moves, seed, size }].slice(-MAX_HISTORY),
    lastPlayedAt: now,
    wins: { ...profile.wins, [size]: (profile.wins[size] ?? 0) + 1 },
  }
  const result = { house: improved && record !== undefined && moves < record, newBest: previousBest !== undefined && moves < previousBest, previousBest, record }
  return { ...result, save: { ...save, profiles: save.profiles.map(other => (other.id === profileId ? updated : other)) } }
}

/** How many puzzles a player solved, all sizes together. */
export function solvedCount(profile: Profile | undefined): number {
  return Object.values(profile?.wins ?? {}).reduce((total, count) => total + count, 0)
}

export type LeaderboardRow = { moves: number; name: string; profileId: string }

/** Everybody's best score on a puzzle, the lowest first. */
export function leaderboard(save: SaveData, seed: string, limit: number): LeaderboardRow[] {
  const rows: LeaderboardRow[] = []
  for (const profile of save.profiles) {
    const moves = profile.best[seed]
    if (moves !== undefined) rows.push({ moves, name: profile.name, profileId: profile.id })
  }
  return rows.toSorted((left, right) => left.moves - right.moves || left.name.localeCompare(right.name)).slice(0, limit)
}

/** Chooses the look of the game. */
export function setTheme(save: SaveData, theme: ThemeId): SaveData {
  return { ...save, theme }
}

export function serializeSave(save: SaveData): string {
  return JSON.stringify(save)
}

const sizeIds = new Set<string>(['l', 'm', 's'])

function cleanCounts(value: unknown): Partial<Record<SizeId, number>> {
  const counts: Partial<Record<SizeId, number>> = {}
  if (typeof value !== 'object' || value === null) return counts
  for (const [key, count] of Object.entries(value)) if (sizeIds.has(key) && typeof count === 'number' && Number.isFinite(count) && count >= 0) counts[key as SizeId] = Math.floor(count)
  return counts
}

function cleanBest(value: unknown): Partial<Record<string, number>> {
  const best: Partial<Record<string, number>> = {}
  if (typeof value !== 'object' || value === null) return best
  for (const [seed, moves] of Object.entries(value)) if (seedPattern.test(seed) && typeof moves === 'number' && Number.isFinite(moves) && moves >= 1) best[seed] = Math.floor(moves)
  return keepRecent(best)
}

function cleanEntry(value: unknown): ScoreEntry | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const item = value as Record<string, unknown>
  if (typeof item.moves !== 'number' || typeof item.at !== 'number' || typeof item.seed !== 'string' || typeof item.size !== 'string' || !sizeIds.has(item.size)) return undefined
  return { at: item.at, moves: item.moves, seed: item.seed, size: item.size as SizeId }
}

function cleanHistory(value: unknown): ScoreEntry[] {
  if (!Array.isArray(value)) return []
  const entries: ScoreEntry[] = []
  for (const item of value) {
    const entry = cleanEntry(item)
    if (entry) entries.push(entry)
  }
  return entries.slice(-MAX_HISTORY)
}

function cleanProfile(value: unknown): Profile | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || item.id.length === 0) return undefined
  const name = cleanName(item.name)
  if (name.length === 0) return undefined
  const createdAt = typeof item.createdAt === 'number' ? item.createdAt : 0
  const color = typeof item.color === 'number' && Number.isInteger(item.color) && item.color >= 0 && item.color < COLOR_COUNT ? item.color : defaultColor(name)
  return { best: cleanBest(item.best), color, createdAt, history: cleanHistory(item.history), id: item.id, lastPlayedAt: typeof item.lastPlayedAt === 'number' ? item.lastPlayedAt : createdAt, name, wins: cleanCounts(item.wins) }
}

/** Reads a saved game back, whatever state the file is in : a broken save gives a fresh one. */
export function parseSave(text: string | undefined): SaveData {
  if (!text) return emptySave()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return emptySave()
  }
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { profiles?: unknown }).profiles)) return emptySave()
  const raw = data as { lastPlayerId?: unknown; lastSize?: unknown; profiles: unknown[]; theme?: unknown }
  const profiles = raw.profiles.map(item => cleanProfile(item)).filter((profile): profile is Profile => profile !== undefined)
  const lastPlayerId = typeof raw.lastPlayerId === 'string' && profiles.some(profile => profile.id === raw.lastPlayerId) ? raw.lastPlayerId : ''
  const lastSize = typeof raw.lastSize === 'string' && sizeIds.has(raw.lastSize) ? (raw.lastSize as SizeId) : 's'
  const theme = THEME_IDS.find(id => id === raw.theme) ?? 'ocean'
  return { lastPlayerId, lastSize, profiles: profiles.slice(0, MAX_PROFILES), theme, version: 1 }
}
