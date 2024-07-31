import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ProjectNode as Component,
  ProjectNodeProps,
} from '../components/ProjectNode'
import { projectNode, file, app} from '../action_packs'
import { IProjectNode, UploadedImage } from '../types'
import { onSlideChangeProps } from '../action_packs/app'

export interface ExtraProps {
  nodeId: IProjectNode['id']
}

export const mapStateToProps = (state: any, props: ExtraProps) => ({
  slideId: state.slideTabWindow === undefined ? null : state.slideTabWindow,
  editable: !file.selectors.previewingFile(state),
  node: projectNode.selectors.getNode(state, props)!, // TODO: 比起 ! ，有没有更好的办法
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSlideChange(slideChangeProps: onSlideChangeProps) {
    dispatch(app.actionCreators.onSlideChange(slideChangeProps))
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
  onResizeImage(id: IProjectNode['id'], index: number, width: number) {
    dispatch(projectNode.actionCreators.resizeImage({ id, index, width }))
  },
  onDeleteImage(id: IProjectNode['id'], index: number) {
    dispatch(projectNode.actionCreators.deleteImage({ id, index }))
  },
  onSelectAsRoot: ((id) => {
    dispatch(projectNode.actionCreators.selectAsRoot({ id }))
  }) as ProjectNodeProps['onSelectAsRoot'],
  onShowImageUploadModal(
    nodeId: IProjectNode['id'],
    type?: UploadedImage['type'],
  ) {
    dispatch(
      projectNode.actionCreators.toggleImageUploadModal({ nodeId, type }),
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

export const ProjectNode = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
