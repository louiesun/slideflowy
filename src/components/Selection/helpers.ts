import { PositionRect, CursorPosition, SelectionRange } from './types'

export { getElementAbsPosRect as getElementPosRect } from '../../utils/DOM'

function horizontalLineCovered(pr1: PositionRect, pr2: PositionRect) {
  return (
    (pr2.top < pr1.top && pr1.top < pr2.bottom) ||
    (pr2.top < pr1.bottom && pr1.bottom < pr2.bottom)
  )
}

function verticalLineCovered(pr1: PositionRect, pr2: PositionRect) {
  return (
    (pr2.left < pr1.left && pr1.left < pr2.right) ||
    (pr2.left < pr1.right && pr1.right < pr2.right)
  )
}

export function coveredByRect(pointOrRect: PositionRect | CursorPosition, rect: PositionRect) {
  if ('right' in pointOrRect) {
    return (
      (horizontalLineCovered(pointOrRect, rect) || horizontalLineCovered(rect, pointOrRect)) &&
      (verticalLineCovered(pointOrRect, rect) || verticalLineCovered(rect, pointOrRect))
    )
  } else {
    return (
      rect.top < pointOrRect.top &&
      pointOrRect.top < rect.bottom &&
      (rect.left < pointOrRect.left && pointOrRect.left < rect.right)
    )
  }
}

export function rangeToPosRect([startCursorPos, endCursorPos]: SelectionRange) {
  return {
    top: Math.min(startCursorPos.top, endCursorPos.top),
    bottom: Math.max(startCursorPos.top, endCursorPos.top),
    left: Math.min(startCursorPos.left, endCursorPos.left),
    right: Math.max(startCursorPos.left, endCursorPos.left),
  }
}

export function posRectToRange(rect: PositionRect): SelectionRange {
  return [
    { top: rect.top, left: rect.left },
    { top: rect.bottom, left: rect.right },
  ]
}

export function moveDirection([startCursorPos, endCursorPos]: SelectionRange) {
  const up = startCursorPos.top > endCursorPos.top
  const right = startCursorPos.left < endCursorPos.left
  const down = startCursorPos.top < endCursorPos.top
  const left = startCursorPos.left > endCursorPos.left

  if (!up && !right && !down && !left) return null

  return { up, right, down, left }
}

export function getMousePagePosition(event: MouseEvent | React.MouseEvent) {
  return { top: event.pageY, left: event.pageX }
}

export function getMouseScreenPosition(event: MouseEvent | React.MouseEvent) {
  return { top: event.clientY, left: event.clientX }
}
