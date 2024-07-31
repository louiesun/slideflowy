import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { EditorState, Transaction } from 'prosemirror-state'
import { ProjectNodeContentView as Component } from '../components/ProjectNodeContentView'
import { IProjectNode, SimpleObj } from '../types'
import { MarkType } from 'prosemirror-model'
import * as projectNode from '../action_packs/project_node'
import * as file from '../action_packs/file'
import * as nodeEdit from '../action_packs/node_edit'
import * as app from '../action_packs/app'

interface ExtraProps {
  nodeId: IProjectNode['id']
}

export const mapStateToProps = (state: any, props: ExtraProps) => {
  const parentNodeInfo = projectNode.selectors.findParentNode(
    props.nodeId,
    state,
  )
  const prevNodeInfo = projectNode.selectors.findPrevNode(props.nodeId, state)
  const nextNodeInfo = projectNode.selectors.findNextNode(props.nodeId, state)
  return {
    selectedRootNodeId: projectNode.selectors.selectedRootNodeId(state),
    editable: !file.selectors.previewingFile(state),
    isRootChildNode: !parentNodeInfo || !parentNodeInfo.parentNode,
    parentNode: parentNodeInfo ? parentNodeInfo.parentNode : null,
    prevNode: prevNodeInfo ? prevNodeInfo.prevNode : null,
    nextNode: nextNodeInfo ? nextNodeInfo.nextNode : null,
    node: projectNode.selectors.getNode(state, props)!, // TODO: 比起 ! ，有没有更好的办法
    focusedAt: projectNode.selectors.getEditStatus(props.nodeId, state)
      .focusedAt,
    editorState: nodeEdit.selectors.getEditorState(props.nodeId, state),
    slideTabWindow: state.slideTabWindow,
    fromMindMap: state.fromMindMap,
    isSlideOpened: Boolean(state.isSlideOpened),
    currentIndex: state.currentIndex,
  }
}

export const mapDispatchToProps = (dispatch: Dispatch, props: ExtraProps) => ({
  onStartEdit() {
    dispatch(
      nodeEdit.actionCreators.start({
        id: props.nodeId,
      }),
    )
  },
  onEndEdit() {
    dispatch(nodeEdit.actionCreators.end({ id: props.nodeId }))
  },
  onDispatchTransaction(tr: Transaction) {
    dispatch(
      nodeEdit.actionCreators.applyTransaction({
        id: props.nodeId,
        transaction: tr,
        // @ts-ignore,
        view: this
      }),
    )
  },
  onCancelEdit() {
    dispatch(nodeEdit.actionCreators.cancel({ id: props.nodeId }))
  },
  onRemoveStyle() {
    dispatch(nodeEdit.actionCreators.removeStyle({ id: props.nodeId }))
  },
  onApplyMark(mark: MarkType, attrs?: SimpleObj) {
    dispatch(
      nodeEdit.actionCreators.applyMark({
        id: props.nodeId,
        mark,
        attrs: attrs || {},
      }),
    )
  },
  onCleanMark(mark: MarkType) {
    dispatch(
      nodeEdit.actionCreators.cleanMark({
        id: props.nodeId,
        mark,
      }),
    )
  },
  onReplaceTextWithMark(text: string, mark: MarkType, attrs: SimpleObj) {
    dispatch(
      nodeEdit.actionCreators.replaceTextWithMark({
        id: props.nodeId,
        text,
        mark,
        attrs,
      }),
    )
  },
  onPrependNode(editorState: EditorState) {
    dispatch(
      projectNode.actionCreators.prependNode({ id: props.nodeId, editorState }),
    )
  },
  onAppendNode(editorState: EditorState) {
    dispatch(
      projectNode.actionCreators.appendNode({ id: props.nodeId, editorState }),
    )
  },
  onConcatPrevNode() {
    dispatch(projectNode.actionCreators.concatNode({ id: props.nodeId }))
  },
  onConcatNextNode(id: IProjectNode['id']) {
    dispatch(projectNode.actionCreators.concatNode({ id }))
  },
  onSeparateNode() {
    dispatch(projectNode.actionCreators.separateNode({ id: props.nodeId }))
  },
  onPasteNodes(nodes: IProjectNode[]) {
    dispatch(
      projectNode.actionCreators.pasteNodes({
        anchorNodeId: props.nodeId,
        nodes,
      }),
    )
  },
  onIndentNode() {
    dispatch(projectNode.actionCreators.indentNode({ id: props.nodeId }))
  },
  onUnindentNode() {
    dispatch(projectNode.actionCreators.unindentNode({ id: props.nodeId }))
  },
  onMoveUp() {
    dispatch(projectNode.actionCreators.moveUp({ id: props.nodeId }))
  },
  onMoveDown() {
    dispatch(projectNode.actionCreators.moveDown({ id: props.nodeId }))
  },
  onDelete() {
    dispatch(
      projectNode.actionCreators.deleteNode({
        id: props.nodeId,
        moveCursor: true,
      }),
    )
  },
  onFocusSeeminglyPrevNode() {
    dispatch(
      projectNode.actionCreators.focusSeeminglyPrevNode({ id: props.nodeId }),
    )
  },
  onFocusSeeminglyNextNode() {
    dispatch(
      projectNode.actionCreators.focusSeeminglyNextNode({ id: props.nodeId }),
    )
  },
  onChangeCurrentIndex(currentIndex: string) {
    dispatch(app.actionCreators.onChangeCurrentIndex(currentIndex))
  },
})

export const ProjectNodeContentView = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
