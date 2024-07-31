import classNames from 'classnames'
import IconTriangle from './icon_triangle.svg'

export function CollapseIndicator({
  expanded,
  ...props
}: {
  title: string
  expanded?: boolean
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      {...props}
      className={classNames('CollapseIndicator', {
        'CollapseIndicator--collapsed': !expanded,
        'CollapseIndicator--expaneded': expanded,
      })}
    >
      <IconTriangle />
    </div>
  )
}
