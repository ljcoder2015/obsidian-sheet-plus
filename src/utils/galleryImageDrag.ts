import type { Plugin } from 'obsidian'

const GALLERY_SCROLLER_SELECTOR = '[data-u-comp="gallery"] > .univer-relative'
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"]'

interface Point {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  base: Point
  img: HTMLImageElement
}

/**
 * 单元格图片大图预览：Univer Gallery 只有滚轮缩放，长图超出视口后无法查看完整。
 * 预览容器隐藏滚动条但保留滚动能力，这里让图片支持按住拖动来滚动内容，
 * 滚轮缩放仍交给 Univer 处理。
 */
export function registerGalleryImageDrag(plugin: Plugin) {
  let dragging: DragState | null = null

  const findScroller = () =>
    document.querySelector<HTMLElement>(GALLERY_SCROLLER_SELECTOR)

  const endDrag = () => {
    if (dragging?.img.hasPointerCapture(dragging.pointerId))
      dragging.img.releasePointerCapture(dragging.pointerId)
    dragging = null
    findScroller()?.classList.remove('is-dragging')
  }

  plugin.registerDomEvent(window, 'pointerdown', (event) => {
    if (event.button !== 0)
      return

    const scroller = findScroller()
    const img = scroller?.querySelector('img')
    const target = event.target as Node | null
    if (!scroller || !img || !target || !scroller.contains(target))
      return
    if ((target as HTMLElement).closest(INTERACTIVE_SELECTOR))
      return

    dragging = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base: { x: scroller.scrollLeft, y: scroller.scrollTop },
      img,
    }
    // 捕获指针，鼠标移出图片或窗口后仍能继续拖动
    img.setPointerCapture(event.pointerId)
    scroller.classList.add('is-dragging')
  })

  plugin.registerDomEvent(window, 'pointermove', (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId)
      return

    const scroller = findScroller()
    if (!scroller)
      return

    // 内容跟随指针移动，等价于把滚轮/滚动条换成鼠标拖动
    scroller.scrollLeft = dragging.base.x - (event.clientX - dragging.startX)
    scroller.scrollTop = dragging.base.y - (event.clientY - dragging.startY)
  })

  plugin.registerDomEvent(window, 'pointerup', (event) => {
    if (dragging && event.pointerId === dragging.pointerId)
      endDrag()
  })

  plugin.registerDomEvent(window, 'pointercancel', endDrag)
}
