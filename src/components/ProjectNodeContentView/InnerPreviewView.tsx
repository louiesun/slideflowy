import { nodeToHtml, htmlToNode } from '../../services/ProseMirrorService'

export interface InnerPreviewViewProps {
  className?: string
  dangerousHTML: string
}

export const InnerPreviewView = ({
  className,
  dangerousHTML,
}: InnerPreviewViewProps) => {
  const sterilizedHTML = React.useMemo(() => sterilize(dangerousHTML), [
    dangerousHTML,
  ])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sterilizedHTML || '&nbsp;' }}
    />
  )
}

function sterilize(html: string) {
  return nodeToHtml(htmlToNode(html))
}
