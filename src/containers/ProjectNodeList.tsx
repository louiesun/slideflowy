import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ProjectNodeList as Component,
  ProjectNodeListProps as ComponentProps,
} from '../components/ProjectNodeList'
import { projectNode, file, app } from '../action_packs'
import { SelectionRange } from '../components/Selection'
import { IProjectNode } from '../types'
import { NodeOrderIntend } from '../action_packs/project_node'
import { onSlideChangeProps } from '../action_packs/app'

export const mapStateToProps = (
  state: any,
  props: { parentNodeId: ComponentProps['parentNodeId'] },
) => ({
  slideId: state.slideTabWindow === undefined ? null : state.slideTabWindow,
  nodes: state.nodes,
  parentNodeId: props.parentNodeId,
  editable: !file.selectors.previewingFile(state),
  dragging: Object.keys(projectNode.selectors.getDraggingNodeIds(state)).length > 0,
  selectionRange: projectNode.selectors.selectionRange(state),
  noneNestedNodeList: projectNode.selectors.getNoneNestedNodeList(state),
  selectedNodes: projectNode.selectors.getAllSelectedNodes(state),
  editingNodeId: projectNode.selectors.getEditingNodeId(state),
  draggingCoveredNodeIds: state.projectNodeDraggingNodeIds,
  lastSelectedNodeIds: state.lastAllSelectedNodeIds
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSlideChange(slideChange: onSlideChangeProps) {
    dispatch(app.actionCreators.onSlideChange(slideChange))
  },
  onCompleteNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.completeNode({ nodes }))
  },
  onUncompleteNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.uncompleteNode({ nodes }))
  },
  onDeleteNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.deleteNode({ nodes }))
  },
  onExpandNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.expand({ nodes }))
  },
  onCollapseNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.collapse({ nodes }))
  },
  onPrepareBeforeCopyNodes(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.prepareBeforeCopyNodes({ nodes }))
  },
  onCopyText(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.copyText({ nodes }))
  },
  onSelected(range: SelectionRange, nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.selectNodes({ range, nodes }))
  },
  onDragStart(nodeId: IProjectNode['id']) {
    dispatch(projectNode.actionCreators.dragStart({ nodeId }))
  },
  onDragEnd() {
    dispatch(projectNode.actionCreators.dragEnd())
  },
  onReordered(
    sourceNodeId: IProjectNode['id'],
    targetNodeId: IProjectNode['id'],
    intend: NodeOrderIntend,
  ) {
    dispatch(
      projectNode.actionCreators.reorder({
        sourceNodeId,
        targetNodeId,
        intend,
      }),
    )
  },
  onMoveToEnd(nodeId: IProjectNode['id']) {
    dispatch(
      projectNode.actionCreators.moveToEnd({
        nodeId,
      }),
    )
  }, 
  updateSelectedNodeIds() {
    dispatch(
      projectNode.actionCreators.updateLastAllSelectedNodeIds()
    )
  },
  cancelSelectedNodeIds() {
    dispatch(
      projectNode.actionCreators.cancelLastAllSelectedNodeIds()
    )
  }
})

export const ProjectNodeList = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)