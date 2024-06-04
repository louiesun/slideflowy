import { Selection } from 'prosemirror-state';
import { ProseMirrorMenuBar, } from './ProseMirrorMenuBar';
import { ProseMirrorEditorView, } from '../ProseMirrorEditorView';
import { produce } from 'immer';
import { nextTick } from '../../utils/P';
import { getElementRevPosRect, getMouseBoundingPos } from '../../utils/DOM';
import { getClipboardImageFile, parseProjectNodeFromClipboardEvent, } from '../../services/ProjectNodeService';
import debounce from 'lodash/debounce';
import { createForwardingRef, assignRef } from '../../utils/R';
import { isCtrlOrMeta } from '../../utils/K';
import { osName } from '../../utils/Platform';
import { $t } from '../../i18n';
import { ProseMirrorLinkEditor } from './ProseMirrorLinkEditor';
import { schema } from '../../services/ProseMirrorService';
import { autoLinkAttrMark, getLinkInfoBySelection, } from '../../services/ProseMirrorService/AutoLinkInputRule';
import { FileService } from '../../services/FileService';
const fileService = new FileService();
class CtrlPressManager {
    isPressed = false;
    constructor() {
        window.addEventListener('keyup', event => {
            isCtrlOrMeta(event) && (this.isPressed = false);
        });
        window.addEventListener('keydown', event => {
            isCtrlOrMeta(event) && (this.isPressed = true);
        });
    }
}
const ctrlPressManager = new CtrlPressManager();
const RESTORE_FOCUS_DATASET_KEY = 'inner-prose-mirror-editor-view-restore-focus';
// 200 的来源
// https://github.com/ckeditor/ckeditor5-ui/blob/b9caee99204901ae85ee3f1b4b4ec41e5eb7bf02/src/toolbar/balloon/balloontoolbar.js#L86
const SELECTION_CHANGE_TIMEOUT = 200;
/**
 * 节点真正的编辑器组件，使用时如果要渲染一些按钮，希望按钮在用户点击
 * 后输入框能够自动恢复焦点，并且不要 dispatch 结束和开始编辑 action
 * ，可以使用 {@link createRestoreFocusElement} 函数包装一层 JSX
 */
export class InnerProseMirrorEditorView extends React.PureComponent {
    state = {
        menuKey: '' + Date.now(),
        menuStyle: {
            display: 'none',
            top: '-9999px',
            left: '-9999px',
        },
        linkEditorEditable: false,
        linkEditorStyle: {
            display: 'none',
            top: '-9999px',
            left: '-9999px',
        },
        linkEditorState: {
            text: '',
            link: '',
        },
        tooltipPosition: undefined,
    };
    editorRef = React.createRef();
    menuRef = React.createRef();
    linkEditorRef = React.createRef();
    editorViewRef = createForwardingRef(instance => {
        assignRef(instance, this.props.editorViewRef);
    });
    tooltipText = $t('NUTFLOWY_TOOLTIP_OPEN_LINK').replace('%s', osName() === 'macOS' ? 'Command' : 'Ctrl');
    get editorView() {
        return this.editorViewRef.current;
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.onDocumentMousedown, false);
        document.addEventListener('click', this.onDocumentClick, false);
        if (this.props.focusedAt) {
            this.focusEditor();
        }
        this.onEditorSelectionChange(null, this.props.editorState.selection);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.focusedAt !== this.props.focusedAt && this.editorView) {
            if (this.props.focusedAt) {
                !this.editorView.hasFocus() && this.focusEditor();
            }
            else {
                this.editorView.hasFocus() &&
                    this.editorView.dom.blur();
            }
        }
        if (!prevProps.editorState.selection.eq(this.props.editorState.selection)) {
            this.onEditorSelectionChange(prevProps.editorState.selection, this.props.editorState.selection);
        }
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.onDocumentMousedown, false);
        document.removeEventListener('click', this.onDocumentClick, false);
    }
    debouncedStoreAnchor = debounce((newSelection) => {
        this.props.storeAnchor(newSelection.anchor);
    }, SELECTION_CHANGE_TIMEOUT);
    onEditorSelectionChange(oldSelection, newSelection) {
        /**
         * 当 editorState.selection 发生变化时，DOM 上的对应元素可能还没有
         * 获得焦点（比如 deleteNode action 的 reducer 会同时更新 focusedAt
         * 和 selection ，然后 focusedAt 的更新才会驱动编辑器夺取焦点），所
         * 以要等下一个 EventLoop 来执行
         */
        void nextTick(this.tryEndEditingOnDocumentSelectionChange);
        this.debouncedShowPopover(newSelection);
        if (
        /* 当 selection 从有到无的时候要隐藏 */
        newSelection.empty ||
            /* 当 selection 在变的时候要隐藏 */
            (oldSelection && !oldSelection.empty && !newSelection.empty)) {
            if (this.state.menuStyle.display === 'block') {
                this.hideMenuBar();
            }
        }
        if (this.editorView?.hasFocus())
            this.debouncedStoreAnchor(newSelection);
    }
    /**
     * 为什么要存储 `event.target` 的引用，然后在 `onDocumentClick` 里判断
     * `event.target` 是不是和 `restoreFocusClickSource` 相同，而不是直接判
     * 断 `event.target.closest(\`[data-${RESTORE_FOCUS_DATASET_KEY}]\`)` ：
     *
     * 这里主要是要解决在 `ProseMirrorMenuBar` 里面，当用户点击菜单项后，
     * 程序会立刻刷新界面，因此在事件回调里的 `event.target` 其实已经不在
     * DOM 树上了，此时 `event.target.parentNode` 是 `null` ，
     * `event.target.closest` 的返回值也始终为 `null` ，所以我们没办法使用
     * `closest` 来进行判断
     *
     * 可以考虑用户在界面的各个 `createRestoreFocusElement` 创建的元素上胡
     * 乱高频点击的情况，因为 `mousedown` 和 `click` 的顺序关系相对明确
     * （https://www.w3.org/TR/uievents/#event-type-click 表格后面第三段第
     * 一句）（我也确实在浏览器里试过一遍：Safari 12.1.1 / Firefox 67.0.4 /
     * Chrome 75.0.3770.100 ），而且时间间隔相对固定，应该不会出现时序问题，
     * 最后触发 `mousedown` 事件的 target 应该也是最后触发 `click` 事件，不
     * 会出现时序问题（onDocumentClick 运行时最后触发 `mousedown` 事件的
     * target 先回调进来，导致 resotre focus click phase 提前结束，进而引发
     * BUG ）所以我们简单用一个变量来保存 target 。如果真的出现我说的问题，
     * 我们再把 `restoreFocusClickSource` 改成一个 Set
     */
    restoreFocusClickSource = null;
    onDocumentMousedown = (event) => {
        if (!(event.target instanceof Element))
            return;
        // 出于性能方面的考虑，我们先判断 `props.focusedAt`，这样当页面上有大
        // 量 ProjectNode 时，`editorView.hasFocus` 也基本上只需要调用一次
        if (!this.props.focusedAt ||
            !this.editorView ||
            !this.editorView.hasFocus()) {
            return;
        }
        // 到最后才判断 `closest` ，因为这个操作理论上来讲会比较消耗性能，经过
        // 上一个判断条件的过滤，就算页面上有大量 ProjectNode ，这个判断基本上
        // 也只需要进行一次
        if (!event.target.closest(`[data-${RESTORE_FOCUS_DATASET_KEY}]`)) {
            return;
        }
        // 如果不调用这个函数的话，当点击富文本菜单时，文字选区会闪动一下
        event.preventDefault();
        this.restoreFocusClickSource = event.target;
        setTimeout(() => {
            this.editorView.focus();
        }, 0);
    };
    onDocumentClick = (event) => {
        if (!(event.target instanceof Element))
            return;
        if (this.restoreFocusClickSource !== event.target)
            return;
        this.restoreFocusClickSource = null;
    };
    tryEndEditingOnDocumentSelectionChange = () => {
        if (!this.props.focusedAt)
            return;
        const selection = window.getSelection();
        if (!selection || !selection.focusNode)
            return;
        const { focusNode } = selection;
        if (!this.editorRef.current)
            return;
        if (this.editorRef.current.contains(focusNode))
            return;
        if (!this.menuRef.current)
            return;
        if (this.menuRef.current.contains(focusNode))
            return;
        if (!this.linkEditorRef.current)
            return;
        if (this.linkEditorRef.current.contains(focusNode))
            return;
        this.props.onEndEdit();
    };
    showMenuBar = () => {
        const { selection: editorSelection } = this.props.editorState;
        if (editorSelection.empty)
            return;
        const view = this.editorView;
        if (!view ||
            !this.menuRef.current ||
            !this.editorRef.current ||
            !this.editorRef.current.containerElem ||
            !this.editorRef.current.containerElem.parentElement) {
            return;
        }
        // this.editorRef.current.container.parentElement 就是 ProjectNodeContentView
        const containerRect = getElementRevPosRect(this.editorRef.current.containerElem.parentElement);
        const end = view.coordsAtPos(editorSelection.head);
        const pos = this.menuRef.current.wrapPosition({
            top: end.bottom - containerRect.top,
            left: end.left - containerRect.left,
        });
        this.setState(produce((s) => {
            s.menuStyle = {
                display: 'block',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
            };
        }));
    };
    showLinkEditor = (editable, linkInfo) => {
        const { selection: editorSelection } = this.props.editorState;
        const view = this.editorView;
        if (!view ||
            !this.editorRef.current ||
            !this.editorRef.current.containerElem ||
            !this.editorRef.current.containerElem.parentElement) {
            return;
        }
        // this.editorRef.current.container.parentElement 就是 ProjectNodeContentView
        const containerRect = getElementRevPosRect(this.editorRef.current.containerElem.parentElement);
        const end = view.coordsAtPos(editorSelection.head);
        const pos = {
            top: end.bottom - containerRect.top,
            left: end.left - containerRect.left,
        };
        this.setState(produce((s) => {
            s.linkEditorEditable = editable;
            s.linkEditorStyle = {
                display: 'flex',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
            };
            if (linkInfo) {
                this.selectionOnEditLink = {
                    type: 'text',
                    anchor: linkInfo.anchor,
                    head: linkInfo.head,
                };
                s.linkEditorState = linkInfo;
            }
            else {
                const slice = editorSelection.content();
                s.linkEditorState = {
                    text: slice.content.textBetween(0, slice.content.size),
                    link: '',
                };
            }
        }));
        this.hideMenuBar();
    };
    debouncedShowPopover = debounce(selection => {
        if (!this.editorView?.hasFocus())
            return;
        const linkInfo = getLinkInfoBySelection(selection);
        if (linkInfo) {
            this.showLinkEditor(false, linkInfo);
        }
        else {
            if (!selection.empty) {
                this.showMenuBar();
            }
            else {
                this.onEditLinkBlur();
            }
        }
    }, SELECTION_CHANGE_TIMEOUT);
    hideMenuBar = () => {
        this.setState(produce((s) => {
            s.menuStyle.display = 'none';
            // 更新 MenuBar 的 key ，相当于重置了状态
            s.menuKey = '' + Date.now();
        }));
    };
    hideLinkEditor = () => {
        this.setState(produce((s) => {
            s.linkEditorStyle.display = 'none';
        }));
    };
    onProseMirrorFocus = () => {
        if (!this.restoreFocusClickSource) {
            this.props.onStartEdit();
        }
        this.setState({ tooltipPosition: undefined });
    };
    onProseMirrorBlur = () => {
        if (!this.restoreFocusClickSource) {
            this.props.onEndEdit();
        }
    };
    onMenuBlur = () => {
        const { editorView } = this;
        if (editorView && document.activeElement === editorView.dom)
            return;
        this.props.onEndEdit();
    };
    selectionOnEditLink = null;
    onEditLink = () => {
        this.selectionOnEditLink = this.props.editorState.selection.toJSON();
        this.showLinkEditor(true);
    };
    onEditLinkDone = (text, href) => {
        const { editorState, onReplaceTextWithMark } = this.props;
        if (this.selectionOnEditLink && this.editorView) {
            this.editorView.focus();
            this.editorView.dispatch(editorState.tr.setSelection(Selection.fromJSON(editorState.doc, this.selectionOnEditLink)));
            onReplaceTextWithMark(text, schema.marks.link, {
                href,
                [autoLinkAttrMark]: false,
            });
            this.onEditLinkBlur();
        }
    };
    onEditLinkDelete = () => {
        const { editorState, onCleanMark } = this.props;
        if (this.selectionOnEditLink && this.editorView) {
            this.editorView.focus();
            this.editorView.dispatch(editorState.tr.setSelection(Selection.fromJSON(editorState.doc, this.selectionOnEditLink)));
            onCleanMark(schema.marks.link);
            this.onEditLinkBlur();
        }
    };
    onEditLinkBlur = () => {
        this.selectionOnEditLink = null;
        this.hideLinkEditor();
    };
    focusEditor = () => {
        if (!this.editorView)
            return;
        this.editorView.focus();
        /**
         * view.focus 会调用 selectionToDOM > setSelection，它的内部会使用 getSelection().addRange 来
         * 选中 p 标签.
         * 随后 view.focus 里会调用 view.dom.focus , 但会因为一些未知的原因, addRange & focus 组合调用会
         * 使得浏览器不进行自动滚动.
         *
         * 修复方案是检查 view.focus 后, 强制调用一次 Transaction#scrollIntoView 来确保编辑区域在用户视图内
         */
        this.editorView.dispatch(this.editorView.state.tr.scrollIntoView());
    };
    onEditorPaste = (editorView, event, slice) => {
        if (getClipboardImageFile(event))
            return true;
        const _nodes = parseProjectNodeFromClipboardEvent(event, slice);
        const processNodes = async () => {
            const nodes = [];
            for (const node of _nodes) {
                if (!Array.isArray(node.images) ||
                    (Array.isArray(node.images) && node.images.length === 0)) {
                    nodes.push(node);
                    continue;
                }
                const _images = node.images || [];
                const images = [];
                for (const image of _images) {
                    if (!(typeof image === 'string')) {
                        images.push(image);
                        continue;
                    }
                    const imageData = await fileService.uploadImage(image);
                    if (imageData) {
                        images.push({
                            type: 'parasiticMedium',
                            data: imageData,
                        });
                    }
                }
                nodes.push({
                    ...node,
                    images,
                });
            }
            return nodes;
        };
        processNodes().then(nodes => {
            if (nodes) {
                this.props.onPasteNodes(nodes);
            }
        }).catch(err => console.error(err));
        if (_nodes) {
            return true;
        }
        // 如果不是多段的粘贴，那么 Prosemirror 会自动把段落合并到现有的段落
        return false;
    };
    onEditorClick = (editorView, pos, event) => {
        const anchorElement = findAnchorElement(event.target);
        if (anchorElement && anchorElement.href) {
            if (!ctrlPressManager.isPressed)
                return false;
            event.preventDefault();
            /**
             * 这里的链接是用户输入的链接，可能是 `http:`, `tel:`, `mailto:`,
             * `evernote:`, ...。所以需要判断一下是不是 http 开头，如果是的话，
             * 就在新窗口打开；如果不是的话，那可能是其他程序注册的 protocal ，
             * 就没必要在新窗口打开了，否则对应的程序启动后会留下一个空的窗口，
             * 很不好看
             */
            if (/^https?:/.test(anchorElement.href)) {
                window.open(anchorElement.href);
            }
            else {
                location.href = anchorElement.href;
            }
            return true;
        }
        return false;
    };
    onKeyDown = (editorView, event) => {
        this.props.onKeyDown(event);
        if (this.menuRef.current && this.menuRef.current.onEditorKeyDown(event)) {
            return true;
        }
        return event.defaultPrevented;
    };
    onMouseMove = (event) => {
        const anchorElement = findAnchorElement(event.target);
        if (anchorElement &&
            anchorElement.href &&
            !(this.editorView && this.editorView.hasFocus())) {
            const tooltipPosition = getMouseBoundingPos(event.nativeEvent);
            this.setState({ tooltipPosition });
        }
    };
    onMouseLeave = (event) => {
        this.setState({ tooltipPosition: undefined });
    };
    containerProps = {
        onFocus: this.onProseMirrorFocus,
        onBlur: this.onProseMirrorBlur,
        onMouseMove: this.onMouseMove,
        onMouseLeave: this.onMouseLeave,
    };
    editorProps = {
        handlePaste: this.onEditorPaste,
        handleClick: this.onEditorClick,
        handleKeyDown: this.onKeyDown,
    };
    render() {
        return (React.createElement(React.Fragment, null,
            React.createElement(ProseMirrorEditorView, { ref: this.editorRef, className: this.props.className, editorViewRef: this.editorViewRef, editorState: this.props.editorState, onDispatchTransaction: this.props.onDispatchTransaction, containerProps: this.containerProps, editorProps: this.editorProps }),
            React.createElement(ProseMirrorMenuBar, { key: this.state.menuKey, ref: this.menuRef, editorState: this.props.editorState, style: this.state.menuStyle, onEditorRetrieveFocus: this.focusEditor, onApplyMark: this.props.onApplyMark, onCleanMark: this.props.onCleanMark, onRemoveStyle: this.props.onRemoveStyle, onBlur: this.onMenuBlur, onEditLink: this.onEditLink }),
            React.createElement(ProseMirrorLinkEditor, { ref: this.linkEditorRef, editable: this.state.linkEditorEditable, style: this.state.linkEditorStyle, state: this.state.linkEditorState, onDone: this.onEditLinkDone, onDelete: this.onEditLinkDelete, onBlur: this.onEditLinkBlur }),
            this.state.tooltipPosition ? (React.createElement(LinkTooltip, { text: this.tooltipText, mouseX: this.state.tooltipPosition.x, mouseY: this.state.tooltipPosition.y })) : null));
    }
}
const LinkTooltip = (props) => {
    return (React.createElement("div", { className: "ProjectNodeContentView__LinkTooptip", style: {
            top: props.mouseY,
            left: props.mouseX,
        } },
        React.createElement("div", { className: "ProjectNodeContentView__LinkTooptip-inner" }, props.text)));
};
/**
 * 使用 InnerProseMirrorEditorView 时如果要渲染一些按钮，希望在用户点击按钮后
 * 输入框能够自动恢复焦点，并且不要 dispatch 结束和开始编辑 action ，可以使用
 * 这个函数包装一层 JSX
 *
 * WARNING **注意**：渲染的 JSX 里，如果有监听 onMouseDown 的元素，在事件触发
 * 的 Event Loop 里不要重新渲染，否则输入框会出 BUG （绝大部分场景下没必要监
 * 听 onMouseDown 事件，听 onClick 就够了）
 *
 * @example
 *
```jsx
function C() {
  const [loading, setLoading] = useState(false)
  return createRestoreFocusElement(
    <button onMouseDown={() => nextTick(() => setLoading(true))}>
      {loading ? 'Loading...' : 'History Back'}
    </button>
  )
}
```
 */
export const createRestoreFocusElement = (el) => {
    if (typeof el.type !== 'string') {
        throw new TypeError('createRestoreFocusElement only support native DOM, for example `createRestoreFocusElement(<img />)`');
    }
    return React.cloneElement(el, {
        [`data-${RESTORE_FOCUS_DATASET_KEY}`]: true,
    });
};
const findAnchorElement = (target) => {
    // PromiseMirror MarkType 嵌套有固定的顺序:
    // strong > em > u > a > span[color] > span[background-color]
    // 从当前 target 最多向上找两层 parent 应该就可以找到 a 标签
    if (!target || !(target instanceof HTMLElement))
        return null;
    if (target instanceof HTMLAnchorElement)
        return target;
    if (target.parentElement instanceof HTMLAnchorElement)
        return target.parentElement;
    if (target.parentElement &&
        target.parentElement.parentElement instanceof HTMLAnchorElement)
        return target.parentElement.parentElement;
    return null;
};
