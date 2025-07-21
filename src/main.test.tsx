// eslint-disable max-nested-callbacks, max-lines-per-function
import { describe, expect, it, vi } from 'vitest'

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

describe('main.tsx', () => {
  it('should have mocked dependencies', () => {
    // Basic test to ensure mocks are working
    expect(mockRender).toBeDefined()
  })

  it('should validate main module can be imported without throwing', async () => {
    // Create a mock app element before importing
    const mockElement = document.createElement('div')
    mockElement.id = 'app'
    document.body.append(mockElement)
    
    try {
      const module = await import('./main')
      expect(module).toBeDefined()
      expect(mockRender).toBeDefined()
    } finally {
      // Cleanup
      mockElement.remove()
    }
  })
})