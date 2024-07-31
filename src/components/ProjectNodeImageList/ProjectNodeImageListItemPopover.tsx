import React, {MutableRefObject, useCallback} from 'react'
import classNames from 'classnames'
import { Popover, PopoverVisibleInfo } from '@nshq/react-popover'
import { $t } from '../../i18n'
import './ProjectNodeImageListItemPopover.scss'

export interface ProjectNodeImageListItemPopoverProps {
  imgRef: MutableRefObject<HTMLImageElement>
  canMoveUp: boolean
  canMoveDown: boolean
  onPreviewImage: () => void
  onCopyImage: () => void
  onDownloadImage: () => void
  onMoveUpImage: () => void
  onMoveDownImage: () => void
  onDeleteImage: () => void
  renderPopoverTrigger: () => React.ReactNode
}

export function ProjectNodeImageListItemPopover(props: ProjectNodeImageListItemPopoverProps) {
  const {
    imgRef,
    canMoveUp,
    canMoveDown,
    onPreviewImage,
    onCopyImage,
    onDownloadImage,
    onMoveUpImage,
    onMoveDownImage,
    onDeleteImage,
    renderPopoverTrigger
  } = props

  const renderPopoverContent = useCallback(() => (
    <ul 
      className='ImageItemMenu'
    >
      <li className='top' onClick={onPreviewImage}>
        {$t('NUTFLOWY_PREVIEW_IMAGE')}
      </li>
      <li onClick={onCopyImage}>
        {$t('NUTFLOWY_COPY_IMAGE')}
      </li>
      <li onClick={onDownloadImage}>
        {$t('NUTFLOWY_DOWNLOAD_IMAGE')}
      </li>
      <li className='divider'/>
      <li className={classNames([{disabled: !canMoveUp}])} onClick={onMoveUpImage}>
        {$t('NUTFLOWY_MOVE_UP_IMAGE')}
      </li>
      <li className={classNames([{disabled: !canMoveDown}])} onClick={onMoveDownImage}>
        {$t('NUTFLOWY_MOVE_DOWN_IMAGE')}
      </li>
      <li className='divider'/>
      <li className='bottom' onClick={onDeleteImage}>
        {$t('NUTFLOWY_DELETE_IMAGE')}
      </li>
    </ul>
  ), [])

  const calcPopoverStyle = useCallback((info: PopoverVisibleInfo) => {
    const img = imgRef!.current
    const rect = img.getBoundingClientRect()
    const { scrollingElement } = document
    const top = scrollingElement ? scrollingElement.scrollTop + rect.top - 2 : rect.top - 2
    const left = scrollingElement ? scrollingElement.scrollLeft + rect.right + 10 : rect.right + 10
    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      display: 'block',
      transform: 'translateX(0)'
    } as React.CSSProperties
  }, [imgRef])

  return (
    <Popover
      triggerClassName='ProjectNodeImageListItem__trigger'
      popoverClassName='ProjectNodeImageListItem__content'
      openOn='click'
      closeOn='clickOutside'
      trigger={renderPopoverTrigger}
      content={renderPopoverContent}
      popoverStyle={calcPopoverStyle}
    />
  )
}