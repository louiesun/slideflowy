import { nodes, marks } from 'prosemirror-schema-basic'
import { Schema as _Schema, Mark, DOMOutputSpec } from 'prosemirror-model'
import { autoLinkAttrMark } from './AutoLinkInputRule'

export const schema = new _Schema({
  nodes: {
    doc: nodes.doc,
    paragraph: nodes.paragraph,
    text: nodes.text,
    hard_break: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM() {
        return ['br']
      },
    },
    math_inline: { // important!
      group: 'inline math',
      content: 'text*', // important!
      inline: true, // important!
      atom: true, // important!
      toDOM: () => ['math-inline', { class: 'math-node' }, 0],
      parseDOM: [
        {
          tag: 'math-inline', // important!
        },
      ],
    },
    math_display: { // important!
      group: 'block math',
      content: 'text*', // important!
      atom: true, // important!
      code: true, // important!
      toDOM: () => ['math-display', { class: 'math-node' }, 0],
      parseDOM: [
        {
          tag: 'math-display', // important!
        },
      ],
    },
  },
  marks: {
    bold: marks.strong,
    italic: marks.em,
    underline: {
      parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
      toDOM(): DOMOutputSpec {
        return ['u']
      },
    },
    strikethrough: {
      parseDOM: [{ tag: 'del' }, { style: 'text-decoration=line-through' }],
      toDOM(): DOMOutputSpec {
        return ['del']
      },
    },
    link: {
      attrs: {
        href: {},
        title: { default: null },
        [autoLinkAttrMark]: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs(dom: HTMLAnchorElement) {
            return {
              href: dom.getAttribute('href'),
              title: dom.getAttribute('title'),
              [autoLinkAttrMark]:
                dom.getAttribute(autoLinkAttrMark) === 'true' ? true : false,
            }
          },
        },
      ],
      toDOM(node: Mark): DOMOutputSpec {
        return [
          'a',
          {
            ...node.attrs,
            rel: 'noreferrer noopener',
            target: '_blank',
          },
        ]
      },
    },
    color: {
      attrs: {
        color: {},
      },
      parseDOM: [
        {
          style: 'color',
          getAttrs(color: string) {
            return color ? { color } : false
          },
        },
        {
          tag: 'span[color]',
          getAttrs(elem: HTMLSpanElement) {
            const color = elem.getAttribute('color')
            return color ? { color } : false
          },
        },
      ],
      toDOM(node: Mark): DOMOutputSpec {
        return ['span', { style: `color: ${node.attrs.color}` }, 0]
      },
    },
    BGColor: {
      attrs: {
        BGColor: {},
      },
      parseDOM: [
        {
          style: 'background-color',
          getAttrs(BGColor: string) {
            return BGColor ? { BGColor } : false
          },
        },
        {
          tag: 'span[background-color]',
          getAttrs(elem: HTMLSpanElement) {
            const BGColor = elem.getAttribute('BGColor')
            return BGColor ? { BGColor } : false
          },
        },
      ],
      toDOM(node: Mark): DOMOutputSpec {
        return ['span', { style: `background-color: ${node.attrs.BGColor}` }, 0]
      },
    },
  },
})

export type Schema = typeof schema
