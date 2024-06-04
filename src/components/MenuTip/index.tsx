import { useState } from 'react';
import { calcTextWidth } from '../../utils/calcTextWidth';
import './index.scss';
export const MenuTip = (props) => {
    const { message, hoverMessage, setHoverMessage } = props;
    const [visible, setVisible] = useState(false);
    const [text, shortcut] = message.split('.');
    const handleMouseEnter = () => {
        setVisible(true);
        setHoverMessage(message);
    };
    const handleMouseLeave = () => {
        setVisible(false);
        setHoverMessage('');
    };
    return (React.createElement("div", { className: "menu-tip-container", onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave },
        props.children,
        visible && message === hoverMessage && (React.createElement("div", { className: 'menu-tip' },
            React.createElement("div", { className: 'menu-tip-text', style: {
                    width: calcTextWidth(text) + 4,
                } }, text),
            shortcut && (React.createElement("div", { className: 'menu-tip-shortcut', style: {
                    width: calcTextWidth(shortcut) + 2,
                } }, shortcut))))));
};
