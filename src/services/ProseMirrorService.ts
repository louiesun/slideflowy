import {
  EditorState,
  Transaction,
  Selection,
  TextSelection,
} from 'prosemirror-state'
import {
  DOMParser as PmDOMParser,
  DOMSerializer,
  MarkType,
  Slice,
  Node as PmNode,
  Fragment,
} from 'prosemirror-model'
import { SimpleObj } from '../types'
import { createNode } from './ProjectNodeService'
import { schema } from './ProseMirrorService/Schema'
import { EditorView } from 'prosemirror-view'
import { getElementRevPosRect } from '../utils/DOM'
import { plugins } from './ProseMirrorService/Plugins'

export { schema, Schema } from './ProseMirrorService/Schema'

export const htmlToNode = (html: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return PmDOMParser.fromSchema(schema).parse(doc.body, {
    preserveWhitespace: true,
  })
}

export const nodeToHtml = (node: PmNode) => {
  const serializer = DOMSerializer.fromSchema(schema)
  if (node.type === schema.nodes.doc) {
    const fragment = serializer.serializeFragment(node.content)
    return Array.from(fragment.children)
      .map((v: HTMLElement) => {
        if (v.nodeName === 'MATH-DISPLAY') {
          return '<math-display class="math-node">' + v.innerHTML + '</math-display>'
        } else {
          return v.innerHTML
        }
      })
      .join('')
  } else {
    const domNode = serializer.serializeNode(node)
    return domNode instanceof Element ? domNode.innerHTML : ''
  }
}

export const createEditorState = (content?: string) => {
  if (!content) {
    return EditorState.create({
      schema,
      plugins,
    })
  }
  const editorState = EditorState.create({
    schema,
    doc: htmlToNode(content),
    plugins,
  })
  return moveCursor('end', editorState)
}

export const createEditorStateWithDoc = (doc?: PmNode) => {
  return EditorState.create({
    schema,
    doc,
    plugins,
  })
}

export const getContentFromState = (editorState: EditorState): string => {
  return nodeToHtml(editorState.doc)
}

export const isTextSelection = (s: Selection): s is TextSelection => {
  return s instanceof TextSelection
}

/**
 * 接收两个参数，第二个参数在忽略时会使用当前选区
 */
export function hasMark(markType: MarkType, content = Slice.empty as Slice) {
  return (state: EditorState) => {
    content = ensureSlice(content, state.selection)
    if (content === Slice.empty) return false

    let has = false
    content.content.forEach(node => {
      if (node.childCount) {
        // 有子节点的元素的 range 下标 0 和下标 length - 1 是元素自己的标签
        // 所以子元素的 range 是 0 + 1 和 (length - 1) - 1
        has = node.rangeHasMark(1, node.nodeSize - 2, markType)
      } else {
        has = Boolean(markType.isInSet(node.marks))
      }
    })
    return has
  }
}

/**
 * https://github.com/ProseMirror/prosemirror-commands/blob/ae2c78bfdf44579e57e78ac7037a70d88e0a6b05/src/commands.js#L455
 */
export function applyMark(markType: MarkType, attrs?: SimpleObj) {
  return (state: EditorState): void | Transaction => {
    const { selection } = state
    const $cursor = isTextSelection(selection) ? selection.$cursor : null
    if (selection.empty || $cursor) return

    return state.tr
      .addMark(selection.from, selection.to, markType.create(attrs))
      .scrollIntoView()
  }
}

export function cleanMark(markType: MarkType) {
  return (state: EditorState): void | Transaction => {
    const { selection } = state
    const $cursor = isTextSelection(selection) ? selection.$cursor : null
    if (selection.empty || $cursor) return

    return state.tr
      .removeMark(selection.from, selection.to, markType)
      .scrollIntoView()
  }
}

export function replaceTextWithMark(
  text: string,
  markType: MarkType,
  attrs?: SimpleObj,
) {
  return (state: EditorState) => {
    const { selection } = state
    const $cursor = isTextSelection(selection) ? selection.$cursor : null
    if (selection.empty || $cursor) return

    const node = schema.text(text, [
      ...selection.$head.marks(),
      markType.create(attrs),
    ])
    state = state.apply(
      state.tr.replaceWith(selection.from, selection.to, node),
    )
    return state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, selection.from + node.nodeSize),
      ),
    )
  }
}

function ensureSlice(slice: Slice, selection: Selection): Slice {
  if (slice === Slice.empty) {
    const { empty } = selection
    const $cursor = isTextSelection(selection) ? selection.$cursor : null
    if (empty || $cursor) return Slice.empty
    slice = selection.content()
  }

  return slice
}

export function moveCursor(
  pos: 'start' | 'end' | number,
  editorState: EditorState,
) {
  let selection: Selection
  if (pos === 'start') {
    selection = Selection.atStart(editorState.doc)
  } else if (pos === 'end') {
    selection = Selection.atEnd(editorState.doc)
  } else {
    selection = TextSelection.create(editorState.doc, pos)
  }

  return editorState.apply(editorState.tr.setSelection(selection))
}

/**
 * 消掉接收的 Slice 里第一层标签
 *
 * ```html
 * <p>123<span>aaa</span></p><p>hello</p><span>world</span>
 * ```
 *
 * 变成
 *
 * ```html
 * 123<span>aaa</span>hello<span>world</span>
 * ```
 */
export function unwrapContainersShallow(slice: Slice) {
  const children = getNodes(slice.content)
  const concatedChild = children.reduce((concated, child) => {
    if (concated.isInline) {
      concated = schema.nodes.paragraph.create({}, concated) as PmNode
    }

    return concated.replace(
      concated.nodeSize - 2,
      concated.nodeSize - 2,
      concated.isInline
        ? Slice.maxOpen(Fragment.fromArray([concated]))
        : child.slice(0),
    )
  })
  return concatedChild.slice(0)
}

/**
 * 把 Slice 根据 BlockNode 拆分成一个数组，然后创建 ProjectNode
 *
 * ```html
 * 123<span>aaa</span><p>hello</p><span>world</span>
 * ```
 *
 * 变成
 *
 * ```js
 * [
 *   ['123', '<span>aaa</span>'],
 *   ['hello'],
 *   ['<span>world</span>']
 * ].map(... => createNode(...))
 * ```
 */
export function parseProjectNodeFromProseMirrorSlice(slice: Slice) {
  const children = getNodes(slice.content)
  const groupedNodes = children.reduce((grouped: PmNode[][], child) => {
    if (child.isBlock) {
      return grouped.concat([[child]])
    }

    const lastGroup = grouped[grouped.length - 1]

    if (lastGroup[0].isBlock) {
      return grouped.concat([[child]])
    }

    lastGroup.push(child)
    return grouped
  }, [])

  const wrappedNodes = groupedNodes.map(nodes => {
    if (nodes[0].isBlock) return nodes[0]
    return schema.node('paragraph', {}, nodes)
  })

  const serializer = DOMSerializer.fromSchema(schema)
  return wrappedNodes
    .map(node => serializer.serializeNode(node))
    .filter((n): n is HTMLElement => (n instanceof HTMLElement))
    .map(node => createNode({ content: node.innerHTML }))
}

export function getNodes(parent: Slice | Fragment): PmNode[] {
  if (parent instanceof Slice) {
    return (parent.content as any).content
  }

  if (parent instanceof Fragment) {
    return (parent as any).content
  }

  return []
}

export function posAtFirstLine(
  editorView: EditorView | undefined | null,
  pos: number | undefined | null,
) {
  if (!editorView || pos == null) return false

  const editorViewStyle = getComputedStyle(editorView.dom)
  const lineHeight = parseInt(editorViewStyle.lineHeight || '16px', 10)

  const editorViewPos = getElementRevPosRect(editorView.dom)
  const posCoords = editorView.coordsAtPos(pos)

  // 因为 TextNode 的 Rect 其实和行盒的尺寸是不一样的。可以尝试一下下面的 url
  //
  //   data:text/html,<html><p style="line-height:1.5;font-size:16px;">hello <span>world</span></p></html>
  //
  // 在 chrome 的 DevTools -> Elements 里，鼠标移动到 hello 那个 TextNode 上，
  // DevTools 会显示 TextNode 的尺寸，高度可能是 23px ，而 p 元素的高度是 24px
  //
  // prettier-ignore
  return (posCoords.top - editorViewPos.top) < (lineHeight / 2)
}

export function posAtLastLine(
  editorView: EditorView | undefined | null,
  pos: number | undefined | null,
) {
  if (!editorView || pos == null) return false

  const editorViewStyle = getComputedStyle(editorView.dom)
  const lineHeight = parseInt(editorViewStyle.lineHeight || '16px', 10)

  const editorViewPos = getElementRevPosRect(editorView.dom)
  const posCoords = editorView.coordsAtPos(pos)

  // 因为 TextNode 的 Rect 其实和行盒的尺寸是不一样的。可以尝试一下下面的 url
  //
  //   data:text/html,<html><p style="line-height:1.5;font-size:16px;">hello <span>world</span></p></html>
  //
  // 在 chrome 的 DevTools -> Elements 里，鼠标移动到 hello 那个 TextNode 上，
  // DevTools 会显示 TextNode 的尺寸，高度可能是 23px ，而 p 元素的高度是 24px
  //
  // prettier-ignore
  return (editorViewPos.bottom - posCoords.bottom) < (lineHeight / 2)
}

type PmNodeDescendantsFnParams = Parameters<
  Parameters<PmNode['descendants']>[0]
>
export function findPos(
  predicate: (...args: PmNodeDescendantsFnParams) => boolean,
  node: PmNode,
) {
  let finalPos = null as number | null
  node.descendants((node, pos, parent, index) => {
    if (finalPos != null) return false
    const res = predicate(node, pos, parent, index)
    if (res) finalPos = pos
    return !res
  })
  return finalPos || 0
}
