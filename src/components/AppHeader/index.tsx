import { __decorate, __metadata } from "tslib";
import IconHome from './icon_home.svg';
import IconSave from './icon_save.svg';
import IconSaving from './icon_saving.svg';
import IconSaved from './icon_saved.svg';
import IconSaveError from './icon_save-error.svg';
import IconUnsaved from './icon_unsaved.svg';
import IconPlay from './icon_play.svg';
import IconMore from './icon_more.svg';
import IconBack from './icon_back.svg';
import IconExport from './icon_export.svg';
import classNames from 'classnames';
import { SimpleTip } from '../SimpleTip';
import { Breadcrumb } from '../Breadcrumb';
import { Attach } from '../Attach';
import { $t } from '../../i18n';
import './style.scss';
import { Inject } from 'react.di';
import { ShortcutService } from '../../services/ShortcutService';
import { shallowChanged, evolve } from '../../utils/F/shallowChanged';
import { Popover } from '@c4605/react-popover';
import { AppHeaderMenu } from '../AppHeaderMenu';
import { nutstoreClient, isLanding, isDownloadDisabled, } from '../../utils/NutstoreSDK';
import { generatePPT } from '../../utils/generatePPT';
import { Notification } from '../../utils/Notification';
import { ExportPPTloading } from './ExportPPTloading';
export class AppHeader extends React.Component {
    static defaultProps = {
        className: '',
        inChildPage: false,
    };
    shortcutManager;
    actionBarRef = React.createRef();
    popoverContentRef = React.createRef();
    modalRefs = [];
    state = {
        // 获取右侧操作栏的实际宽度，确保文件名和面包屑不会被遮挡
        actionBarWidth: 300,
        // 下拉菜单的显示状态
        popoverVisible: false,
        // 是否显示导出加载中
        isShowExportLoading: false,
    };
    setPopoverVisible = (popoverVisible, reason) => {
        if (!popoverVisible && reason.event && reason.event instanceof MouseEvent) {
            if (!this.popoverContentRef.current)
                return;
            if (!(reason.event.target instanceof HTMLElement))
                return;
            if (this.popoverContentRef.current.contains(reason.event.target))
                return;
            if (this.modalRefs.some(ref => ref.current &&
                reason.event &&
                reason.event.target instanceof HTMLElement &&
                ref.current.contains(reason.event.target)))
                return;
        }
        this.setState({
            popoverVisible,
        });
    };
    exportPPT = async () => {
        this.setState({
            isShowExportLoading: true,
            popoverVisible: false,
        });
        const { props } = this;
        const { nodes, rootNodeIds, fileName, slideBG } = props;
        try {
            await generatePPT({
                nodes,
                rootNodeIds,
                fileName,
                slideBG,
            });
        }
        catch (error) {
            Notification.show({ text: $t('EXPORT_FAILED') });
        }
        finally {
            this.setState({
                isShowExportLoading: false,
            });
        }
    };
    shouldComponentUpdate(nextProps, nextState) {
        const shallowChangedProp = shallowChanged(nextProps, this.props, evolve({
            parents: this.isParentTreeChanged.bind(this),
        }));
        if (shallowChangedProp) {
            return true;
        }
        const shallowChangedState = shallowChanged(nextState, this.state);
        if (shallowChangedState) {
            return true;
        }
        return false;
    }
    componentDidMount() {
        this.updateActionBarWidth();
    }
    componentDidUpdate() {
        this.updateActionBarWidth();
    }
    render() {
        const { props, state, setPopoverVisible } = this;
        const containerClassName = classNames([
            'AppHeader',
            this.props.className,
            {
                'AppHeader--in-child': this.props.inChildPage,
            },
        ]);
        const renderPopoverTrigger = () => React.createElement(IconMore, { className: "icon-more" });
        const renderProjectNodeMenu = () => (React.createElement(AppHeaderMenu, { fileShareable: props.fileShareable, isPreview: props.isPreview, shortcutButtonVisible: props.shortcutButtonVisible, undoAvailable: props.undoAvailable, redoAvailable: props.redoAvailable, onUndo: props.onUndo, onRedo: props.onRedo, onToggleShortcutsList: props.onToggleShortcutsList, onPopoverVisibleChanged: (popoverVisible) => {
                this.setState({
                    popoverVisible,
                });
            }, modalRefs: this.modalRefs, innerRef: this.popoverContentRef }));
        const renderSaveStatus = () => {
            if (!props.saveIconStatus)
                return null;
            return saveStatusContent({ status: props.saveIconStatus });
        };
        const isAdDemo = isLanding();
        const downloadDisabled = isDownloadDisabled();
        return (React.createElement("div", { className: `${containerClassName} ${isAdDemo ? 'is-demo-style' : ''}` },
            !isAdDemo && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "AppHeader__back-root", onClick: this.onBackRoot },
                    React.createElement(IconHome, { className: "icon-home" })))),
            React.createElement(Breadcrumb, { items: this.generateBreadcrumb(props.fileName, props.parents), onClickItem: props.onNodeSelectAsRoot }),
            !isAdDemo && (React.createElement(React.Fragment, null,
                React.createElement("h1", { className: "AppHeader__file-name", style: {
                        '--action-bar-width': `${this.state.actionBarWidth}px`,
                    } }, props.fileName))),
            React.createElement("div", { ref: this.actionBarRef, className: "AppHeader__file-actions" },
                isAdDemo ? null : (React.createElement(React.Fragment, null,
                    React.createElement(Attach, { when: !props.isPreview },
                        React.createElement("div", { className: "AppHeader__save-status" }, renderSaveStatus()),
                        React.createElement(TipButton, { className: 'AppHeader__save-btn', message: this.shortcutTip('save'), disabled: !!props.saveIconDisabled, onClick: props.onSaveFile },
                            React.createElement(IconSave, null))),
                    React.createElement(Attach, { when: !downloadDisabled && !nutstoreClient.isMobile },
                        React.createElement(TipButton, { className: 'AppHeader__export-btn', message: $t('EXPORT_PPT'), onClick: this.exportPPT },
                            React.createElement(IconExport, null))),
                    React.createElement(Attach, { when: !props.isPreview && !props.slideVisible },
                        React.createElement(SimpleTip, { message: $t('NUTFLOWY_MORE') },
                            React.createElement(Popover, { triggerClassName: classNames([
                                    'AppHeaderPopoverMenu__trigger',
                                    { notice: props.shortcutButtonNotice },
                                ]), popoverClassName: "AppHeaderPopoverMenu__popover", openOn: "click", closeOn: "clickOutside", trigger: renderPopoverTrigger, content: renderProjectNodeMenu, visible: state.popoverVisible, onVisibleChange: setPopoverVisible, inline: false }))),
                    React.createElement(Attach, { when: !props.isPreview &&
                            !nutstoreClient.isDesktopClient &&
                            !nutstoreClient.isElectronClient },
                        React.createElement(TipButton, { className: 'AppHeader__exit-btn', message: $t('NUTFLOWY_BACK'), disabled: !!props.saveAndQuitIconDisabled, onClick: this.onSaveAndQuitFile },
                            React.createElement(IconBack, null))))),
                React.createElement(Attach, { when: props.slideVisible &&
                        !props.isSlideOpened &&
                        !nutstoreClient.isMobile },
                    React.createElement("div", { className: "AppHeader__slide-btn", onClick: props.onTogglePlaySlide },
                        React.createElement(IconPlay, { className: "icon-play" }),
                        React.createElement("span", null, $t('NUTFLOWY_Slide_PLAY')))),
                React.createElement(Attach, { when: props.isSlideOpened && !nutstoreClient.isMobile },
                    React.createElement("div", { className: "AppHeader__slide-quit-btn", onClick: () => {
                            props.onToggleQuitSlide();
                        } },
                        React.createElement("span", null, $t('NUTFLOWY_Slide_QUIT'))))),
            state.isShowExportLoading && React.createElement(ExportPPTloading, null)));
    }
    isParentTreeChanged(tree1, tree2) {
        return (tree1.map(n => n.id + n.content).join(',') !==
            tree2.map(n => n.id + n.content).join(','));
    }
    updateActionBarWidth() {
        if (this.actionBarRef.current) {
            this.setState({ actionBarWidth: this.actionBarRef.current.offsetWidth });
        }
    }
    onBackRoot = () => {
        this.props.onNodeSelectAsRoot({ id: null });
    };
    shortcutTip(name) {
        return `${$t(name.toUpperCase())} ${this.shortcutManager.render(name.toLowerCase())}`;
    }
    generateBreadcrumb(fileName, nodes) {
        return [
            {
                id: null,
                key: 'null',
                name: fileName,
            },
        ].concat(nodes.map(n => ({
            ...n,
            key: String(n.id),
            name: n.content,
        })));
    }
    onSaveAndQuitFile = () => {
        this.props.onSaveAndQuitFile();
    };
}
__decorate([
    Inject,
    __metadata("design:type", ShortcutService)
], AppHeader.prototype, "shortcutManager", void 0);
const TipButton = props => {
    let withText = false;
    if (Array.isArray(props.children)) {
        withText = props.children.some(n => typeof n === 'string');
    }
    return (React.createElement(SimpleTip, { message: props.message },
        React.createElement("button", { className: classNames([withText ? 'with-text' : '', props.className]), disabled: props.disabled, onClick: props.onClick }, props.children)));
};
const saveStatusContent = ({ status }) => {
    switch (status) {
        case 'changed':
            return [
                React.createElement(IconUnsaved, { key: "icon-save", className: "icon-save" }),
                $t('UNSAVED'),
            ];
        case 'saving':
            return [
                React.createElement(IconSaving, { key: "icon-save-loading", className: "icon-save-loading" }),
                $t('NUTFLOWY_SAVING'),
            ];
        case 'failed':
            return [
                React.createElement(IconSaveError, { key: "icon-save-error", className: "icon-save-error" }),
                $t('NUTFLOWY_SAVE_FAILED'),
            ];
        case 'saved':
        default:
            return [
                React.createElement(IconSaved, { key: "icon-save-done", className: "icon-save-done" }),
                $t('NUTFLOWY_SAVED'),
            ];
    }
};
