import { connect } from 'react-redux';
import { ProjectNode as Component, } from '../components/ProjectNode';
import { projectNode, file, app } from '../action_packs';
export const mapStateToProps = (state, props) => ({
    slideId: state.slideTabWindow === undefined ? null : state.slideTabWindow,
    editable: !file.selectors.previewingFile(state),
    node: projectNode.selectors.getNode(state, props), // TODO: 比起 ! ，有没有更好的办法
});
export const mapDispatchToProps = (dispatch) => ({
    onSlideChange(slideChangeProps) {
        dispatch(app.actionCreators.onSlideChange(slideChangeProps));
    },
    onCompleteNode(nodes) {
        dispatch(projectNode.actionCreators.completeNode({ nodes }));
    },
    onUncompleteNode(nodes) {
        dispatch(projectNode.actionCreators.uncompleteNode({ nodes }));
    },
    onDeleteNode(nodes) {
        dispatch(projectNode.actionCreators.deleteNode({ nodes }));
    },
    onExpandNode(nodes) {
        dispatch(projectNode.actionCreators.expand({ nodes }));
    },
    onCollapseNode(nodes) {
        dispatch(projectNode.actionCreators.collapse({ nodes }));
    },
    onPrepareBeforeCopyNodes(nodes) {
        dispatch(projectNode.actionCreators.prepareBeforeCopyNodes({ nodes }));
    },
    onCopyText(nodes) {
        dispatch(projectNode.actionCreators.copyText({ nodes }));
    },
    onResizeImage(id, index, width) {
        dispatch(projectNode.actionCreators.resizeImage({ id, index, width }));
    },
    onDeleteImage(id, index) {
        dispatch(projectNode.actionCreators.deleteImage({ id, index }));
    },
    onSelectAsRoot: ((id) => {
        dispatch(projectNode.actionCreators.selectAsRoot({ id }));
    }),
    onShowImageUploadModal(nodeId, type) {
        dispatch(projectNode.actionCreators.toggleImageUploadModal({ nodeId, type }));
    },
    updateSelectedNodeIds() {
        dispatch(projectNode.actionCreators.updateLastAllSelectedNodeIds());
    },
    cancelSelectedNodeIds() {
        dispatch(projectNode.actionCreators.cancelLastAllSelectedNodeIds());
    }
});
export const ProjectNode = connect(mapStateToProps, mapDispatchToProps)(Component);
