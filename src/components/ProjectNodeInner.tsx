import { FC, useContext } from 'react'
import { IProjectNode } from '../types'
import { ProjectNodeImageList } from '../containers/ProjectNodeImageList'
import { ProjectNodeContentView } from '../containers/ProjectNodeContentView'
import { ProjectNodeImageUploader } from '../containers/ProjectNodeImageUploader'
import { FocusContext } from './Selection/FocusContext'

export interface ProjectNodeInnerProps {
  nodeId: IProjectNode['id']
  selected: boolean
}

export const ProjectNodeInner: FC<ProjectNodeInnerProps> = props => {
  const ctx = useContext(FocusContext)
  return (
    <>
      <ProjectNodeContentView
        nodeId={props.nodeId}
        storeAnchor={ctx.storeAnchor}
      />
      <ProjectNodeImageList
        nodeId={props.nodeId}
        selected={props.selected}
        storeImgUrl={ctx.storeImgUrl}
      />
      <ProjectNodeImageUploader nodeId={props.nodeId} />
    </>
  )
}
