import { describe, expect, it } from 'vitest'
import { observeRenderVisibility } from '../src/views/univer/render-visibility.js'

describe('observeRenderVisibility', () => {
  it('uses the container realm and follows visibility until disconnected', () => {
    let callback
    let disconnected = false
    const calls = []
    const container = {
      ownerDocument: {
        defaultView: {
          IntersectionObserver: class {
            constructor(cb) {
              callback = cb
            }

            observe() {}
            disconnect() { disconnected = true }
          },
        },
      },
    }

    const stop = observeRenderVisibility({
      activate: () => calls.push('activate'),
      deactivate: () => calls.push('deactivate'),
    }, container)

    callback([{ target: container, isIntersecting: false }])
    callback([{ target: container, isIntersecting: true }])
    stop()

    expect(calls).toEqual(['deactivate', 'activate'])
    expect(disconnected).toBe(true)
  })

  it('keeps the render active when the container realm has no observer', () => {
    const calls = []
    const stop = observeRenderVisibility({
      activate: () => calls.push('activate'),
      deactivate: () => calls.push('deactivate'),
    }, { ownerDocument: { defaultView: {} } })

    stop()
    expect(calls).toEqual([])
  })
})
