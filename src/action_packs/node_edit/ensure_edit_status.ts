import * as selectors from '../project_node/selectors';
export const ensureEditStatus = (id, state) => {
    state.nodeEditStatus = state.nodeEditStatus || {};
    state.nodeEditStatus[id] = state.nodeEditStatus[id] || {};
    return selectors.getEditStatus(id, state);
};
