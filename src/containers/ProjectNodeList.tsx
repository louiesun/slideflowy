import { connect } from 'react-redux';
import { ProjectNodeList as Component, } from '../components/ProjectNodeList';
import { projectNode, file, nodeEdit } from '../action_packs';
export const mapStateToProps = (state, props) => ({
    parentNodeId: props.parentNodeId,
    editable: !file.selectors.previewingFile(state),
    dragging: projectNode.selectors.getDraggingNodeIds(state).length > 0,
    selectionRange: projectNode.selectors.selectionRange(state),
    nodes: projectNode.selectors.getNoneNestedNodeList(state),
    selectedNodes: projectNode.selectors.getAllSelectedNodes(state),
    editingNodeId: projectNode.selectors.getEditingNodeId(state),
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
    onSelected(range, nodes) {
        dispatch(projectNode.actionCreators.selectNodes({ range, nodes }));
    },
    onDragStart(nodeId) {
        dispatch(projectNode.actionCreators.dragStart({ nodeIds: [nodeId] }));
    },
    onDragEnd(nodeId) {
        dispatch(projectNode.actionCreators.dragEnd({ nodeIds: [nodeId] }));
    },
    onReordered(sourceNodeId, targetNodeId, intend) {
        dispatch(projectNode.actionCreators.reorder({
            sourceNodeId,
            targetNodeId,
            intend,
        }));
    },
    onMoveToEnd(nodeId) {
        dispatch(projectNode.actionCreators.moveToEnd({
            nodeId,
        }));
    },
    onWindowFocus(id, anchor) {
        dispatch(nodeEdit.actionCreators.restoreEditorAnchor({
            id,
            anchor,
        }));
    },
});
export const ProjectNodeList = connect(mapStateToProps, mapDispatchToProps)(Component);
