import { connect } from 'react-redux';
import { ProjectNode as Component, } from '../components/ProjectNode';
import { projectNode, file } from '../action_packs';
export const mapStateToProps = (state, props) => ({
    editable: !file.selectors.previewingFile(state),
    node: projectNode.selectors.getNodeWithShallowChildren(state, props), // TODO: 比起 ! ，有没有更好的办法
});
export const mapDispatchToProps = (dispatch) => ({
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
    onCopyNode(nodes) {
        dispatch(projectNode.actionCreators.copyNodes({ nodes }));
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
});
export const ProjectNode = connect(mapStateToProps, mapDispatchToProps)(Component);
