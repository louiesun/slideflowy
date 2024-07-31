import classnames from 'classnames'
import { divideEvery } from '../../utils/F'
import { osName } from '../../utils/Platform'
import { ShortcutService, Shortcut } from '../../services/ShortcutService'
import { $t } from '../../i18n'
import './style.scss'
import { useInject } from '../../utils/di'
import { useCallback, useEffect, useState, useMemo } from 'react'

export interface ShortcutPanelProps {
  inPreviewMode: boolean
  visible: boolean
  onVisibleChanged: (visible: boolean) => void
}

function useShortcutChangedTime() {
  const manager = useInject(ShortcutService)

  const [shortcutChangedAt, shortcutChanged] = useState(Date.now())

  useEffect(
    () => {
      /**
       * 在调用 useState 和 useEffect 的回调执行之间会有一段空隙时间，这段时间里
       * manager 可能会注册一些新的快捷键，对比这之间的变化的逻辑写起来有点麻烦
       * ，而大部分快捷键又恰好是这之间注册的，所以干脆直接触发一次渲染
       */
      shortcutChanged(Date.now())

      return manager.on('add', () => {
        shortcutChanged(Date.now())
      })
    },
    [manager, shortcutChanged],
  )

  return shortcutChangedAt
}

export function ShortcutPanel(props: ShortcutPanelProps) {
  const manager = useInject(ShortcutService)

  const shortcutChangedAt = useShortcutChangedTime()

  const shortcutList = useMemo(
    () =>
      manager.map(({ name, shortcut, info }) =>
        !props.inPreviewMode || info.safety
          ? renderShortcutItem(manager, name, shortcut)
          : null,
      ),
    [shortcutChangedAt],
  )

  const toggleOpen = useCallback(() => props.onVisibleChanged(!props.visible), [
    props.onVisibleChanged,
    props.visible,
  ])

  return (
    <div
      className={classnames([
        'ShortcutPanel',
        {
          'ShortcutPanel--opened': props.visible,
        },
      ])}
    >
      <h3 className="ShortcutPanel__title">{$t('NUTFLOWY_SHORTCUT_LIST')}</h3>
      {shortcutList}
      <button onClick={toggleOpen} className="ShortcutPanel__close-panel" />
    </div>
  )
}

function renderShortcutItem(
  manager: ShortcutService,
  name: string,
  shortcut: Shortcut,
) {
  return (
    <dl key={name} className="ShortcutPanel__item">
      <dt className="ShortcutPanel__name">{name}</dt>
      <dd
        title={manager.readable(shortcut, 'text').join(' + ')}
        className="ShortcutPanel__detail"
      >
        {renderDisplayable(manager, shortcut)}
      </dd>
    </dl>
  )
}

function renderDisplayable(manager: ShortcutService, shortcut: Shortcut) {
  const kbds = manager
    .readable(shortcut, 'symbol')
    .map(key => <kbd key={key}>{key}</kbd>)

  if (osName() === 'macOS') {
    return kbds
  } else {
    return divideEvery(1, '+', kbds)
  }
}
