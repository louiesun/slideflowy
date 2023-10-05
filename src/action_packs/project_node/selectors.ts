import * as ProjectNodeService from '../../services/ProjectNodeService';
export const getNode = (state, props) => ProjectNodeService.getNode(props.nodeId, state);
export const getEditingNode = (state) => {
    const nodeEditStatus = state.nodeEditStatus || {};
    const nodeId = Object.keys(nodeEditStatus).find(nodeId => Boolean(!!nodeEditStatus[nodeId].focusedAt && getNode(state, { nodeId })));
    if (!nodeId)
        return;
    return getNode(state, { nodeId });
};
export const getEditingNodeId = (state) => {
    const node = getEditingNode(state);
    return node && node.id;
};
