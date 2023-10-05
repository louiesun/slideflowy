import { __decorate, __metadata } from "tslib";
import './style.scss';
import { $t } from '../../i18n';
import { Attach } from '../Attach';
import classNames from 'classnames';
import { createRestoreFocusElement } from '../ProjectNodeContentView';
import { Inject } from 'react.di';
import { ShortcutService } from '../../services/ShortcutService';
import { ShareFileButton } from '../../containers/ShareFileButton';
export class AppHeaderMenu extends React.PureComponent {
    shortcutManager;
    shareModalRef = React.createRef();
    componentDidMount() {
        this.props.modalRefs?.push(this.shareModalRef);
    }
    render() {
        const { props, shareModalRef } = this;
        return (React.createElement("div", { ref: props.innerRef },
            React.createElement("ul", { className: "AppHeaderMenu" },
                React.createElement(Attach, { when: props.fileShareable },
                    React.createElement("li", null,
                        React.createElement(ShareFileButton, { onShareModalClose: () => props.onPopoverVisibleChanged(false), modalRef: shareModalRef }))),
                React.createElement(Attach, { when: !props.isPreview }, createRestoreFocusElement(React.createElement("li", { className: classNames({ disabled: !props.undoAvailable }), onClick: this.onUndo },
                    React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_UNDO')),
                    React.createElement("div", { className: "menu-icon" }, `${this.shortcutManager.render('undo')}`)))),
                React.createElement(Attach, { when: !props.isPreview }, createRestoreFocusElement(React.createElement("li", { className: classNames({ disabled: !props.redoAvailable }), onClick: this.onRedo },
                    React.createElement("div", { className: "menu-text" }, $t('NUTFLOWY_REDO')),
                    React.createElement("div", { className: "menu-icon" }, `${this.shortcutManager.render('redo')}`)))),
                React.createElement(Attach, { when: props.shortcutButtonVisible },
                    React.createElement("li", { onClick: this.onToggleShortcutsList }, $t('NUTFLOWY_SHORTCUT_LIST'))))));
    }
    onUndo = () => {
        this.props.onUndo();
    };
    onRedo = () => {
        this.props.onRedo();
    };
    onToggleShortcutsList = () => {
        this.props.onPopoverVisibleChanged(false);
        this.props.onToggleShortcutsList();
    };
}
__decorate([
    Inject,
    __metadata("design:type", ShortcutService)
], AppHeaderMenu.prototype, "shortcutManager", void 0);
