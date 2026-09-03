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

test('pauses after inactivity and wakes on container activity', async () => {
  let callback
  const listeners = new Map()
  const container = {
    ownerDocument: { defaultView: { IntersectionObserver: class {
      constructor(cb) { callback = cb }
      observe() {}
      disconnect() {}
    } } },
    addEventListener(type, listener) { listeners.set(type, listener) },
    removeEventListener() {},
  }
  const calls = []
  const stop = observeRenderVisibility({
    activate: () => calls.push('activate'),
    deactivate: () => calls.push('deactivate'),
  }, container, 5)

  callback([{ target: container, isIntersecting: true }])
  await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(calls.at(-1), 'deactivate')
  listeners.get('pointerdown')()
  assert.equal(calls.at(-1), 'activate')
  stop()
})

test('does not wake a hidden render when the window gains focus', () => {
  let callback
  const windowListeners = new Map()
  const container = {
    ownerDocument: { defaultView: { IntersectionObserver: class {
      constructor(cb) { callback = cb }
      observe() {}
      disconnect() {}
    }, addEventListener(type, listener) { windowListeners.set(type, listener) }, removeEventListener() {} } },
    addEventListener() {},
    removeEventListener() {},
  }
  const calls = []
  const stop = observeRenderVisibility({
    activate: () => calls.push('activate'),
    deactivate: () => calls.push('deactivate'),
  }, container, 50)

  callback([{ target: container, isIntersecting: false }])
  windowListeners.get('focus')()
  assert.deepEqual(calls, ['deactivate'])
  stop()
})
