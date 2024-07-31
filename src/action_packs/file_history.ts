/**
 * ## 目前程序的历史由两个部分组成：
 *
 * * nutflowy 自己管理的历史（主要是节点**列表**的修改历史）：当用户对列表做了什
 *   么修改，我们就把之前的整个 state 放到当前 state 的 `backwardState` 属性里。
 *   因此，nutflowy 自己管理的历史在数据结构上其实就像是一个单向链表
 *
 * * ProseMirror 编辑器里的历史，存储在
 *   `state.nodeEditStatus[projectNodeId].editorState` 里，这个属性是一个
 *   ProseMirror 的 `EditorState` 实例，因为我们使用了 prosemirror-history 这个
 *   插件，所以 `editorState` 存储了文本编辑的历史，也内置了历史管理的逻辑（比如
 *   什么操作应该记录到历史里，什么操作没必要记录），我们只需要调用对应 API 就可
 *   以操作历史
 *
 * ## 用户编辑节点内容时不需要产生新的 `backwardState` ：
 *
 * 我们可以把历史看成一个栈，列表的操作历史会压进 (A) 栈，当用户开始编辑节点时，
 * 我们会新建一个 `editorState` ，相当于在 (A) 栈的最顶部压入一个子堆栈 (B) ，用
 * 户对内容的修改历史会压进 (B) 栈，用户尝试撤销时我们也会先尝试把 (B) 栈的历史
 * 先弹出，直到发现 (B) 栈已经空了，用户再尝试撤销时，我们才弹出 (A) 栈的内容
 *
 * 因为每次用户结束编辑的时候我们都会创建一个新的 `editorState` ，然后把当前
 * state 记录为 `backwardState`，所以不会出现“用户在 A 节点编辑，切换到 B 节点编
 * 辑，再切换到 A 节点，点击撤销，发现 A 节点的修改被撤销”的情况
 *
 * ## 撤销操作的实现逻辑简介
 *
 * 当 reducer 收到 `undo` action 时我们会检查当前是否存在编辑中的节点，然后
 * 调用 prosemirror-history 包提供的 API (`undoDepth`) 来检查该节点是否存在编
 * 辑历史：
 *
 * * 如果存在的话，那么就调用另外一个 API (`undo`) 来生成回退历史的 transaction
 *   （transaction 是 ProseMirror 中的概念，几乎和 redux 中的 action 等价）。调
 *   用 `editorState.apply(transaction)` 生成一个新的 `editorState`，并把它更新
 *   到 {@link ProjectNodeState.nodeEditStatus} 里面。
 *
 * * 如果不存在的话，那就检查 state 中的 `backwardState` 里是否有修改历史，有
 *   的话就把整个 state 回退到对应版本
 */

import { createStandardAction, ActionType, isOfType } from 'typesafe-actions'
import { produce } from 'immer'
import { AnyAction } from 'redux'
import { Epic } from '../types'
import { mergeMap as mergeMap$ } from 'rxjs/operators'
import { Notification } from '../utils/Notification'
import { $t } from '../i18n'
import * as RX from '../utils/RX'
import { State as NodeEditState } from './node_edit'
import { State as ProjectNodeState } from './project_node'
import { getEditingNodeId } from './project_node/selectors'
import {
  redoEditorState,
  redoEditorStateAvailable,
} from './node_edit/redo_editor_state'
import {
  undoEditorState,
  undoEditorStateAvailable,
} from './node_edit/undo_editor_state'
import { ActionTypes as FileActionTypes } from './file'
import { omit } from 'lodash'

export type Actions = ActionType<typeof actionCreators>

interface HistoryRecord {
  triggerAction: any
  state: State
}

export interface State {
  fileHistory?: HistoryRecord[]
  historyIndex?: number
}

export enum ActionTypes {
  init = 'file_history:init',
  undo = 'edit_history:undo',
  undoPerform = 'edit_history:undo:perform',
  redo = 'edit_history:redo',
  redoPerform = 'edit_history:redo:perform',
}

export const actionCreators = {
  init: createStandardAction(ActionTypes.init)(),
  undo: createStandardAction(ActionTypes.undo)(),
  undoPerform: createStandardAction(ActionTypes.undoPerform)(),
  redo: createStandardAction(ActionTypes.redo)(),
  redoPerform: createStandardAction(ActionTypes.redoPerform)(),
}

export namespace selectors {
  export const undoAvailable = (state: State & ProjectNodeState) => {
    const editingNodeId = getEditingNodeId(state)

    if (editingNodeId && undoEditorStateAvailable(editingNodeId, state)) {
      return true
    }

    return Boolean(state.fileHistory?.length && state.historyIndex)
  }

  export const redoAvailable = (state: State & ProjectNodeState) => {
    const editingNodeId = getEditingNodeId(state)

    if (editingNodeId && redoEditorStateAvailable(editingNodeId, state)) {
      return true
    }

    return Boolean(
      state.fileHistory?.length &&
        state.historyIndex !== undefined &&
        state.fileHistory.length > state.historyIndex + 1,
    )
  }
}

export const reducer = (
  state: State & ProjectNodeState,
  action: Actions,
): State => {
  switch (action.type) {
    case ActionTypes.init: {
      return {
        ...state,
        fileHistory: [
          {
            triggerAction: action,
            state,
          },
        ],
        historyIndex: 0,
      }
    }
    case ActionTypes.undoPerform: {
      if (!selectors.undoAvailable(state)) return state

      const editingNodeId = getEditingNodeId(state)

      if (editingNodeId) {
        let isUndoSucceed = false
        state = produce(state, state => {
          isUndoSucceed = undoEditorState(
            editingNodeId,
            state as State & ProjectNodeState & NodeEditState,
          )
        })
        if (isUndoSucceed) return state
      }

      if (!state.fileHistory || state.historyIndex === undefined) return state

      return {
        ...state.fileHistory[state.historyIndex - 1].state,
        fileHistory: state.fileHistory,
        historyIndex: state.historyIndex - 1,
      }
    }
    case ActionTypes.redoPerform: {
      if (!selectors.redoAvailable(state)) return state

      const editingNodeId = getEditingNodeId(state)

      if (editingNodeId) {
        let isRedoSucceed = false
        state = produce(state, state => {
          isRedoSucceed = redoEditorState(
            editingNodeId,
            state as State & ProjectNodeState & NodeEditState,
          )
        })
        if (isRedoSucceed) return state
      }

      if (!state.fileHistory || state.historyIndex === undefined) return state

      return {
        ...state.fileHistory[state.historyIndex + 1].state,
        fileHistory: state.fileHistory,
        historyIndex: state.historyIndex + 1,
      }
    }
  }

  return state
}

export type UndoableActionPredicate<A extends AnyAction, S> =
  | string
  | ((action: A, newState: S, oldState: S) => boolean)

export const wrapStateMutator = <S, A extends AnyAction>(
  undoableActionPredicates: UndoableActionPredicate<A, S>[],
  stateMutator: (state: S, action: A) => S | void,
) => (state: S & State, action: A) => {
  const mutatedState = produce<S & State>(state =>
    stateMutator(state as S, action),
  )(state)

  const matchedPredicate = undoableActionPredicates.find(p =>
    typeof p === 'string' ? p === action.type : p(action, mutatedState, state),
  )

  if (!matchedPredicate) return mutatedState

  const triggerAction = { ...action }
  if (process.env.NODE_ENV !== 'development') {
    delete triggerAction.payload
  }

  const currentHistory = state.fileHistory || [
    { state: omit(state, ['imageUploadModalStatus']), triggerAction },
  ]
  const currentHistoryIndex = state.historyIndex || 0
  const newHistory = [
    ...currentHistory.slice(0, currentHistoryIndex + 1),
    {
      state: omit(mutatedState, ['imageUploadModalStatus']),
      triggerAction,
    },
  ]

  const finalState: S & State = {
    ...mutatedState,
    fileHistory: newHistory,
    historyIndex: currentHistoryIndex + 1,
  }
  return compressHistory('fileHistory', finalState)
}

export const epic: Epic<State, Actions> = (action$, state$) =>
  action$.pipe(
    mergeMap$(
      RX.create((observer, action) => {
        if (isOfType(FileActionTypes.fetchedFile, action)) {
          observer.next(actionCreators.init())
        }
        if (isOfType(ActionTypes.undo, action)) {
          if (selectors.undoAvailable(state$.value)) {
            observer.next(actionCreators.undoPerform())
            Notification.show({ text: $t('NUTFLOWY_UNDO_COMPLETED') })
          }
        } else if (isOfType(ActionTypes.redo, action)) {
          if (selectors.redoAvailable(state$.value)) {
            observer.next(actionCreators.redoPerform())
            Notification.show({ text: $t('NUTFLOWY_REDO_COMPLETED') })
          }
        }
        observer.complete()
      }),
    ),
  )

export function sanitizeStateInReduxDevtools<S extends State>(state: S): S {
  return {
    ...state,
    '...': '<filtered>',
    fileHistory: state.fileHistory,
  }
}

const HISTORY_LIMIT = 100
function compressHistory<T extends keyof State>(type: T, state: State) {
  if (!state[type]) return state

  const fileHistories = state[type] as HistoryRecord[]

  if (fileHistories.length <= HISTORY_LIMIT) return state

  return {
    ...state,
    fileHistory: fileHistories.slice(
      fileHistories.length - HISTORY_LIMIT,
      fileHistories.length,
    ),
    historyIndex: HISTORY_LIMIT - 1,
  }
}
