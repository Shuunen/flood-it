




describe('main', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.resetModules()
  })

  it('a renders the app in #app', async () => {expect.hasAssertions();
    document.body.innerHTML = '<div id="app"></div>'
    await import('./main.tsx')
    expect(document.querySelector('#app h1')?.textContent).toBe('Flood-it')
  })

  it('b throws without #app', async () => {expect.hasAssertions();
    await expect(import('./main.tsx')).rejects.toThrow('No #app element found in the document')
  })
})
