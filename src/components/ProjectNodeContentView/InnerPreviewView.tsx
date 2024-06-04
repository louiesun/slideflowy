import { nodeToHtml, htmlToNode } from '../../services/ProseMirrorService';
export const InnerPreviewView = ({ className, dangerousHTML, }) => {
    const sterilizedHTML = React.useMemo(() => sterilize(dangerousHTML), [
        dangerousHTML,
    ]);
    return (React.createElement("div", { className: className, dangerouslySetInnerHTML: { __html: sterilizedHTML || '&nbsp;' } }));
};
function sterilize(html) {
    return nodeToHtml(htmlToNode(html));
}
