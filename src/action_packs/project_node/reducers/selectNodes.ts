import { chain, reduce, reduced } from 'ramda'
import { ActionType } from 'typesafe-actions'
import { selectors, actionCreators, State } from '../'
import { IProjectNode } from '../../../types'

export function selectNodes(
  {
    payload: { range, nodes: userSelectedNodes },
  }: ActionType<typeof actionCreators.selectNodes>,
  state: State,
) {
  state.projectNodeSelection = range

  if (!userSelectedNodes.length) {
    state.projectNodeUserSelectedNodeIds = []
    state.projectNodeAllSelectedNodeIds = []
    state.projectNodeAllSelectedCopyNodeIds = []
    return
  }

  state.projectNodeUserSelectedNodeIds = userSelectedNodes.map(n => n.id)
  state.projectNodeUserSelectedCopyNodeIds = userSelectedNodes.map(n => n.id)

  const sortedNodes = flatAndSortNodes(userSelectedNodes, state)
  state.projectNodeAllSelectedNodeIds = chain(node => {
    const children = selectors.getChildNodesRecursively(node, state)
    return [node.id].concat(children.map(node => node.id))
  }, sortedNodes)
  state.projectNodeAllSelectedCopyNodeIds = chain(node => {
    const children = selectors.getChildNodesRecursively(node, state)
    return [node.id].concat(children.map(node => node.id))
  }, sortedNodes)
}

export function selectCopyNodes(
  {
    payload: { nodes: userSelectedNodes },
  }: ActionType<typeof actionCreators.prepareBeforeCopyNodes>,
  state: State,
) {
  if (!userSelectedNodes.length) {
    state.projectNodeUserSelectedNodeIds = []
    state.projectNodeAllSelectedNodeIds = []
    state.projectNodeAllSelectedCopyNodeIds = []
    return
  }
  state.projectNodeUserSelectedCopyNodeIds = userSelectedNodes.map(n => n.id)
  const sortedNodes = flatAndSortNodes(userSelectedNodes, state)
  state.projectNodeAllSelectedCopyNodeIds = chain(node => {
    const children = selectors.getChildNodesRecursively(node, state)
    return [node.id].concat(children.map(node => node.id))
  }, sortedNodes)
}

/**
 * 压平传入的节点并且对他们根据视觉上的顺序进行排序。
 *
 * 这里的 `userSelectedNodes` 不要求节点之间是在视觉上两两相邻的。
 */
function flatAndSortNodes(userSelectedNodes: IProjectNode[], state: State) {
  // 过滤掉父节点已经在选区列表的节点，因为节点被选中后子节点一定属于被选中状态
  const isolateNodes = userSelectedNodes.filter(node =>
    userSelectedNodes.every(_node => _node.childrenIds.indexOf(node.id) === -1),
  )

  // 对组根据视觉上的顺序进行排序，排序的逻辑是先找到公共的祖先，然后根据所属的
  // 公共祖先次级节点位置进行排序
  isolateNodes.sort((fstNode, sndNode) => {
    const fstId = fstNode.id
    const sndId = sndNode.id

    // 获取除了 parentId 以外的祖先 id
    const fstAncestorIds = getAncestorIds(fstId, state)
    const sndAncestorIds = getAncestorIds(sndId, state)

    // 如果任何一个节点是根节点，就直接对比根节点
    const rootIdOrder = selectors.getRootNodeIds(state)
    if (!fstAncestorIds.length && !sndAncestorIds.length) {
      return compareIds(fstId, sndId, rootIdOrder)
    } else if (!fstAncestorIds.length) {
      return compareIds(fstId, sndAncestorIds[0], rootIdOrder)
    } else if (!sndAncestorIds.length) {
      return compareIds(fstAncestorIds[0], sndId, rootIdOrder)
    }

    // 如果 sndNode 是 fstNode 的祖先，就把 sndNode 上调，反之亦然
    if (fstAncestorIds.indexOf(sndId) > -1) return 1
    if (sndAncestorIds.indexOf(fstId) > -1) return -1

    // 找到公共祖先，然后根据公共祖先的次级节点位置进行排序
    const fstAncestorIdAndIdxPairs = fstAncestorIds.map(
      (id, idx) => [idx, id] as const,
    )
    fstAncestorIdAndIdxPairs.reverse()
    const commAncestorInfo = reduce(
      (ret, [fstAncestorIdx, id]) => {
        const sndAncestorIdx = sndAncestorIds.indexOf(id)
        if (sndAncestorIdx < 0) return ret

        // 如果 aAncestorIds 的最末尾元素出现在 bAncestorIds 里，有三种情况
        //
        // [1,2,3,4]a  <----  a 是 b 的祖先节点的兄弟节点，或者就是 b 的祖先节点
        // [1,2,3,4,5,6]b
        //
        // [1,2,3,4,5,6]a
        // [1,2,3,4]b
        //
        // [1,2,3,4]a  <----  这种情况不会出现，因为上面已经根据父节点分组过了
        // [1,2,3,4]b
        const fstComparableAncestorId =
          fstAncestorIds[fstAncestorIdx + 1] || fstId
        const sndComparableAncestorId =
          sndAncestorIds[sndAncestorIdx + 1] || sndId

        return reduced({
          commonAncestorId: id,
          fstComparableAncestorId,
          sndComparableAncestorId,
        })
      },
      null,
      fstAncestorIdAndIdxPairs,
    )

    // 如果没有公共祖先，就对比根节点
    if (!commAncestorInfo) {
      return compareIds(fstAncestorIds[0], sndAncestorIds[0], rootIdOrder)
    }

    const { childrenIds: commonParentChildrenIds } = selectors.getNode(state, {
      nodeId: commAncestorInfo.commonAncestorId,
    })

    return compareIds(
      commAncestorInfo.fstComparableAncestorId,
      commAncestorInfo.sndComparableAncestorId,
      commonParentChildrenIds,
    )
  })

  return isolateNodes
}

function compareIds(
  aId: IProjectNode['id'],
  bId: IProjectNode['id'],
  idOrder: IProjectNode['id'][],
): 1 | 0 | -1 {
  const aIdx = idOrder.indexOf(aId)
  const bIdx = idOrder.indexOf(bId)
  if (aIdx === bIdx) {
    return 0
  } else if (aIdx < bIdx) {
    return -1
  } else {
    return 1
  }
}

function getAncestorIds(id: IProjectNode['id'] | null, state: State): string[] {
  if (id) {
    return selectors.findParentTree(id, state).map(n => n.id)
  } else {
    return []
  }
}
