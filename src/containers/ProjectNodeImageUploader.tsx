import { connect } from 'react-redux';
import { projectNode } from '../action_packs';
import { ProjectNodeImageUploader as Component } from '../components/ProjectNodeImageUploader';
const mapStateToProps = (state, props) => {
    const node = projectNode.selectors.getNodeWithShallowChildren(state, props);
    const editingNodeId = projectNode.selectors.getEditingNodeId(state);
    return {
        node,
        isEditing: node.id === editingNodeId,
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
