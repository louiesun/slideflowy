import { IProjectNode } from '../../types'
import { State } from '../node_edit'
import { ensureEditStatus } from './ensure_edit_status'
import { Transaction } from 'prosemirror-state'
import { getContentFromState } from '../../services/ProseMirrorService'
import { EditorView } from 'prosemirror-view'
import { Schema } from '../../services/ProseMirrorService'

export function applyTransaction(
  id: IProjectNode['id'],
  tr: Transaction,
  state: State,
  // @ts-ignore
  view?: EditorView<Schema>
) {
  const editStatus = ensureEditStatus(id, state)
  if (!editStatus.editorState) return
  editStatus.editorState = editStatus.editorState.apply(tr)
  editStatus.editingContent = getContentFromState(editStatus.editorState)
  if (view) {
    view.updateState(editStatus.editorState)
  }
}
