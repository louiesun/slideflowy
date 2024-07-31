import { nutstoreClient } from 'NutstoreSDK'
import {
  SelectionContainer,
  SelectionContainerProps,
  getElementPosRect,
  coveredByRect,
  getMousePagePosition,
  SelectionRange,
} from '../Selection'
import { ProjectNodeListGlobalShortcuts } from '../../containers/ProjectNodeListGlobalShortcuts'
import { Popover } from '../Popover'
import { ProjectNodeMenu, ProjectNodeMenuProps } from '../ProjectNodeMenu'
import {
  ProjectNodeListContext,
  ProjectNodeListContextValue,
} from './ProjectNodeListContext'
import { ProjectNodeListProps } from './index'
import { IProjectNode } from '../../types'
import { onSlideChangeProps } from '../../action_packs/app'

export interface ProjectNodeListRootWrapperProps {
  slideId: Window | null
  selectedNodes: IProjectNode[]
  selectionRange: null | SelectionRange
  editable: boolean
  dragging: boolean
  editingNodeId: IProjectNode['id'] | undefined
  noneNestedNodeList: IProjectNode[]
  onSlideChange: (slideChangeProps: onSlideChangeProps) => void
  onDragStart: ProjectNodeListContextValue['onDragStart']
  onDragEnd: ProjectNodeListContextValue['onDragEnd']
  onSelected: SelectionContainerProps<IProjectNode>['onSelected']
  onCompleteNode: ProjectNodeMenuProps['onCompleteNode']
  onUncompleteNode: ProjectNodeMenuProps['onUncompleteNode']
  onDeleteNode: ProjectNodeMenuProps['onDeleteNode']
  onExpandNode: ProjectNodeMenuProps['onExpandNode']
  onCollapseNode: ProjectNodeMenuProps['onCollapseNode']
  onPrepareBeforeCopyNodes: ProjectNodeMenuProps['onPrepareBeforeCopyNodes']
  onCopyText: ProjectNodeMenuProps['onCopyText']
  updateSelectedNodeIds: () => void
  cancelSelectedNodeIds: () => void
  children?: React.ReactNode
}

interface ProjectNodeListRootWrapperState {
  popoverPosProps: null | {
    popoverTop: number
    popoverLeft: number
  }

  /**
   * 这个属性主要是在 SelectionContainer 的 onSelected 事件触发后，强制
   * 刷新 ProjectNodeListRootWrapper ，让 Popover 重新定位用的
   */
  lastRerenderPopoverAt: number
}

export class ProjectNodeListRootWrapper extends React.PureComponent<
  ProjectNodeListRootWrapperProps,
  ProjectNodeListRootWrapperState
> {
  static defaultProps = {
    dragging: false,
  }

  readonly state: ProjectNodeListRootWrapperState = {
    popoverPosProps: null,
    lastRerenderPopoverAt: Date.now(),
  }

  private containerRef = React.createRef<HTMLDivElement>()
  private selectionRef = React.createRef<SelectionContainer<IProjectNode>>()

  componentDidMount() {
    document.addEventListener(
      'dragover',
      this.onSomethingDragOverDocument,
      false,
    )
  }

  componentWillUnmount() {
    document.removeEventListener(
      'dragover',
      this.onSomethingDragOverDocument,
      false,
    )
  }

  componentDidUpdate(
    prevProps: ProjectNodeListRootWrapperProps,
    prevState: ProjectNodeListRootWrapperState,
  ) {
    if (this.props.selectedNodes !== prevProps.selectedNodes) {
      // 因为 selectedNodes 刚发生变化的时候，子组件的 css 类名不一定渲染
      // 好了（比如全选快捷键触发的时候），所以需要等渲染完成一遍后再显示
      // Popover
      if (this.props.selectedNodes.length) {
        this.setState({
          popoverPosProps: this.calcPopoverPos(),
        })
      } else {
        this.setState({
          popoverPosProps: null,
        })
      }
    }
  }

  render() {
    if (nutstoreClient.isMobile) {
      return this.renderMobileVersion()
    } else {
      return this.renderDesktopVersion()
    }
  }

  private renderMobileVersion() {
    return (
      <ProjectNodeListContext.Provider
        value={{
          registerListItem: this.registerListItem,
          onDragStart: this.props.onDragStart,
          onDragEnd: this.props.onDragEnd,
        }}
      >
        <div ref={this.containerRef} className="ProjectNodeList__RootWrapper-mobile">
          {this.props.children}
        </div>
      </ProjectNodeListContext.Provider>
    )
  }

  private renderDesktopVersion() {
    return (
      <SelectionContainer<IProjectNode>
        ref={this.selectionRef}
        disabled={this.props.dragging}
        selectRange={this.props.selectionRange}
        selectionVisible={this.selectionVisible}
        shouldSelect={this.shouldSelect}
        shouldUnselect={this.shouldUnselect}
        onSelected={this.onSelected}
      >
        <ProjectNodeListGlobalShortcuts
          onSelectAllNodes={this.onSelectAllNodes}
        >
          <ProjectNodeListContext.Provider
            value={{
              registerListItem: this.registerListItem,
              onDragStart: this.props.onDragStart,
              onDragEnd: this.props.onDragEnd,
            }}
          >
            <div
              ref={this.containerRef}
              className="ProjectNodeList__RootWrapper"
            >
              {this.props.children}
              {this.renderProjectNodeMenuPopover()}
            </div>
          </ProjectNodeListContext.Provider>
        </ProjectNodeListGlobalShortcuts>
      </SelectionContainer>
    )
  }

  private onSelectAllNodes = () => {
    if (!this.selectionRef.current) return
    this.selectionRef.current.selectAll()
  }

  // 原生 dnd API 好像在遇到 position fixed 的时候不会自动滚屏，然后
  // 我们正好有顶栏，所以需要手动来做滚动的工作
  private onSomethingDragOverDocument = (event: DragEvent) => {
    if (!this.props.dragging) return
    if (!document.scrollingElement) return
    if (event.clientY < 40)
      document.scrollingElement.scrollTop -= 40 - event.clientY
  }

  private renderProjectNodeMenuPopover() {
    return (
      <Popover
        visible={Boolean(this.state.popoverPosProps)}
        containerClassName="ProjectNodeList__batch-operate-popover"
        {...this.state.popoverPosProps}
        content={() => (
          <ProjectNodeMenu
            {...this.props}
            editable={this.props.editable}
            nodes={this.props.selectedNodes}
          />
        )}
      />
    )
  }

  private calcPopoverPos() {
    const defaultPos = { popoverTop: 0, popoverLeft: 0 }

    if (!this.containerRef.current) return defaultPos

    if (!this.props.selectionRange) return defaultPos

    const firstSelectedNode = this.props.selectedNodes[0]
    const firstSelectedNodePos =
      firstSelectedNode &&
      this._listItem[firstSelectedNode.id] &&
      this._listItem[firstSelectedNode.id].elem &&
      getElementPosRect(this._listItem[firstSelectedNode.id].elem!)

    if (!firstSelectedNodePos) return defaultPos

    return {
      popoverTop: firstSelectedNodePos.top - 10,
      popoverLeft: firstSelectedNodePos.right,
    }
  }

  private _listItem: {
    [nodeId in IProjectNode['id']]: { elem: null | HTMLElement }
  } = {}
  private registerListItem = (nodeId: string, el: null | HTMLElement) => {
    this._listItem[nodeId] = { elem: el }
  }

  private shouldSelect = (event: React.MouseEvent): boolean | void => {
    if (
      !this.isProjectNodeContentView(event.target) ||
      this.inEditingNodeElement(event) ||
      this.inBatchOperatePopover(event.target)
    ) {
      return false
    }
  }

  private shouldUnselect = (event: React.MouseEvent): boolean | void => {
    if (this.inBatchOperatePopover(event.target)) {
      return false
    }
  }

  private isProjectNodeContentView(target: EventTarget) {
    if (!(target instanceof HTMLElement)) return false
    if (target.closest('.ProjectNodeContentView')) return true
    return false
  }

  private inEditingNodeElement(event: React.MouseEvent) {
    if (!(event.target instanceof HTMLElement)) return false
    if (!this.props.editingNodeId) return false
    const item = this._listItem[this.props.editingNodeId]
    if (!item || !item.elem) return false
    const elemRect = getElementPosRect(item.elem)
    return coveredByRect(getMousePagePosition(event), elemRect)
  }

  private inBatchOperatePopover(target: EventTarget) {
    return (
      target instanceof HTMLElement &&
      target.closest('.ProjectNodeList__batch-operate-popover')
    )
  }

  private onSelected: ProjectNodeListProps['onSelected'] = (range, items) => {
    this.props.onSelected(range, items)
    this.setState({ lastRerenderPopoverAt: Date.now() })
  }

  private selectionVisible: SelectionContainerProps<
    IProjectNode
  >['selectionVisible'] = (selectionRange, selectedItems) => {
    if (selectedItems.length > 1) return true
    if (!selectedItems.length) return false
    const node = selectedItems[0]
    const item = this._listItem[node.id]
    if (!item || !item.elem) return false
    const elemRect = getElementPosRect(item.elem)
    const currPos = selectionRange[1]
    return !coveredByRect(currPos, elemRect)
  }
}
