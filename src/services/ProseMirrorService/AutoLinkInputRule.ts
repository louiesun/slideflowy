import { Plugin } from 'prosemirror-state';
import { Fragment, Slice } from 'prosemirror-model';
import { endlessReplace } from '../../utils/S';
import { $t } from '../../i18n';
import { schema } from 'prosemirror-schema-basic';
/**
 * URI 的标准 RFC3986 : https://tools.ietf.org/html/rfc3986#appendix-A
 *
 * 基于 http://urlregex.com/ 里的 JavaScript 小节，但是做了大量的修改：
 *
 *  * 出于使用习惯考虑，允许把 `xxxx://` 识别为 URI
 *  * 原正则里的 `[A-Za-z]{3,9}` 改成了更符合标准的
 *    `[A-Za-z][A-Za-z0-9+-.]*`
 *
 * 简述这个规则（当然会比这个更加严格）：
 *
 *  * 必须有冒号或者 www. 开头
 *  * 冒号的前面的内容，必须是字母开头，允许内含字母/数字/+/-/.
 *  * 冒号后面必须有内容
 *
 * 如果要改，可以把这个正则表达式贴到 https://regex101.com/ 上，一边测试一边改。
 * 改完的正则表达式要能够匹配到下列 url （可以继续补充）：
 *
 * 先约定用词：
 *
 *  * 匹配组：`(xxxx)`
 *  * 候选项：`xxx|xxx` ，竖线两边的就是候选项
 *  * 字符集合：`[A-Z]` ，方括号包含的就是字符集合
 *
 * 接下来做一些简单的说明：
 *
 *  * 下面的这些英文术语都是来自于 https://tools.ietf.org/html/rfc3986#appendix-A
 *  * 第一个匹配组是用来匹配 **可选出现**的 `scheme` 和 **必须出现**的 `hier-part`
 *      * 第一个候选项匹配 `scheme ":" hier-part` 格式
 *          * 第一、二个字符集合用来匹配 `scheme` 部分
 *          * 第二个匹配组用来匹配 `userinfo` 部分
 *          * 第四个字符集合用来匹配 `host [ ":" port ]` 部分
 *      * 第二个候选项匹配 `scheme "://"`  格式
 *      * 第三个候选项匹配 `www` 开头的，没有 `scheme` 的 url
 *  * 第二个匹配组用来匹配 **可选出现** 的 `[ "?" query ] [ "#" fragment ]`
 *  * 第一个匹配组的第一个候选项第二个字符集合，和第二个候选项，允许有多个冒号（虽然是 RFC3986 不允许的），是考虑到为了匹配 jdbc 风格的 url
 *  * 第一个匹配组的第一个候选项第四个字符集合允许有多个冒号的原因是考虑到要匹配 IPv6
 *
// 普通 url
foo http://user:pass@aaaa.com:8000/issue/NS-123?q=a#fff bar
// 自定义协议名称的 url
foo evernote:// bar
foo jdbc:datadirect:oracle://myserver:1521;sid=testdb bar
foo jdbc:datadirect:oracle://user:pass@myserver:1521;sid=testdb bar
foo jdbc:postgresql:database bar
foo jdbc:postgresql:/ bar
foo jdbc:postgresql://host/database bar
foo jdbc:postgresql://host/ bar
foo jdbc:postgresql://host:port/database bar
foo jdbc:postgresql://host:port/ bar
// 没有协议名称的 url
foo www.google.com/issue/NS-aaaa bar
foo www.google.com:8080/issue/NS-aaaa bar
// RFC3986 里的例子
ftp://ftp.is.co.za/rfc/rfc1808.txt
http://www.ietf.org/rfc/rfc2396.txt
ldap://[2001:db8::7]/c=GB?objectClass?one
mailto:John.Doe@example.com
news:comp.infosystems.www.servers.unix
tel:+1-816-555-1212
telnet://192.0.2.16:80/
urn:oasis:names:specification:docbook:dtd:xml:4.1.2
 *
 */
const LINK_RE = /([A-Za-z][A-Za-z0-9+-.:]*:(?:\/\/)?(?:[\-;.:&=+$,\w]+@)?[A-Za-z0-9+\-.:\[\]]+|[A-Za-z0-9+\-.:]*:\/\/|www\.[A-Za-z0-9\.\-]+(?::\d)?)((?:\/[\+~%\/\.\w\-_]*)?[?\-\+=&;%@\/\.\w_]*#?[\.\!\/\\\w]*)?/;
export const autoLinkAttrMark = 'data-ns-from-auto-link';
export const autoLinkInputRulesPlugin = new Plugin({
    /**
     * 逻辑是每次 apply transaction 时，都把所有的 link 刷新一遍
     */
    appendTransaction(trs, oldState, newState) {
        return generateTransaction(newState);
    },
    props: {
        transformPasted: (slice, view) => {
            const { schema } = view.state;
            const newNodes = [];
            slice.content.forEach(node => {
                if (node.type.spec.code || !node.isBlock) {
                    newNodes.push(node);
                    return;
                }
                const matched = matchLink(node.textBetween(0, node.content.size, undefined, '\ufffc'), (match, previousEnd, startIndex) => {
                    const fromPos = startIndex;
                    const toPos = fromPos + match[0].length;
                    if (fromPos !== 0) {
                        newNodes.push(schema.text(node.textContent.slice(0, fromPos)));
                    }
                    const href = match[0].startsWith('www.')
                        ? `http://${match[0]}`
                        : match[0];
                    const linkNode = schema.text($t('WEB_LINK'), [
                        schema.marks.link.create({
                            href,
                            [autoLinkAttrMark]: false,
                        }),
                    ]);
                    newNodes.push(linkNode);
                    if (toPos < node.content.size - 1) {
                        newNodes.push(schema.text(node.textContent.slice(toPos)));
                    }
                });
                if (matched === null) {
                    newNodes.push(node);
                }
            });
            return Slice.maxOpen(Fragment.fromArray(newNodes));
        },
    },
});
function generateTransaction(state) {
    const { tr } = state;
    state.doc.descendants((node, pos) => {
        if (node.type.spec.code)
            return;
        if (!node.isBlock)
            return;
        // Block Node 的开标签占一个位置
        const contentStartPos = pos + 1;
        // 移除所有现有的 link mark
        node.descendants((node, pos) => {
            removeLinkMark(contentStartPos + pos, node, state, tr);
        });
        // 重新检索并应用一遍 link mark
        matchLink(node.textBetween(0, node.content.size, undefined, '\ufffc'), (match, previousEnd, startIndex) => {
            applyLinkMark(contentStartPos, match, startIndex, state, tr);
        });
    });
    return tr;
}
function applyLinkMark(nodePos, match, linkStartIndex, state, tr) {
    const matchStartPos = nodePos + linkStartIndex;
    const fromPos = tr.mapping.map(matchStartPos);
    const toPos = tr.mapping.map(matchStartPos + match[0].length);
    const { link: linkMarkType } = state.doc.type.schema.marks;
    // 当要添加链接的内容里存在不是由 AutoLinkInputRule 插件添加的链接
    // 时，就不进行下一步了
    let existManualLink = false;
    state.doc.nodesBetween(fromPos, toPos, (node, pos) => {
        const linkMark = node.marks.find(m => m.type === linkMarkType);
        if (linkMark && !linkMark.attrs[autoLinkAttrMark]) {
            existManualLink = true;
            return false;
        }
        return;
    });
    if (existManualLink)
        return;
    const href = match[0].startsWith('www.') ? `http://${match[0]}` : match[0];
    tr.addMark(fromPos, toPos, state.doc.type.schema.marks.link.create({
        href,
        [autoLinkAttrMark]: true,
    }));
}
function removeLinkMark(nodePos, node, state, tr) {
    const { link: linkMarkType } = state.doc.type.schema.marks;
    const linkMark = node.marks.find(m => m.type === linkMarkType && m.attrs[autoLinkAttrMark]);
    if (linkMark) {
        tr.removeMark(nodePos, nodePos + node.nodeSize, linkMark);
    }
}
function matchLink(textContent, callback) {
    callback = callback || (() => { });
    let lastMatch = null;
    let lastEnd = 0;
    let match = null;
    // 获取最后一个匹配
    // tslint:disable-next-line:no-conditional-assignment
    while ((match = LINK_RE.exec(textContent))) {
        callback(match, lastEnd, lastEnd + match.index);
        lastMatch = match;
        lastEnd += lastMatch.index + lastMatch[0].length;
        textContent = textContent.slice(lastMatch.index + lastMatch[0].length);
    }
    return !lastMatch
        ? null
        : {
            match: lastMatch[0],
            start: lastEnd - lastMatch[0].length,
            end: lastEnd,
        };
}
export function processLinkInContent(content) {
    return endlessReplace(LINK_RE, (match, stepStr) => {
        console.log(match, stepStr);
        const href = match[0].startsWith('www.') ? `http://${match[0]}` : match[0];
        return `<a href="${href}" ${autoLinkAttrMark}="false" target="_blank">${$t('WEB_LINK')}</a>`;
    }, content);
}
export function getLinkInfoBySelection(selection) {
    if (selection.head !== selection.anchor)
        return;
    const anchor = selection.$anchor;
    const before = anchor.parent.childBefore(anchor.parentOffset);
    const after = anchor.parent.childAfter(anchor.parentOffset);
    const getMarkInfo = (child) => {
        if (!child.node)
            return null;
        const linkMark = child.node.marks.find(mark => mark.type.name === schema.marks.link.name);
        return linkMark
            ? {
                anchor: anchor.start() + child.offset,
                head: child.offset + child.node.nodeSize + 1,
                text: child.node.textContent,
                // tslint:disable-next-line:no-string-literal
                link: linkMark.attrs['href'],
            }
            : null;
    };
    return getMarkInfo(before) || getMarkInfo(after);
}
