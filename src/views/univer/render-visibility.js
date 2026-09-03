/**
 * @param {{ activate: () => void, deactivate: () => void }} render
 * @param {Element} container
 * @param {number} [idleMs=2000] Pause the render loop after this much inactivity.
 * @returns {() => void}
 */
export function observeRenderVisibility(render, container, idleMs = 2000) {
  const Observer = container.ownerDocument.defaultView?.IntersectionObserver
  if (!Observer) {
    return () => {}
  }

  const win = container.ownerDocument.defaultView
  let visible = false
  let idleTimer = null
  const clearIdle = () => {
    if (idleTimer !== null) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }
  const pause = () => {
    clearIdle()
    render.deactivate()
  }
  const wake = () => {
    if (!visible) {
      return
    }
    render.activate()
    clearIdle()
    idleTimer = setTimeout(pause, idleMs)
  }

  const observer = new Observer((entries) => {
    const entry = entries.find(item => item.target === container)
    if (!entry) {
      return
    }
    visible = entry.isIntersecting
    if (entry.isIntersecting) {
      wake()
    }
    else {
      pause()
    }
  })
  observer.observe(container)

  const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']
  activityEvents.forEach(type => container.addEventListener?.(type, wake, { passive: true }))
  win?.addEventListener?.('blur', pause)
  win?.addEventListener?.('focus', wake)
  idleTimer = setTimeout(pause, idleMs)

  return () => {
    observer.disconnect()
    activityEvents.forEach(type => container.removeEventListener?.(type, wake))
    win?.removeEventListener?.('blur', pause)
    win?.removeEventListener?.('focus', wake)
    clearIdle()
  }
}
