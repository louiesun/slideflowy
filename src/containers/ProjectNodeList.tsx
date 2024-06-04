import { connect } from 'react-redux';
import { ProjectNodeList as Component, } from '../components/ProjectNodeList';
import { projectNode, file, app } from '../action_packs';
export const mapStateToProps = (state, props) => ({
    slideId: state.slideTabWindow === undefined ? null : state.slideTabWindow,
    nodes: state.nodes,
    parentNodeId: props.parentNodeId,
    editable: !file.selectors.previewingFile(state),
    dragging: Object.keys(projectNode.selectors.getDraggingNodeIds(state)).length > 0,
    selectionRange: projectNode.selectors.selectionRange(state),
    noneNestedNodeList: projectNode.selectors.getNoneNestedNodeList(state),
    selectedNodes: projectNode.selectors.getAllSelectedNodes(state),
    editingNodeId: projectNode.selectors.getEditingNodeId(state),
    draggingCoveredNodeIds: state.projectNodeDraggingNodeIds,
    lastSelectedNodeIds: state.lastAllSelectedNodeIds
});
export const mapDispatchToProps = (dispatch) => ({
    onSlideChange(slideChange) {
        dispatch(app.actionCreators.onSlideChange(slideChange));
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
    onSelected(range, nodes) {
        dispatch(projectNode.actionCreators.selectNodes({ range, nodes }));
    },
    onDragStart(nodeId) {
        dispatch(projectNode.actionCreators.dragStart({ nodeId }));
    },
    onDragEnd() {
        dispatch(projectNode.actionCreators.dragEnd());
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
    updateSelectedNodeIds() {
        dispatch(projectNode.actionCreators.updateLastAllSelectedNodeIds());
    },
    cancelSelectedNodeIds() {
        dispatch(projectNode.actionCreators.cancelLastAllSelectedNodeIds());
    }
});
export const ProjectNodeList = connect(mapStateToProps, mapDispatchToProps)(Component);
