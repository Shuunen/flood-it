// eslint-disable max-nested-callbacks, max-lines-per-function
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Mock preact render function
const mockRender = vi.fn()
vi.mock('preact', () => ({
  render: mockRender
}))

// Mock the App component
vi.mock('./app.tsx', () => ({
  // eslint-disable-next-line max-nested-callbacks
  App: () => 'MockedApp'
}))

// Import main.tsx at the module level after mocks are set up
let mainModule: unknown

describe('main.tsx', () => {
  beforeAll(async () => {
    // Create a mock app element before importing
    const mockElement = document.createElement('div')
    mockElement.id = 'app'
    document.body.append(mockElement)
    
    // Import main.tsx to trigger the render call
    mainModule = await import('./main')
  })

  afterAll(() => {
    // Cleanup any app elements
    const mockElement = document.querySelector('#app')
    mockElement?.remove()
  })

  it('should have mocked dependencies', () => {
    // Basic test to ensure mocks are working
    expect(mockRender).toBeDefined()
  })

  it('should validate main module is properly loaded', () => {
    // Test that the main module was imported
    expect(mainModule).toBeDefined()
    
    // Test that the mock render function was called
    expect(mockRender).toHaveBeenCalled()
  })
})