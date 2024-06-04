import * as ProjectNodeService from '../../services/ProjectNodeService';
import { emptyAry, last } from '../../utils/F';
import { reduce, reduced } from 'ramda';
export const getNode = (state, props) => ProjectNodeService.getNode(props.nodeId, state);
export const getEditingNodeId = (state) => {
    if (!state.focusingNodeIds)
        return;
    return state.focusingNodeIds[0];
};
export const isNodeEditing = (state, props) => {
    return props.nodeId === getEditingNodeId(state);
};
export const getNodes = ProjectNodeService.getNodes;
export const getChildNodesRecursively = ProjectNodeService.getChildNodesRecursively;
export const getChildNodes = (props, state) => {
    if (props.nodeId) {
        const parentNode = getNode(state, props);
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
export const selectedRootNodeId = (state) => state.selectAsRootNodeId || null;
export const selectionRange = (state) => state.projectNodeSelection || null;
export const getDraggingNodeIds = (state) => state.projectNodeDraggingNodeIds || emptyAry;
export const getRootNodeIds = ProjectNodeService.getRootNodeIds;
export const getAllSelectedNodes = (state) => (state.projectNodeAllSelectedNodeIds || [])
    .map((nodeId) => getNode(state, { nodeId }))
    .filter(ProjectNodeService.isExistedProjectNode);
export const getUserSelectedNodes = (state) => (state.projectNodeUserSelectedNodeIds || [])
    .map((nodeId) => getNode(state, { nodeId }))
    .filter(ProjectNodeService.isExistedProjectNode);
export const getEditStatus = (id, state) => {
    if (!state.nodeEditStatus)
        return {};
    if (!state.nodeEditStatus[id])
        return {};
    return state.nodeEditStatus[id];
};
export const findSeeminglyPrevNode = (id, state) => {
    const parentNodeInfo = findParentNode(id, state);
    if (!parentNodeInfo)
        return;
    const prevNode = findPrevNodeInParent(parentNodeInfo.node, parentNodeInfo.parentNode, state);
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
        const deeperPrevNode = getNode(state, {
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
export const findSeeminglyNextNode = (id, state) => {
    const currNode = getNode(state, { nodeId: id });
    if (!currNode)
        return;
    if (currNode.childrenIds.length && currNode.expanded) {
        return getNode(state, { nodeId: currNode.childrenIds[0] });
    }
    const parentTree = findParentTree(id, state).slice(0, -1);
    parentTree.reverse();
    parentTree.push(null);
    const { result } = reduce((reduceState, parentNode) => {
        const nextNode = findNextNodeInParent(reduceState.currNode, parentNode, state);
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
export const findParentNode = ProjectNodeService.findParentNode;
export const findParentTree = ProjectNodeService.findParentTree;
export const findPrevNode = (id, state) => {
    const parentNodeInfo = findParentNode(id, state);
    if (!parentNodeInfo)
        return;
    const { node, parentNode } = parentNodeInfo;
    const prevNode = findPrevNodeInParent(node, parentNode, state);
    if (!prevNode)
        return;
    return { ...parentNodeInfo, prevNode };
};
export const findPrevNodeInParent = (node, parentNode, state) => {
    const ids = parentNode ? parentNode.childrenIds : state.rootNodeIds;
    const nodeIdx = ids.indexOf(node.id);
    if (nodeIdx < 1)
        return;
    const prevNodeId = ids[nodeIdx - 1];
    return getNode(state, { nodeId: prevNodeId });
};
export const findNextNode = (id, state) => {
    const parentNodeInfo = findParentNode(id, state);
    if (!parentNodeInfo)
        return;
    const { node, parentNode } = parentNodeInfo;
    const nextNode = findNextNodeInParent(node, parentNode, state);
    if (!nextNode)
        return;
    return { ...parentNodeInfo, nextNode };
};
export const findNextNodeInParent = (node, parentNode, state) => {
    const ids = parentNode ? parentNode.childrenIds : state.rootNodeIds;
    const nodeIdx = ids.indexOf(node.id);
    if (nodeIdx === -1)
        return;
    const nextNodeId = ids[nodeIdx + 1];
    return getNode(state, { nodeId: nextNodeId });
};
export const getParentMap = (state) => state.nodesParentMap || {};
