import { nodeToHtml, htmlToNode } from '../../services/ProseMirrorService';
export const Content = React.memo(({ style, className, dangerousHTML, onClick }) => {
    const sterilizedHTML = React.useMemo(() => sterilize(dangerousHTML), [
        dangerousHTML,
    ]);
    return (React.createElement("div", { style: style, className: className, dangerouslySetInnerHTML: { __html: sterilizedHTML || '&nbsp;' }, onClick: onClick }));
});
function sterilize(html) {
    return nodeToHtml(htmlToNode(html));
}
