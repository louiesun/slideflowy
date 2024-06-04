import { nodes, marks } from 'prosemirror-schema-basic';
import { Schema as _Schema } from 'prosemirror-model';
import { autoLinkAttrMark } from './AutoLinkInputRule';
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
                return ['br'];
            },
        },
    },
    marks: {
        bold: marks.strong,
        italic: marks.em,
        underline: {
            parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
            toDOM() {
                return ['u'];
            },
        },
        strikethrough: {
            parseDOM: [{ tag: 'del' }, { style: 'text-decoration=line-through' }],
            toDOM() {
                return ['del'];
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
                    getAttrs(dom) {
                        return {
                            href: dom.getAttribute('href'),
                            title: dom.getAttribute('title'),
                            [autoLinkAttrMark]: dom.getAttribute(autoLinkAttrMark) === 'true' ? true : false,
                        };
                    },
                },
            ],
            toDOM(node) {
                return [
                    'a',
                    {
                        ...node.attrs,
                        rel: 'noreferrer noopener',
                        target: '_blank',
                    },
                ];
            },
        },
        color: {
            attrs: {
                color: {},
            },
            parseDOM: [
                {
                    style: 'color',
                    getAttrs(color) {
                        return color ? { color } : false;
                    },
                },
                {
                    tag: 'span[color]',
                    getAttrs(elem) {
                        const color = elem.getAttribute('color');
                        return color ? { color } : false;
                    },
                },
            ],
            toDOM(node) {
                return ['span', { style: `color: ${node.attrs.color}` }, 0];
            },
        },
        BGColor: {
            attrs: {
                BGColor: {},
            },
            parseDOM: [
                {
                    style: 'background-color',
                    getAttrs(BGColor) {
                        return BGColor ? { BGColor } : false;
                    },
                },
                {
                    tag: 'span[background-color]',
                    getAttrs(elem) {
                        const BGColor = elem.getAttribute('BGColor');
                        return BGColor ? { BGColor } : false;
                    },
                },
            ],
            toDOM(node) {
                return ['span', { style: `background-color: ${node.attrs.BGColor}` }, 0];
            },
        },
    },
});
