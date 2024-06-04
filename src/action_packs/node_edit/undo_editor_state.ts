import { undo, undoDepth } from 'prosemirror-history';
import { ensureEditorState } from './ensure_editor_state';
import * as projectNodeSelectors from '../project_node/selectors';
import { applyTransaction } from './apply_transaction';
export function undoEditorStateAvailable(id, state) {
    const status = projectNodeSelectors.getEditStatus(id, state);
    if (!status || !status.editorState)
        return false;
    if (!undoDepth(status.editorState))
        return false;
    return true;
}
/**
 * 尝试撤销指定 projectNode 的编辑历史
 *
 * * 如果成功撤销，返回 `true`
 * * 如果没有历史可以撤销，返回 `false`
 */
export function undoEditorState(id, state) {
    if (!undoEditorStateAvailable(id, state))
        return false;
    const editorState = ensureEditorState(id, state);
    return undo(editorState, tr => {
        applyTransaction(id, tr, state);
    });
}
