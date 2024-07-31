import {
  applyMiddleware,
  Store as ReduxStore,
  createStore as reduxCreateStore,
} from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { createEpicMiddleware } from 'redux-observable'
import { BehaviorSubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { Epic } from '../types'
import { container } from '../utils/di'
import { catchEpicErrors, catchReducerErrors } from '../utils/Raven'
import {
  RootActions,
  ActionState,
  epic,
  reducer,
  file,
  nodeEdit,
  fileHistory,
} from '../action_packs'
import { sanitizeStateInReduxDevtools } from '../action_packs/file_history'

export type RootState = ActionState

export type Store = ReduxStore<RootState>

const epicMiddleware = createEpicMiddleware<
  RootActions,
  RootActions,
  RootState,
  typeof container
>({
  dependencies: container,
})

const composeEnhancers = composeWithDevTools({
  trace: true,
  stateSanitizer: <S extends fileHistory.State>(state: S, index: number) =>
    sanitizeStateInReduxDevtools(state),
  actionsBlacklist: [
    file.ActionTypes.fileChanged,
    nodeEdit.ActionTypes.updateEditorStates,
  ],
})

const epic$ = new BehaviorSubject(epic)
const hotReloadingEpic: Epic<RootState, RootActions> = (...args) =>
  epic$.pipe(
    switchMap((epic: Epic<RootState, RootActions>) =>
      catchEpicErrors(epic(...args)),
    ),
  )

let _store: undefined | ReturnType<typeof reduxCreateStore>
export async function createStore(initialData: any = {}) {
  if (_store) return _store

  const store = (_store = reduxCreateStore(
    catchReducerErrors(reducer),
    initialData,
    composeEnhancers(applyMiddleware(epicMiddleware)),
  ))

  epicMiddleware.run(hotReloadingEpic)

  if (module.hot) {
    module.hot.accept('../action_packs', () => {
      console.log('[Store HMR] triggered')

      const pack = require('../action_packs')

      store.replaceReducer(catchReducerErrors(pack.reducer))
      console.log('[Store HMR] reducer replaced')

      epic$.next(pack.epic)
      console.log('[Store HMR] epic replaced')
    })
  }

  return store
}
