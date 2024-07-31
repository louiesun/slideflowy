import classNames from 'classnames'
import { ProjectNodePopover } from '../../containers/ProjectNodePopover'
import { ProjectNodeMenu, ProjectNodeMenuProps } from '../ProjectNodeMenu'
import IconMore from './icon_more.svg'
import { useCallback, useState, useMemo } from 'react'
import { values } from '../../utils/F'

const renderPopoverTrigger = () => <IconMore className="icon-more" />

export function usePopoverMenu({
  nodes: node,
  ...otherProps
}: ProjectNodeMenuProps) {
  const [visible, setVisible] = useState(false)

  const renderProjectNodeMenu = useCallback(
    () => <ProjectNodeMenu {...otherProps} nodes={node} />,
    [...values(otherProps), node],
  )

  const popover = useMemo(
    () => (
      <ProjectNodePopover
        triggerClassName={classNames('ProjectNodePopoverMenu__trigger', {
          active: visible,
        })}
        popoverClassName="ProjectNodePopoverMenu__popover"
        openOn="click"
        closeOn="clickOutside"
        trigger={renderPopoverTrigger}
        content={renderProjectNodeMenu}
        visible={visible}
        onVisibleChange={(visible) => setVisible(visible)}
      />
    ),
    [visible, setVisible, renderProjectNodeMenu],
  )

  return [popover, visible] as [typeof popover, typeof visible]
}
