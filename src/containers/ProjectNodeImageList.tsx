import { connect } from 'react-redux';
import { ProjectNodeImageList as Component } from '../components/ProjectNodeImageList';
import { projectNode } from '../action_packs';
import * as app from '../action_packs/app';
export const mapStateToProps = (state, props) => ({
    node: projectNode.selectors.getNode(state, props),
    isPreviewing: state.nutstoreFile?.isPreview == null ? true : state.nutstoreFile.isPreview,
    slideTabWindow: state.slideTabWindow,
    isSlideOpened: Boolean(state.isSlideOpened),
    currentIndex: state.currentIndex,
    fromMindMap: state.fromMindMap,
});
export const mapDispatchToProps = (dispatch) => ({
    onResizeImage(id, index, width) {
        dispatch(projectNode.actionCreators.resizeImage({ id, index, width }));
    },
    onDeleteImage(id, index) {
        dispatch(projectNode.actionCreators.deleteImage({ id, index }));
    },
    onChangeCurrentIndex(currentIndex) {
        dispatch(app.actionCreators.onChangeCurrentIndex(currentIndex));
    },
    setImagePreviewUrls(id, urls) {
        dispatch(projectNode.actionCreators.setImagePreviewUrls({ id, urls }));
    },
    onMoveUpImage(id, index) {
        dispatch(projectNode.actionCreators.moveUpImage({ id, index }));
    },
    onMoveDownImage(id, index) {
        dispatch(projectNode.actionCreators.moveDownImage({ id, index }));
    },
});
export const ProjectNodeImageList = connect(mapStateToProps, mapDispatchToProps)(Component);
