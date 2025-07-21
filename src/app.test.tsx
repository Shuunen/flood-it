// eslint-disable max-nested-callbacks, max-lines-per-function, sort-keys
import { render, screen, cleanup } from '@testing-library/preact'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { App } from './app'

// Mock the utils module to control randomness
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils')
  return {
    ...actual,
    // eslint-disable-next-line max-nested-callbacks
    createSeed: vi.fn(() => '7x7_0000000000000000000000000000000000000000000000000'),
    // eslint-disable-next-line max-nested-callbacks
    parseSeed: vi.fn(() => ({
      width: 7,
      height: 7,
      cells: '0000000000000000000000000000000000000000000000000',
      fixedSeed: '7x7_0000000000000000000000000000000000000000000000000'
    })),
    flood: vi.fn()
  }
})

// Mock global location
const mockLocation = {
  hash: '',
  href: 'http://localhost:3000'
}

// eslint-disable-next-line jest/require-hook
Object.defineProperty(globalThis, 'location', {
  value: mockLocation,
  writable: true
})

describe('app', () => {
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.hash = ''
  })

  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    cleanup()
  })

  it('should render the game title', () => {
    render(<App />)
    expect(screen.getByText('Flood-it')).toBeInTheDocument()
  })

  it('should render moves counter', () => {
    render(<App />)
    expect(screen.getByText('0 moves')).toBeInTheDocument()
  })

  it('should render new game button', () => {
    render(<App />)
    expect(screen.getByText('New Game')).toBeInTheDocument()
  })

  it('should render restart button', () => {
    render(<App />)
    const restartButton = screen.getByText('Restart')
    expect(restartButton).toBeInTheDocument()
    expect(restartButton).toBeDisabled()
  })

  it('should render game seed', () => {
    render(<App />)
    expect(screen.getByText(/Game seed :/)).toBeInTheDocument()
  })

  it('should render game grid', () => {
    render(<App />)
    
    // Should render grid cells
    const cells = document.querySelectorAll('[id^="cell-"]')
    expect(cells.length).toBeGreaterThan(0)
  })
})