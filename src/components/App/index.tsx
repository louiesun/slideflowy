import { useEffect, useState, useCallback, useRef } from 'react';
import classnames from 'classnames';
import { nutstoreClient, parseQs } from '../../utils/NutstoreSDK';
import { osName } from '../../utils/Platform';
import { ProjectNodeList } from '../../containers/ProjectNodeList';
import { AppHeader } from '../../containers/AppHeader';
import { ShortcutPanel } from '../ShortcutPanel';
import { ProjectNodeInner } from '../ProjectNodeInner';
import IconPlus from './icon_plus.svg';
import './style.scss';
import { useInject } from '../../utils/di';
import { FileService } from '../../services/FileService';
import { ImagePreviewModalContextProvider } from '../ImagePreviewModalContext';
const isShortcutPanelAvailable = !nutstoreClient.isMobile;
// 还未确定要不要在移动端显示该功能，目前先放出来开效果
const isSlideAvailable = true;
let slideId = null;
const shortcutsBtnNotifyStorageKey = 'headerShortcutsBtnClicked';
export function App(props) {
    const fileService = useInject(FileService);
    const slideIsReadyRef = useRef(false);
    const slideIsReady = (event) => {
        if (slideId !== null) {
            slideIsReadyRef.current = true;
            slideId.postMessage({
                type: 'STATE_RESPONSE',
                body: {
                    isPreview: props.previewingFile,
                    fileName: props.fileName,
                    rootNodeIds: props.rootNodeIds,
                    nodes: props.nodes,
                    slideBG: props.slideBG,
                },
            }, window.location.origin);
        }
    };
    const slideActivelyClose = (event) => {
        props.onToggleSlide(false);
        props.onChangeCurrentIndex(''); // 当前播放的slide为空
    };
    const requestImage = async (event) => {
        const imgUrl = await fileService
            .getPreviewLink(event.data.body.data)
            .catch(() => '');
        if (slideId !== null) {
            slideId.postMessage({
                type: 'IMAGE_RESPONSE',
                body: {
                    url: imgUrl,
                    relativePath: event.data.body.relativePath,
                },
            }, window.location.origin);
        }
    };
    const setBackgroundImage = (event) => {
        props.setBG(event.data.body);
    };
    const messageHandler = (event) => {
        if (event.origin !== window.location.origin)
            return;
        switch (event.data.type) {
            case 'SLIDE_IS_READY':
                slideIsReady(event);
                break;
            case 'SLIDE_ACTIVELY_CLOSE':
                slideActivelyClose(event);
                break;
            case 'REQUEST_IMAGE':
                void requestImage(event);
                break;
            case 'BACKGROUND_IMAGE':
                setBackgroundImage(event);
                break;
            default:
                break;
        }
    };
    useEffect(() => void (document.title = props.fileName), [props.fileName]);
    useEffect(() => {
        window.addEventListener('message', messageHandler, false);
        return () => {
            window.removeEventListener('message', messageHandler, false);
        };
    }, [props.slideTabWindow]);
    const [state, setState] = useState({
        shortcutsListVisible: localStorage[shortcutsBtnNotifyStorageKey] === 'true',
        shortcutsBtnNotify: !nutstoreClient.isClient && !localStorage[shortcutsBtnNotifyStorageKey],
    });
    const onShortcutPanelVisibleChanged = useCallback((visible) => {
        setState((state) => ({ ...state, shortcutsListVisible: visible }));
    }, [setState]);
    const onToggleShortcutsList = useCallback(() => {
        setState((state) => {
            localStorage[shortcutsBtnNotifyStorageKey] = String(!state.shortcutsListVisible);
            return {
                shortcutsListVisible: !state.shortcutsListVisible,
                shortcutsBtnNotify: false,
            };
        });
    }, [setState]);
    const isSlideURL = () => {
        const searchParams = parseQs(location.search);
        return !!searchParams.isSlide;
    };
    const addSlideParameter = () => {
        const myURL = new URL(location.href);
        myURL.searchParams.set('isSlide', 'true');
        return myURL.href;
    };
    const onTogglePlaySlide = () => {
        let slideUrl = window.location.href;
        if (!isSlideURL()) {
            slideUrl = addSlideParameter();
        }
        slideId = window.open(slideUrl, '', 'popup');
        props.onAddId(slideId);
        props.onToggleSlide(true);
    };
    const onToggleQuitSlide = () => {
        if (slideId !== null && slideIsReadyRef.current) {
            slideId.postMessage({
                type: 'CLOSE',
                body: '',
            }, window.location.origin);
            props.onToggleSlide(false);
            props.onChangeCurrentIndex(''); // 当前播放的slide为空
            slideIsReadyRef.current = false;
        }
    };
    const { selectedRootNodeId, node, requestingFileInfo } = props;
    const os = osName();
    const systemClassName = os ? `App--in-platform-${os.toLowerCase()}` : '';
    return requestingFileInfo ? null : (React.createElement("div", { className: classnames([
            'App',
            systemClassName,
            {
                'App--preview': props.previewingFile,
                'App--in-mobile': nutstoreClient.isMobile,
            },
        ]) },
        React.createElement("div", { className: "App__container" },
            React.createElement(AppHeader, { inChildPage: Boolean(selectedRootNodeId), shortcutButtonNotice: state.shortcutsBtnNotify, onToggleShortcutsList: onToggleShortcutsList, shortcutButtonVisible: isShortcutPanelAvailable, slideVisible: isSlideAvailable, onTogglePlaySlide: onTogglePlaySlide, onToggleQuitSlide: onToggleQuitSlide }),
            React.createElement(ImagePreviewModalContextProvider, null,
                React.createElement(ProjectNodeList, { isRoot: true, parentNodeId: selectedRootNodeId, header: !selectedRootNodeId ? null : (React.createElement("h1", { className: "App__page-node-content" },
                        React.createElement(ProjectNodeInner, { nodeId: node.id }))), footer: !props.appendNodeIconVisible ? null : (React.createElement("div", { className: "App__append-node", onClick: () => props.onParentAppendNode(selectedRootNodeId) },
                        React.createElement(IconPlus, { className: "icon-append-node" }))) })),
            isShortcutPanelAvailable ? (React.createElement(ShortcutPanel, { inPreviewMode: props.previewingFile, visible: state.shortcutsListVisible, onVisibleChanged: onShortcutPanelVisibleChanged })) : null)));
}
