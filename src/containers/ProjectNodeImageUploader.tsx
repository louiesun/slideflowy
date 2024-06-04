import { connect } from 'react-redux';
import { projectNode } from '../action_packs';
import { ProjectNodeImageUploader as Component } from '../components/ProjectNodeImageUploader';
const mapStateToProps = (state, props) => {
    const node = projectNode.selectors.getNode(state, props);
    const isEditing = projectNode.selectors.isNodeEditing(state, props);
    return {
        node,
        isEditing,
        modalType: state.imageUploadModalStatus?.nodeId === props.nodeId
            ? state.imageUploadModalStatus.modalType
            : undefined,
    };
};
const mapDispatchToProps = (dispatch) => ({
    onInsertImage(id, imageInfo) {
        dispatch(projectNode.actionCreators.insertImage({ id, imageInfo }));
    },
    onHideImageUploadModal(node) {
        dispatch(projectNode.actionCreators.toggleImageUploadModal({ nodeId: node.id }));
    },
});
export const ProjectNodeImageUploader = connect(mapStateToProps, mapDispatchToProps)(Component);
