import { chain, identity, findLast, trim, fromPairs } from 'ramda'
import { State } from '../action_packs/project_node'
import { IProjectNode, StoreProjectNode } from '../types'
import { uuid, uuidToBase64, isTextUuid } from '../utils/uuid'
import * as F from '../utils/F'
import * as ProseMirrorService from './ProseMirrorService'
import { Slice } from 'prosemirror-model'
import memoizeOne from 'memoize-one'
import { processLinkInContent } from './ProseMirrorService/AutoLinkInputRule'
import { endlessReplace, replaceSubstring } from '../utils/S'

export const ClipboardInternalMimeType =
  'application/x-nutsflowy-clipboard-data'
export const ClipboardRawTextMimeType = 'text/plain'
export const ClipboardRichTextMimeType = 'text/html'

const textToMarkdownSimply = (text: string) => {
  return text
    .replace(/<span.*?>(.+?)<\/span>/g, ($0, $1) => $1)
    .replace(/<strong>(.+?)<\/strong>/g, ($0, $1) => `**${$1}**`)
    .replace(/<em>(.+?)<\/em>/g, ($0, $1) => `*${$1}*`)
    .replace(/<u>(.+?)<\/u>/g, ($0, $1) => `_${$1}_`)
    .replace(
      /<a\s.*?href=(?:"|')(.+?)(?:"|')(.*?)>(.+?)<\/a>/g,
      ($0, $1, $2, $3) =>
        /\s+data-ns-from-auto-link=\bfalse\b/.test($2) ? `[${$3}](${$1})` : $3,
    )
}

export const projectNodeToRichTextItems = (
  node: IProjectNode,
  state: State,
): string => {
  const childStrs = getChildNodes(node, state).map(n =>
    projectNodeToRichTextItems(n, state),
  )
  const childCombined = childStrs.length ? `<ul>${childStrs.join('')}</ul>` : ''
  const itemSelf = node.completed ? `<s>${node.content}</s>` : node.content
  return `<li>${itemSelf}${childCombined}</li>`
}

export const projectNodesToRichText = (nodes: IProjectNode[], state: State) => {
  return (
    '<ul>' +
    nodes.map(n => projectNodeToRichTextItems(n, state)).join('') +
    '</ul>'
  )
}

export const projectNodeToRawTextItems = (
  node: IProjectNode,
  state: State,
): string[] => {
  const selfStr = `* [${node.completed ? 'x' : ' '}] ${textToMarkdownSimply(
    node.content,
  )}`
  const childStrs = chain(
    n => projectNodeToRawTextItems(n, state).map(s => '    ' + s),
    getChildNodes(node, state),
  )
  return [selfStr].concat(childStrs)
}

export const projectNodesToRawText = (nodes: IProjectNode[], state: State) => {
  return chain(n => projectNodeToRawTextItems(n, state), nodes).join('\n')
}

export const filterChildrenNodeShallow = (
  nodes: IProjectNode[],
): IProjectNode[] => {
  const childrenIds: IProjectNode['id'][] = []
  nodes.forEach(node => childrenIds.push(...node.childrenIds))
  return nodes.filter(node => childrenIds.indexOf(node.id) === -1)
}

export const projectNodesFromInternalClipboardData = (dataStr: string) => {
  // WARNING: 注意这里虽然类型写的是 IProjectNode ，但其实 createdAt
  //          还不是 Date
  let clipboardNodes: IProjectNode[]

  try {
    clipboardNodes = JSON.parse(dataStr)
    // TODO: 更严格的检查和对应的错误处理逻辑
    if (!Array.isArray(clipboardNodes)) return F.emptyAry
  } catch {
    return F.emptyAry
  }

  return clipboardNodes.map(n => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
  }))
}

const parseRichPrefixRE = /^\s*(?:\*|\-)\s+(?:\[([^\]])?\])?\s*/

export const projectNodesFromRawTextValid = (text: string) => {
  const trimedText = text.trim()

  if (
    trimedText.split(/\n|\r|\r\n/).length > 1 ||
    // 如果文本以 `* [] `, `* [ ] `, `* [x] ` 开头，那么即使是单行
    // 的文本，也认为是需要转换的
    trimedText.match(/^\* \[(\s*|x)\] /)
  ) {
    return true
  }

  return parseRichPrefixRE.test(text)
}

/**
 * 支持的纯文本规则：
 *
 *   * 以 \n 或 \r 或 \r\n 分隔
 *   * 以空格或者制表符缩进，缩进越少层级越高
 *   * 当以 * 或 - 开头并且后面至少有一个空格时，如果后面跟随了 [] 或 [ ] 或 [x] ，转换为完成状态
 *   * 支持 markdown 的 *xxx* 和 **xxx**
 */
export const projectNodesFromRawText = (text: string) => {
  const getIndentLevel = (s: string) => {
    const matches = s.match(/^\s*/)
    if (!matches) return 0
    return matches[0].split(/(\s)/).filter(identity).length
  }

  const getCompleteStatus = (s: string) => {
    const matches = s.match(parseRichPrefixRE)
    if (!matches) return false
    return matches[1] === 'x'
  }

  const items = text
    .split(/\n|\r|\r\n/)
    .filter(trim)
    .map(s => ({
      indentLevel: getIndentLevel(s),
      completed: getCompleteStatus(s),
      content: limitedMarkdownToHtml(s.replace(parseRichPrefixRE, '')),
    }))

  type Item = typeof items extends (infer T)[] ? T : never

  const results = items.reduce((results, i, idx) => {
    const node: IProjectNode = createNode({
      content: i.content,
      completed: i.completed,
    })

    results = results.concat({ node, item: i })

    if (idx === 0) return results
    if (i.indentLevel === 0) return results

    const parent = findLast(r => r.item.indentLevel < i.indentLevel, results)
    if (!parent) return results

    parent.node.childrenIds.push(node.id)

    return results
  }, F.emptyAry as { node: IProjectNode; item: Item }[])

  return results.map(r => r.node)
}

function limitedMarkdownToHtml(md: string) {
  let result = md
  result = replace(/\*\*([^\*]+)\*\*/, s => `<strong>${s}</strong>`, result)
  result = replace(/\*([^\*]+)\*/, s => `<em>${s}</em>`, result)
  result = replace(/_([^\_]+)\_/, s => `<u>${s}</u>`, result)
  result = processLinkInContent(result)
  return result

  function replace(
    re: RegExp,
    processer: (content: string) => string,
    str: string,
  ) {
    return endlessReplace(
      re,
      (match, stepStr) =>
        replaceSubstring(
          match.index,
          match[0].length,
          processer(match[1]),
          stepStr,
        ),
      str,
    )
  }
}

export const getChildNodesRecursively = memoizeOne(
  (node: IProjectNode, state: State): IProjectNode[] => {
    if (node.childrenIds.length) {
      const children = getChildNodes(node, state)
      return chain(
        childNode =>
          [childNode].concat(getChildNodesRecursively(childNode, state)),
        children,
      )
    } else {
      return F.emptyAry
    }
  },
)

export const getTopNodes = (state: State) =>
  filterNodes(state.rootNodeIds || F.emptyAry, state)

export const getChildNodes = (node: IProjectNode, state: State) =>
  filterNodes(node.childrenIds, state)

export const filterNodes = (nodeIds: IProjectNode['id'][], state: State) =>
  nodeIds.map(id => getNode(id, state)).filter(Boolean)

export const getNodes = (state: State) => state.nodes || F.emptyObj

export const getNode = (
  nodeId: IProjectNode['id'],
  state: State,
): IProjectNode => getNodes(state)[nodeId]

export const isExistedProjectNode = (
  a: IProjectNode | undefined | null,
): a is IProjectNode => Boolean(a)

export function createNode(props: Partial<IProjectNode> = {}): IProjectNode {
  return {
    id: uuid({ base64: true }),
    content: '',
    expanded: false,
    completed: false,
    childrenIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    depth: 0,
    ...props,
  }
}

export function isDescendantNode(nodes: { [id in IProjectNode['id']]: IProjectNode }, faId: IProjectNode['id'], sonId: IProjectNode['id']): boolean {
  const fa = nodes[faId]
  const son = nodes[sonId]
  if (!fa || !son) return false
  if (fa.childrenIds.indexOf(sonId) !== -1) return true
  return fa.childrenIds.some(id => isDescendantNode(nodes, id, sonId))
}

export function nodeSeeminglyAppendSiblingAvailable(node: IProjectNode) {
  if (!node.expanded) return true
  return node.childrenIds.length <= 1
}

/**
 * 如果找不到传入的子节点或者对应的父节点，则什么都不返回
 * 如果在 rootNodeIds 里找到了，则返回的 parentNode 为 null
 *
 * @return node 是找到的节点本身，parentNode 是找到的父节点
 */
export const findParentNode = memoizeOne(
  (nodeOrNodeId: IProjectNode['id'] | IProjectNode, state: State) => {
    const node =
      typeof nodeOrNodeId === 'string'
        ? getNode(nodeOrNodeId, state)
        : nodeOrNodeId

    if (!node || !state.rootNodeIds) return

    const isRootChildNode = state.rootNodeIds.indexOf(node.id) !== -1

    if (isRootChildNode) {
      return { node, parentNode: null }
    }

    const parentNode = getParentNode(node.id, state)

    if (!parentNode) return

    return { node, parentNode }
  },
)

export const findParentTree = memoizeOne(
  (id: IProjectNode['id'] | null, state: State): IProjectNode[] => {
    if (!id) return F.emptyAry

    const node = getNode(id, state)
    if (!node || !state.rootNodeIds) return F.emptyAry

    let currNode = node
    let parentNode: IProjectNode | undefined
    const parentTree = [currNode]
    // tslint:disable-next-line:no-conditional-assignment
    while ((parentNode = getParentNode(currNode.id, state))) {
      parentTree.unshift(parentNode)
      currNode = parentNode
    }

    return parentTree
  },
)

function getParentNode(nodeId: IProjectNode['id'], state: State) {
  const parentMap = state.nodesParentMap || {}
  const parentId = parentMap[nodeId]
  if (!parentId) return
  if (!state.nodes) return
  return state.nodes[parentId]
}

export const getParentMap = memoizeOne((state: State) => {
  type ParentMapPair = [string, IProjectNode['id'] | null]
  const nodes = getNodes(state)
  const rootNodeIds = getRootNodeIds(state)
  const parentMapPairs = rootNodeIds
    .map(id => [id, null] as ParentMapPair)
    .concat(
      chain(id => {
        const node = nodes[id]
        return node.childrenIds.map(
          (childId: string) => [childId, node.id] as ParentMapPair,
        )
      }, Object.keys(nodes)),
    )
  return fromPairs(parentMapPairs as ParentMapPair[])
})

export const getNoneNestedNodeList = memoizeOne((state: State, reserveCollapsed?: boolean) => {
  const selectAsRootNodeId = state.selectAsRootNodeId
  let rootNodes: IProjectNode[]
  const nodeList: IProjectNode[] = []
  const pushChildrenNodes = (nodes: IProjectNode[]) => {
    nodes.forEach(node => {
      nodeList.push(node)
      if (reserveCollapsed || (!reserveCollapsed && node.expanded)) {
        pushChildrenNodes(getChildNodes(node, state))
      }
    })
  }
  if (selectAsRootNodeId != null) {
    rootNodes = getChildNodes(getNode(selectAsRootNodeId, state), state)
  } else {
    rootNodes = getTopNodes(state)
  }
  pushChildrenNodes(rootNodes)
  return nodeList
})

export const getRootNodeIds = (state: State) => state.rootNodeIds || F.emptyAry

export const insertToChildrenIds = (
  locationId: IProjectNode['id'],
  insertId: IProjectNode['id'],
  position: 'before' | 'after',
  childrenIds: IProjectNode['id'][],
) => {
  const equalLocationId = (i: any) => i === locationId
  if (position === 'after') {
    return F.append(equalLocationId, insertId, childrenIds)
  } else {
    return F.prepend(equalLocationId, insertId, childrenIds)
  }
}

export const removeChildId = (
  nodeId: IProjectNode['id'],
  childrenIds: IProjectNode['id'][],
) => {
  return childrenIds.filter(i => i !== nodeId)
}

/**
 * 判断剪贴板里的 html 是不是其实是 markdown 纯文本
 * 在不支持 navigator.clipboard.writeText API 的浏览器里（比如 Edge ），
 * 复制纯文本格式的内容到剪贴板用的是 document.execCommand ，会生成 MIME
 * 类型为 text/html 的 clipboardData ，这种情况下不应该交给 ProseMirror
 * 来转换，否则会把多行纯文本当成单行文本
 */
export function clipboardHtmlIsPlainTextEssentially(event: ClipboardEvent) {
  if (!event.clipboardData) return false

  const htmlData = event.clipboardData.getData('text/html')
  const textData = event.clipboardData.getData('text/plain')
  if (!htmlData) return true
  if (!textData) return false

  if (!('DOMParser' in window)) return true

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlData, 'text/html')
  const elems = Array.from(doc.querySelectorAll('body > *'))
  if (elems.length > 1) return false
  if (elems[0].tagName.toLowerCase() !== 'span') return false

  const { textContent } = elems[0]
  if (!textContent) return false
  // Windows 上用 execCommand 复制的文本，换行符是 \r\n ，而
  // textContent 里不会有这个
  if (textContent !== textData.replace(/\r/g, '')) return false

  return true
}

export function getClipboardImageFile(event: ClipboardEvent): File | null {
  if (!event.clipboardData?.types) return null

  return (
    Array.from(event.clipboardData.items)
      .find(item => item.kind === 'file' && item.type.startsWith('image/'))
      ?.getAsFile() || null
  )
}

// TODO:
//  * 在有 slice 的情况下，支持基本的 markdown 列表语法，并保留缩进
//  * 支持 ul/li 标签，并保留缩进
export function parseProjectNodeFromClipboardEvent(
  event: Event,
  slice?: Slice,
) {
  if (!(event instanceof ClipboardEvent)) return

  let result: IProjectNode[] | undefined

  if (
    !result &&
    event.clipboardData &&
    event.clipboardData.types.indexOf(ClipboardInternalMimeType) !== -1
  ) {
    result = parseFromInternalMimeType(event)
  }

  if (!result && clipboardHtmlIsPlainTextEssentially(event)) {
    result = parseTreatAsMarkdown(event)
  }

  if (!result && slice) {
    const blockNodes = ProseMirrorService.getNodes(slice).filter(
      node => node.isBlock,
    )
    // 只有多段文本才需要粘贴为多个节点，否则就让富文本编辑器自己处理
    if (blockNodes.length > 1) {
      result = parseFromProseMirrorSlice(slice)
    }
  }

  return result && result.length ? result : undefined

  function parseFromInternalMimeType(event: ClipboardEvent) {
    const internalMimeTypeClipboardDataStr =
      event.clipboardData &&
      event.clipboardData.getData(ClipboardInternalMimeType)

    if (!internalMimeTypeClipboardDataStr) return

    return projectNodesFromInternalClipboardData(
      internalMimeTypeClipboardDataStr,
    )
  }

  function parseFromProseMirrorSlice(slice: Slice) {
    const nodesFromSlices =
      slice && ProseMirrorService.parseProjectNodeFromProseMirrorSlice(slice)

    if (nodesFromSlices && nodesFromSlices.length) {
      return nodesFromSlices
    }

    return
  }

  function parseTreatAsMarkdown(event: ClipboardEvent) {
    const rawTextMimeTypeClipboardDataStr =
      event.clipboardData &&
      event.clipboardData.getData(ClipboardRawTextMimeType)

    if (
      rawTextMimeTypeClipboardDataStr &&
      projectNodesFromRawTextValid(rawTextMimeTypeClipboardDataStr)
    ) {
      return projectNodesFromRawText(rawTextMimeTypeClipboardDataStr)
    }

    return
  }
}

export function getStoreProjectNodes(
  state: State,
  options: getStoreProjectNodes.Options = {},
) {
  const nodes = F.mapkv(projectNodeToStoreProjectNode, state.nodes || {})
  if (!options.includeEditingContent) return nodes
  if (!state.nodeEditStatus) return nodes

  Object.keys(state.nodeEditStatus).forEach(id => {
    const status = state.nodeEditStatus![id]
    const node = nodes[id]

    if (
      !node ||
      !status ||
      status.editingContent == null ||
      status.editingContent === node.content
    ) {
      return
    }

    node.content = status.editingContent
  })

  return nodes
}
export namespace getStoreProjectNodes {
  export interface Options {
    includeEditingContent?: boolean
  }
}

export const uuidTryToBase64 = (id: string) => {
  return isTextUuid(id) ? uuidToBase64(id) : id
}

export function projectNodeToStoreProjectNode(
  n: IProjectNode,
  _: IProjectNode['id'],
): [StoreProjectNode['id'], StoreProjectNode] {
  const id = uuidTryToBase64(n.id)

  return [
    id,
    {
      id,
      content: n.content,
      expanded: n.expanded ? 1 : 0,
      completed: n.completed ? 1 : 0,
      childrenIds: n.childrenIds.map(uuidTryToBase64),
      createdAt: n.createdAt.getTime(),
      updatedAt: n.updatedAt.getTime(),
      images: n.images,
    },
  ]
}

export function projectNodeFromStoreProjectNode(
  n: StoreProjectNode,
  id: StoreProjectNode['id'],
): [IProjectNode['id'], IProjectNode] {
  return [
    n.id,
    {
      id: n.id,
      content: n.content,
      expanded: !!n.expanded,
      completed: !!n.completed,
      childrenIds: n.childrenIds,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
      images: n.images,
      depth: 0,
    },
  ]
}

export function getNodeDepth(node: IProjectNode, state: State) {
  let depth = 0
  let parent = getParentNode(node.id, state)
  const selectAsRootNodeId = state.selectAsRootNodeId
  while (parent !== undefined && parent.id !== selectAsRootNodeId) {
    depth++
    parent = getParentNode(parent.id, state)
  }
  return depth
}
