import * as projectNodeSelectors from '../project_node/selectors'
import { State } from './'
import { IProjectNode } from '../../types'
import { createEditorState } from '../../services/ProseMirrorService'
import { ensureEditStatus } from './ensure_edit_status'

export function ensureEditorState(nodeId: IProjectNode['id'], state: State) {
  const node = projectNodeSelectors.getNode(state, { nodeId })
  const editStatus = ensureEditStatus(nodeId, state)
  const editorState =
    editStatus.editorState ||
    createEditorState(
      editStatus.editingContent == null
        ? node.content
        : editStatus.editingContent,
    )
  return (editStatus.editorState = editorState)
}
