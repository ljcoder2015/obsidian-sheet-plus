import assert from 'node:assert/strict'
import test from 'node:test'
import { observeRenderVisibility } from '../src/views/univer/render-visibility.js'

test('uses the container realm and follows visibility until disconnected', () => {
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

  assert.deepEqual(calls, ['deactivate', 'activate'])
  assert.equal(disconnected, true)
})

test('keeps the render active when the container realm has no observer', () => {
  const calls = []
  const stop = observeRenderVisibility({
    activate: () => calls.push('activate'),
    deactivate: () => calls.push('deactivate'),
  }, { ownerDocument: { defaultView: {} } })

  stop()
  assert.deepEqual(calls, [])
})
