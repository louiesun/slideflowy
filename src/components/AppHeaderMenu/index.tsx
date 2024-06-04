import { useRef } from 'react';
import './style.scss';
import { $t } from '../../i18n';
import { Attach } from '../Attach';
import classNames from 'classnames';
import { createRestoreFocusElement } from '../ProjectNodeContentView';
import { ShortcutService } from '../../services/ShortcutService';
import { ShareFileButton } from '../../containers/ShareFileButton';
import { useInject } from '../../utils/di';
export const AppHeaderMenu = (props) => {
    const shareModalRef = useRef(null);
    const shortcutManager = useInject(ShortcutService);
    const onUndo = () => {
        props.onUndo();
    };
    const onRedo = () => {
        props.onRedo();
    };
    const onToggleShortcutsList = () => {
        props.onToggleShortcutsList();
    };
    return (React.createElement("div", null,
        React.createElement("ul", { className: "AppHeaderMenu" },
            React.createElement(Attach, { when: !props.isPreview }, createRestoreFocusElement(React.createElement("li", { className: classNames({ disabled: !props.undoAvailable }), onClick: onUndo },
                React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_UNDO')),
                React.createElement("div", { className: "menu-icon" }, `${shortcutManager.render('undo')}`)))),
            React.createElement(Attach, { when: !props.isPreview }, createRestoreFocusElement(React.createElement("li", { className: classNames({ disabled: !props.redoAvailable }), onClick: onRedo },
                React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_REDO')),
                React.createElement("div", { className: "menu-icon" }, `${shortcutManager.render('redo')}`)))),
            React.createElement(Attach, { when: !props.isPreview },
                React.createElement("div", { className: "divider" })),
            React.createElement(Attach, { when: props.fileShareable },
                React.createElement("li", null,
                    React.createElement("div", { className: "menu-text" },
                        React.createElement(ShareFileButton, { onShareModalClose: () => { }, modalRef: shareModalRef })))),
            React.createElement(Attach, { when: true },
                React.createElement("li", { onClick: () => {
                        props.onToggleExportPanelVisible();
                    } },
                    React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_EXPORT')))),
            React.createElement(Attach, { when: props.shortcutButtonVisible },
                React.createElement("li", { onClick: onToggleShortcutsList },
                    React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_SHORTCUT_LIST')))))));
};
