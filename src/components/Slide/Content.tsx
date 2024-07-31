import { nodeToHtml, htmlToNode } from '../../services/ProseMirrorService'
import { InnerPreviewViewProps } from '../ProjectNodeContentView/InnerPreviewView'

interface ContentProps extends InnerPreviewViewProps {
  style?: React.CSSProperties
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

export const Content = React.memo(
  ({ style, className, dangerousHTML, onClick }: ContentProps) => {
    const sterilizedHTML = React.useMemo(() => sterilize(dangerousHTML), [
      dangerousHTML,
    ])

    return (
      <div
        style={style}
        className={className}
        dangerouslySetInnerHTML={{ __html: sterilizedHTML || '&nbsp;' }}
        onClick={onClick}
      />
    )
  },
)

function sterilize(html: string) {
  return nodeToHtml(htmlToNode(html))
}
