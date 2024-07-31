import { useDrop } from 'react-dnd'
import classnames from 'classnames'
import { DraggableProjectNodeProps } from './DraggableProjectNode'
import { IProjectNode } from '../../types'
import { selectors } from '../../action_packs/project_node'

const { isAncestor, isCoveredInSelectedNodeIds } = selectors

export interface DroppableEndingNodeProps {
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  noneNestedNodeList: IProjectNode[]
  lastSelectedNodeIds: IProjectNode['id'][]
  onDrop: (nodeId: IProjectNode['id']) => void
}

export const DroppableEndingNode: React.FC<DroppableEndingNodeProps> = (props) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ProjectNode',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    drop: (item: DraggableProjectNodeProps, monitor) => {
      if (
        !monitor.isOver({ shallow: true }) ||
        (props.lastSelectedNodeIds.length !== 0 && isCoveredInSelectedNodeIds(props.noneNestedNodeList[props.noneNestedNodeList.length - 1].id, props.lastSelectedNodeIds))
      ) {
        return
      }
      const selectedNodeIds = props.lastSelectedNodeIds && props.lastSelectedNodeIds.length !== 0 ?
        props.lastSelectedNodeIds : 
        [item.node.id]
      const topNodeIds: string[] = []
      selectedNodeIds.forEach((id, idx) => {
        if (idx === 0) {
          topNodeIds.push(id)
          return
        }
        if (!isAncestor(topNodeIds[topNodeIds.length - 1], id, props.nodes)) {
          topNodeIds.push(id)
        }
      })
      const reversed = topNodeIds.reverse()
      reversed.forEach((id: string) => {
        props.onDrop(id)
      })
    }
  }), [props.nodes, props.noneNestedNodeList, props.lastSelectedNodeIds, props.onDrop])

  return (
    <div
      ref={drop}
      className={classnames([
        'DroppableEndingNode',
        {
          'DroppableEndingNode--hovering': isOver && (
            props.lastSelectedNodeIds.length === 0 ||
            !isCoveredInSelectedNodeIds(props.noneNestedNodeList[props.noneNestedNodeList.length - 1].id, props.lastSelectedNodeIds)
          )
        },
      ])}
    />
  )
}
