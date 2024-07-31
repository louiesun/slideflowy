import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { projectNode, State as ProjectNodeState } from '../action_packs'
import { IProjectNode, UploadedImage } from '../types'
import { ProjectNodeImageUploader as Component } from '../components/ProjectNodeImageUploader'

interface ExtraProps {
  nodeId: IProjectNode['id']
}

const mapStateToProps = (state: ProjectNodeState, props: ExtraProps) => {
  const node = projectNode.selectors.getNode(state, props)!
  const isEditing = projectNode.selectors.isNodeEditing(state, props)

  return {
    node,
    isEditing,
    modalType:
      state.imageUploadModalStatus?.nodeId === props.nodeId
        ? state.imageUploadModalStatus.modalType
        : undefined,
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onInsertImage(id: IProjectNode['id'], imageInfo: UploadedImage) {
    dispatch(projectNode.actionCreators.insertImage({ id, imageInfo }))
  },
  onHideImageUploadModal(node: IProjectNode) {
    dispatch(
      projectNode.actionCreators.toggleImageUploadModal({ nodeId: node.id }),
    )
  },
})

export const ProjectNodeImageUploader = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
