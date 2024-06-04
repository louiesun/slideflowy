import { createStandardAction } from 'typesafe-actions';
import { of as of$ } from 'rxjs';
import { produce } from 'immer';
const initialState = {
    slideTabWindow: null,
    isSlideOpened: false,
    currentIndex: '',
    startNodeId: '',
};
export var ActionTypes;
(function (ActionTypes) {
    ActionTypes["init"] = "app:init";
    ActionTypes["onToggleSlide"] = "app:onToggleSlide";
    ActionTypes["onAddId"] = "app:onAddId";
    ActionTypes["onChangeCurrentIndex"] = "app:onChangeCurrentIndex";
    ActionTypes["onStartNodeId"] = "app:onStartNodeId";
    ActionTypes["onSlideChange"] = "app:onSlideChange";
})(ActionTypes || (ActionTypes = {}));
export const actionCreators = {
    init: createStandardAction(ActionTypes.init)(),
    onToggleSlide: createStandardAction(ActionTypes.onToggleSlide)(),
    onAddId: createStandardAction(ActionTypes.onAddId)(),
    onChangeCurrentIndex: createStandardAction(ActionTypes.onChangeCurrentIndex)(),
    onStartNodeId: createStandardAction(ActionTypes.onStartNodeId)(),
    onSlideChange: createStandardAction(ActionTypes.onSlideChange)(),
};
export const reducer = produce((state = initialState, action) => {
    switch (action.type) {
        case ActionTypes.init:
            break;
        case ActionTypes.onToggleSlide:
            state.isSlideOpened = action.payload;
            break;
        case ActionTypes.onAddId:
            state.slideTabWindow = action.payload;
            break;
        case ActionTypes.onChangeCurrentIndex:
            state.currentIndex = action.payload;
            break;
        case ActionTypes.onStartNodeId:
            state.startNodeId = action.payload;
        case ActionTypes.onSlideChange:
            const payload = action.payload;
            state.startNodeId = payload.startNodeId === undefined ? state.startNodeId : payload.startNodeId;
            state.slideTabWindow = payload.slideTabWindow === undefined ? state.slideTabWindow : payload.slideTabWindow;
            state.isSlideOpened = payload.isSlideOpened === undefined ? state.isSlideOpened : payload.isSlideOpened;
            state.currentIndex = payload.currentIndex === undefined ? state.currentIndex : payload.currentIndex;
    }
});
let appInited = false;
export const epic = (action$, state$, container) => {
    if (!appInited) {
        appInited = true;
        return of$(actionCreators.init());
    }
    else {
        return action$;
    }
};
