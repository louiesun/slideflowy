import { createStandardAction } from 'typesafe-actions';
import { TextSelection } from 'prosemirror-state';
import * as projectNode from '../project_node';
import { createEditorState, getContentFromState, applyMark as _applyMark, cleanMark as _cleanMark, replaceTextWithMark as _replaceTextWithMark, moveCursor, findPos, } from '../../services/ProseMirrorService';
import { wrapStateMutator } from '../file_history';
import { applyTransaction } from './apply_transaction';
import { combineEpics } from 'redux-observable';
import { of as of$ } from 'rxjs';
import { map as map$, mergeMap as mergeMap$, distinctUntilChanged as distinctUntilChanged$, } from 'rxjs/operators';
import produce from 'immer';
import { castDraft } from 'immer';
import { compose, toPairs } from 'ramda';
import { ensureEditorState } from './ensure_editor_state';
import { getNode } from '../project_node/selectors';
import { ensureEditStatus } from './ensure_edit_status';
export var ActionTypes;
(function (ActionTypes) {
    // 开始编辑
    ActionTypes["start"] = "node_edit:start";
    // 结束编辑
    ActionTypes["end"] = "node_edit:end";
    // 取消编辑
    ActionTypes["cancel"] = "node_edit:cancel";
    // 添加指定 Mark
    ActionTypes["applyMark"] = "node_edit:applyMark";
    // 清理指定 Mark
    ActionTypes["cleanMark"] = "node_edit:cleanMark";
    // 替换文字，并添加指定 Mark
    ActionTypes["replaceTextWithMark"] = "node_edit:replaceTextWithMark";
    // 重置所有样式
    ActionTypes["removeStyle"] = "node_edit:removeStyle";
    // 通用的应用 Transaction
    ActionTypes["applyTransaction"] = "node_edit:applyTransaction";
    // 自动更新 EditorState ，只在 autoInitEditorStateEpic 里面用，其他 **任何**
    // 地方都不要用
    ActionTypes["updateEditorStates"] = "node_edit:updateEditorStates";
    // 窗口重新获取焦点后，恢复之前的光标位置
    ActionTypes["restoreEditorAnchor"] = "node_edit:restoreEditorAnchor";
    // 窗口重新获取焦点后，恢复焦点到之前的图片
    ActionTypes["restoreImgFocus"] = "node_edit:restoreImgFocus";
    // 从结尾开始编辑
    ActionTypes["editAtTheEnd"] = "node_edit:editAtTheEnd";
})(ActionTypes || (ActionTypes = {}));
export const actionCreators = {
    start: createStandardAction(ActionTypes.start)(),
    end: createStandardAction(ActionTypes.end)(),
    cancel: createStandardAction(ActionTypes.cancel)(),
    applyMark: createStandardAction(ActionTypes.applyMark)(),
    cleanMark: createStandardAction(ActionTypes.cleanMark)(),
    replaceTextWithMark: createStandardAction(ActionTypes.replaceTextWithMark)(),
    removeStyle: createStandardAction(ActionTypes.removeStyle)(),
    applyTransaction: createStandardAction(ActionTypes.applyTransaction)(),
    updateEditorStates: createStandardAction(ActionTypes.updateEditorStates)(),
    restoreEditorAnchor: createStandardAction(ActionTypes.restoreEditorAnchor)(),
    restoreImgFocus: createStandardAction(ActionTypes.restoreImgFocus)(),
    editAtTheEnd: createStandardAction(ActionTypes.editAtTheEnd)(),
};
const undoableActionTypes = [
    (action, newS, oldS) => {
        if (action.type === ActionTypes.end) {
            return projectNode.isNodesChanged(newS, oldS);
        }
        return false;
    },
];
export var selectors;
(function (selectors) {
    selectors.getEditorState = (id, state) => state.nodeEditStatus &&
        state.nodeEditStatus[id] &&
        state.nodeEditStatus[id].editorState;
})(selectors || (selectors = {}));
export const reducer = wrapStateMutator(undoableActionTypes, (state, action) => {
    switch (action.type) {
        case ActionTypes.start:
            startEditNode(action.payload.id, state);
            break;
        case ActionTypes.end:
            endEditNode(action.payload.id, state);
            break;
        case ActionTypes.cancel:
            cancelEditNode(action.payload.id, state);
            break;
        case ActionTypes.applyMark:
            applyMark(action.payload.id, action.payload.mark, action.payload.attrs, state);
            break;
        case ActionTypes.cleanMark:
            cleanMark(action.payload.id, action.payload.mark, state);
            break;
        case ActionTypes.replaceTextWithMark:
            replaceTextWithMark(action.payload.id, action.payload.text, action.payload.mark, action.payload.attrs, state);
            break;
        case ActionTypes.removeStyle: {
            removeStyle(action.payload.id, state);
            break;
        }
        case ActionTypes.applyTransaction:
            applyTransaction(action.payload.id, action.payload.transaction, state, action.payload.view);
            break;
        case ActionTypes.updateEditorStates:
            setNodeEditStatus(action.payload, state);
            break;
        case ActionTypes.restoreEditorAnchor:
            restoreEditorAnchor(action.payload.id, action.payload.anchor, state);
            break;
        case ActionTypes.restoreImgFocus:
            restoreImgFocus(action.payload.id, action.payload.imgUrl, state);
            break;
        case ActionTypes.editAtTheEnd:
            editAtTheEnd(action.payload.id, state);
    }
});
function setNodeEditStatus(editStatus, state) {
    state.nodeEditStatus = editStatus;
}
function removeStyle(id, state) {
    const editorState = selectors.getEditorState(id, state);
    if (!editorState)
        return;
    const tr = editorState.tr.removeMark(editorState.selection.from, editorState.selection.to);
    applyTransaction(id, tr, state);
}
function applyMark(id, mark, attrs, state) {
    const { editorState } = ensureEditStatus(id, state);
    if (!editorState)
        return;
    const tr = _applyMark(mark, attrs)(editorState);
    if (tr) {
        applyTransaction(id, tr, state);
    }
}
function cleanMark(id, mark, state) {
    const { editorState } = ensureEditStatus(id, state);
    if (!editorState)
        return;
    const tr = _cleanMark(mark)(editorState);
    if (tr) {
        applyTransaction(id, tr, state);
    }
}
function replaceTextWithMark(id, text, mark, attrs, state) {
    const editStatus = ensureEditStatus(id, state);
    if (!editStatus.editorState)
        return;
    editStatus.editorState = _replaceTextWithMark(text, mark, attrs)(editStatus.editorState);
}
function restoreEditorAnchor(id, anchor, state) {
    startEditNode(id, state);
    ensureEditStatus(id, state).editorState = moveCursor(anchor, ensureEditorState(id, state));
}
function restoreImgFocus(nodeId, imgUrl, state) {
    const node = getNode(state, { nodeId });
    node.focusedImgUrl = imgUrl;
}
function editAtTheEnd(id, state) {
    startEditNode(id, state);
    ensureEditStatus(id, state).editorState = moveCursor('end', ensureEditorState(id, state));
}
export function startEditNode(id, _options, _state) {
    let options;
    let state;
    if (arguments.length === 2) {
        options = {};
        state = _options;
    }
    else {
        options = _options;
        state = _state;
    }
    const node = projectNode.selectors.getNode(state, { nodeId: id });
    if (!node)
        return;
    const editStatus = ensureEditStatus(id, state);
    if (editStatus.focusedAt)
        return;
    if (!options.keepOtherEditing && state.nodeEditStatus) {
        toPairs(state.nodeEditStatus)
            .filter(p => p[1].focusedAt)
            .forEach(p => endEditNode(p[0], state));
    }
    let editorState = editStatus.editorState || createEditorState(node.content);
    if (options.resetCursor) {
        const firstTextNodePos = findPos(node => node.isInline, editorState.doc);
        editorState = editorState.apply(editorState.tr.setSelection(TextSelection.create(editorState.doc, firstTextNodePos)));
    }
    if (state.focusingNodeIds === undefined) {
        state.focusingNodeIds = [];
    }
    state.focusingNodeIds.push(id);
    editStatus.focusedAt = Date.now();
    editStatus.editorState = editorState;
    editStatus.editingContent = getContentFromState(editorState);
}
export function endEditNode(id, state) {
    const editStatus = ensureEditStatus(id, state);
    const node = projectNode.selectors.getNode(state, { nodeId: id });
    state.focusingNodeIds = undefined;
    delete editStatus.focusedAt;
    if (node && editStatus.editorState) {
        editStatus.editorState = editorStateCleanUp(editStatus.editorState);
        node.content = getContentFromState(editStatus.editorState);
        editStatus.editingContent = node.content;
    }
    function editorStateCleanUp(s) {
        const content = getContentFromState(s);
        const newState = createEditorState(content);
        return compose((s) => moveCursor(s.selection.to, s))(newState);
    }
}
export function cancelEditNode(id, state) {
    const editStatus = ensureEditStatus(id, state);
    const node = projectNode.selectors.getNode(state, { nodeId: id });
    state.focusingNodeIds = undefined;
    delete editStatus.focusedAt;
    if (node) {
        editStatus.editorState = createEditorState(node.content);
        editStatus.editingContent = node.content;
    }
}
const autoInitEditorStateEpic = (action$, state$) => action$.pipe(map$(() => state$.value.nodes), distinctUntilChanged$(), map$(nodes => {
    const originalEditStatus = state$.value.nodeEditStatus || {};
    const _editStatus = Object.assign({}, originalEditStatus);
    const _nodes = Object.assign({}, nodes);
    return produce(originalEditStatus, editStatus => {
        // 补充新增加的 node 的 editStatus
        Object.keys(originalEditStatus).forEach(id => delete _nodes[id]);
        Object.keys(_nodes).forEach(id => {
            editStatus[id] = castDraft({
                editorState: createEditorState(_nodes[id].content),
            });
        });
        // 移除多出来的 editStatus
        Object.keys(nodes || {}).forEach(id => delete _editStatus[id]);
        Object.keys(_editStatus).forEach(id => {
            delete editStatus[id];
        });
    });
}), distinctUntilChanged$(), mergeMap$(editStatus => of$(actionCreators.updateEditorStates(editStatus))));
export const epic = combineEpics(autoInitEditorStateEpic);
