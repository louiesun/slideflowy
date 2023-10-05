import { coveredByRect, getElementPosRect, rangeToPosRect, posRectToRange, getMousePagePosition, getMouseScreenPosition, } from './helpers';
import { Provider } from './SelectionContext';
import { throttle } from 'lodash';
export class SelectionContainer extends React.PureComponent {
    static defaultProps = {
        selectionRectVisible: false,
        selectionVisible: ([startPos, endPos]) => {
            const xDistance = Math.abs(startPos.left - endPos.left);
            const yDistance = Math.abs(startPos.top - endPos.top);
            return xDistance > 20 || yDistance > 20;
        },
        disabled: false,
        preventUserSelect: true,
        shouldSelect: () => true,
        shouldUnselect: () => true,
        selectRange: null,
        onSelected: () => { },
    };
    state;
    selfRef = React.createRef();
    selectionItems = [];
    constructor(props) {
        super(props);
        this.onSelectionItemDidMount = this.onSelectionItemDidMount.bind(this);
        this.onSelectionItemWillUnmount = this.onSelectionItemWillUnmount.bind(this);
        this.state = {
            ctxValue: this.getCtxValue(),
            lastPageSelection: null,
            currPageSelection: null,
            currScreenSelection: null,
        };
    }
    get selectedItems() {
        return this.selectionItems.filter(i => i.selected).map(i => i.props.item);
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.onMouseDown, false);
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('mouseup', this.onMouseUp, false);
        if (this.props.selectRange) {
            this.setState({ lastPageSelection: this.props.selectRange });
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.selectRange !== this.state.lastPageSelection) {
            if (this.props.selectRange !== prevProps.selectRange) {
                this.setState({ lastPageSelection: this.props.selectRange }, () => {
                    this.props.onSelected(this.state.lastPageSelection, this.selectedItems);
                });
            }
            else if (this.state.lastPageSelection !== prevState.lastPageSelection) {
                const items = this.state.lastPageSelection
                    ? this.getCoveredItems(this.state.lastPageSelection)
                    : [];
                // 有些情况下代码走到这里的时候 selectedItems 还没有更新（比如 selectAll ）
                // 最好等状态传入所有子组件后再调用，否则外部接到回调的时候会发现子组件的
                // 状态都还没更新完
                this.props.onSelected(this.state.lastPageSelection, items);
            }
        }
        if (this.props.disabled !== prevProps.disabled && this.props.disabled) {
            this.setState({
                currPageSelection: null,
                lastPageSelection: null,
            });
        }
        if (this.props.disabled !== prevProps.disabled ||
            this.props.selectionVisible !== prevProps.selectionVisible ||
            this.state.currPageSelection !== prevState.currPageSelection ||
            this.state.lastPageSelection !== prevState.lastPageSelection) {
            this.setState({ ctxValue: this.getCtxValue() });
        }
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.onMouseDown, false);
        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('mouseup', this.onMouseUp, false);
    }
    render() {
        return (React.createElement(Provider, { value: this.state.ctxValue },
            React.createElement("div", { ref: this.selfRef },
                this.props.children,
                this.renderInspector(),
                this.renderSelectionRectangle())));
    }
    /**
     * 选中所有元素，相当于鼠标划出容器大小的选区
     * WARNING: 只在鼠标松开的情况下生效，点住的情况下会被忽略
     */
    selectAll() {
        if (this.state.currPageSelection)
            return;
        if (!this.selfRef.current)
            return;
        const elemRect = getElementPosRect(this.selfRef.current);
        this.setState({ lastPageSelection: posRectToRange(elemRect) });
    }
    getCoveredItems(range) {
        const rect = rangeToPosRect(range);
        return this.selectionItems
            .filter(i => i.coveredByRect(rect))
            .map(i => i.props.item);
    }
    renderInspector() {
        if (!this.props.selectionInspector)
            return;
        const { pageSelectionRange } = this.state.ctxValue;
        const rect = pageSelectionRange && rangeToPosRect(pageSelectionRange);
        return (React.createElement("div", { key: "inspector", style: {
                position: 'absolute',
                right: '0px',
                top: '0px',
                width: '250px',
                background: '#eaeaea',
            } },
            !rect
                ? null
                : [
                    `rect.top: ${rect.top}`,
                    React.createElement("br", { key: '1' }),
                    `rect.left: ${rect.left}`,
                    React.createElement("br", { key: '2' }),
                    `rect.bottom: ${rect.bottom}`,
                    React.createElement("br", { key: '3' }),
                    `rect.right: ${rect.right}`,
                ],
            React.createElement("br", null),
            !this.state.currPageSelection
                ? null
                : [
                    `startCursorPos.top: ${this.state.currPageSelection[0].top}`,
                    React.createElement("br", { key: '1' }),
                    `startCursorPos.left: ${this.state.currPageSelection[0].left}`,
                    React.createElement("br", { key: '2' }),
                    `currCursorPos.top: ${this.state.currPageSelection[1].top}`,
                    React.createElement("br", { key: '3' }),
                    `currCursorPos.left: ${this.state.currPageSelection[1].left}`,
                ],
            React.createElement("br", null)));
    }
    renderSelectionRectangle() {
        if (!this.props.selectionRectVisible)
            return;
        let parentTop;
        let parentLeft;
        if (this.selfRef &&
            this.selfRef.current &&
            this.selfRef.current.offsetParent) {
            const parent = this.selfRef.current.offsetParent;
            const parentRect = getElementPosRect(parent);
            parentTop = parentRect.top;
            parentLeft = parentRect.left;
        }
        else {
            parentTop = 0;
            parentLeft = 0;
        }
        const { pageSelectionRange } = this.state.ctxValue;
        const rect = pageSelectionRange && rangeToPosRect(pageSelectionRange);
        return (React.createElement("div", { key: "rectangle", style: !rect
                ? {}
                : {
                    border: '1px solid #000',
                    position: 'absolute',
                    top: rect.top - parentTop + 'px',
                    left: rect.left - parentLeft + 'px',
                    width: rect.right - rect.left + 'px',
                    height: rect.bottom - rect.top + 'px',
                } }));
    }
    onMouseDown = (event) => {
        if (this.props.disabled)
            return;
        if (!(event.target instanceof Element))
            return;
        if (event.button !== 0)
            return;
        if (!this.selfRef.current)
            return;
        if (!this.selfRef.current.contains(event.target))
            return;
        const selfPosRect = getElementPosRect(this.selfRef.current);
        if (!selfPosRect)
            return;
        const cursorPagePos = getMousePagePosition(event);
        const cursorScreenPos = getMouseScreenPosition(event);
        if (coveredByRect(cursorPagePos, selfPosRect) && this.shouldSelect(event)) {
            this.setState({
                currPageSelection: [cursorPagePos, cursorPagePos],
                currScreenSelection: [cursorScreenPos, cursorScreenPos],
            });
        }
        else if (this.shouldUnselect(event)) {
            this.setState({
                lastPageSelection: null,
                currPageSelection: null,
                currScreenSelection: null,
            });
        }
    };
    onMouseMove = throttle((event) => {
        if (!this.state.currPageSelection)
            return;
        if (!this.state.currScreenSelection)
            return;
        const selection = document.getSelection();
        const startPos = this.state.currPageSelection[0];
        const endPos = getMousePagePosition(event);
        if (this.props.preventUserSelect &&
            selection &&
            selection.rangeCount &&
            this.selectionRangeVisible([startPos, endPos])) {
            if (document.activeElement !== document.body &&
                document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            selection.removeAllRanges();
        }
        this.setState({
            currPageSelection: [startPos, endPos],
            currScreenSelection: [
                this.state.currScreenSelection[0],
                getMouseScreenPosition(event),
            ],
        });
    }, 100);
    onMouseUp = (event) => {
        if (!this.state.currPageSelection)
            return;
        if (!this.state.currScreenSelection)
            return;
        const startPos = this.state.currPageSelection[0];
        const endPos = getMousePagePosition(event);
        if (this.selectionRangeVisible([startPos, endPos])) {
            this.setState({
                lastPageSelection: [startPos, endPos],
                currPageSelection: null,
                currScreenSelection: null,
            });
        }
        else if (this.shouldUnselect(event)) {
            this.setState({
                lastPageSelection: null,
                currPageSelection: null,
                currScreenSelection: null,
            });
        }
    };
    shouldSelect(event) {
        const shouldSelect = this.props.shouldSelect(event);
        return shouldSelect == null ? true : shouldSelect;
    }
    shouldUnselect(event) {
        const shouldUnselect = this.props.shouldUnselect(event);
        return shouldUnselect == null ? true : shouldUnselect;
    }
    selectionRangeVisible(selectionRange) {
        const selectionPosRect = rangeToPosRect(selectionRange);
        const selectedItems = this.selectionItems
            .filter(i => i.coveredByRect(selectionPosRect))
            .map(i => i.props.item);
        return this.props.selectionVisible(selectionRange, selectedItems);
    }
    getCtxValue() {
        const initialContextValue = {
            isSelecting: false,
            pageSelectionRange: null,
            screenSelectionRange: null,
            onSelectionItemDidMount: this.onSelectionItemDidMount,
            onSelectionItemWillUnmount: this.onSelectionItemWillUnmount,
        };
        if (!this.state)
            return initialContextValue;
        if (this.props.disabled)
            return initialContextValue;
        const pageSelectionRange = this.state.currPageSelection || this.state.lastPageSelection;
        if (!pageSelectionRange)
            return initialContextValue;
        if (!this.selectionRangeVisible(pageSelectionRange))
            return initialContextValue;
        return {
            isSelecting: !!this.state.currPageSelection,
            pageSelectionRange,
            screenSelectionRange: this.state.currScreenSelection,
            onSelectionItemDidMount: this.onSelectionItemDidMount,
            onSelectionItemWillUnmount: this.onSelectionItemWillUnmount,
        };
    }
    onSelectionItemDidMount(item) {
        if (this.selectionItems.indexOf(item) === -1) {
            this.selectionItems = this.selectionItems.concat(item);
        }
    }
    onSelectionItemWillUnmount(item) {
        if (this.selectionItems.indexOf(item) !== -1) {
            this.selectionItems = this.selectionItems.filter(i => i !== item);
        }
    }
}
