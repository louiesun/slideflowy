import { last } from 'ramda'
import classnames from 'classnames'
import { EditorState } from 'prosemirror-state'
import { IProjectNode } from '../../types'
import { nextTick } from '../../utils/P'
import {
  InnerProseMirrorEditorView,
  InnerProseMirrorEditorViewProps,
} from './InnerProseMirrorEditorView'
import {
  isTextSelection,
  posAtFirstLine,
  posAtLastLine,
} from '../../services/ProseMirrorService'
import './style.scss'
import { InnerPreviewView } from './InnerPreviewView'
import { EditorView } from 'prosemirror-view'
import { osName } from '../../utils/Platform'
import { CompositionManager } from '../../utils/CompositionManager'
import { FocusContextValue } from '../Selection/FocusContext'

export { createRestoreFocusElement } from './InnerProseMirrorEditorView'

export interface ProjectNodeContentViewProps {
  editable: boolean
  focusedAt?: number
  selectedRootNodeId: IProjectNode['id'] | null
  isRootChildNode: boolean
  fromMindMap: boolean
  isSlideOpened: boolean
  slideTabWindow: Window | null
  currentIndex: string
  onChangeCurrentIndex: (currentIndex: string) => void
  parentNode: IProjectNode | null
  prevNode: IProjectNode | null
  nextNode: IProjectNode | null
  node: IProjectNode
  editorState?: EditorState
  onStartEdit: () => void
  onEndEdit: () => void
  onCancelEdit: () => void
  onDispatchTransaction: InnerProseMirrorEditorViewProps['onDispatchTransaction']
  onApplyMark: InnerProseMirrorEditorViewProps['onApplyMark']
  onCleanMark: InnerProseMirrorEditorViewProps['onCleanMark']
  onReplaceTextWithMark: InnerProseMirrorEditorViewProps['onReplaceTextWithMark']
  onRemoveStyle: InnerProseMirrorEditorViewProps['onRemoveStyle']
  onPrependNode: (editorState: EditorState) => void
  onAppendNode: (editorState: EditorState) => void
  onSeparateNode: () => void
  onConcatPrevNode: () => void
  onConcatNextNode: (id: IProjectNode['id']) => void
  onIndentNode: () => void
  onUnindentNode: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocusSeeminglyPrevNode: () => void
  onFocusSeeminglyNextNode: () => void
  onPasteNodes: InnerProseMirrorEditorViewProps['onPasteNodes']
  storeAnchor: FocusContextValue['storeAnchor']
}

export class ProjectNodeContentView extends React.Component<
  ProjectNodeContentViewProps,
  {}
> {
  static defaultProps = {
    editable: true,
  }

  private compositionManager: CompositionManager

  private containerRef = React.createRef<HTMLDivElement>()

  private editorViewRef = React.createRef<EditorView>()

  private sendIndexFromSlide = (event: MessageEvent) => {
    if (event.data.type !== 'SEND_INDEX_FROM_SLIDE') return
    const currentIndex = event.data.body
    if (currentIndex === this.props.node.id) {
      this.props.onChangeCurrentIndex(currentIndex)
    }
  }

  componentDidMount() {
    this.compositionManager = new CompositionManager(this.containerRef.current!)
    window.addEventListener('message', this.sendIndexFromSlide, false)
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.sendIndexFromSlide, false)
  }

  render() {
    return (
      <div
        onClick={() => {
          if (this.props.isSlideOpened && this.props.slideTabWindow !== null) {
            this.props.slideTabWindow!.postMessage(
              {
                type: 'CURRENT_INDEX',
                body: this.props.node.id,
              },
              window.location.origin,
            )
            this.props.onChangeCurrentIndex(this.props.node.id)
          }
        }}
        ref={this.containerRef}
        className={classnames({
          ProjectNodeContentView: true,
          'ProjectNodeContentView--completed': this.props.node.completed,
        })}
      >
        {this.renderEditor()}
      </div>
    )
  }

  private renderEditor() {
    if (
      !this.props.editable ||
      !this.props.editorState ||
      this.props.isSlideOpened ||
      this.props.fromMindMap
    ) {
      return (
        <InnerPreviewView
          className={classnames({
            ProjectNodeContentView__content: true,
            IsPlaying:
              this.props.node.id === this.props.currentIndex &&
              (this.props.isSlideOpened || this.props.fromMindMap)
          })}
          dangerousHTML={this.props.node.content}
        />
      )
    }

    return (
      <InnerProseMirrorEditorView
        className="ProjectNodeContentView__content"
        editorViewRef={this.editorViewRef}
        focusedAt={this.props.focusedAt}
        editorState={this.props.editorState}
        onStartEdit={this.onStartEdit}
        onEndEdit={this.onEndEdit}
        onDispatchTransaction={this.props.onDispatchTransaction}
        onApplyMark={this.props.onApplyMark}
        onCleanMark={this.props.onCleanMark}
        onReplaceTextWithMark={this.props.onReplaceTextWithMark}
        onRemoveStyle={this.props.onRemoveStyle}
        onKeyDown={this.onKeyDown}
        onPasteNodes={this.props.onPasteNodes}
        storeAnchor={this.storeAnchor}
      />
    )
  }

  private storeAnchor = (anchor: number) => {
    this.props.storeAnchor(this.props.node.id, anchor)
  }

  private onStartEdit = () => {
    // 不能在已经处于编辑状态时再发布“开始编辑” action ，否则会导致，在撤销时
    //
    // 撤销一次结束编辑 -> 编辑器获得焦点，进而导致发布“开始编辑” action ->
    // 历史中被插入插入新的记录 -> 需要再撤销一次才能回到原计划的上一个状态
    //
    // onEndEdit 也是同理
    if (this.props.focusedAt) return
    this.props.onStartEdit()
  }

  private onEndEdit = () => {
    if (!this.props.focusedAt) return
    this.props.onEndEdit()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const { isRootChildNode, parentNode, selectedRootNodeId } = this.props
    const isTopLevelNode = Boolean(
      isRootChildNode || (parentNode && parentNode.id === selectedRootNodeId),
    )
    const isSelectedRootNode =
      this.props.node.id === this.props.selectedRootNodeId

    const contextInfo = {
      isSelectedRootNode,
      isTopLevelNode,
      parentNode: parentNode!,
    }
    if (
      event.key === 'Enter' &&
      event.ctrlKey !== true &&
      event.metaKey !== true
    ) {
      // 单纯的按下回车键，这样写成这样是因为 新需求要使用 组合键 快捷换行，因此添加条件限制
      if (!this.compositionManager.isComposing(event)) {
        this.onEnterDown(event, contextInfo)
      }
      return
    }

    if (event.key === 'Backspace') {
      this.onBackspaceDown(event, contextInfo)
      return
    }

    if (
      (osName() === 'macOS' && event.metaKey && event.shiftKey) ||
      (osName() === 'Windows' && event.ctrlKey && event.shiftKey)
    ) {
      if (event.key === 'ArrowUp') {
        this.props.onMoveUp()
        event.preventDefault()
        return
      } else if (event.key === 'ArrowDown') {
        this.props.onMoveDown()
        event.preventDefault()
        return
      }
    }

    // tab|shift-tab 调整节点缩进
    if (event.key === 'Tab') {
      if (!isSelectedRootNode) {
        if (event.shiftKey) {
          this.props.onUnindentNode()
        } else {
          this.props.onIndentNode()
        }
      }
      event.preventDefault()
      return
    }

    // esc 取消编辑
    if (event.key === 'Escape') {
      this.props.onCancelEdit()
      event.preventDefault()
      return
    }

    // 上下键移动焦点，如果光标已经在首行/末行，则切换到下一个邻近节点
    if (
      event.key === 'ArrowUp' &&
      posAtFirstLine(
        this.editorViewRef.current,
        this.props.editorState && this.props.editorState.selection.to,
      )
    ) {
      this.props.onFocusSeeminglyPrevNode()
      event.preventDefault()
      return
    }
    if (
      event.key === 'ArrowDown' &&
      posAtLastLine(
        this.editorViewRef.current,
        this.props.editorState && this.props.editorState.selection.to,
      )
    ) {
      this.props.onFocusSeeminglyNextNode()
      event.preventDefault()
      return
    }

    // 根据情况判断是否合并下一个节点
    // macOS 下面 ctrl + d
    // macOS 下面 delete(fn + backspace)
    // 其他平台 delete
    if (
      (osName() === 'macOS' && event.ctrlKey && event.key === 'd') ||
      event.key === 'Delete'
    ) {
      const { editorState } = this.props
      if (!editorState) return
      const { selection } = editorState
      if (!isTextSelection(selection) || !selection.$cursor) return
      const cursorAtTheEndingPoint = !selection.$cursor.nodeAfter
      const isConcatAvailable =
        this.props.node.childrenIds.length === 0 &&
        this.props.nextNode &&
        cursorAtTheEndingPoint
      if (isConcatAvailable) {
        event.preventDefault()
        this.props.onConcatNextNode(this.props.nextNode!.id)
      }
    }
  }

  /**
   * * ctrl-shift-backspace 删除节点
   * * 如果输入框没有内容，那么删除节点
   * * 如果输入框有内容
   *     * 如果光标在输入框开始处，并且上一个节点没有子节点，那就把上一个
   *       节点的内容并入当前节点的开头（这是设计是为了用户用回车拆分节点
   *       后可以快速并且符合直觉地撤销）
   *     * 否则就是标准行为
   */
  private onBackspaceDown(
    event: KeyboardEvent,
    info: {
      isTopLevelNode: boolean
    },
  ) {
    // ctrl-shift-backspace 删除节点
    if (event.ctrlKey && event.shiftKey) {
      event.preventDefault()
      this.props.onDelete()
      return
    }

    const { editorState } = this.props
    if (!editorState) return

    // 如果输入框没有内容，那么删除节点
    if (!editorState.doc.textContent) {
      event.preventDefault()
      this.props.onDelete()
      return
    }

    const { selection } = editorState
    if (!isTextSelection(selection) || !selection.$cursor) return

    const prevNodeHasNoChild =
      this.props.prevNode && !this.props.prevNode.childrenIds.length
    const cursorAtTheStartingPoint = !selection.$cursor.nodeBefore
    if (prevNodeHasNoChild && cursorAtTheStartingPoint) {
      event.preventDefault()
      this.props.onConcatPrevNode()
    }
  }

  /**
   * * 如果是页面节点，那就只是完成修改
   * * 如果编辑框里还有内容
   *     * 如果光标在开始处，向上添加新节点并置空当前节点
   *     * 如果光标在中间，分割当前节点, 将节点前段向上添加,保留后段.
   *     * 如果光标在结束处，向下添加新节点并置空当前节点
   * * 如果编辑框里没有内容
   *     * 如果是顶层节点，那么一定是新建视觉下方的节点
   *     * 如果不是顶层节点，那么需要判断下方是否存在同级节点
   *         * 如果下方不存在同级节点，那么取消缩进一级
   *         * 如果下方存在同级节点，那么新建视觉下方的节点
   */
  private onEnterDown(
    event: KeyboardEvent,
    info: {
      isSelectedRootNode: boolean
      isTopLevelNode: boolean
      parentNode: IProjectNode
    },
  ) {
    const { node, editorState } = this.props
    if (!editorState) return

    // 如果是页面节点，那就只是完成修改
    if (info.isSelectedRootNode) {
      event.preventDefault()
      this.onEndEdit()
      return
    }

    const { selection } = editorState
    if (!isTextSelection(selection) || !selection.$cursor) return
    const { $cursor } = selection

    // 如果编辑框里还有内容
    if (editorState.doc.textContent || (node.images && node.images.length > 0)) {
      event.preventDefault()
      if (!$cursor.nodeAfter) {
        // 光标在结束处
        this.props.onAppendNode(editorState)
      } else if (!$cursor.nodeBefore) {
        // 光标在开始处
        this.props.onPrependNode(editorState)
      } else {
        // 光标在中间
        this.props.onSeparateNode()
        void this.keepScreenScrollProgress(async () => {
          await nextTick()
        })
      }
    } else if (info.isTopLevelNode) {
      event.preventDefault()
      this.props.onAppendNode(editorState)
    } else if (last(info.parentNode.childrenIds) === this.props.node.id) {
      event.preventDefault()
      this.props.onUnindentNode()
    } else {
      event.preventDefault()
      this.props.onAppendNode(editorState)
    }
  }

  // https://jira.jianguoyun.com/browse/NS-4661
  // 编辑中的节点特别长（大约是两屏）时，拆分节点或者续接节点的时候
  // 页面会滚动到看不到光标的位置，所以需要在这种情况时进行修正
  private async keepScreenScrollProgress(works: () => void | Promise<void>) {
    if (!this.containerRef.current || document.documentElement === null) return
    const { scrollTop, scrollHeight } = document.documentElement
    await works()
    if (!document.scrollingElement) return
    // 这种重设似乎总是有机率会导致页面跳动一下，所以不是非常有必要的
    // 情况下就不要这么干了
    if (Math.abs(document.scrollingElement.scrollTop - scrollTop) > 40) {
      const difference = document.scrollingElement.scrollHeight - scrollHeight
      document.scrollingElement.scrollTop = scrollTop + difference
    }
  }
}
