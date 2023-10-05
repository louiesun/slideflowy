import classNames from 'classnames';
import { ProjectNodePopover } from '../../containers/ProjectNodePopover';
import { ProjectNodeMenu } from '../ProjectNodeMenu';
import IconMore from './icon_more.svg';
import { useCallback, useState, useMemo } from 'react';
import { values } from '../../utils/F';
const renderPopoverTrigger = () => React.createElement(IconMore, { className: "icon-more" });
export function usePopoverMenu({ nodes: node, ...otherProps }) {
    const [visible, setVisible] = useState(false);
    const renderProjectNodeMenu = useCallback(() => React.createElement(ProjectNodeMenu, { ...otherProps, nodes: node }), [...values(otherProps), node]);
    const popover = useMemo(() => (React.createElement(ProjectNodePopover, { triggerClassName: classNames('ProjectNodePopoverMenu__trigger', {
            active: visible,
        }), popoverClassName: "ProjectNodePopoverMenu__popover", openOn: "click", closeOn: "clickOutside", trigger: renderPopoverTrigger, content: renderProjectNodeMenu, visible: visible, onVisibleChange: (visible) => setVisible(visible) })), [visible, setVisible, renderProjectNodeMenu]);
    return [popover, visible];
}
