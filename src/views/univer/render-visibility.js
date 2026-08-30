/**
 * @param {{ activate: () => void, deactivate: () => void }} render
 * @param {Element} container
 * @returns {() => void}
 */
export function observeRenderVisibility(render, container) {
  const Observer = container.ownerDocument.defaultView?.IntersectionObserver
  if (!Observer) {
    return () => {}
  }

  const observer = new Observer((entries) => {
    const entry = entries.find(item => item.target === container)
    if (!entry) {
      return
    }
    if (entry.isIntersecting) {
      render.activate()
    }
    else {
      render.deactivate()
    }
  })
  observer.observe(container)
  return () => observer.disconnect()
}
