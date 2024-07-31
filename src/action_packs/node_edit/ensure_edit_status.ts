import { IProjectNode } from "../../types"
import { State } from "../project_node"
import * as selectors from '../project_node/selectors'

export const ensureEditStatus = (id: IProjectNode['id'], state: State) => {
  state.nodeEditStatus = state.nodeEditStatus || {}
  state.nodeEditStatus[id] = state.nodeEditStatus[id] || {}
  return selectors.getEditStatus(id, state)
}
