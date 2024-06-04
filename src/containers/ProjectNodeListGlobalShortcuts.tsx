import { connect } from 'react-redux';
import { ProjectNodeListGlobalShortcuts as Component } from '../components/ProjectNodeListGlobalShortcuts';
import { projectNode, file, fileHistory } from '../action_packs';
export const mapStateToProps = (state) => ({
    editable: !file.selectors.previewingFile(state),
    selectedNodes: projectNode.selectors.getAllSelectedNodes(state),
    selectedCopyNodes: projectNode.selectors.getAllSelectedCopyNodes(state),
});
export const mapDispatchToProps = (dispatch) => ({
    onUndo() {
        dispatch(fileHistory.actionCreators.undo());
    },
    onRedo() {
        dispatch(fileHistory.actionCreators.redo());
    },
    onSaveFile() {
        dispatch(file.actionCreators.saveFile(undefined));
    },
    onDeleteNode(nodes) {
        dispatch(projectNode.actionCreators.deleteNode({ nodes }));
    },
    onCopyText(nodes) {
        dispatch(projectNode.actionCreators.copyText({ nodes }));
    },
    onPrepareBeforeCopyNodes(nodes) {
        dispatch(projectNode.actionCreators.prepareBeforeCopyNodes({ nodes }));
    },
    onCopySelectedNodes(event) {
        dispatch(projectNode.actionCreators.copySelectedNodes(event));
    },
    onCutSelectedNodes(event) {
        dispatch(projectNode.actionCreators.cutSelectedNodes(event));
    },
    onExpandAll() {
        dispatch(projectNode.actionCreators.expandAll());
    },
    onCollapseAll() {
        dispatch(projectNode.actionCreators.collapseAll());
    },
});
export const ProjectNodeListGlobalShortcuts = connect(mapStateToProps, mapDispatchToProps)(Component);
