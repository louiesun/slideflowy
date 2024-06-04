import { createStandardAction, isOfType } from 'typesafe-actions';
import { zipObj, last, reduce, reduced, values } from 'ramda';
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
import { prepend, append, emptyObj } from '../../utils/F';
import * as innerSelectors from './selectors';
import { selectNodes, selectCopyNodes } from './reducers/selectNodes';
import { ensureEditorState } from '../node_edit/ensure_editor_state';
import { isEqual, omit } from 'lodash';
import { ClipboardInternalMimeType, ClipboardRawTextMimeType, ClipboardRichTextMimeType, } from '../../services/ProjectNodeService';
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
    ActionTypes["moveUp"] = "project_node:moveUp";
    ActionTypes["moveDown"] = "project_node:moveDown";
    ActionTypes["deleteNode"] = "project_node:deleteNode";
    ActionTypes["selectAsRoot"] = "project_node:selectAsRoot";
    ActionTypes["selectNodes"] = "project_node:selectNodes";
    ActionTypes["copySelectedNodes"] = "project_node:copySelectedNodes";
    ActionTypes["cutSelectedNodes"] = "project_node:cutSelectedNodes:start";
    ActionTypes["cutSelectedNodesEnd"] = "project_node:cutSelectedNodes:end";
    ActionTypes["pasteNodes"] = "project_node:pasteNodes";
    ActionTypes["prepareBeforeCopyNodes"] = "project_node:prepareBeforeCopyNodes";
    ActionTypes["copyText"] = "project_node:copyText";
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
    ActionTypes["setImagePreviewUrls"] = "project_node:setImagePreviewUrls";
    ActionTypes["updateLastAllSelectedNodeIds"] = "project_node:updateLastAllSelectedNodeIds";
    ActionTypes["cancelLastAllSelectedNodeIds"] = "project_node:cancelLastAllSelectedNodeIds";
    ActionTypes["moveUpImage"] = "project_node:moveUpImage";
    ActionTypes["moveDownImage"] = "project_node:moveDownImage";
})(ActionTypes || (ActionTypes = {}));
const undoableActionTypes = [
    (action, newS, oldS) => {
        if (values(ActionTypes)
            .filter(t => [
            ActionTypes.prepareBeforeCopyNodes,
            ActionTypes.copyText,
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
    moveUp: createStandardAction(ActionTypes.moveUp)(),
    moveDown: createStandardAction(ActionTypes.moveDown)(),
    deleteNode: createStandardAction(ActionTypes.deleteNode)(),
    selectAsRoot: createStandardAction(ActionTypes.selectAsRoot)(),
    selectNodes: createStandardAction(ActionTypes.selectNodes)(),
    copySelectedNodes: createStandardAction(ActionTypes.copySelectedNodes)(),
    cutSelectedNodes: createStandardAction(ActionTypes.cutSelectedNodes)(),
    cutSelectedNodesEnd: createStandardAction(ActionTypes.cutSelectedNodesEnd)(),
    pasteNodes: createStandardAction(ActionTypes.pasteNodes)(),
    prepareBeforeCopyNodes: createStandardAction(ActionTypes.prepareBeforeCopyNodes)(),
    copyText: createStandardAction(ActionTypes.copyText)(),
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
    setImagePreviewUrls: createStandardAction(ActionTypes.setImagePreviewUrls)(),
    updateLastAllSelectedNodeIds: createStandardAction(ActionTypes.updateLastAllSelectedNodeIds)(),
    cancelLastAllSelectedNodeIds: createStandardAction(ActionTypes.cancelLastAllSelectedNodeIds)(),
    moveUpImage: createStandardAction(ActionTypes.moveUpImage)(),
    moveDownImage: createStandardAction(ActionTypes.moveDownImage)(),
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
            searchDraggingCoveredNodes(state, action.payload.nodeId);
            break;
        }
        case ActionTypes.dragEnd: {
            state.projectNodeDraggingNodeIds = emptyObj;
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
        case ActionTypes.moveUp: {
            const prevListNode = findPrevListNode(action.payload.id, state);
            if (!prevListNode) {
                break;
            }
            const curNode = selectors.getNode(state, { nodeId: action.payload.id });
            moveUp(curNode, prevListNode, state);
            startEditNode(curNode.id, state);
            break;
        }
        case ActionTypes.moveDown: {
            const nextListNode = findNextListNode(action.payload.id, state);
            if (!nextListNode) {
                break;
            }
            const curNode = selectors.getNode(state, { nodeId: action.payload.id });
            moveDown(curNode, nextListNode, state);
            startEditNode(curNode.id, state);
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
            const selectedNodes = selectors.getAllSelectedCopyNodes(state);
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
            break;
        case ActionTypes.setImagePreviewUrls:
            setImagePreviewUrls(action.payload.id, action.payload.urls, state);
        case ActionTypes.updateLastAllSelectedNodeIds:
            state.lastAllSelectedNodeIds = state.projectNodeAllSelectedNodeIds;
            break;
        case ActionTypes.cancelLastAllSelectedNodeIds:
            state.lastAllSelectedNodeIds = [];
            break;
        case ActionTypes.moveUpImage:
            const moveUpNodeImages = state.nodes[action.payload.id].images;
            if (moveUpNodeImages) {
                const index = action.payload.index;
                if (index > 0) {
                    console.log('swap');
                    const temp = moveUpNodeImages[index];
                    moveUpNodeImages[index] = moveUpNodeImages[index - 1];
                    moveUpNodeImages[index - 1] = temp;
                }
            }
            break;
        case ActionTypes.moveDownImage:
            const moveDownNodeImages = state.nodes[action.payload.id].images;
            if (moveDownNodeImages) {
                const index = action.payload.index;
                if (index < moveDownNodeImages.length - 1) {
                    console.log('swap');
                    const temp = moveDownNodeImages[index];
                    moveDownNodeImages[index] = moveDownNodeImages[index + 1];
                    moveDownNodeImages[index + 1] = temp;
                }
            }
            break;
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
        case ActionTypes.prepareBeforeCopyNodes: {
            action.payload.nodes.forEach(n => {
                const node = selectors.getNode(state, { nodeId: n.id });
                node && (node.expanded = true);
            });
            selectCopyNodes(action, state);
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
export const prepareBeforeCopyNodesEpic = (action$, state$) => action$.pipe(mergeMap$(action => {
    if (isOfType(ActionTypes.prepareBeforeCopyNodes, action)) {
        const state = state$.value;
        const draggableProjectNodes = document.getElementsByClassName('DraggableProjectNode');
        const noneNestedNodeList = selectors.getNoneNestedNodeList(state);
        const promises = [];
        const nodes = selectors.getAllSelectedCopyNodes(state);
        for (const node of nodes) {
            if (!node.images || node.images.length === 0) {
                continue;
            }
            promises.push(new Promise((resolve) => {
                const intervalId = setInterval(() => {
                    const index = noneNestedNodeList.findIndex(n => n.id === node.id);
                    if (index < 0 || index >= draggableProjectNodes.length) {
                        return;
                    }
                    const targetNode = draggableProjectNodes[index];
                    const images = Array.from(targetNode.getElementsByTagName('img'));
                    if (images.length === node.images.length &&
                        images.every(image => image.width !== 0 && image.height !== 0)) {
                        clearInterval(intervalId);
                        resolve(true);
                    }
                }, 50);
            }));
        }
        void Promise.all(promises).then(() => {
            setTimeout(() => {
                document.execCommand('copy');
            }, 200);
        });
    }
    return empty$();
}));
const transformNodeImagesToBase64 = (internalMimeTypeNodes, state) => {
    const draggableProjectNodes = document.getElementsByClassName('DraggableProjectNode');
    const noneNestedNodeList = selectors.getNoneNestedNodeList(state);
    return internalMimeTypeNodes.map(node => {
        const index = noneNestedNodeList.findIndex(n => n.id === node.id);
        if (index >= draggableProjectNodes.length ||
            draggableProjectNodes.length === 0) {
            return [];
        }
        const targetNode = draggableProjectNodes[index];
        const images = targetNode.getElementsByTagName('img');
        return {
            ...node,
            images: Array.from(images).map((image) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, image.width, image.height);
                return canvas.toDataURL('image/png');
            }),
        };
    });
};
const setDataTransfer = (dataTransfer, internalMimeTypeNodes, rawTextMimeTypeNodes, state) => {
    const externalMimeTypeNodes = transformNodeImagesToBase64(internalMimeTypeNodes, state);
    dataTransfer.setData(ClipboardInternalMimeType, JSON.stringify(externalMimeTypeNodes));
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
        try {
            setDataTransfer(clipboardEvent.clipboardData, selectors.getAllSelectedCopyNodes(state), selectors.getUserSelectedCopyNodes(state), state);
            Notification.show({ text: $t('NUTFLOWY_COPY_SUCCEED') });
        }
        catch (e) {
            Notification.show({ text: $t('NUTFLOWY_COPY_FAILED') });
            console.error(e);
        }
    }
    if (isOfType(ActionTypes.cutSelectedNodes, action)) {
        return of$(actionCreators.cutSelectedNodesEnd());
    }
    return empty$();
}));
export const copyTextEpic = (action$, state$) => action$.pipe(filter$(isOfType(ActionTypes.copyText)), tap$(async (action) => {
    try {
        const { nodes } = state$.value;
        const getChildrenContent = (node) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(node.content, 'text/html');
            const body = doc.querySelector('body');
            let result = body.textContent || '';
            node.childrenIds.forEach(item => {
                result += '\n' + getChildrenContent(nodes[item]);
            });
            return result;
        };
        const selectedNodes = action.payload.nodes;
        if (selectedNodes.length === 0) {
            return;
        }
        let copyTextContent = '';
        if (selectedNodes.length > 1) {
            copyTextContent = selectedNodes
                .reduce((content, item) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(item.content, 'text/html');
                const body = doc.querySelector('body');
                return content + body.textContent + '\n';
            }, '')
                .replace(/\n$/, '');
        }
        else {
            copyTextContent = getChildrenContent(selectedNodes[0]);
        }
        await navigator.clipboard.writeText(copyTextContent);
        Notification.show({ text: $t('NUTFLOWY_COPY_SUCCEED') });
    }
    catch (e) {
        Notification.show({ text: $t('NUTFLOWY_COPY_FAILED') });
        console.error(e);
    }
}), mergeMap$(() => empty$()));
export const epic = combineEpics(cutOrCopySelectedNodesEpic, prepareBeforeCopyNodesEpic, copyTextEpic);
export var selectors;
(function (selectors) {
    selectors.getNode = innerSelectors.getNode, selectors.getEditingNodeId = innerSelectors.getEditingNodeId, selectors.isNodeEditing = innerSelectors.isNodeEditing;
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
    selectors.getDraggingNodeIds = (state) => state.projectNodeDraggingNodeIds || emptyObj;
    selectors.getRootNodeIds = ProjectNodeService.getRootNodeIds;
    selectors.getAllSelectedNodes = (state) => (state.projectNodeAllSelectedNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }))
        .filter(ProjectNodeService.isExistedProjectNode);
    selectors.getUserSelectedNodes = (state) => (state.projectNodeUserSelectedNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }))
        .filter(ProjectNodeService.isExistedProjectNode);
    selectors.getAllSelectedCopyNodes = (state) => (state.projectNodeAllSelectedCopyNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }));
    selectors.getUserSelectedCopyNodes = (state) => (state.projectNodeUserSelectedCopyNodeIds || [])
        .map(nodeId => selectors.getNode(state, { nodeId }));
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
    selectors.isAncestor = (ancestorId, nodeId, nodes) => {
        const search = (a, b) => {
            if (a === b) {
                return true;
            }
            for (let i = 0; i < (nodes[a].childrenIds || []).length; ++i) {
                if (search(nodes[a].childrenIds[i], b)) {
                    return true;
                }
            }
            return false;
        };
        return search(ancestorId, nodeId);
    };
    selectors.isCoveredInSelectedNodeIds = (nodeId, selectedNodeIds) => {
        if (selectedNodeIds.length === 0)
            return false;
        return selectedNodeIds.some((selectedNodeId) => {
            return selectedNodeId === nodeId;
        });
    };
})(selectors || (selectors = {}));
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
function removeNodeFromChildren(node, state) {
    const parentNodeInfo = selectors.findParentNode(node.id, state);
    const childrenIds = !parentNodeInfo || !parentNodeInfo.parentNode ? state.rootNodeIds : parentNodeInfo.parentNode.childrenIds;
    const index = childrenIds.indexOf(node.id);
    childrenIds.splice(index, 1);
}
// 节点顺序列表：视觉上从上到下的节点组成的列表
// 向上移动原理：将整个节点（及其子孙节点）移动到节点顺序列表中前一个节点的前面
//         如果该节点是第一个节点，则不移动
// 实现方式：找到待移动节点在节点顺序列表中的上一个节点 prevListNode（已经提前确保不为空），
//      （1）如果 prevListNode 有父亲节点，那么只需要将待移动节点移动到该父亲节点的 childrenIds 中 prevListNode 的前面
//      （2）如果 prevListNode 没有父亲节点，说明 prevListNode 是一个根节点，那么只需要将待移动节点移动到 state 的 prevListNode 的前面
function moveUp(curNode, prevListNode, state) {
    removeNodeFromChildren(curNode, state);
    const parentNodeInfo = selectors.findParentNode(prevListNode.id, state);
    // 判断父亲节点是否存在，从而判断选择 childrenIds/rootNodeIds
    const childrenIds = !parentNodeInfo || !parentNodeInfo.parentNode ? state.rootNodeIds : parentNodeInfo.parentNode.childrenIds;
    const index = childrenIds.indexOf(prevListNode.id);
    // 将待移动节点移动至 prevListNode 前方
    childrenIds.splice(index, 0, curNode.id);
}
// 向下移动：找到待移动节点在节点顺序列表中的下一个节点 nextListNode（已经提前确保不为空），
//      （1）nextListNode 有儿子节点，那么将待移动节点移动至该节点的第一个儿子节点
//      （2）nextListNode 没有儿子节点，那么将待移动节点移动至 nextListNode 的同级正下方
function moveDown(curNode, nextListNode, state) {
    removeNodeFromChildren(curNode, state);
    // 判断 nextListNode 是否有儿子节点
    if (nextListNode.childrenIds.length !== 0) {
        nextListNode.childrenIds.unshift(curNode.id);
    }
    else {
        const parentNodeInfo = selectors.findParentNode(nextListNode.id, state);
        const childrenIds = !parentNodeInfo || !parentNodeInfo.parentNode ? state.rootNodeIds : parentNodeInfo.parentNode.childrenIds;
        const index = childrenIds.indexOf(nextListNode.id);
        childrenIds.splice(index + 1, 0, curNode.id);
    }
}
// 目的是找到节点顺序列表的上一个节点
// **待移动节点在节点顺序列表的上一个节点，不一定是向上的兄弟节点，因为在节点顺序列表中，这两个节点中间可能存在着兄弟节点的子孙节点**
// 如果向上的兄弟节点无子孙节点，说明向上的兄弟节点正好就是节点顺序列表的上一个节点
// 如果向上的兄弟节点有子孙节点，说明节点顺序列表的上一个节点，在其中的子孙节点之间，所以进行迭代寻找
//   特别的，如果向上的兄弟节点不存在，说明待移动节点本身是父亲节点的第一个儿子（或者整个 rootNodes 的第一个节点）
//   如果向上的兄弟节点不存在，并且待移动节点有父亲节点，说明上一个节点就是父亲节点
//   如果向上的兄弟节点不存在，并且待移动节点无父亲节点，说明当前节点本身就是最上方的节点，那么直接返回 null
function findPrevListNode(nodeId, state) {
    // 找到待移动节点的向上兄弟节点
    const prevNodeInfo = selectors.findPrevNode(nodeId, state);
    if (prevNodeInfo) {
        let curNode = prevNodeInfo.prevNode;
        // 如果向上的兄弟节点有子孙节点，则不断迭代寻找儿子节点的最后一个儿子节点，然后继续寻找最后一个儿子节点
        while (curNode.childrenIds && curNode.childrenIds.length) {
            curNode = selectors.getNode(state, { nodeId: curNode.childrenIds[curNode.childrenIds.length - 1] });
        }
        // 直到兄弟节点，或者兄弟节点的最后一个儿子节点的最后一个儿子节点……，不再具有儿子节点，说明此时当前这个节点就是寻找的节点
        return curNode;
    }
    // 特别的，向上的兄弟节点不存在，那么判断父亲节点是否存在
    const parentNodeInfo = selectors.findParentNode(nodeId, state);
    if (!parentNodeInfo) {
        // 如果父亲节点不存在，说明当前节点处于整个文档的最上方，那么直接返回 null
        return null;
    }
    // 否则返回父亲节点
    return parentNodeInfo.parentNode;
}
// 目的是找到节点顺序列表的下一个节点（不包括子孙节点）
// 如果当前节点有向下的兄弟节点，那么就是该节点
// 否则，如果当前节点的父亲节点的向下的兄弟节点存在，那么这就是节点顺序列表的下一个节点
// 但是有可能，当前节点的父亲节点，同样是同级的最后一个节点，因此可能需要迭代向上寻找父亲节点的父亲节点……直到父亲节点的向下的兄弟节点存在
// 如果找到 root 了还不存在，说明当前节点就是最后一个节点，返回 null
function findNextListNode(nodeId, state) {
    // 判断兄弟节点是否存在
    const nextNodeInfo = selectors.findNextNode(nodeId, state);
    if (nextNodeInfo) {
        return nextNodeInfo.nextNode;
    }
    // 向上迭代祖先节点，直到某个祖先节点存在向下的兄弟节点
    let parentNodeInfo = selectors.findParentNode(nodeId, state);
    while (parentNodeInfo) {
        // 当前祖先节点存在，查找该祖先节点的向下的兄弟节点
        const nextNodeInfo = selectors.findNextNode(parentNodeInfo.parentNode.id, state);
        // 如果存在，那么就是节点顺序列表的下一个节点
        if (nextNodeInfo) {
            return nextNodeInfo.nextNode;
        }
        // 否则，继续向上迭代
        parentNodeInfo = selectors.findParentNode(parentNodeInfo.parentNode.id, state);
    }
    // 否则当前节点就是最后一个节点
    return null;
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
export function setDepthForAllNodes(state) {
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
export const searchDraggingCoveredNodes = (state, id) => {
    const draggingCoveredNodeIds = {
        [id]: true
    };
    const search = (nodeId) => {
        const node = selectors.getNode(state, { nodeId });
        if (node.childrenIds && node.childrenIds.length) {
            node.childrenIds.forEach(childId => {
                draggingCoveredNodeIds[childId] = true;
                search(childId);
            });
        }
    };
    search(id);
    state.projectNodeDraggingNodeIds = draggingCoveredNodeIds;
};
function setImagePreviewUrls(nodeId, urls, state) {
    const node = selectors.getNode(state, { nodeId });
    node.imagePreviewUrls = urls;
}
