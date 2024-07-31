import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { ProjectNodeListGlobalShortcuts as Component } from '../components/ProjectNodeListGlobalShortcuts'
import { projectNode, file, fileHistory } from '../action_packs'
import { IProjectNode } from '../types'

export const mapStateToProps = (state: any) => ({
  editable: !file.selectors.previewingFile(state),
  selectedNodes: projectNode.selectors.getAllSelectedNodes(state),
  selectedCopyNodes: projectNode.selectors.getAllSelectedCopyNodes(state),
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onUndo() {
    dispatch(fileHistory.actionCreators.undo())
  },
  onRedo() {
    dispatch(fileHistory.actionCreators.redo())
  },
  onSaveFile() {
    dispatch(file.actionCreators.saveFile(undefined))
  },
  onDeleteNode(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.deleteNode({ nodes }))
  },
  onCopyText(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.copyText({ nodes }))
  },
  onPrepareBeforeCopyNodes(nodes: IProjectNode[]) {
    dispatch(projectNode.actionCreators.prepareBeforeCopyNodes({ nodes }))
  },
  onCopySelectedNodes(event: ClipboardEvent) {
    dispatch(projectNode.actionCreators.copySelectedNodes(event))
  },
  onCutSelectedNodes(event: ClipboardEvent) {
    dispatch(projectNode.actionCreators.cutSelectedNodes(event))
  },
  onExpandAll() {
    dispatch(projectNode.actionCreators.expandAll())
  },
  onCollapseAll() {
    dispatch(projectNode.actionCreators.collapseAll())
  },
})

export const ProjectNodeListGlobalShortcuts = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
