import { startRun } from './formula-render'

const renderedKeys = new WeakMap<object, string>()

/**
 * Starts rendering `target` for the link `key` (its src and alt). Returns null when `target`
 * already shows that link, so an unchanged embed is not rendered twice. Otherwise returns a
 * check that stays true only while no newer render of `target` has started.
 */
export function beginRender(target: object, key: string): (() => boolean) | null {
  if (renderedKeys.get(target) === key)
    return null

  renderedKeys.set(target, key)
  return startRun(target)
}
