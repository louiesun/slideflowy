import { useRef } from 'react'
import './style.scss'
import { $t } from '../../i18n'
import { Attach } from '../Attach'
import classNames from 'classnames'
import { createRestoreFocusElement } from '../ProjectNodeContentView'
import { ShortcutService } from '../../services/ShortcutService'
import { ShareFileButton } from '../../containers/ShareFileButton'
import { useInject } from '../../utils/di'

export type SaveIconStatus = 'changed' | 'saving' | 'saved' | 'failed'

export interface AppHeaderMenuProps {
  fileShareable: boolean
  isPreview: boolean
  shortcutButtonVisible: boolean
  undoAvailable: boolean
  redoAvailable: boolean
  fileName: string
  onUndo: () => void
  onRedo: () => void
  onToggleShortcutsList: () => void
  onToggleExportPanelVisible: () => void
}

export const AppHeaderMenu = (props: AppHeaderMenuProps) => {
  const shareModalRef = useRef<HTMLDivElement>(null)
  const shortcutManager = useInject(ShortcutService)

  const onUndo = () => {
    props.onUndo()
  }

  const onRedo = () => {
    props.onRedo()
  }

  const onToggleShortcutsList = () => {
    props.onToggleShortcutsList()
  }

  return (
    <div>
      <ul className="AppHeaderMenu">
        <Attach when={!props.isPreview}>
          {createRestoreFocusElement(
            <li
              className={classNames({ disabled: !props.undoAvailable })}
              onClick={onUndo}
            >
              <div className="menu-text">{$t('NUTFLOWY_UNDO')}</div>
              <div className="menu-icon">
                {`${shortcutManager.render('undo')}`}
              </div>
            </li>,
          )}
        </Attach>
        <Attach when={!props.isPreview}>
          {createRestoreFocusElement(
            <li
              className={classNames({ disabled: !props.redoAvailable })}
              onClick={onRedo}
            >
              <div className="menu-text">{$t('NUTFLOWY_REDO')}</div>
              <div className="menu-icon">
                {`${shortcutManager.render('redo')}`}
              </div>
            </li>,
          )}
        </Attach>
        <Attach when={!props.isPreview}>
          <div className="divider" />
        </Attach>
        <Attach when={props.fileShareable}>
          <li>
            <div className="menu-text">
              <ShareFileButton
                onShareModalClose={() => {}}
                modalRef={shareModalRef}
              />
            </div>
          </li>
        </Attach>
        <Attach when={true}>
          <li onClick={() => {
            props.onToggleExportPanelVisible()
          }}>
            <div className="menu-text">
              {$t('NUTFLOWY_EXPORT')}
            </div>
          </li>
        </Attach>
        <Attach when={props.shortcutButtonVisible}>
          <li onClick={onToggleShortcutsList}>
            <div className="menu-text">{$t('NUTFLOWY_SHORTCUT_LIST')}</div>
          </li>
        </Attach>
      </ul>
    </div>
  )
}
