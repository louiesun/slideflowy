import { createStandardAction, ActionType } from 'typesafe-actions'
import { of as of$ } from 'rxjs'
import { Epic, IProjectNode } from '../types'
import { produce } from 'immer'

export type Actions = ActionType<typeof actionCreators>

export interface State {
  slideTabWindow?: Window | null,  // 新开tab页的window标识，用于postMessage
  isSlideOpened?: boolean,  // 是否打开了slide
  currentIndex?: string,  // slide当前播放的页面的id
  startNodeId?: IProjectNode['id'], // slide开始播放的页面的id
}

const initialState = {
  slideTabWindow: null,
  isSlideOpened: false,
  currentIndex: '',
  startNodeId: '',
}

export enum ActionTypes {
  init = 'app:init',
  onToggleSlide = 'app:onToggleSlide',
  onAddId = 'app:onAddId',
  onChangeCurrentIndex = 'app:onChangeCurrentIndex',
  onStartNodeId = 'app:onStartNodeId',
  onSlideChange = 'app:onSlideChange',
}

export interface onSlideChangeProps {
  startNodeId?: string,
  slideTabWindow?: Window | null,
  isSlideOpened?: boolean,
  currentIndex?: string,
}

export const actionCreators = {
  init: createStandardAction(ActionTypes.init)(),
  onToggleSlide: createStandardAction(ActionTypes.onToggleSlide)<boolean>(),
  onAddId: createStandardAction(ActionTypes.onAddId)<Window | null>(),
  onChangeCurrentIndex: createStandardAction(ActionTypes.onChangeCurrentIndex)<string>(),
  onStartNodeId: createStandardAction(ActionTypes.onStartNodeId)<string>(),
  onSlideChange: createStandardAction(ActionTypes.onSlideChange)<onSlideChangeProps>(),
}

export const reducer = produce((state = initialState, action: Actions) => {
  switch (action.type) {
    case ActionTypes.init:
      break
    case ActionTypes.onToggleSlide:
      state.isSlideOpened = action.payload
      break
    case ActionTypes.onAddId:
      state.slideTabWindow = action.payload
      break
    case ActionTypes.onChangeCurrentIndex:
      state.currentIndex = action.payload
      break
    case ActionTypes.onStartNodeId:
      state.startNodeId = action.payload
    case ActionTypes.onSlideChange:
      const payload = action.payload as onSlideChangeProps
      state.startNodeId = payload.startNodeId === undefined ? state.startNodeId : payload.startNodeId
      state.slideTabWindow = payload.slideTabWindow === undefined ? state.slideTabWindow : payload.slideTabWindow
      state.isSlideOpened = payload.isSlideOpened === undefined ? state.isSlideOpened : payload.isSlideOpened
      state.currentIndex = payload.currentIndex === undefined ? state.currentIndex : payload.currentIndex
  }
})

let appInited = false
export const epic: Epic<State, Actions> = (action$, state$, container) => {
  if (!appInited) {
    appInited = true
    return of$(actionCreators.init())
  } else {
    return action$
  }
}
