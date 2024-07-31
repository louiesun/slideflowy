import { Inject } from 'react.di'
import { IProjectNode } from '../types'
import { osName } from '../utils/Platform'
import { $t } from '../i18n'
import { inEditarea } from '../utils/DOM'
import { Shortcut, ShortcutService } from '../services/ShortcutService'
import { nutstoreClient } from '../utils/NutstoreSDK'

export interface ProjectNodeListGlobalShortcutsProps {
  editable: boolean
  selectedNodes: IProjectNode[]
  selectedCopyNodes: IProjectNode[]
  onUndo: () => void
  onRedo: () => void
  onSaveFile: () => void
  onSelectAllNodes: () => void
  onDeleteNode: (nodes: IProjectNode[]) => void
  onCopyText: (nodes: IProjectNode[]) => void
  onPrepareBeforeCopyNodes: (nodes: IProjectNode[]) => void
  onCopySelectedNodes: (event: ClipboardEvent) => void
  onCutSelectedNodes: (event: ClipboardEvent) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  children?: React.ReactNode
}

export interface ProjectNodeListGlobalShortcutsState {
  isClient: boolean
  featureRestrictionEnabled: boolean
}

export class ProjectNodeListGlobalShortcuts extends React.Component<
  ProjectNodeListGlobalShortcutsProps,
  ProjectNodeListGlobalShortcutsState
> {
  @Inject shortcutManager: ShortcutService

  private osName = osName()

  private expanded = true

  constructor(props: ProjectNodeListGlobalShortcutsProps) {
    super(props)
    this.state = {
      isClient: false,
      featureRestrictionEnabled: false,
    }
  }

  componentDidMount() {
    const _isClient = nutstoreClient.isElectronClient
    this.setState({ isClient: _isClient })
    if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
      void nutstoreClient.getFeatureRestrictionEnabled().then((enabled) => {
        this.setState({ featureRestrictionEnabled: enabled })
      })
    } else {
      this.setState({ featureRestrictionEnabled: false })
    }

    // 被嵌套在 iframe 里的情况下，刚打开网页时整个 window 都不会获得
    // 焦点，因此也会收不到 ctrl-a 快捷键的事件
    window.focus()

    document.addEventListener('keydown', this.onKeyboardPressed, false)
    document.addEventListener('copy', this.onCopySelectedNodes, false)
    document.addEventListener('cut', this.onCutSelectedNodes, false)

    if (this.osName === 'macOS') {
      this.shortcutManager.registerShortcut('undo', $t('NUTFLOWY_UNDO'), {
        meta: true,
        key: 'z',
      })
      this.shortcutManager.registerShortcut('redo', $t('NUTFLOWY_REDO'), {
        meta: true,
        shift: true,
        key: 'z',
      })
      this.shortcutManager.registerShortcut('moveUp', $t('NUTFLOWY_MOVE_UP'), {
        meta: true,
        shift: true,
        key: 'ArrowUp'
      })
      this.shortcutManager.registerShortcut('moveDown', $t('NUTFLOWY_MOVE_DOWN'), {
        meta: true,
        shift: true,
        key: 'ArrowDown'
      })
    } else {
      this.shortcutManager.registerShortcut('undo', $t('NUTFLOWY_UNDO'), {
        ctrl: true,
        key: 'z',
      })
      this.shortcutManager.registerShortcut('redo', $t('NUTFLOWY_REDO'), {
        ctrl: true,
        key: 'y',
      })
      this.shortcutManager.registerShortcut('moveUp', $t('NUTFLOWY_MOVE_UP'), {
        ctrl: true,
        shift: true,
        key: 'ArrowUp'
      })
      this.shortcutManager.registerShortcut('moveDown', $t('NUTFLOWY_MOVE_DOWN'), {
        ctrl: true,
        shift: true,
        key: 'ArrowDown'
      })
    }

    const ctrl = this.osName !== 'macOS'
    this.shortcutManager.registerShortcut('save', $t('SAVE'), {
      meta: !ctrl,
      ctrl,
      key: 's',
    })
    this.shortcutManager.registerShortcut(
      'copy',
      $t('COPY'),
      {
        meta: !ctrl,
        ctrl,
        key: 'c',
      },
      { safety: true },
    )
    this.shortcutManager.registerShortcut(
      'copy_text',
      $t('COPY_TEXT'),
      {
        meta: !ctrl,
        ctrl,
        shift: true,
        key: 'c',
      },
      { safety: true },
    )
    this.shortcutManager.registerShortcut(
      'selectAll',
      $t('NUTFLOWY_SELECT_ALL_NODES'),
      { meta: !ctrl, ctrl, key: 'a' },
      { safety: true },
    )
    this.shortcutManager.registerShortcut('cut', $t('NUTFLOWY_CUT'), {
      meta: !ctrl,
      ctrl,
      key: 'x',
    })
    this.shortcutManager.registerShortcut('paste', $t('NUTFLOWY_PASTE'), {
      meta: !ctrl,
      ctrl,
      key: 'v',
    })

    this.shortcutManager.registerShortcut('delete', $t('DELETE'), {
      ctrl: true,
      shift: true,
      key: 'Backspace',
    })
    this.shortcutManager.registerShortcut(
      'cancelEdit',
      $t('NUTFLOWY_CANCEL_EDIT'),
      { key: 'Escape' },
    )
    this.shortcutManager.registerShortcut('indent', $t('NUTFLOWY_INDENT'), {
      key: 'Tab',
    })
    this.shortcutManager.registerShortcut('outdent', $t('NUTFLOWY_OUTDENT'), {
      shift: true,
      key: 'Tab',
    })

    const modifierKeysOptions: Partial<Shortcut> =
      osName() === 'macOS' ? { meta: true } : { ctrl: true }
    this.shortcutManager.registerShortcut(
      'richTextBold',
      $t('NUTFLOWY_RICHTEXT_MENUITEM_BOLD'),
      {
        ...modifierKeysOptions,
        key: 'B',
      },
    )
    this.shortcutManager.registerShortcut(
      'richTextItalic',
      $t('NUTFLOWY_RICHTEXT_MENUITEM_ITALIC'),
      {
        ...modifierKeysOptions,
        key: 'I',
      },
    )
    this.shortcutManager.registerShortcut(
      'richTextUnderline',
      $t('NUTFLOWY_RICHTEXT_MENUITEM_UNDERLINE'),
      {
        ...modifierKeysOptions,
        key: 'U',
      },
    )
    this.shortcutManager.registerShortcut(
      'textWrapping',
      $t('NUTFLOWY_TEXT_WRAPPING'),
      {
        ...modifierKeysOptions,
        key: '\u21B5',
      },
    )

    this.shortcutManager.registerShortcut(
      'expandOrCollapseAll',
      $t('NUTFLOWY_EXPAND_OR_COLLAPSE_ALL'),
      {
        meta: !ctrl,
        alt: ctrl,
        shift: true,
        key: '.',
      },
      { safety: true },
    )
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyboardPressed, false)
    document.removeEventListener('copy', this.onCopySelectedNodes, false)
    document.removeEventListener('cut', this.onCutSelectedNodes, false)
  }

  checkWhetherRunVipFeatures = () => {
    const { isClient, featureRestrictionEnabled } = this.state
    return new Promise(async (resolve) => {
      let isVip
      if (isClient && featureRestrictionEnabled && nutstoreClient.isPayingUser) {
        isVip = await nutstoreClient.isPayingUser()
      } else {
        isVip = false
      }
      if (isClient && featureRestrictionEnabled && !isVip && nutstoreClient.showPricingPlans) {
        nutstoreClient.showPricingPlans()
        resolve(false)
      } else {
        resolve(true)
      }
    })
  }

  render() {
    return this.props.children
  }

  private onKeyboardPressed = async (event: KeyboardEvent) => {
    if (event.key === 'Backspace' && !inEditarea(event.target)) {
      // 防止触发历史后退功能
      event.preventDefault()
    }

    // (ctrl|cmd)-c 拦截复制的默认事件
    if (
      this.props.editable &&
      (this.osName === 'macOS' ? event.metaKey : event.ctrlKey) &&
      event.key.toLowerCase() === 'c' && !event.shiftKey
    ) {
      if (document.activeElement?.tagName === 'BODY') {
        this.props.onPrepareBeforeCopyNodes(this.props.selectedCopyNodes)
        event.preventDefault()
      }
    }

    // (ctrl|cmd)-shift-c 复制文本
    if (
      this.props.editable &&
      (this.osName === 'macOS' ? event.metaKey : event.ctrlKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'c'
    ) {
      event.preventDefault()
      void this.checkWhetherRunVipFeatures().then(run => {
        if (!run) {
          return
        }
        this.props.onCopyText(this.props.selectedNodes)

      })
    }

    // (ctrl|cmd)-s 保存
    if (
      this.props.editable &&
      event.key === 's' &&
      (this.osName === 'macOS' ? event.metaKey : event.ctrlKey)
    ) {
      this.props.onSaveFile()
      event.preventDefault()
      return
    }

    // 按 Backspace/Delete 可以删除选中的节点
    if (
      this.props.selectedNodes.length &&
      this.props.editable &&
      (event.key === 'Backspace' || event.key === 'Delete')
    ) {
      this.props.onDeleteNode(this.props.selectedNodes)
      return
    }

    // Cmd-a/Ctrl-a 选中所有节点
    if (
      !inEditarea(event.target) &&
      event.key === 'a' &&
      ((this.osName === 'macOS' && event.metaKey) || event.ctrlKey)
    ) {
      event.preventDefault()
      this.props.onSelectAllNodes()
      return
    }

    // Cmd-Shift-z/Ctrl-Y 重做
    if (
      this.props.editable &&
      ((this.osName === 'macOS' &&
        event.metaKey &&
        event.shiftKey &&
        event.key === 'z') ||
        (event.ctrlKey && event.key === 'y'))
    ) {
      this.props.onRedo()
      return
    }

    // Cmd-z/Ctrl-z 撤销
    if (
      this.props.editable &&
      event.key === 'z' &&
      ((this.osName === 'macOS' && event.metaKey) || event.ctrlKey)
    ) {
      this.props.onUndo()
      return
    }

    // Cmd-Shift-./Alt-Shift-.全部展开/折叠
    if (
      event.code === 'Period' &&
      ((this.osName === 'macOS' && event.metaKey) || event.altKey) &&
      event.shiftKey
    ) {
      this.expanded ? this.props.onCollapseAll() : this.props.onExpandAll()
      this.expanded = !this.expanded
    }
  }

  private onCopySelectedNodes = (event: ClipboardEvent) => {
    if (!this.props.selectedCopyNodes.length) return
    this.props.onCopySelectedNodes(event)
  }

  private onCutSelectedNodes = (event: ClipboardEvent) => {
    if (!this.props.selectedCopyNodes.length) return
    if (!this.props.editable) return
    this.props.onCutSelectedNodes(event)
  }
}
