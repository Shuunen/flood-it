/** Where everything sits on the 1920x1080 stage. The game rules read it to know what was clicked, the picture to draw it. */
export const STAGE = { height: 1080, width: 1920 }

export type Rect = { height: number; width: number; x: number; y: number }

export function inside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

// ---------------------------------------------------------------- the board

export const BOARD = { height: 700, width: 700, x: 610, y: 128 }

export function cellRect(index: number, width: number, height: number): Rect {
  const cellWidth = BOARD.width / width
  const cellHeight = BOARD.height / height
  return { height: cellHeight, width: cellWidth, x: BOARD.x + (index % width) * cellWidth, y: BOARD.y + Math.floor(index / width) * cellHeight }
}

/** The index of the cell under a point, or -1. */
export function cellAt(x: number, y: number, width: number, height: number): number {
  if (!inside(BOARD, x, y) || x === BOARD.x + BOARD.width || y === BOARD.y + BOARD.height) return -1
  const column = Math.floor((x - BOARD.x) / (BOARD.width / width))
  const row = Math.floor((y - BOARD.y) / (BOARD.height / height))
  return row * width + column
}

// ---------------------------------------------------------------- the water buttons under the board

const DROP = { diameter: 104, gap: 34, y: 884 }

export function dropRect(index: number, count: number): Rect {
  const total = count * DROP.diameter + (count - 1) * DROP.gap
  return { height: DROP.diameter, width: DROP.diameter, x: BOARD.x + BOARD.width / 2 - total / 2 + index * (DROP.diameter + DROP.gap), y: DROP.y }
}

/** The color of the water button under a point, or -1. */
export function dropAt(x: number, y: number, count: number): number {
  for (let index = 0; index < count; index += 1) if (inside(dropRect(index, count), x, y)) return index
  return -1
}

// ---------------------------------------------------------------- panels and buttons

export const PLAYER_CHIP: Rect = { height: 84, width: 420, x: 1430, y: 38 }
export const NEW_GAME_BUTTON: Rect = { height: 80, width: 440, x: 70, y: 568 }
export const RESTART_BUTTON: Rect = { height: 80, width: 440, x: 70, y: 668 }
export const SWITCH_BUTTON: Rect = { height: 80, width: 440, x: 70, y: 768 }
export const HOME_BUTTON: Rect = { height: 80, width: 440, x: 70, y: 868 }

export function sizeButton(index: number): Rect {
  return { height: 70, width: 136, x: 1410 + index * 152, y: 150 }
}

/** The size pill under a point, or -1. */
export function sizeAt(x: number, y: number, count: number): number {
  for (let index = 0; index < count; index += 1) if (inside(sizeButton(index), x, y)) return index
  return -1
}

// ---------------------------------------------------------------- the home screen

export const HOME_START: Rect = { height: 130, width: 620, x: 650, y: 500 }
export const HOME_SWITCH: Rect = { height: 76, width: 340, x: 650, y: 830 }
export const HOME_SETTINGS: Rect = { height: 76, width: 260, x: 1010, y: 830 }

export function homeSize(index: number): Rect {
  return { height: 72, width: 224, x: 606 + index * 242, y: 712 }
}

/** The size pill of the home screen under a point, or -1. */
export function homeSizeAt(x: number, y: number, count: number): number {
  for (let index = 0; index < count; index += 1) if (inside(homeSize(index), x, y)) return index
  return -1
}

// ---------------------------------------------------------------- the settings screen

export const SETTINGS_BACK: Rect = { height: 80, width: 300, x: 810, y: 792 }

/** The card of a theme, side by side. */
export function themeCard(index: number): Rect {
  return { height: 420, width: 360, x: 380 + index * 400, y: 350 }
}

/** The theme card under a point, or -1. */
export function themeAt(x: number, y: number, count: number): number {
  for (let index = 0; index < count; index += 1) if (inside(themeCard(index), x, y)) return index
  return -1
}

// ---------------------------------------------------------------- the end of a puzzle

export const WIN_CARD: Rect = { height: 560, width: 760, x: 580, y: 170 }
export const WIN_AGAIN: Rect = { height: 84, width: 660, x: 630, y: 590 }

// ---------------------------------------------------------------- the player screen

export const PLAYER_CARD: Rect = { height: 780, width: 1240, x: 340, y: 150 }
export const PROFILES_PER_PAGE = 8
export const NEW_PLAYER_CHIP: Rect = { height: 96, width: 560, x: 380, y: 788 }
export const PREVIOUS_PAGE: Rect = { height: 96, width: 110, x: 1290, y: 788 }
export const NEXT_PAGE: Rect = { height: 96, width: 110, x: 1430, y: 788 }
export const NAME_FIELD: Rect = { height: 120, width: 1000, x: 460, y: 410 }
export const NAME_CANCEL: Rect = { height: 84, width: 225, x: 460, y: 700 }
export const NAME_ERASE: Rect = { height: 84, width: 225, x: 710, y: 700 }
export const NAME_DELETE: Rect = { height: 84, width: 225, x: 960, y: 700 }
export const NAME_OK: Rect = { height: 84, width: 225, x: 1210, y: 700 }

/** The color swatches of the player form. */
export function colorSwatch(index: number): Rect {
  return { height: 68, width: 68, x: 460 + index * 92, y: 588 }
}

/** The color swatch under a point, or -1. */
export function colorAt(x: number, y: number, count: number): number {
  for (let index = 0; index < count; index += 1) if (inside(colorSwatch(index), x, y)) return index
  return -1
}

/** A slot of the page of players : two columns, four rows. */
export function profileChip(slot: number): Rect {
  return { height: 96, width: 560, x: 380 + (slot % 2) * 600, y: 320 + Math.floor(slot / 2) * 112 }
}

/** The small edit button on the chip of a player of the page. */
export function profileEdit(slot: number): Rect {
  const chip = profileChip(slot)
  return { height: 44, width: 100, x: chip.x + chip.width - 124, y: chip.y + 26 }
}

/** The slot of the player chip under a point, or -1. */
export function profileAt(x: number, y: number, count: number): number {
  for (let slot = 0; slot < count; slot += 1) if (inside(profileChip(slot), x, y)) return slot
  return -1
}
