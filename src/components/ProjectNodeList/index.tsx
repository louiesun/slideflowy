import classnames from 'classnames'
import {
  DraggableProjectNode,
  DraggableProjectNodeProps,
} from './DraggableProjectNode'
import {
  ProjectNodeListRootWrapper,
  ProjectNodeListRootWrapperProps,
} from './ProjectNodeListRootWrapper'
import {
  ProjectNodeListContext,
  ProjectNodeListContextValue,
} from './ProjectNodeListContext'
import './style.scss'
import { IProjectNode } from '../../types'
import { evolve, shallowChanged } from '../../utils/F/shallowChanged'
import {
  DroppableEndingNodeProps,
  DroppableEndingNode,
} from './DroppableEndingNode'

export interface ProjectNodeListProps extends ProjectNodeListRootWrapperProps {
  draggingCoveredNodeIds: { [id in IProjectNode['id']]: IProjectNode }
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  parentNodeId: IProjectNode['id'] | null // null 代表根节点
  isRoot: boolean
  header: React.ReactNode
  footer: React.ReactNode
  onReordered: DraggableProjectNodeProps['onReordered']
  onMoveToEnd: DroppableEndingNodeProps['onDrop']
  lastSelectedNodeIds: IProjectNode['id'][]
}

export class ProjectNodeList extends React.Component<ProjectNodeListProps> {
  static defaultProps = {
    isRoot: false,
    header: null,
    footer: null,
  }

  shouldComponentUpdate(nextProps: ProjectNodeListProps) {
    return Boolean(
      shallowChanged(
        this.props,
        nextProps,
        evolve<ProjectNodeListProps>({
          noneNestedNodeList: (a, b) =>
            a.map((n) => n.id).join(',') !== b.map((n) => n.id).join(','),
        }),
      ),
    )
  }

  render() {
    if (this.props.isRoot) {
      return this.renderOuter(this.renderInner())
    } else {
      return this.renderInner()
    }
  }

  private renderOuter(inner: any) {
    return (
      <ProjectNodeListRootWrapper {...this.props}>
        {this.props.header}
        {inner}
        {this.props.footer}
      </ProjectNodeListRootWrapper>
    )
  }

  private renderInner() {
    return <ProjectNodeListContext.Consumer children={this.renderProjectNode} />
  }

  private renderProjectNode = (ctx: ProjectNodeListContextValue) => (
    <div
      className={classnames([
        'ProjectNodeList',
        { 'ProjectNodeList--dragging': this.props.dragging },
      ])}
    >
      {this.props.noneNestedNodeList.map((n, idx) => (
        <DraggableProjectNode
          key={n.id}
          innerElemRef={ctx.registerListItem}
          index={idx}
          node={n}
          isDraggingCovered={!this.props.draggingCoveredNodeIds ? false : Boolean(this.props.draggingCoveredNodeIds[n.id])}
          isSelectedInState={this.props.selectedNodes.indexOf(n) > -1}
          nodes={this.props.nodes}
          draggable={this.props.editable}
          onDragStart={ctx.onDragStart}
          onDragEnd={ctx.onDragEnd}
          onReordered={this.props.onReordered}
          lastSelectedNodeIds={this.props.lastSelectedNodeIds || []}
          draggingCoveredNodeIds={this.props.draggingCoveredNodeIds}
          cancelSelectedNodeIds={this.props.cancelSelectedNodeIds}
        />
      ))}
      <DroppableEndingNode 
        nodes={this.props.nodes}
        noneNestedNodeList={this.props.noneNestedNodeList}
        lastSelectedNodeIds={this.props.lastSelectedNodeIds || []}
        onDrop={this.props.onMoveToEnd} 
      />
    </div>
  )
}