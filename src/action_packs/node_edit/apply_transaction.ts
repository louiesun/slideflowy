import { ensureEditStatus } from './ensure_edit_status';
import { getContentFromState } from '../../services/ProseMirrorService';
export function applyTransaction(id, tr, state, 
// @ts-ignore
view) {
    const editStatus = ensureEditStatus(id, state);
    if (!editStatus.editorState)
        return;
    editStatus.editorState = editStatus.editorState.apply(tr);
    editStatus.editingContent = getContentFromState(editStatus.editorState);
    if (view) {
        view.updateState(editStatus.editorState);
    }
}
