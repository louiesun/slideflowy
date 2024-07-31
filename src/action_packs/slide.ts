import { createStandardAction, ActionType } from 'typesafe-actions'
import { produce } from 'immer'

export type Actions = ActionType<typeof actionCreators>

export interface State {
  slide?: {
    bg?: string
  }
}

export enum ActionTypes {
  setBG = 'slide:setBG',
}

export const actionCreators = {
  setBG: createStandardAction(ActionTypes.setBG)<string>(),
}

export namespace selectors {
  export const bg = (state: State) => (state.slide && state.slide.bg) || ''
}

export const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case ActionTypes.setBG:
      state.slide = state.slide || {}
      state.slide.bg = action.payload
      break
  }
})
