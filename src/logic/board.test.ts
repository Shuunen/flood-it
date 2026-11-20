import { createRng, createSeed, floodDistances, hashText, isSolved, neighbours, parseSeed, playMove, sizeById, SIZES } from './board.ts'

describe('sizes', () => {
  it('finds a size by id and falls back to the small one', () => {
    expect(sizeById('m').width).toBe(10)
    expect(sizeById('nope')).toBe(SIZES[0])
  })
})

describe('random', () => {
  it('hashes the same text to the same number', () => {
    expect(hashText('flood')).toBe(hashText('flood'))
    expect(hashText('flood')).not.toBe(hashText('flooD'))
  })

  it('gives the same numbers for the same seed, all between 0 and 1', () => {
    const first = createRng(42)
    const second = createRng(42)
    const numbers = Array.from({ length: 20 }, () => first())
    expect(numbers).toStrictEqual(Array.from({ length: 20 }, () => second()))
    expect(numbers.every(number => number >= 0 && number < 1)).toBe(true)
    expect(createRng(43)()).not.toBe(numbers[0])
  })
})

describe('seeds', () => {
  it('creates a seed that parses back into a board', () => {
    const seed = createSeed(SIZES[1], createRng(7))
    const board = parseSeed(seed)
    expect(seed.startsWith('10x10x5_')).toBe(true)
    expect(board?.cells).toHaveLength(100)
    expect(board?.colors).toBe(5)
    expect(board?.cells.every(cell => cell >= 0 && cell < 5)).toBe(true)
  })

  it.each(['', 'nope', '7x7x4_012', '7x7x4_' + '9'.repeat(49), '1x1x4_0', '7x7x1_' + '0'.repeat(49), '7x7x10_' + '0'.repeat(49)])('refuses the broken seed "%s"', seed => {
    expect(parseSeed(seed)).toBeUndefined()
  })
})

describe('flooding', () => {
  it('lists the neighbours of a corner, an edge and the middle', () => {
    expect(neighbours(0, 3, 3).toSorted((left, right) => left - right)).toStrictEqual([1, 3])
    expect(neighbours(8, 3, 3).toSorted((left, right) => left - right)).toStrictEqual([5, 7])
    expect(neighbours(1, 3, 3).toSorted((left, right) => left - right)).toStrictEqual([0, 2, 4])
    expect(neighbours(4, 3, 3).toSorted((left, right) => left - right)).toStrictEqual([1, 3, 5, 7])
  })

  it('measures the flooded region from the top left', () => {
    // 0 0 1
    // 1 0 1
    // 1 1 1
    expect(floodDistances([0, 0, 1, 1, 0, 1, 1, 1, 1], 3, 3)).toStrictEqual([0, 1, -1, -1, 2, -1, -1, -1, -1])
  })

  it('changes nothing when the color is already the flooded one', () => {
    expect(playMove([0, 1, 1, 1], 2, 2, 0)).toBeUndefined()
    expect(playMove([0, 1, 1, 1], 2, 2, -1)).toBeUndefined()
  })

  it('floods the region and swallows the neighbours of the new color', () => {
    // 0 0 1      1 1 1
    // 1 0 1  ->  1 1 1
    // 1 1 2      1 1 2
    const move = playMove([0, 0, 1, 1, 0, 1, 1, 1, 2], 3, 3, 1)
    expect(move?.cells).toStrictEqual([1, 1, 1, 1, 1, 1, 1, 1, 2])
    expect(move?.absorbed).toBe(5)
    expect(move?.dist).toStrictEqual([0, 1, 2, 1, 2, 3, 2, 3, -1])
    expect(move?.maxDist).toBe(3)
  })

  it('knows when a board is solved', () => {
    expect(isSolved([2, 2, 2, 2])).toBe(true)
    expect(isSolved([2, 2, 1, 2])).toBe(false)
  })

  it('solves a board by always playing the color around the region', () => {
    const board = parseSeed(createSeed(SIZES[0], createRng(1)))
    let cells = board?.cells ?? []
    let moves = 0
    while (!isSolved(cells) && moves < 200) {
      const color = (cells[0] + 1) % 4
      cells = playMove(cells, 7, 7, color)?.cells ?? cells
      moves += 1
    }
    expect(isSolved(cells)).toBe(true)
  })
})
