import { ensureEditStatus } from '../project_node';
export function applyTransaction(id, tr, state) {
    const editStatus = ensureEditStatus(id, state);
    if (!editStatus.editorState)
        return;
    editStatus.editorState = editStatus.editorState.apply(tr);
    editStatus.editingContent = editStatus.editorState.doc.textContent;
}
