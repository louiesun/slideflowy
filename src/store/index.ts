import { applyMiddleware, createStore as reduxCreateStore, } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createEpicMiddleware } from 'redux-observable';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { container } from '../utils/di';
import { catchEpicErrors, catchReducerErrors } from '../utils/Raven';
import { epic, reducer, file, nodeEdit, } from '../action_packs';
import { sanitizeStateInReduxDevtools } from '../action_packs/file_history';
const epicMiddleware = createEpicMiddleware({
    dependencies: container,
});
const composeEnhancers = composeWithDevTools({
    trace: true,
    stateSanitizer: (state, index) => sanitizeStateInReduxDevtools(state),
    actionsBlacklist: [
        file.ActionTypes.fileChanged,
        nodeEdit.ActionTypes.updateEditorStates,
    ],
});
const epic$ = new BehaviorSubject(epic);
const hotReloadingEpic = (...args) => epic$.pipe(switchMap((epic) => catchEpicErrors(epic(...args))));
let _store;
export async function createStore(initialData = {}) {
    if (_store)
        return _store;
    const store = (_store = reduxCreateStore(catchReducerErrors(reducer), initialData, composeEnhancers(applyMiddleware(epicMiddleware))));
    epicMiddleware.run(hotReloadingEpic);
    if (module.hot) {
        module.hot.accept('../action_packs', () => {
            console.log('[Store HMR] triggered');
            const pack = require('../action_packs');
            store.replaceReducer(catchReducerErrors(pack.reducer));
            console.log('[Store HMR] reducer replaced');
            epic$.next(pack.epic);
            console.log('[Store HMR] epic replaced');
        });
    }
    return store;
}
