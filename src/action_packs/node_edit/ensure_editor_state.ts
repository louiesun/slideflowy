import { selectors as projectNodeSelectors, ensureEditStatus, } from '../project_node';
import { createEditorState } from '../../services/ProseMirrorService';
export function ensureEditorState(nodeId, state) {
    const node = projectNodeSelectors.getNode(state, { nodeId });
    const editStatus = ensureEditStatus(nodeId, state);
    const editorState = editStatus.editorState ||
        createEditorState(editStatus.editingContent == null
            ? node.content
            : editStatus.editingContent);
    return (editStatus.editorState = editorState);
}
