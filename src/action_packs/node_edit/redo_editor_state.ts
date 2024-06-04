import { redo, redoDepth } from 'prosemirror-history';
import { ensureEditorState } from './ensure_editor_state';
import * as projectNodeSelectors from '../project_node/selectors';
import { applyTransaction } from './apply_transaction';
export function redoEditorStateAvailable(id, state) {
    const status = projectNodeSelectors.getEditStatus(id, state);
    if (!status || !status.editorState)
        return false;
    if (!redoDepth(status.editorState))
        return false;
    return true;
}
/**
 * 尝试重做指定 projectNode 的编辑历史
 *
 * * 如果成功重做，返回 `true`
 * * 如果没有历史可以重做，返回 `false`
 */
export function redoEditorState(id, state) {
    if (!redoEditorStateAvailable(id, state))
        return false;
    const editorState = ensureEditorState(id, state);
    return redo(editorState, tr => {
        applyTransaction(id, tr, state);
    });
}
