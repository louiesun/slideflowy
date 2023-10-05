import { createStandardAction, isOfType } from 'typesafe-actions';
import { zipObj, last, reduce, reduced, values } from 'ramda';
import clipboardCopy from 'clipboard-copy';
import * as ProjectNodeService from '../../services/ProjectNodeService';
import { combineEpics } from 'redux-observable';
import { projectNodesToRawText, projectNodesToRichText, filterChildrenNodeShallow, removeChildId, getParentMap, getNodeDepth, } from '../../services/ProjectNodeService';
import { uuid } from '../../utils/uuid';
import { $t } from '../../i18n';
import { wrapStateMutator } from '../file_history';
import { startEditNode, endEditNode } from '../node_edit';
import { empty as empty$, of as of$ } from 'rxjs';
import { tap as tap$, filter as filter$, mergeMap as mergeMap$, } from 'rxjs/operators';
import { Notification } from '../../utils/Notification';
import { moveCursor, createEditorState, createEditorStateWithDoc, } from '../../services/ProseMirrorService';
import { prepend, append, emptyAry } from '../../utils/F';
import * as innerSelectors from './selectors';
import { selectNodes } from './reducers/selectNodes';
import { ensureEditorState } from '../node_edit/ensure_editor_state';
import { isEqual, omit } from 'lodash';
export var ActionTypes;
(function (ActionTypes) {
    ActionTypes["expand"] = "project_node:expand";
    ActionTypes["expandAll"] = "project_node:expandAll";
    ActionTypes["collapse"] = "project_node:collapse";
    ActionTypes["collapseAll"] = "project_node:collapseAll";
    ActionTypes["dragStart"] = "project_node:dragStart";
    ActionTypes["dragEnd"] = "project_node:dragEnd";
    ActionTypes["reorder"] = "project_node:reorder";
    ActionTypes["moveToEnd"] = "project_node:moveToEnd";
    ActionTypes["addNode"] = "project_node:addNode";
    ActionTypes["indentNode"] = "project_node:indentNode";
    ActionTypes["unindentNode"] = "project_node:unindentNode";
    ActionTypes["completeNode"] = "project_node:completeNode";
    ActionTypes["uncompleteNode"] = "project_node:uncompleteNode";
    ActionTypes["deleteNode"] = "project_node:deleteNode";
    ActionTypes["selectAsRoot"] = "project_node:selectAsRoot";
    ActionTypes["selectNodes"] = "project_node:selectNodes";
    ActionTypes["copySelectedNodes"] = "project_node:copySelectedNodes";
    ActionTypes["cutSelectedNodes"] = "project_node:cutSelectedNodes:start";
    ActionTypes["cutSelectedNodesEnd"] = "project_node:cutSelectedNodes:end";
    ActionTypes["pasteNodes"] = "project_node:pasteNodes";
    ActionTypes["copyNodes"] = "project_node:copyNodes";
    ActionTypes["focusSeeminglyPrevNode"] = "project_node:focusSeeminglyPrevNode";
    ActionTypes["focusSeeminglyNextNode"] = "project_node:focusSeeminglyNextNode";
    ActionTypes["prependNode"] = "project_node:prependNode";
    ActionTypes["appendNode"] = "project_node:appendNode";
    ActionTypes["concatNode"] = "project_node:concatNode";
    ActionTypes["separateNode"] = "project_node:separateNode";
    ActionTypes["insertImage"] = "project_node:insertImage";
    ActionTypes["deleteImage"] = "project_node:deleteImage";
    ActionTypes["resizeImage"] = "project_node:resizeImage";
    ActionTypes["toggleImageUploadModal"] = "project_node:toggleImageUploadModal";
})(ActionTypes || (ActionTypes = {}));
const undoableActionTypes = [
    (action, newS, oldS) => {
        if (values(ActionTypes)
            .filter(t => [
            ActionTypes.copyNodes,
            ActionTypes.copySelectedNodes,
            ActionTypes.cutSelectedNodes,
            ActionTypes.toggleImageUploadModal,
        ].indexOf(t) === -1)
            .some(t => action.type === t)) {
            return isNodesChanged(newS, oldS);
        }
        return false;
    },
];
export const actionCreators = {
    expand: createStandardAction(ActionTypes.expand)(),
    expandAll: createStandardAction(ActionTypes.expandAll)(),
    collapse: createStandardAction(ActionTypes.collapse)(),
    collapseAll: createStandardAction(ActionTypes.collapseAll)(),
    dragStart: createStandardAction(ActionTypes.dragStart)(),
    dragEnd: createStandardAction(ActionTypes.dragEnd)(),
    reorder: createStandardAction(ActionTypes.reorder)(),
    moveToEnd: createStandardAction(ActionTypes.moveToEnd)(),
    addNode: createStandardAction(ActionTypes.addNode)(),
    indentNode: createStandardAction(ActionTypes.indentNode)(),
    unindentNode: createStandardAction(ActionTypes.unindentNode)(),
    completeNode: createStandardAction(ActionTypes.completeNode)(),
    uncompleteNode: createStandardAction(ActionTypes.uncompleteNode)(),
    deleteNode: createStandardAction(ActionTypes.deleteNode)(),
    selectAsRoot: createStandardAction(ActionTypes.selectAsRoot)(),
    selectNodes: createStandardAction(ActionTypes.selectNodes)(),
    copySelectedNodes: createStandardAction(ActionTypes.copySelectedNodes)(),
    cutSelectedNodes: createStandardAction(ActionTypes.cutSelectedNodes)(),
    cutSelectedNodesEnd: createStandardAction(ActionTypes.cutSelectedNodesEnd)(),
    pasteNodes: createStandardAction(ActionTypes.pasteNodes)(),
    copyNodes: createStandardAction(ActionTypes.copyNodes)(),
    focusSeeminglyPrevNode: createStandardAction(ActionTypes.focusSeeminglyPrevNode)(),
    focusSeeminglyNextNode: createStandardAction(ActionTypes.focusSeeminglyNextNode)(),
    prependNode: createStandardAction(ActionTypes.prependNode)(),
    appendNode: createStandardAction(ActionTypes.appendNode)(),
    concatNode: createStandardAction(ActionTypes.concatNode)(),
    separateNode: createStandardAction(ActionTypes.separateNode)(),
    insertImage: createStandardAction(ActionTypes.insertImage)(),
    deleteImage: createStandardAction(ActionTypes.deleteImage)(),
    resizeImage: createStandardAction(ActionTypes.resizeImage)(),
    toggleImageUploadModal: createStandardAction(ActionTypes.toggleImageUploadModal)(),
};
export const reducer = wrapStateMutator(undoableActionTypes, (state, action) => {
    switch (action.type) {
        case ActionTypes.expand:
        case ActionTypes.collapse: {
            action.payload.nodes.forEach(n => {
                const node = selectors.getNode(state, { nodeId: n.id });
                node && (node.expanded = action.type === ActionTypes.expand);
            });
            break;
        }
        case ActionTypes.expandAll:
        case ActionTypes.collapseAll: {
            if (state.nodes) {
                Object.values(state.nodes).forEach(node => {
                    node.expanded = action.type === ActionTypes.expandAll;
                });
            }
            break;
        }
        case ActionTypes.dragStart: {
            state.projectNodeDraggingNodeIds = action.payload.nodeIds;
            break;
        }
        case ActionTypes.dragEnd: {
            state.projectNodeDraggingNodeIds = [];
            break;
        }
        case ActionTypes.reorder: {
            const info = action.payload;
            const sourceNode = selectors.getNode(state, {
                nodeId: info.sourceNodeId,
            });
            const targetNode = selectors.getNode(state, {
                nodeId: info.targetNodeId,
            });
            if (!sourceNode || !targetNode)
                break;
            const sourceNodeParentInfo = selectors.findParentNode(info.sourceNodeId, state);
            if (!sourceNodeParentInfo)
                break;
            const sourceParentNode = sourceNodeParentInfo.parentNode;
            const targetNodeParentInfo = selectors.findParentNode(info.targetNodeId, state);
            if (!targetNodeParentInfo)
                break;
            const targetNodeParent = targetNodeParentInfo.parentNode;
            if (sourceParentNode) {
                sourceParentNode.childrenIds = removeChildId(info.sourceNodeId, sourceParentNode.childrenIds);
            }
            else {
                state.rootNodeIds = removeChildId(info.sourceNodeId, state.rootNodeIds || []);
            }
            if (info.intend.relation === 'child') {
                if (info.intend.position === 'before')
                    break;
                const targetParentNode = targetNode;
                if (targetParentNode.expanded) {
                    targetParentNode.childrenIds.unshift(info.sourceNodeId);
                }
                else {
                    targetParentNode.childrenIds.push(info.sourceNodeId);
                    targetParentNode.expanded = true;
                }
            }
            else {
                const targetParentNode = targetNodeParent;
                if (targetParentNode) {
                    targetParentNode.childrenIds = ProjectNodeService.insertToChildrenIds(info.targetNodeId, info.sourceNodeId, info.intend.position, targetParentNode.childrenIds);
                }
                else {
                    state.rootNodeIds = ProjectNodeService.insertToChildrenIds(info.targetNodeId, info.sourceNodeId, info.intend.position, state.rootNodeIds || []);
                }
            }
            break;
        }
        case ActionTypes.moveToEnd:
            const nodeId = action.payload.nodeId;
            const sourceNodeParentInfo = selectors.findParentNode(nodeId, state);
            if (!sourceNodeParentInfo)
                break;
            const parentNode = sourceNodeParentInfo.parentNode;
            if (parentNode) {
                parentNode.childrenIds = removeChildId(nodeId, parentNode.childrenIds);
            }
            else {
                state.rootNodeIds = removeChildId(nodeId, state.rootNodeIds || []);
            }
            if (state.selectAsRootNodeId != null) {
                const rootNode = selectors.getNode(state, {
                    nodeId: state.selectAsRootNodeId,
                });
                rootNode.childrenIds = ProjectNodeService.insertToChildrenIds(last(rootNode.childrenIds), nodeId, 'after', rootNode.childrenIds);
            }
            else {
                state.rootNodeIds = ProjectNodeService.insertToChildrenIds(last(state.rootNodeIds || []), nodeId, 'after', state.rootNodeIds || []);
            }
            break;
        case ActionTypes.addNode:
            addNewNodeToParent(action.payload.parentId, state);
            break;
        case ActionTypes.indentNode:
            indentNode(action.payload.id, state);
            break;
        case ActionTypes.unindentNode:
            unindentNode(action.payload.id, state);
            break;
        case ActionTypes.completeNode: {
            action.payload.nodes.forEach(n => {
                const node = selectors.getNode(state, { nodeId: n.id });
                node && (node.completed = true);
            });
            break;
        }
        case ActionTypes.uncompleteNode: {
            action.payload.nodes.forEach(n => {
                const node = selectors.getNode(state, { nodeId: n.id });
                node && (node.completed = false);
            });
            break;
        }
        case ActionTypes.deleteNode: {
            if ('nodes' in action.payload) {
                action.payload.nodes.forEach(n => {
                    deleteNodeRecursively(n.id, state);
                });
                break;
            }
            const prevNode = selectors.findSeeminglyPrevNode(action.payload.id, state);
            deleteNodeRecursively(action.payload.id, state);
            if (prevNode && action.payload.moveCursor) {
                ensureEditStatus(prevNode.id, state).editorState = moveCursor('end', ensureEditorState(prevNode.id, state));
                startEditNode(prevNode.id, state);
            }
            if (state.selectAsRootNodeId === action.payload.id &&
                action.payload.moveCursor) {
                state.selectAsRootNodeId = prevNode ? prevNode.id : null;
            }
            break;
        }
        case ActionTypes.selectAsRoot: {
            if (action.payload.id == null) {
                state.selectAsRootNodeId = null;
            }
            else {
                const node = selectors.getNode(state, { nodeId: action.payload.id });
                if (!node)
                    return;
                state.selectAsRootNodeId = node.id;
            }
            break;
        }
        case ActionTypes.cutSelectedNodesEnd: {
            // 如果在 cutSelectedNodes 的时候就修改了 state 的话，可能会导致对应的
            // Epic 获取不到用户选择的节点，所以需要等复制到剪贴板后再删除节点
            const selectedNodes = selectors.getAllSelectedNodes(state);
            if (!selectedNodes.length)
                break;
            selectedNodes.forEach(node => deleteNodeRecursively(node.id, state));
            break;
        }
        case ActionTypes.pasteNodes: {
            const anchorNode = selectors.getNode(state, {
                nodeId: action.payload.anchorNodeId,
            });
            endEditNode(anchorNode.id, state);
            pasteNodes(action.payload.nodes, anchorNode, state);
            break;
        }
        case ActionTypes.focusSeeminglyPrevNode: {
            focusSeeminglyPrevNode(action.payload.id, state);
            break;
        }
        case ActionTypes.focusSeeminglyNextNode: {
            focusSeeminglyNextNode(action.payload.id, state);
            break;
        }
        case ActionTypes.prependNode: {
            const newNode = addNewSeeminglySiblingNode({
                operator: 'prepend',
                anchorNodeId: action.payload.id,
                content: '',
            }, state);
            if (newNode) {
                startEditNode(newNode.id, state);
            }
            break;
        }
        case ActionTypes.appendNode: {
            const newNode = addNewSeeminglySiblingNode({
                operator: 'append',
                anchorNodeId: action.payload.id,
                content: '',
            }, state);
            if (newNode) {
                startEditNode(newNode.id, state);
            }
            break;
        }
        case ActionTypes.concatNode:
            concatPrevNode(action.payload.id, state);
            break;
        case ActionTypes.separateNode:
            separateNode(action.payload.id, state);
            break;
        case ActionTypes.insertImage:
            insertImage(action.payload.id, action.payload.imageInfo, state);
            break;
        case ActionTypes.deleteImage:
            deleteImage(action.payload.id, action.payload.index, state);
            break;
        case ActionTypes.resizeImage:
            resizeImage(action.payload.id, action.payload.index, action.payload.width, state);
            break;
        case ActionTypes.toggleImageUploadModal:
            if (!action.payload.type) {
                delete state.imageUploadModalStatus;
            }
            else {
                state.imageUploadModalStatus = {
                    nodeId: action.payload.nodeId,
                    modalType: action.payload.type,
                };
            }
    }
    switch (action.type) {
        case ActionTypes.selectAsRoot:
            state.projectNodeSelection = null;
            state.projectNodeUserSelectedNodeIds = [];
            state.projectNodeAllSelectedNodeIds = [];
            break;
        case ActionTypes.selectNodes: {
            selectNodes(action, state);
            break;
        }
    }
    if (!state.nodesParentMap ||
        !state.prevReduceNodes ||
        state.nodes !== state.prevReduceNodes) {
        state.nodesParentMap = getParentMap(state);
        setDepthForAllNodes(state);
    }
    state.prevReduceNodes = state.nodes;
});
export const ClipboardInternalMimeType = 'application/x-nutsflowy-clipboard-data';
export const ClipboardRawTextMimeType = 'text/plain';
export const ClipboardRichTextMimeType = 'text/html';
const setDataTransfer = (dataTransfer, internalMimeTypeNodes, rawTextMimeTypeNodes, state) => {
    dataTransfer.setData(ClipboardInternalMimeType, JSON.stringify(internalMimeTypeNodes));
    dataTransfer.setData(ClipboardRichTextMimeType, projectNodesToRichText(filterChildrenNodeShallow(rawTextMimeTypeNodes), state));
    dataTransfer.setData(ClipboardRawTextMimeType, projectNodesToRawText(filterChildrenNodeShallow(rawTextMimeTypeNodes), state));
};
export const cutOrCopySelectedNodesEpic = (action$, state$) => action$.pipe(mergeMap$(action => {
    if (isOfType(ActionTypes.cutSelectedNodes, action) ||
        isOfType(ActionTypes.copySelectedNodes, action)) {
        const state = state$.value;
        const clipboardEvent = action.payload;
        if (!clipboardEvent.clipboardData)
            return empty$();
        clipboardEvent.preventDefault();
        setDataTransfer(clipboardEvent.clipboardData, selectors.getAllSelectedNodes(state), selectors.getUserSelectedNodes(state), state);
    }
    if (isOfType(ActionTypes.cutSelectedNodes, action)) {
        return of$(actionCreators.cutSelectedNodesEnd());
    }
    return empty$();
}));
export const copyNodesEpic = (action$, state$) => action$.pipe(filter$(isOfType(ActionTypes.copyNodes)), tap$(async (action) => {
    const state = state$.value;
    const rawText = projectNodesToRawText(filterChildrenNodeShallow(action.payload.nodes), state);
    try {
        await copyData(rawText, dataTransfer => {
            setDataTransfer(dataTransfer, action.payload.nodes, action.payload.nodes, state);
        });
        Notification.show({ text: $t('NUTFLOWY_COPY_SUCCEED') });
    }
    catch (err) {
        Notification.show({ text: $t('NUTFLOWY_COPY_FAILED') });
        console.error(err);
    }
}), mergeMap$(() => empty$()));
export const epic = combineEpics(cutOrCopySelectedNodesEpic, copyNodesEpic);
export var selectors;
(function (selectors) {
    selectors.getNode = innerSelectors.getNode, selectors.getEditingNode = innerSelectors.getEditingNode, selectors.getEditingNodeId = innerSelectors.getEditingNodeId;
    selectors.getNodes = ProjectNodeService.getNodes;
    selectors.getChildNodesRecursively = ProjectNodeService.getChildNodesRecursively;
    selectors.getChildNodes = (props, state) => {
        if (props.nodeId) {
            const parentNode = selectors.getNode(state, props);
            if (!parentNode || !parentNode.childrenIds.length)
                return [];
            return ProjectNodeService.getChildNodes(parentNode, state);
        }
        else if (state.rootNodeIds) {
            return ProjectNodeService.getTopNodes(state);
        }
        else {
            return [];
        }
    };
    selectors.selectedRootNodeId = (state) => state.selectAsRootNodeId || null;
    selectors.selectionRange = (state) => state.projectNodeSelection || null;
    selectors.getDraggingNodeIds = (state) => state.projectNodeDraggingNodeIds || emptyAry;
    selectors.getRootNodeIds = ProjectNodeService.getRootNodeIds;
    selectors.getAllSelectedNodes = (state) => (state.projectNodeAllSelectedNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }))
        .filter(ProjectNodeService.isExistedProjectNode);
    selectors.getUserSelectedNodes = (state) => (state.projectNodeUserSelectedNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }))
        .filter(ProjectNodeService.isExistedProjectNode);
    selectors.getNodeWithShallowChildren = (state, props) => {
        const originNode = selectors.getNode(state, props);
        if (!originNode)
            return;
        return {
            ...originNode,
            children: selectors.getChildNodes(props, state),
        };
    };
    selectors.getEditStatus = (id, state) => {
        if (!state.nodeEditStatus)
            return {};
        if (!state.nodeEditStatus[id])
            return {};
        return state.nodeEditStatus[id];
    };
    selectors.findSeeminglyPrevNode = (id, state) => {
        const parentNodeInfo = selectors.findParentNode(id, state);
        if (!parentNodeInfo)
            return;
        const prevNode = selectors.findPrevNodeInParent(parentNodeInfo.node, parentNodeInfo.parentNode, state);
        if (!prevNode) {
            if (parentNodeInfo && parentNodeInfo.parentNode) {
                return parentNodeInfo.parentNode;
            }
            else {
                return;
            }
        }
        let seeminglyPrevNode = prevNode;
        while (seeminglyPrevNode.expanded && seeminglyPrevNode.childrenIds) {
            const deeperPrevNode = selectors.getNode(state, {
                nodeId: last(seeminglyPrevNode.childrenIds),
            });
            if (deeperPrevNode) {
                seeminglyPrevNode = deeperPrevNode;
            }
            else {
                break;
            }
        }
        return seeminglyPrevNode;
    };
    selectors.findSeeminglyNextNode = (id, state) => {
        const currNode = selectors.getNode(state, { nodeId: id });
        if (!currNode)
            return;
        if (currNode.childrenIds.length && currNode.expanded) {
            return selectors.getNode(state, { nodeId: currNode.childrenIds[0] });
        }
        const parentTree = selectors.findParentTree(id, state).slice(0, -1);
        parentTree.reverse();
        parentTree.push(null);
        const { result } = reduce((reduceState, parentNode) => {
            const nextNode = selectors.findNextNodeInParent(reduceState.currNode, parentNode, state);
            reduceState.currNode = parentNode;
            if (!nextNode) {
                return reduceState;
            }
            else {
                reduceState.result = nextNode;
                return reduced(reduceState);
            }
        }, { currNode, result: undefined }, parentTree);
        return result;
    };
    selectors.findParentNode = ProjectNodeService.findParentNode;
    selectors.findParentTree = ProjectNodeService.findParentTree;
    selectors.findPrevNode = (id, state) => {
        const parentNodeInfo = selectors.findParentNode(id, state);
        if (!parentNodeInfo)
            return;
        const { node, parentNode } = parentNodeInfo;
        const prevNode = selectors.findPrevNodeInParent(node, parentNode, state);
        if (!prevNode)
            return;
        return { ...parentNodeInfo, prevNode };
    };
    selectors.findPrevNodeInParent = (node, parentNode, state) => {
        const ids = parentNode ? parentNode.childrenIds : state.rootNodeIds;
        const nodeIdx = ids.indexOf(node.id);
        if (nodeIdx < 1)
            return;
        const prevNodeId = ids[nodeIdx - 1];
        return selectors.getNode(state, { nodeId: prevNodeId });
    };
    selectors.findNextNode = (id, state) => {
        const parentNodeInfo = selectors.findParentNode(id, state);
        if (!parentNodeInfo)
            return;
        const { node, parentNode } = parentNodeInfo;
        const nextNode = selectors.findNextNodeInParent(node, parentNode, state);
        if (!nextNode)
            return;
        return { ...parentNodeInfo, nextNode };
    };
    selectors.findNextNodeInParent = (node, parentNode, state) => {
        const ids = parentNode ? parentNode.childrenIds : state.rootNodeIds;
        const nodeIdx = ids.indexOf(node.id);
        if (nodeIdx === -1)
            return;
        const nextNodeId = ids[nodeIdx + 1];
        return selectors.getNode(state, { nodeId: nextNodeId });
    };
    selectors.getParentMap = (state) => state.nodesParentMap || {};
    selectors.getNoneNestedNodeList = ProjectNodeService.getNoneNestedNodeList;
})(selectors || (selectors = {}));
async function copyData(text, operateDataTransfer) {
    debugger;
    if (navigator.permissions &&
        typeof navigator.permissions.query === 'function' &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function') {
        const status = await navigator.permissions.query({
            name: 'clipboard-write',
        });
        if (status.state === 'denied')
            throw new Error('denied');
        const dataTransfer = new DataTransfer();
        operateDataTransfer(dataTransfer);
        try {
            await navigator.clipboard.write(dataTransfer);
        }
        catch {
            try {
                await navigator.clipboard.writeText(text);
            }
            catch {
                await clipboardCopy(text);
            }
        }
    }
    else {
        await clipboardCopy(text);
    }
}
export const ensureEditStatus = (id, state) => {
    state.nodeEditStatus = state.nodeEditStatus || {};
    state.nodeEditStatus[id] = state.nodeEditStatus[id] || {};
    return selectors.getEditStatus(id, state);
};
function pasteNodes(nodes, siblingNode, state) {
    const parentNodeInfo = selectors.findParentNode(siblingNode.id, state);
    if (!parentNodeInfo)
        return;
    if (!nodes.length)
        return;
    const { parentNode } = parentNodeInfo;
    // 过滤掉父节点已经在选区列表的节点
    const nodesNeedBeClone = nodes.filter(node => {
        return nodes.every(_node => _node.childrenIds.indexOf(node.id) === -1);
    });
    // 考虑到剪切的时候节点已经从 State 移除了，所以需要先把节点放回 state 里
    const { newNodes, affectedNewNodes } = cloneNodes(nodesNeedBeClone, {
        ...state,
        nodes: {
            ...state.nodes,
            ...zipObj(nodes.map(n => n.id), nodes),
        },
    });
    affectedNewNodes.forEach(node => {
        state.nodes = state.nodes || {};
        state.nodes[node.id] = node;
    });
    const newNodeIds = newNodes.map(node => node.id);
    if (!parentNode) {
        const rootNodeIds = selectors.getRootNodeIds(state);
        const siblingNodeIdx = rootNodeIds.findIndex(id => siblingNode.id === id);
        if (siblingNodeIdx < 0)
            return;
        rootNodeIds.splice(siblingNodeIdx + 1, 0, ...newNodeIds);
        state.rootNodeIds = rootNodeIds;
    }
    else {
        const siblingNodeIdx = parentNode.childrenIds.findIndex(id => siblingNode.id === id);
        if (siblingNodeIdx < 0)
            return;
        parentNode.childrenIds.splice(siblingNodeIdx + 1, 0, ...newNodeIds);
    }
}
function addNewNodeToParent(parentId, state) {
    const newNode = ProjectNodeService.createNode();
    if (parentId) {
        const parentNode = selectors.getNode(state, { nodeId: parentId });
        if (!parentNode)
            return;
        parentNode.childrenIds.push(newNode.id);
    }
    else {
        state.rootNodeIds.push(newNode.id);
    }
    state.nodes[newNode.id] = newNode;
    startEditNode(newNode.id, state);
}
export function deleteNode(id, state) {
    const node = selectors.getNode(state, { nodeId: id });
    if (!node)
        return;
    if (state.nodeEditStatus && state.nodeEditStatus[id]) {
        delete state.nodeEditStatus[id];
    }
    const parentNodeInfo = selectors.findParentNode(id, state);
    if (!parentNodeInfo)
        return;
    const { parentNode } = parentNodeInfo;
    if (!parentNode) {
        state.rootNodeIds = state.rootNodeIds.filter(id => id !== node.id);
    }
    else {
        parentNode.childrenIds = parentNode.childrenIds.filter(id => id !== node.id);
    }
    delete state.nodes[node.id];
}
export function deleteNodeRecursively(id, state) {
    const node = selectors.getNode(state, { nodeId: id });
    if (!node)
        return;
    if (node.childrenIds) {
        node.childrenIds.forEach(id => deleteNodeRecursively(id, state));
    }
    deleteNode(id, state);
}
function indentNode(id, state) {
    const prevNodeInfo = selectors.findPrevNode(id, state);
    if (!prevNodeInfo)
        return;
    const { node, prevNode, parentNode } = prevNodeInfo;
    prevNode.childrenIds.push(node.id);
    prevNode.expanded = true;
    if (parentNode) {
        parentNode.childrenIds = parentNode.childrenIds.filter(id => id !== node.id);
    }
    else {
        state.rootNodeIds = state.rootNodeIds.filter(id => id !== node.id);
    }
}
function unindentNode(id, state) {
    const parentNodeInfo = selectors.findParentNode(id, state);
    if (!parentNodeInfo)
        return;
    const { node, parentNode } = parentNodeInfo;
    if (!parentNode)
        return;
    const superParentNodeInfo = selectors.findParentNode(parentNode.id, state);
    if (!superParentNodeInfo)
        return;
    parentNode.childrenIds = parentNode.childrenIds.filter(id => id !== node.id);
    if (superParentNodeInfo.parentNode) {
        superParentNodeInfo.parentNode.childrenIds = ProjectNodeService.insertToChildrenIds(parentNode.id, node.id, 'after', superParentNodeInfo.parentNode.childrenIds);
    }
    else {
        state.rootNodeIds = ProjectNodeService.insertToChildrenIds(parentNode.id, node.id, 'after', state.rootNodeIds || []);
    }
}
function cloneNodes(nodes, state) {
    return nodes.reduce((res, n) => {
        const { newNode, affectedNewNodes } = cloneNode(n, state);
        // 要保证粘贴后的顺序
        res.newNodes = res.newNodes.concat(newNode);
        res.affectedNewNodes = res.affectedNewNodes.concat(affectedNewNodes);
        return res;
    }, {
        affectedNewNodes: [],
        newNodes: [],
    });
}
function cloneNode(node, state) {
    let affectedNewNodes = [];
    let newChildren = [];
    if (node.childrenIds) {
        const res = node.childrenIds.reduce((res, nodeId) => {
            const node = selectors.getNode(state, { nodeId });
            if (!node)
                return res;
            const { newNode, affectedNewNodes } = cloneNode(node, state);
            res.affectedNewNodes = res.affectedNewNodes.concat(affectedNewNodes);
            res.children = res.children.concat(newNode);
            return res;
        }, {
            affectedNewNodes: [],
            children: [],
        });
        affectedNewNodes = res.affectedNewNodes;
        newChildren = res.children;
    }
    else {
        affectedNewNodes = [];
        newChildren = [];
    }
    const newNode = {
        ...node,
        id: uuid({ base64: true }),
        childrenIds: newChildren.map(node => node.id),
    };
    return {
        newNode,
        affectedNewNodes: [newNode].concat(affectedNewNodes),
    };
}
function focusSeeminglyPrevNode(nodeId, state) {
    const prevNode = selectors.findSeeminglyPrevNode(nodeId, state);
    if (!prevNode)
        return;
    startEditNode(prevNode.id, { resetCursor: true }, state);
}
function focusSeeminglyNextNode(nodeId, state) {
    const nextNode = selectors.findSeeminglyNextNode(nodeId, state);
    if (!nextNode)
        return;
    startEditNode(nextNode.id, { resetCursor: true }, state);
}
/**
 * 给指定节点作为基准，添加**视觉上**前一个/后一个节点
 *
 * @return 默认返回新建的节点，如果找不到可以添加的位置，就什么都不会返回
 */
function addNewSeeminglySiblingNode(info, state) {
    const parentNodeInfo = selectors.findParentNode(info.anchorNodeId, state);
    if (!parentNodeInfo)
        return;
    const { node, parentNode } = parentNodeInfo;
    const newNode = ProjectNodeService.createNode({
        content: info.content,
    });
    if (info.operator === 'append' && node.expanded && node.childrenIds.length) {
        node.childrenIds = [newNode.id].concat(node.childrenIds);
    }
    else {
        const operatorFn = info.operator === 'prepend' ? prepend : append;
        if (!parentNode) {
            state.rootNodeIds = operatorFn(id => id === node.id, newNode.id, state.rootNodeIds);
        }
        else {
            parentNode.childrenIds = operatorFn(id => id === node.id, newNode.id, parentNode.childrenIds);
        }
    }
    state.nodes[newNode.id] = newNode;
    return newNode;
}
function concatPrevNode(nodeId, state) {
    const prevNodeInfo = selectors.findPrevNode(nodeId, state);
    if (!prevNodeInfo || prevNodeInfo.prevNode.childrenIds.length)
        return;
    const currNode = selectors.getNode(state, { nodeId });
    if (!currNode)
        return;
    const headNodeEditStatus = ensureEditStatus(prevNodeInfo.prevNode.id, state);
    const { editorState: headNodeEdiorState } = headNodeEditStatus;
    if (!headNodeEdiorState)
        return;
    const tailNodeEditStatus = ensureEditStatus(nodeId, state);
    const { editorState: tailNodeEdiorState } = tailNodeEditStatus;
    if (!tailNodeEdiorState)
        return;
    /**
     * 先把内容合并，从
     *
     * ```
     * (a) * <p>123</p>
     * (b) * <p>456</p>
     * ```
     *
     * 合并为
     *
     * ```
     * (a) * <p>123</p><p>456</p>
     * ```
     */
    let newHeadEditorState = headNodeEdiorState.apply(headNodeEdiorState.tr.insert(headNodeEdiorState.doc.content.size, tailNodeEdiorState.doc));
    /* 然后把 (a) 中间的 `</p><p>` 合并 */
    newHeadEditorState = newHeadEditorState.apply(newHeadEditorState.tr.join(headNodeEdiorState.doc.content.size));
    /* 最后把光标移动到 (a) 的末尾 -1 （因为 `</p>` 被合并了） */
    newHeadEditorState = moveCursor(headNodeEdiorState.doc.content.size - 1, newHeadEditorState);
    deleteNode(nodeId, state);
    headNodeEditStatus.editorState = newHeadEditorState;
    prevNodeInfo.prevNode.childrenIds = currNode.childrenIds;
    startEditNode(prevNodeInfo.prevNode.id, state);
}
function separateNode(nodeId, state) {
    const editStatus = ensureEditStatus(nodeId, state);
    if (!editStatus)
        return;
    const { editorState } = editStatus;
    if (!editorState)
        return;
    const { size } = editorState.doc.content;
    const headState = editorState.apply(editorState.tr.delete(editorState.selection.to, size));
    let tailState = createEditorState();
    tailState = tailState.apply(tailState.tr.replace(0, tailState.doc.content.size, editorState.doc.slice(editorState.selection.to, size)));
    tailState = moveCursor('start', tailState);
    const newNode = addNewSeeminglySiblingNode({
        operator: 'append',
        anchorNodeId: nodeId,
        content: tailState.doc.textContent,
    }, state);
    if (newNode) {
        const resetEditingHistory = (state) => createEditorStateWithDoc(state.doc);
        editStatus.editorState = headState;
        ensureEditStatus(newNode.id, state).editorState = resetEditingHistory(tailState);
        startEditNode(newNode.id, state);
    }
}
function insertImage(nodeId, imageInfo, state) {
    const node = selectors.getNode(state, { nodeId });
    if (node.images) {
        node.images.push(imageInfo);
    }
    else {
        node.images = [imageInfo];
    }
}
function deleteImage(nodeId, index, state) {
    const node = selectors.getNode(state, { nodeId });
    if (node.images) {
        node.images = [
            ...node.images.slice(0, index),
            ...node.images.slice(index + 1),
        ];
    }
}
function resizeImage(nodeId, index, width, state) {
    const node = selectors.getNode(state, { nodeId });
    if (node.images && node.images[index] && width) {
        node.images[index].width = width;
    }
}
function setDepthForAllNodes(state) {
    if (state.nodes) {
        const values = Object.values(state.nodes);
        values.forEach(value => {
            state.nodes[value.id].depth = getNodeDepth(value, state);
        });
    }
}
export const isNodesChanged = (newState, oldState) => {
    if (!isEqual(newState.rootNodeIds, oldState.rootNodeIds)) {
        return true;
    }
    else if (isEqual(Object.keys(newState.nodes || {}), Object.keys(oldState.nodes || {})) &&
        newState.nodes &&
        oldState.nodes) {
        const sameExceptDepth = Object.keys(newState.nodes).every(key => {
            return isEqual(omit(newState.nodes[key], ['depth']), omit(oldState.nodes[key], ['depth']));
        });
        return !sameExceptDepth;
    }
    else {
        return true;
    }
};
