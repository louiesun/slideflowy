import { Parser } from "htmlparser2";
export class HTMLStringParser {
    elements;
    constructor(html) {
        const that = this;
        const elements = [];
        const recordtree = [];
        const VNodePrototype = {
            parent: null,
            children: [],
            getText() {
                let texts = [];
                this.children.forEach((item) => {
                    if (item.text !== undefined) {
                        texts.push(item.text);
                    }
                    else if (item.children && item.children.length) {
                        texts = texts.concat(this.getText.call(item));
                    }
                });
                return texts.join(" ");
            },
            getElements() {
                let elements = [];
                this.children.forEach((item) => {
                    if (item.text !== undefined) {
                        return;
                    }
                    elements.push(item);
                    if (item.children && item.children.length) {
                        elements = elements.concat(this.getElements.call(item));
                    }
                });
                return elements;
            },
        };
        const parser = new Parser({
            onopentag(name, attrs) {
                const proto = Object.create(VNodePrototype);
                const vnode = that.createVNode(name, attrs, proto);
                const parent = recordtree.length
                    ? recordtree[recordtree.length - 1]
                    : null;
                if (parent) {
                    vnode.parent = parent;
                    if (!parent.hasOwnProperty("children")) {
                        parent.children = [];
                    }
                    parent.children && parent.children.push(vnode);
                }
                recordtree.push(vnode);
                elements.push(vnode);
            },
            ontext(text) {
                if (!text.trim()) {
                    return;
                }
                const parent = recordtree.length
                    ? recordtree[recordtree.length - 1]
                    : null;
                const vnode = {
                    text,
                    parent,
                };
                if (parent) {
                    if (!parent.hasOwnProperty("children")) {
                        parent.children = [];
                    }
                    parent.children && parent.children.push(vnode);
                }
                elements.push(vnode);
            },
            onclosetag() {
                recordtree.pop();
            },
        });
        parser.parseChunk(html);
        parser.done();
        this.elements = elements;
    }
    createVNode(name, attrs, proto) {
        proto.name = name;
        proto.id = attrs.id || "";
        proto.class = attrs.class ? attrs.class.split(" ") : [];
        proto.attrs = attrs;
        return proto;
    }
    getRoots() {
        return this.elements.filter((item) => !item.parent);
    }
    getElements() {
        return this.elements;
    }
}
