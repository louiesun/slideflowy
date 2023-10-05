import { createStandardAction } from 'typesafe-actions';
import { of as of$ } from 'rxjs';
import { produce } from 'immer';
const initialState = {
    slideTabWindow: null,
    isSlideOpened: false,
    currentIndex: '',
};
export var ActionTypes;
(function (ActionTypes) {
    ActionTypes["init"] = "app:init";
    ActionTypes["onToggleSlide"] = "app:onToggleSlide";
    ActionTypes["onAddId"] = "app:onAddId";
    ActionTypes["onChangeCurrentIndex"] = "app:onChangeCurrentIndex";
})(ActionTypes || (ActionTypes = {}));
export const actionCreators = {
    init: createStandardAction(ActionTypes.init)(),
    onToggleSlide: createStandardAction(ActionTypes.onToggleSlide)(),
    onAddId: createStandardAction(ActionTypes.onAddId)(),
    onChangeCurrentIndex: createStandardAction(ActionTypes.onChangeCurrentIndex)(),
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
