import { osName } from '../utils/Platform'
import { BooleanT } from '../utils/F'
import { injectable } from 'inversify'
import { EventBus } from '../utils/EventBus'

const commonKbdSymbolMap = {
  arrowup: '\u2191',
  arrowdown: '\u2193',
}

const macKbdSymbolMap = {
  ...commonKbdSymbolMap,
  meta: '\u2318',
  ctrl: '\u2303',
  shift: '\u21E7',
  alt: '\u2325',
  tab: '\u21E5',
  enter: '\u21B5',
  capslock: '\u21EA',
  backspace: '\u232B',
}

const windowsKbdNameMap = {
  meta: 'Win',
}

const macosKbdNameMap = {
  meta: 'Command',
  ctrl: 'Control',
  alt: 'Option',
}

export interface Shortcut {
  shift?: boolean
  ctrl?: boolean
  alt?: boolean
  meta?: boolean
  key: string // https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent/key/Key_Values
}

export interface ShortcutInfo {
  /** 声明这个快捷键不会修改文档 */
  safety?: boolean
}

export interface ShortcutItem {
  id: string
  name: string
  shortcut: Shortcut
  info: ShortcutInfo
}

export type OutputStyle = 'symbol' | 'text'

@injectable()
export class ShortcutService extends EventBus<ShortcutItem> {
  private readonly modifierKeys: (keyof Shortcut)[] = [
    'meta',
    'ctrl',
    'alt',
    'shift',
    'key',
  ]

  readonly shortcuts: { [id: string]: ShortcutItem } = {}

  registerShortcut(
    id: string,
    name: string,
    shortcut: Shortcut,
    info: ShortcutInfo = {},
  ) {
    const item = { id, name, shortcut, info }
    this.shortcuts[id] = item
    this.emit('add', item)
  }

  readable(shortcut: Shortcut, style: OutputStyle = 'symbol') {
    return this.modifierKeys
      .map(k =>
        !shortcut[k] ? null : this.transformSymbol(k, shortcut, style),
      )
      .filter(BooleanT<string>())
  }

  render(id: string, style: OutputStyle = 'symbol') {
    const shortcutItem = this.shortcuts[id]
    if (!shortcutItem) return ''
    const kbds = this.readable(shortcutItem.shortcut)
    if (osName() === 'macOS') {
      return kbds.join('')
    } else {
      return kbds.join(' + ')
    }
  }

  map<T>(f: (shortcutItem: ShortcutItem, id: string) => T) {
    return Object.keys(this.shortcuts).map(id => f(this.shortcuts[id], id))
  }

  private transformSymbol(
    type: keyof Shortcut,
    shortcut: Shortcut,
    style: OutputStyle,
  ) {
    let res = type === 'key' ? shortcut.key : type
    const osname = osName()

    if (style === 'symbol') {
      if (osname === 'macOS') {
        res = (macKbdSymbolMap[res.toLowerCase()] as string) || res
      } else {
        res = (commonKbdSymbolMap[res.toLowerCase()] as string) || res
      }
    } else {
      if (osname === 'macOS') {
        res = (macosKbdNameMap[res.toLowerCase()] as string) || res
      } else if (osname === 'Windows') {
        res = (windowsKbdNameMap[res.toLowerCase()] as string) || res
      }
    }

    return res[0].toUpperCase() + res.toLowerCase().slice(1)
  }
}
