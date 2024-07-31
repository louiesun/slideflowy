export const inEditarea = (obj: null | EventTarget | HTMLElement) => {
  if (!(obj instanceof HTMLElement)) return false
  const tagName = obj.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    obj.closest('[contenteditable]')
  )
}

export interface PositionRect {
  top: number
  left: number
  bottom: number
  right: number
  width: number
  height: number
}

/**
 * 返回元素相对 viewport 的位置
 */
export function getElementRevPosRect(elem: null | undefined): void
export function getElementRevPosRect(elem: Element): PositionRect
export function getElementRevPosRect(
  elem: Element | undefined | null,
): PositionRect | void {
  if (!elem) return
  return elem.getBoundingClientRect()
}

/**
 * 返回元素相对于滚动条 viewport （一般来说就是整个文档）的位置
 */
export function getElementAbsPosRect(elem: null | undefined): void
export function getElementAbsPosRect(elem: Element): PositionRect
export function getElementAbsPosRect(
  elem: Element | undefined | null,
): PositionRect | void {
  if (!elem) return
  const { scrollingElement } = document
  if (!scrollingElement) return
  const elemRevRect = getElementRevPosRect(elem)
  const elemPosTop = scrollingElement.scrollTop + elemRevRect.top
  const elemPosLeft = scrollingElement.scrollLeft + elemRevRect.left
  return {
    ...elemRevRect,
    top: elemPosTop,
    left: elemPosLeft,
    bottom: elemPosTop + elemRevRect.height,
    right: elemPosLeft + elemRevRect.width,
  }
}

/**
 * 根据 MouseEvent 获取鼠标相对于视口（viewport）的位置
 */
export function getMouseBoundingPos(event: MouseEvent) {
  return {
    x: event.pageX - window.scrollX,
    y: event.pageY - window.scrollY,
  }
}
