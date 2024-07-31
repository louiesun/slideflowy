import { createStandardAction, ActionType } from 'typesafe-actions'
import { EditorState, Transaction, TextSelection } from 'prosemirror-state'
import { IProjectNode, SimpleObj, Epic, FstArgType } from '../../types'
import * as projectNode from '../project_node'
import {
  createEditorState,
  getContentFromState,
  applyMark as _applyMark,
  cleanMark as _cleanMark,
  replaceTextWithMark as _replaceTextWithMark,
  moveCursor,
  findPos,
} from '../../services/ProseMirrorService'
import { wrapStateMutator } from '../file_history'
import { applyTransaction } from './apply_transaction'
import { MarkType } from 'prosemirror-model'
import { combineEpics } from 'redux-observable'
import { of as of$ } from 'rxjs'
import {
  map as map$,
  mergeMap as mergeMap$,
  distinctUntilChanged as distinctUntilChanged$,
} from 'rxjs/operators'
import produce from 'immer'
import { castDraft } from 'immer'
import { compose, toPairs } from 'ramda'
import { ensureEditorState } from './ensure_editor_state'
import { getNode } from '../project_node/selectors'
import { EditorView } from 'prosemirror-view'
import { Schema } from '../../services/ProseMirrorService'
import { ensureEditStatus } from './ensure_edit_status'

export type Actions = ActionType<typeof actionCreators>

export interface State extends projectNode.State {}

export enum ActionTypes {
  // 开始编辑
  start = 'node_edit:start',
  // 结束编辑
  end = 'node_edit:end',
  // 取消编辑
  cancel = 'node_edit:cancel',
  // 添加指定 Mark
  applyMark = 'node_edit:applyMark',
  // 清理指定 Mark
  cleanMark = 'node_edit:cleanMark',
  // 替换文字，并添加指定 Mark
  replaceTextWithMark = 'node_edit:replaceTextWithMark',
  // 重置所有样式
  removeStyle = 'node_edit:removeStyle',
  // 通用的应用 Transaction
  applyTransaction = 'node_edit:applyTransaction',
  // 自动更新 EditorState ，只在 autoInitEditorStateEpic 里面用，其他 **任何**
  // 地方都不要用
  updateEditorStates = 'node_edit:updateEditorStates',
  // 窗口重新获取焦点后，恢复之前的光标位置
  restoreEditorAnchor = 'node_edit:restoreEditorAnchor',
  // 窗口重新获取焦点后，恢复焦点到之前的图片
  restoreImgFocus = 'node_edit:restoreImgFocus',
  // 从结尾开始编辑
  editAtTheEnd = 'node_edit:editAtTheEnd',
}

export const actionCreators = {
  start: createStandardAction(ActionTypes.start)<{
    id: IProjectNode['id']
  }>(),
  end: createStandardAction(ActionTypes.end)<{ id: IProjectNode['id'] }>(),
  cancel: createStandardAction(ActionTypes.cancel)<{
    id: IProjectNode['id']
  }>(),
  applyMark: createStandardAction(ActionTypes.applyMark)<{
    id: IProjectNode['id']
    mark: MarkType
    attrs: SimpleObj
  }>(),
  cleanMark: createStandardAction(ActionTypes.cleanMark)<{
    id: IProjectNode['id']
    mark: MarkType
  }>(),
  replaceTextWithMark: createStandardAction(ActionTypes.replaceTextWithMark)<{
    id: IProjectNode['id']
    text: string
    mark: MarkType
    attrs: SimpleObj
  }>(),
  removeStyle: createStandardAction(ActionTypes.removeStyle)<{
    id: IProjectNode['id']
  }>(),
  applyTransaction: createStandardAction(ActionTypes.applyTransaction)<{
    id: IProjectNode['id']
    // @ts-ignore
    transaction: Transaction<Schema>
    // @ts-ignore
    view: EditorView<Schema>
  }>(),
  updateEditorStates: createStandardAction(ActionTypes.updateEditorStates)<
    FstArgType<typeof setNodeEditStatus>
  >(),
  restoreEditorAnchor: createStandardAction(ActionTypes.restoreEditorAnchor)<{
    id: IProjectNode['id']
    anchor: number
  }>(),
  restoreImgFocus: createStandardAction(ActionTypes.restoreImgFocus)<{
    id: IProjectNode['id']
    imgUrl: string
  }>(),
  editAtTheEnd: createStandardAction(ActionTypes.editAtTheEnd)<{
    id: IProjectNode['id']
  }>(),
}

const undoableActionTypes = [
  (action: Actions, newS: State, oldS: State): boolean => {
    if (action.type === ActionTypes.end) {
      return projectNode.isNodesChanged(newS, oldS)
    }
    return false
  },
]

export namespace selectors {
  export const getEditorState = (
    id: IProjectNode['id'],
    state: State,
  ): EditorState | undefined =>
    state.nodeEditStatus &&
    state.nodeEditStatus[id] &&
    state.nodeEditStatus[id].editorState
}

export const reducer = wrapStateMutator(
  undoableActionTypes,
  (state: State, action: Actions) => {
    switch (action.type) {
      case ActionTypes.start:
        startEditNode(action.payload.id, state)
        break
      case ActionTypes.end:
        endEditNode(action.payload.id, state)
        break
      case ActionTypes.cancel:
        cancelEditNode(action.payload.id, state)
        break
      case ActionTypes.applyMark:
        applyMark(
          action.payload.id,
          action.payload.mark,
          action.payload.attrs,
          state,
        )
        break
      case ActionTypes.cleanMark:
        cleanMark(action.payload.id, action.payload.mark, state)
        break
      case ActionTypes.replaceTextWithMark:
        replaceTextWithMark(
          action.payload.id,
          action.payload.text,
          action.payload.mark,
          action.payload.attrs,
          state,
        )
        break
      case ActionTypes.removeStyle: {
        removeStyle(action.payload.id, state)
        break
      }
      case ActionTypes.applyTransaction:
        applyTransaction(action.payload.id, action.payload.transaction, state, action.payload.view)
        break
      case ActionTypes.updateEditorStates:
        setNodeEditStatus(action.payload, state)
        break
      case ActionTypes.restoreEditorAnchor:
        restoreEditorAnchor(action.payload.id, action.payload.anchor, state)
        break
      case ActionTypes.restoreImgFocus:
        restoreImgFocus(action.payload.id, action.payload.imgUrl, state)
        break
      case ActionTypes.editAtTheEnd:
        editAtTheEnd(action.payload.id, state)
    }
  },
)

function setNodeEditStatus(
  editStatus: NonNullable<State['nodeEditStatus']>,
  state: State,
) {
  state.nodeEditStatus = editStatus
}

function removeStyle(id: IProjectNode['id'], state: State) {
  const editorState = selectors.getEditorState(id, state)
  if (!editorState) return
  const tr = editorState.tr.removeMark(
    editorState.selection.from,
    editorState.selection.to,
  )
  applyTransaction(id, tr, state)
}

function applyMark(
  id: IProjectNode['id'],
  mark: MarkType,
  attrs: SimpleObj,
  state: State,
) {
  const { editorState } = ensureEditStatus(id, state)
  if (!editorState) return
  const tr = _applyMark(mark, attrs)(editorState)
  if (tr) {
    applyTransaction(id, tr, state)
  }
}

function cleanMark(id: IProjectNode['id'], mark: MarkType, state: State) {
  const { editorState } = ensureEditStatus(id, state)
  if (!editorState) return
  const tr = _cleanMark(mark)(editorState)
  if (tr) {
    applyTransaction(id, tr, state)
  }
}

function replaceTextWithMark(
  id: IProjectNode['id'],
  text: string,
  mark: MarkType,
  attrs: SimpleObj,
  state: State,
) {
  const editStatus = ensureEditStatus(id, state)
  if (!editStatus.editorState) return
  editStatus.editorState = _replaceTextWithMark(
    text,
    mark,
    attrs,
  )(editStatus.editorState)
}

function restoreEditorAnchor(
  id: IProjectNode['id'],
  anchor: number,
  state: State,
) {
  startEditNode(id, state)
  ensureEditStatus(id, state).editorState = moveCursor(
    anchor,
    ensureEditorState(id, state),
  )
}

function restoreImgFocus(
  nodeId: IProjectNode['id'],
  imgUrl: string,
  state: State,
) {
  const node = getNode(state, { nodeId })
  node.focusedImgUrl = imgUrl
}

function editAtTheEnd(id: IProjectNode['id'], state: State) {
  startEditNode(id, state)
  ensureEditStatus(id, state).editorState = moveCursor(
    'end',
    ensureEditorState(id, state),
  )
}

export function startEditNode(id: IProjectNode['id'], state: State): void
export function startEditNode(
  id: IProjectNode['id'],
  options: startEditNode.Options,
  state: State,
): void
export function startEditNode(
  id: IProjectNode['id'],
  _options?: any,
  _state?: any,
) {
  let options: startEditNode.Options
  let state: State

  if (arguments.length === 2) {
    options = {}
    state = _options
  } else {
    options = _options
    state = _state
  }

  const node = projectNode.selectors.getNode(state, { nodeId: id })
  if (!node) return
  const editStatus = ensureEditStatus(id, state)
  if (editStatus.focusedAt) return

  if (!options.keepOtherEditing && state.nodeEditStatus) {
    toPairs(state.nodeEditStatus)
      .filter(p => p[1].focusedAt)
      .forEach(p => endEditNode(p[0], state))
  }

  let editorState = editStatus.editorState || createEditorState(node.content)
  if (options.resetCursor) {
    const firstTextNodePos = findPos(node => node.isInline, editorState.doc)
    editorState = editorState.apply(
      editorState.tr.setSelection(
        TextSelection.create(editorState.doc, firstTextNodePos),
      ),
    )
  }

  if (state.focusingNodeIds === undefined) {
    state.focusingNodeIds = []
  }
  state.focusingNodeIds.push(id)
  editStatus.focusedAt = Date.now()
  editStatus.editorState = editorState
  editStatus.editingContent = getContentFromState(editorState)
}
export namespace startEditNode {
  export interface Options {
    keepOtherEditing?: boolean
    resetCursor?: boolean
  }
}

export function endEditNode(id: IProjectNode['id'], state: State) {
  const editStatus = ensureEditStatus(id, state)
  const node = projectNode.selectors.getNode(state, { nodeId: id })

  state.focusingNodeIds = undefined
  delete editStatus.focusedAt
  if (node && editStatus.editorState) {
    editStatus.editorState = editorStateCleanUp(editStatus.editorState)
    node.content = getContentFromState(editStatus.editorState)
    editStatus.editingContent = node.content
  }

  function editorStateCleanUp<S extends EditorState>(s: S) {
    const content = getContentFromState(s)
    const newState = createEditorState(content) as S
    return compose((s: S) => moveCursor(s.selection.to, s))(newState)
  }
}

export function cancelEditNode(id: IProjectNode['id'], state: State) {
  const editStatus = ensureEditStatus(id, state)
  const node = projectNode.selectors.getNode(state, { nodeId: id })

  state.focusingNodeIds = undefined
  delete editStatus.focusedAt
  if (node) {
    editStatus.editorState = createEditorState(node.content)
    editStatus.editingContent = node.content
  }
}

const autoInitEditorStateEpic: Epic<State, Actions> = (action$, state$) =>
  action$.pipe(
    map$(() => state$.value.nodes),
    distinctUntilChanged$(),
    map$(nodes => {
      const originalEditStatus = state$.value.nodeEditStatus || {}
      const _editStatus = Object.assign({}, originalEditStatus)
      const _nodes = Object.assign({}, nodes)
      return produce(originalEditStatus, editStatus => {
        // 补充新增加的 node 的 editStatus
        Object.keys(originalEditStatus).forEach(id => delete _nodes[id])
        Object.keys(_nodes).forEach(id => {
          editStatus[id] = castDraft({
            editorState: createEditorState(_nodes[id].content),
          })
        })

        // 移除多出来的 editStatus
        Object.keys(nodes || {}).forEach(id => delete _editStatus[id])
        Object.keys(_editStatus).forEach(id => {
          delete editStatus[id]
        })
      })
    }),
    distinctUntilChanged$(),
    mergeMap$(editStatus => of$(actionCreators.updateEditorStates(editStatus))),
  )

export const epic = combineEpics(autoInitEditorStateEpic)
