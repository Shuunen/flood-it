


import { act } from 'preact/test-utils'
import { render } from 'preact'

import { App } from './app.tsx'

const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']

let container: HTMLElement

function cell (x: number, y: number) {
  return container.querySelector<HTMLElement>(`#cell-${x}${y}`) as HTMLElement
}

function button (label: string) {
  return [...container.querySelectorAll('button')].find(item => item.textContent === label) as HTMLButtonElement
}

async function mount (hash = '') {
  globalThis.location.hash = hash
  await act(() => {
    render(<App />, container)
  })
}

async function click (element: HTMLElement) {
  await act(() => {
    element.click()
  })
}

describe('app', () => {
  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    render(undefined, container)
    container.remove()
    vi.restoreAllMocks()
  })

  it('a generates a random 7x7 grid when there is no hash', async () => {expect.hasAssertions();
    await mount()
    expect(container.querySelectorAll('[id^="cell-"]')).toHaveLength(49)
    expect(globalThis.location.hash).toMatch(/^#7x7_[0-3]{49}$/u)
    expect(container.textContent).toContain('0 moves')
  })

  it('b uses the seed from the hash', async () => {expect.hasAssertions();
    await mount('#2x2_0123')
    expect(cell(1, 1).style.background).toBe(colors[0])
    expect(cell(2, 1).style.background).toBe(colors[1])
    expect(cell(1, 2).style.background).toBe(colors[2])
    expect(cell(2, 2).style.background).toBe(colors[3])
    expect(container.textContent).toContain('Game seed : 2x2_0123')
  })

  it('c falls back to a 7x7 grid on an invalid seed', async () => {expect.hasAssertions();
    await mount('#nope')
    expect(container.querySelectorAll('[id^="cell-"]')).toHaveLength(49)
  })

  it('c2 falls back to the first color on an unknown color digit', async () => {expect.hasAssertions();
    await mount('#2x2_0999')
    expect(cell(1, 1).style.background).toBe(colors[0])
  })

  it('d pads a too short seed', async () => {expect.hasAssertions();
    await mount('#2x2_01')
    expect(container.querySelectorAll('[id^="cell-"]')).toHaveLength(4)
    expect(globalThis.location.hash).toMatch(/^#2x2_01[0-3]{2}$/u)
  })

  it('e truncates a too long seed', async () => {expect.hasAssertions();
    await mount('#2x2_012301')
    expect(container.querySelectorAll('[id^="cell-"]')).toHaveLength(4)
    expect(globalThis.location.hash).toBe('#2x2_0123')
  })

  it('f floods and counts a move, ignoring a click on the flood color', async () => {expect.hasAssertions();
    await mount('#2x2_0012')
    await click(cell(1, 1))
    expect(container.textContent).toContain('0 moves')
    await click(cell(1, 2))
    expect(container.textContent).toContain('1 moves')
    expect(cell(1, 1).style.background).toBe(colors[1])
  })

  it('g wins when the grid is one color, then blocks further moves', async () => {expect.hasAssertions();
    await mount('#2x2_0001')
    await click(cell(2, 2))
    expect(container.textContent).toContain('You win in 1 moves!')
    expect(cell(1, 1).className).toContain('animate-win')
    await click(cell(1, 1))
    expect(container.textContent).toContain('1 moves')
  })

  it('h restarts the same seed and resets moves', async () => {expect.hasAssertions();
    await mount('#2x2_0012')
    expect(button('Restart').disabled).toBe(true)
    await click(cell(1, 2))
    expect(cell(1, 1).style.background).toBe(colors[1])
    expect(button('Restart').disabled).toBe(false)
    await click(button('Restart'))
    expect(container.textContent).toContain('0 moves')
    expect(cell(1, 1).style.background).toBe(colors[0])
  })

  it('i starts a new game with the same grid size', async () => {expect.hasAssertions();
    await mount('#3x2_000000')
    await click(button('New Game'))
    expect(container.querySelectorAll('[id^="cell-"]')).toHaveLength(6)
    expect(globalThis.location.hash).toMatch(/^#3x2_[0-3]{6}$/u)
  })
})
