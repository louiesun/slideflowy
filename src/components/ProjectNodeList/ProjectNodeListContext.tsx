import { identity } from '../../utils/F'
import { IProjectNode } from '../../types'

export interface ProjectNodeListContextValue {
  registerListItem: (nodeId: IProjectNode['id'], el: null | HTMLElement) => any
  onDragStart: (nodeId: IProjectNode['id']) => void
  onDragEnd: () => void
}

export const ProjectNodeListContext = React.createContext<
  ProjectNodeListContextValue
>({
  registerListItem: identity as any,
  onDragStart: identity as any,
  onDragEnd: identity as any,
})