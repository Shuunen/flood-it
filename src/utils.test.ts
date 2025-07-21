// eslint-disable sort-keys
import { randomNumber } from 'shuutils'
import { describe, expect, it, vi } from 'vitest'
import { colors, createSeed, flood, parseSeed } from './utils'

// Mock randomNumber to have predictable tests
vi.mock('shuutils', () => ({
  randomNumber: vi.fn()
}))

const mockRandomNumber = vi.mocked(randomNumber)

describe('utils', () => {
  describe('colors', () => {
    it('should export the correct colors array', () => {
      expect(colors).toEqual(['royalblue', 'deeppink', 'chartreuse', 'darkorange'])
      expect(colors).toHaveLength(4)
    })
  })

  describe('createSeed', () => {
    it('should create a seed with correct format', () => {
      mockRandomNumber.mockReturnValue(0)
      const seed = createSeed(3, 2)
      expect(seed).toMatch(/^3x2_\d{6}$/)
      expect(seed).toBe('3x2_000000')
    })

    it('should create seed with correct length for different grid sizes', () => {
      mockRandomNumber.mockReturnValue(1)
      const seed = createSeed(2, 2)
      expect(seed).toBe('2x2_1111')
    })

    it('should handle various color indices', () => {
      mockRandomNumber
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3)
      const seed = createSeed(2, 2)
      expect(seed).toBe('2x2_0123')
    })
  })

  describe('parseSeed', () => {
    it('should parse valid seed correctly', () => {
      const result = parseSeed('3x2_012345')
      expect(result).toEqual({
        width: 3,
        height: 2,
        cells: '012345',
        fixedSeed: '3x2_012345'
      })
    })

    it('should return default values for invalid seed', () => {
      const result = parseSeed('invalid')
      expect(result).toEqual({
        width: 7,
        height: 7,
        cells: '',
        fixedSeed: ''
      })
    })

    it('should fix too short seed', () => {
      mockRandomNumber.mockReturnValue(0)
      const result = parseSeed('2x2_12')
      expect(result).toEqual({
        width: 2,
        height: 2,
        cells: '1200',
        fixedSeed: '2x2_1200'
      })
    })

    it('should fix too long seed', () => {
      const result = parseSeed('2x2_123456')
      expect(result).toEqual({
        width: 2,
        height: 2,
        cells: '1234',
        fixedSeed: '2x2_1234'
      })
    })

    it('should not mark as fixed when no changes needed', () => {
      const result = parseSeed('2x2_1234')
      expect(result.fixedSeed).toBe('2x2_1234')
    })
  })

  describe('flood', () => {
    it('should flood fill a simple 2x2 grid', () => {
      const grid = [
        ['red', 'blue'],
        ['red', 'blue']
      ]
      flood(0, 0, 'red', 'green', grid)
      expect(grid).toEqual([
        ['green', 'blue'],
        ['green', 'blue']
      ])
    })

    it('should flood fill connected cells only', () => {
      const grid = [
        ['red', 'blue', 'red'],
        ['red', 'blue', 'red'], 
        ['blue', 'red', 'red']
      ]
      flood(0, 0, 'red', 'green', grid)
      // The flood fill starts at (0,0) and should only affect red cells connected to it
      // The top-right red and bottom-right red should not be affected as they're separated by blue
      expect(grid).toEqual([
        ['green', 'blue', 'red'],
        ['green', 'blue', 'red'],
        ['blue', 'red', 'red']
      ])
    })

    it('should not flood when target equals replacement', () => {
      const grid = [
        ['red', 'blue'],
        ['red', 'blue']
      ]
      const originalGrid = grid.map(row => [...row])
      flood(0, 0, 'red', 'red', grid)
      expect(grid).toEqual(originalGrid)
    })

    it('should handle edge cases - out of bounds', () => {
      const grid = [['red']]
      flood(-1, 0, 'red', 'blue', grid)
      flood(1, 0, 'red', 'blue', grid)
      flood(0, -1, 'red', 'blue', grid)
      flood(0, 1, 'red', 'blue', grid)
      expect(grid).toEqual([['red']])
    })

    it('should handle empty grid', () => {
      const grid: string[][] = []
      expect(() => flood(0, 0, 'red', 'blue', grid)).not.toThrow()
    })

    it('should flood fill entire connected area', () => {
      const grid = [
        ['A', 'A', 'B'],
        ['A', 'B', 'B'],
        ['B', 'B', 'B']
      ]
      flood(0, 0, 'A', 'C', grid)
      expect(grid).toEqual([
        ['C', 'C', 'B'],
        ['C', 'B', 'B'],
        ['B', 'B', 'B']
      ])
    })
  })
})