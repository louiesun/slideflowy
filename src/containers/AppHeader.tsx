import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { AppHeader as Component, SaveIconStatus } from '../components/AppHeader'
import { projectNode, file, fileHistory, slide } from '../action_packs'
import { IProjectNode } from '../types'
import { ISaveFileStatus } from '../action_packs/file'
import { clone } from 'ramda'

export const mapStateToProps = (state: any) => {
  const {
    selectedRootNodeId,
    findParentTree,
   } = projectNode.selectors

  const rootNodeId = selectedRootNodeId(state)
  const parentTree = rootNodeId ? findParentTree(rootNodeId, state) : []
  const previewingFile = file.selectors.previewingFile(state)
  const saveFileStatus = state.saveFileStatus
  const saveAndQuitingFile = file.selectors.saveAndQuitFileStatus(state)
  const disabledSaveIcon =
    (saveFileStatus && saveFileStatus.step === 'requesting') ||
    saveAndQuitingFile.step === 'requesting'
  const isFileChanged = file.selectors.isFileChanged(state)

  return {
    fromMindMap: state.fromMindMap,
    isPreview: previewingFile,
    fileName: file.selectors.getFileName(state),
    saveIconStatus: saveIconStatus(saveFileStatus, isFileChanged),
    saveIconDisabled: disabledSaveIcon,
    saveAndQuitIconDisabled: disabledSaveIcon,
    parents: parentTree,
    undoAvailable: fileHistory.selectors.undoAvailable(state),
    redoAvailable: fileHistory.selectors.redoAvailable(state),
    fileShareable: file.selectors.fileShareable(state),
    isSlideOpened: Boolean(state.isSlideOpened),
    nodes: clone<{ [nodeId in IProjectNode['id']]: IProjectNode }>(state.nodes),
    rootNodeIds: state.rootNodeIds,
    slideBG: slide.selectors.bg(state),
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSaveFile() {
    dispatch(file.actionCreators.saveFile(undefined))
  },
  onSaveAndQuitFile() {
    dispatch(file.actionCreators.saveAndQuitFile())
  },
  onNodeSelectAsRoot(info: { id: IProjectNode['id'] | null }) {
    dispatch(projectNode.actionCreators.selectAsRoot({ id: info.id }))
  },
  onUndo() {
    dispatch(fileHistory.actionCreators.undo())
  },
  onRedo() {
    dispatch(fileHistory.actionCreators.redo())
  },
})

export const AppHeader = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)

function saveIconStatus(
  saveFileStatus: ISaveFileStatus | undefined,
  isFileChanged: boolean | undefined,
): SaveIconStatus | undefined {
  if (!saveFileStatus && !isFileChanged) return
  // prettier-ignore
  return saveFileStatus?.step === 'failed' ? 'failed' :
         saveFileStatus?.step === 'requesting' ? 'saving' :
         isFileChanged ? 'changed' :
         'saved'
}
