import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Popover } from '@nshq/react-popover';
import { $t } from '../../i18n';
import './ProjectNodeImageListItemPopover.scss';
export function ProjectNodeImageListItemPopover(props) {
    const { imgRef, canMoveUp, canMoveDown, onPreviewImage, onCopyImage, onDownloadImage, onMoveUpImage, onMoveDownImage, onDeleteImage, renderPopoverTrigger } = props;
    const renderPopoverContent = useCallback(() => (React.createElement("ul", { className: 'ImageItemMenu' },
        React.createElement("li", { className: 'top', onClick: onPreviewImage }, $t('NUTFLOWY_PREVIEW_IMAGE')),
        React.createElement("li", { onClick: onCopyImage }, $t('NUTFLOWY_COPY_IMAGE')),
        React.createElement("li", { onClick: onDownloadImage }, $t('NUTFLOWY_DOWNLOAD_IMAGE')),
        React.createElement("li", { className: 'divider' }),
        React.createElement("li", { className: classNames([{ disabled: !canMoveUp }]), onClick: onMoveUpImage }, $t('NUTFLOWY_MOVE_UP_IMAGE')),
        React.createElement("li", { className: classNames([{ disabled: !canMoveDown }]), onClick: onMoveDownImage }, $t('NUTFLOWY_MOVE_DOWN_IMAGE')),
        React.createElement("li", { className: 'divider' }),
        React.createElement("li", { className: 'bottom', onClick: onDeleteImage }, $t('NUTFLOWY_DELETE_IMAGE')))), []);
    const calcPopoverStyle = useCallback((info) => {
        const img = imgRef.current;
        const rect = img.getBoundingClientRect();
        const { scrollingElement } = document;
        const top = scrollingElement ? scrollingElement.scrollTop + rect.top - 2 : rect.top - 2;
        const left = scrollingElement ? scrollingElement.scrollLeft + rect.right + 10 : rect.right + 10;
        return {
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            display: 'block',
            transform: 'translateX(0)'
        };
    }, [imgRef]);
    return (React.createElement(Popover, { triggerClassName: 'ProjectNodeImageListItem__trigger', popoverClassName: 'ProjectNodeImageListItem__content', openOn: 'click', closeOn: 'clickOutside', trigger: renderPopoverTrigger, content: renderPopoverContent, popoverStyle: calcPopoverStyle }));
}
