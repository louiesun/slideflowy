import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { compose } from 'ramda'
import { App as Component } from '../components/App'
import { projectNode, file, slide, app } from '../action_packs'
import { Connector } from '../utils/R'
import { IProjectNode } from '../types'
import { onSlideChangeProps } from '../action_packs/app'

export const mapStateToProps = (state: any) => {
  // prettier-ignore
  const { selectedRootNodeId, getChildNodes, findParentTree } = projectNode.selectors

  const rootNodeId = selectedRootNodeId(state)
  const parentTree = rootNodeId ? findParentTree(rootNodeId, state) : []
  const nodes = rootNodeId
    ? getChildNodes({ nodeId: rootNodeId }, state)
    : getChildNodes({}, state)
  const previewingFile = file.selectors.previewingFile(state)

  return {
    slideId: state.slideTabWindow === undefined ? null : state.slideTabWindow,
    startNodeId: state.startNodeId === undefined ? '' : state.startNodeId,
    fileName: file.selectors.getFileName(state),
    appendNodeIconVisible: !nodes.length && !previewingFile,
    previewingFile,
    selectedRootNodeId: rootNodeId,
    parents: parentTree,
    node: parentTree[parentTree.length - 1],
    requestingFileInfo: state.requestingFileInfo,
    slideBG: slide.selectors.bg(state),
    rootNodeIds: state.rootNodeIds,
    nodes: state.nodes,
    slideTabWindow: state.slideTabWindow,
    isSlideOpened: Boolean(state.isSlideOpened),
    noneNestedNodeList: projectNode.selectors.getNoneNestedNodeList(state, true),
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
  onParentAppendNode(parentId: IProjectNode['id'] | null) {
    dispatch(projectNode.actionCreators.addNode({ parentId }))
  },
  onSlideChange(slideChangeProps: onSlideChangeProps) {
    dispatch(app.actionCreators.onSlideChange(slideChangeProps))
  },
  setBG(bg: string) {
    dispatch(slide.actionCreators.setBG(bg))
  },
})

const connector: Connector = connect(mapStateToProps, mapDispatchToProps)

export const App = compose(connector)(Component)
