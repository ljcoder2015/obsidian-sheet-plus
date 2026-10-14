import { describe, expect, it } from 'vitest'
import { beginRender } from '../src/post-processor/embed-refresh'

describe('beginRender', () => {
  it('renders an embed the first time', () => {
    const isCurrent = beginRender({}, 'Budget|=A1')
    expect(isCurrent?.()).toBe(true)
  })

  it('skips an embed that already shows the same link', () => {
    const el = {}
    beginRender(el, 'Budget|=A1')
    expect(beginRender(el, 'Budget|=A1')).toBeNull()
  })

  it('re-renders when the link text changes', () => {
    const el = {}
    const first = beginRender(el, 'Budget|=A1')
    const second = beginRender(el, 'Budget|=A1{fmt:0%}')
    expect(second?.()).toBe(true)
    expect(first?.()).toBe(false)
  })

  it('tracks embeds independently', () => {
    const first = beginRender({}, 'Budget|=A1')
    beginRender({}, 'Budget|=A1')
    expect(first?.()).toBe(true)
  })
})
