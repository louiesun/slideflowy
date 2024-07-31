import React, {memo, useState} from 'react'
import {
  useDrag,
  useDrop,
  DropTargetMonitor,
} from 'react-dnd'
import classnames from 'classnames'
import { ProjectNode } from '../../containers/ProjectNode'
import {
  SelectionItem,
  SelectionItemProps,
  getElementPosRect,
  moveDirection,
} from '../Selection'
import { IProjectNode } from '../../types'
import { isDescendantNode, nodeSeeminglyAppendSiblingAvailable } from '../../services/ProjectNodeService'
import { NodeOrderIntend, selectors } from '../../action_packs/project_node'
import { evolve } from '../../utils/F/shallowChanged'
import shallowEqual from 'shallowequal'

const { isAncestor, isCoveredInSelectedNodeIds } = selectors

export interface DraggableProjectNodeProps {
  isDraggingCovered: boolean
  innerElemRef: (id: IProjectNode['id'], elem: null | HTMLElement) => void
  index: number
  node: IProjectNode
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  draggable: boolean
  onDragStart: (id: IProjectNode['id']) => void
  onDragEnd: () => void
  onReordered: (
    sourceNodeId: IProjectNode['id'],
    targetNodeId: IProjectNode['id'],
    intend: NodeOrderIntend,
  ) => void
  isSelectedInState: boolean
  lastSelectedNodeIds: IProjectNode['id'][]
  draggingCoveredNodeIds: { [id in IProjectNode['id']]: IProjectNode }
  cancelSelectedNodeIds: () => void
}

type DraggableProjectNodeState = null | NodeOrderIntend

const __DraggableProjectNode: React.FC<DraggableProjectNodeProps> = (props) => {
  const [dndMoveIntend, setDndMoveIntend] = useState<DraggableProjectNodeState>(null)

  const [{isDragging}, drag] = useDrag(() => {
    return {
      type: 'ProjectNode',
      item: () => {
        // 在 Chrome 与 Safari 中，如果在 dragStart 事件还未结束时，将 dragSource 指定 pointer-events = none，会导致拖拽事件直接结束
        // 此处采取异步推迟的方式解决
        setTimeout(() => props.onDragStart(props.node.id), 0)
        return props
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      canDrag: () => {
        return props.draggable
      },
      end: () => {
        props.onDragEnd()
      }
    }
  }, [props.draggable, props.node, props.onDragStart, props.onDragEnd])

  const [{isOver}, drop] = useDrop(() => ({
    accept: 'ProjectNode',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    hover: (item, monitor) => {
      const newDndMoveIntend = dndHoverIntend(item as DraggableProjectNodeProps, monitor)
      const a = dndMoveIntend === null
      const b = newDndMoveIntend === null
      if (a !== b) {
        setDndMoveIntend(newDndMoveIntend)
      } else if (a === b && a === true) {
        return
      } else if (
        dndMoveIntend!.relation !== newDndMoveIntend!.relation ||
        dndMoveIntend!.position !== newDndMoveIntend!.position
      ) {
        setDndMoveIntend(newDndMoveIntend)
      }
    },
    drop: (item, monitor) => {
      const info = dndHoverIntend(item as DraggableProjectNodeProps, monitor)
      if (!info) return
      const selectedNodeIds = props.lastSelectedNodeIds && props.lastSelectedNodeIds.length !== 0 ? 
        props.lastSelectedNodeIds : 
        [(monitor.getItem() as DraggableProjectNodeProps).node.id]
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
      props.onDragEnd()
      props.cancelSelectedNodeIds()
      const reversed = info.position === 'after' ? topNodeIds.reverse() : topNodeIds
      reversed.forEach((id: string) => {
        props.onReordered(id, props.node.id, info)
      })
    }
  }), [props.node, props.nodes, props.onReordered, props.lastSelectedNodeIds, dndMoveIntend])

  const dndHoverIntend = (  
    item: DraggableProjectNodeProps,
    monitor: DropTargetMonitor,
  ): DraggableProjectNodeState => {
    const defaultReturn = null

    const dragId = item.node.id
    const dropId = props.node.id

    // Don't replace items with themselves
    if (
      dragId === dropId || 
      isCoveredInSelectedNodeIds(props.node.id, props.lastSelectedNodeIds)
    ) {
      return defaultReturn
    }

    // Determine rectangle on screen
    const hoveredElem = document.getElementsByClassName('DraggableProjectNode')[props.index]
    if (!(hoveredElem instanceof HTMLElement)) return defaultReturn
    const hoverBoundingRect = hoveredElem.getBoundingClientRect()
  
    // Determine mouse position
    const clientOffset = monitor.getClientOffset()
    if (!clientOffset) return defaultReturn
  
    const dndMoveIntend: NodeOrderIntend = {
      relation: 'sibling',
      position: 'after',
    }
  
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    const hoverClientY = clientOffset.y - hoverBoundingRect.top
    // 光标在覆盖的元素上半部分时在元素前方插入，在下半部分时在后方插入
    if (hoverClientY < hoverMiddleY) {
      dndMoveIntend.position = 'before'
    } else {
      dndMoveIntend.position = 'after'
  
      const hoverClientX = clientOffset.x - hoverBoundingRect.left
      // 如果节点看起来没办法追加同级节点
      if (
        !nodeSeeminglyAppendSiblingAvailable(props.node) ||
        hoverClientX > 100
      ) {
        dndMoveIntend.relation = 'child'
      } else {
        dndMoveIntend.relation = 'sibling'
      }
    }

    if (isDescendantNode(props.nodes, dragId, dropId)) {
      return defaultReturn
    }
  
    return dndMoveIntend
  }

  const innerRef = (elem: HTMLDivElement) => {
    props.innerElemRef(props.node.id, elem)
  }

  const getContainerDndRelatedClasses = () => {
    if (!isOver) return {}
    if (!dndMoveIntend) return {}
    return {
      'DraggableProjectNode--hover-intend-before':
        dndMoveIntend.position === 'before',
      'DraggableProjectNode--hover-intend-after':
        dndMoveIntend.position === 'after',
      'DraggableProjectNode--hover-intend-sibling':
        dndMoveIntend.relation === 'sibling',
      'DraggableProjectNode--hover-intend-child':
        dndMoveIntend.relation === 'child',
    }
  }

  return (
    <div ref={drop}>
      <div
        ref={innerRef}
        className={classnames([
          'DraggableProjectNode',
          {
            ...getContainerDndRelatedClasses(),
            'DraggableProjectNode--dragging': isDragging || 
              props.isDraggingCovered ||
              (
                isCoveredInSelectedNodeIds(props.node.id, props.lastSelectedNodeIds || []) && 
                props.draggingCoveredNodeIds && Object.keys(props.draggingCoveredNodeIds || []).length > 0
              )
          },
        ])}
      >
        <DraggableProjectNodeInner
          isSelectedInState={props.isSelectedInState}
          node={props.node}
          dragSourceRef={drag}
        />
      </div>
    </div>
  )
}

__DraggableProjectNode.defaultProps = {
  isSelectedInState: false
}

const isDraggableProjectNodePropsEqual = (prevProps: DraggableProjectNodeProps, nextProps: DraggableProjectNodeProps) => {
  return shallowEqual(
    prevProps,
    nextProps,
    evolve<DraggableProjectNodeProps>({
      node: (a, b) => a.id === b.id
    }),
  )
}

export const DraggableProjectNode = memo(__DraggableProjectNode, isDraggableProjectNodePropsEqual)

interface DraggableProjectNodeInnerProps {
  isSelectedInState: boolean
  node: IProjectNode
  dragSourceRef: React.Ref<HTMLElement>
}

const __DraggableProjectNodeInner: React.FC<DraggableProjectNodeInnerProps> = (props) => {
  const shouldSelect: SelectionItemProps<any>['shouldSelect'] = (
    elem,
    pageSelectionRange,
  ) => {
    const elemRect = getElementPosRect(elem)
    const currPos = pageSelectionRange[1]
    const direction = moveDirection(pageSelectionRange)
    if (!direction) return false

    if (direction.down) {
      return currPos.top - elemRect.top > 10
    } else if (direction.up) {
      return elemRect.bottom - currPos.top > 10
    } else {
      return true
    }
  }

  return (
    <SelectionItem
      item={props.node}
      shouldSelect={shouldSelect}
      children={ctx => (
        <ProjectNode
          itemRef={ctx.innerRef}
          selected={
            ctx.isSelecting ? ctx.selected : props.isSelectedInState
          }
          nodeId={props.node.id}
          dragSourceRef={props.dragSourceRef}
        />
      )}
    />
  )
}

const isDraggableProjectNodeInner = (prevProps: DraggableProjectNodeInnerProps, nextProps: DraggableProjectNodeInnerProps) => {
  return shallowEqual(
    prevProps,
    nextProps,
    evolve<DraggableProjectNodeInnerProps>({
      node: (a, b) => a.id === b.id,
    }),
  )
}

const DraggableProjectNodeInner = memo(__DraggableProjectNodeInner, isDraggableProjectNodeInner)