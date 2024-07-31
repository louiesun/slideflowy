import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { ProjectNodeImageList as Component } from '../components/ProjectNodeImageList'
import { projectNode, State as ProjectNodeState } from '../action_packs'
import { IProjectNode } from '../types'
import * as app from '../action_packs/app'

export interface ExtraProps {
  nodeId: IProjectNode['id']
}

export const mapStateToProps = (
  state: ProjectNodeState,
  props: ExtraProps,
) => ({
  node: projectNode.selectors.getNode(state, props)!, // TODO: 比起 ! ，有没有更好的办法
  isPreviewing:
    state.nutstoreFile?.isPreview == null ? true : state.nutstoreFile.isPreview,
  slideTabWindow: state.slideTabWindow,
  isSlideOpened: Boolean(state.isSlideOpened),
  currentIndex: state.currentIndex,
  fromMindMap: state.fromMindMap,
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onResizeImage(id: IProjectNode['id'], index: number, width: number) {
    dispatch(projectNode.actionCreators.resizeImage({ id, index, width }))
  },
  onDeleteImage(id: IProjectNode['id'], index: number) {
    dispatch(projectNode.actionCreators.deleteImage({ id, index }))
  },
  onChangeCurrentIndex(currentIndex: string) {
    dispatch(app.actionCreators.onChangeCurrentIndex(currentIndex))
  },
  setImagePreviewUrls(id: IProjectNode['id'], urls: string[]) {
    dispatch(projectNode.actionCreators.setImagePreviewUrls({id, urls}))
  },
  onMoveUpImage(id: IProjectNode['id'], index: number) {
    dispatch(projectNode.actionCreators.moveUpImage({ id, index }))
  },
  onMoveDownImage(id: IProjectNode['id'], index: number) {
    dispatch(projectNode.actionCreators.moveDownImage({ id, index }))
  },
})

export const ProjectNodeImageList = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
