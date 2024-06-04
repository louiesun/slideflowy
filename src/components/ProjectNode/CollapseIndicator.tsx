import classNames from 'classnames';
import IconTriangle from './icon_triangle.svg';
export function CollapseIndicator({ expanded, ...props }) {
    return (React.createElement("div", { ...props, className: classNames('CollapseIndicator', {
            'CollapseIndicator--collapsed': !expanded,
            'CollapseIndicator--expaneded': expanded,
        }) },
        React.createElement(IconTriangle, null)));
}
