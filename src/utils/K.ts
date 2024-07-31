// K 是 keyboard 的意思

import { osName } from './Platform'

export const isCtrlPressed = (event: KeyboardEvent) => {
  const os = osName()
  return (os === 'macOS' && event.metaKey) || (os !== 'macOS' && event.ctrlKey)
}

export const isCtrlOrMeta = (e: KeyboardEvent) => {
  const os = osName()
  return (
    (os === 'macOS' && e.key === 'Meta') || (os !== 'macOS' && e.key === 'Control')
  )
}
