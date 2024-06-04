import { createStandardAction } from 'typesafe-actions';
import { produce } from 'immer';
export var ActionTypes;
(function (ActionTypes) {
    ActionTypes["setBG"] = "slide:setBG";
})(ActionTypes || (ActionTypes = {}));
export const actionCreators = {
    setBG: createStandardAction(ActionTypes.setBG)(),
};
export var selectors;
(function (selectors) {
    selectors.bg = (state) => (state.slide && state.slide.bg) || '';
})(selectors || (selectors = {}));
export const reducer = produce((state, action) => {
    switch (action.type) {
        case ActionTypes.setBG:
            state.slide = state.slide || {};
            state.slide.bg = action.payload;
            break;
    }
});
