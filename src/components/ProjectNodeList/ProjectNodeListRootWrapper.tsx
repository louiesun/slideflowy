import { nutstoreClient } from 'NutstoreSDK';
import { SelectionContainer, getElementPosRect, coveredByRect, getMousePagePosition, } from '../Selection';
import { ProjectNodeListGlobalShortcuts } from '../../containers/ProjectNodeListGlobalShortcuts';
import { Popover } from '../Popover';
import { ProjectNodeMenu } from '../ProjectNodeMenu';
import { ProjectNodeListContext, } from './ProjectNodeListContext';
export class ProjectNodeListRootWrapper extends React.PureComponent {
    static defaultProps = {
        dragging: false,
    };
    state = {
        popoverPosProps: null,
        lastRerenderPopoverAt: Date.now(),
    };
    containerRef = React.createRef();
    selectionRef = React.createRef();
    componentDidMount() {
        document.addEventListener('dragover', this.onSomethingDragOverDocument, false);
    }
    componentWillUnmount() {
        document.removeEventListener('dragover', this.onSomethingDragOverDocument, false);
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.selectedNodes !== prevProps.selectedNodes) {
            // 因为 selectedNodes 刚发生变化的时候，子组件的 css 类名不一定渲染
            // 好了（比如全选快捷键触发的时候），所以需要等渲染完成一遍后再显示
            // Popover
            if (this.props.selectedNodes.length) {
                this.setState({
                    popoverPosProps: this.calcPopoverPos(),
                });
            }
            else {
                this.setState({
                    popoverPosProps: null,
                });
            }
        }
    }
    render() {
        if (nutstoreClient.isMobile) {
            return this.renderMobileVersion();
        }
        else {
            return this.renderDesktopVersion();
        }
    }
    renderMobileVersion() {
        return (React.createElement(ProjectNodeListContext.Provider, { value: {
                registerListItem: this.registerListItem,
                onDragStart: this.props.onDragStart,
                onDragEnd: this.props.onDragEnd,
            } },
            React.createElement("div", { ref: this.containerRef, className: "ProjectNodeList__RootWrapper-mobile" }, this.props.children)));
    }
    renderDesktopVersion() {
        return (React.createElement(SelectionContainer, { ref: this.selectionRef, disabled: this.props.dragging, selectRange: this.props.selectionRange, selectionVisible: this.selectionVisible, shouldSelect: this.shouldSelect, shouldUnselect: this.shouldUnselect, onSelected: this.onSelected },
            React.createElement(ProjectNodeListGlobalShortcuts, { onSelectAllNodes: this.onSelectAllNodes },
                React.createElement(ProjectNodeListContext.Provider, { value: {
                        registerListItem: this.registerListItem,
                        onDragStart: this.props.onDragStart,
                        onDragEnd: this.props.onDragEnd,
                    } },
                    React.createElement("div", { ref: this.containerRef, className: "ProjectNodeList__RootWrapper" },
                        this.props.children,
                        this.renderProjectNodeMenuPopover())))));
    }
    onSelectAllNodes = () => {
        if (!this.selectionRef.current)
            return;
        this.selectionRef.current.selectAll();
    };
    // 原生 dnd API 好像在遇到 position fixed 的时候不会自动滚屏，然后
    // 我们正好有顶栏，所以需要手动来做滚动的工作
    onSomethingDragOverDocument = (event) => {
        if (!this.props.dragging)
            return;
        if (!document.scrollingElement)
            return;
        if (event.clientY < 40)
            document.scrollingElement.scrollTop -= 40 - event.clientY;
    };
    renderProjectNodeMenuPopover() {
        return (React.createElement(Popover, { visible: Boolean(this.state.popoverPosProps), containerClassName: "ProjectNodeList__batch-operate-popover", ...this.state.popoverPosProps, content: () => (React.createElement(ProjectNodeMenu, { ...this.props, editable: this.props.editable, nodes: this.props.selectedNodes })) }));
    }
    calcPopoverPos() {
        const defaultPos = { popoverTop: 0, popoverLeft: 0 };
        if (!this.containerRef.current)
            return defaultPos;
        if (!this.props.selectionRange)
            return defaultPos;
        const firstSelectedNode = this.props.selectedNodes[0];
        const firstSelectedNodePos = firstSelectedNode &&
            this._listItem[firstSelectedNode.id] &&
            this._listItem[firstSelectedNode.id].elem &&
            getElementPosRect(this._listItem[firstSelectedNode.id].elem);
        if (!firstSelectedNodePos)
            return defaultPos;
        return {
            popoverTop: firstSelectedNodePos.top - 10,
            popoverLeft: firstSelectedNodePos.right,
        };
    }
    _listItem = {};
    registerListItem = (nodeId, el) => {
        this._listItem[nodeId] = { elem: el };
    };
    shouldSelect = (event) => {
        if (!this.isProjectNodeContentView(event.target) ||
            this.inEditingNodeElement(event) ||
            this.inBatchOperatePopover(event.target)) {
            return false;
        }
    };
    shouldUnselect = (event) => {
        if (this.inBatchOperatePopover(event.target)) {
            return false;
        }
    };
    isProjectNodeContentView(target) {
        if (!(target instanceof HTMLElement))
            return false;
        if (target.closest('.ProjectNodeContentView'))
            return true;
        return false;
    }
    inEditingNodeElement(event) {
        if (!(event.target instanceof HTMLElement))
            return false;
        if (!this.props.editingNodeId)
            return false;
        const item = this._listItem[this.props.editingNodeId];
        if (!item || !item.elem)
            return false;
        const elemRect = getElementPosRect(item.elem);
        return coveredByRect(getMousePagePosition(event), elemRect);
    }
    inBatchOperatePopover(target) {
        return (target instanceof HTMLElement &&
            target.closest('.ProjectNodeList__batch-operate-popover'));
    }
    onSelected = (range, items) => {
        this.props.onSelected(range, items);
        this.setState({ lastRerenderPopoverAt: Date.now() });
    };
    selectionVisible = (selectionRange, selectedItems) => {
        if (selectedItems.length > 1)
            return true;
        if (!selectedItems.length)
            return false;
        const node = selectedItems[0];
        const item = this._listItem[node.id];
        if (!item || !item.elem)
            return false;
        const elemRect = getElementPosRect(item.elem);
        const currPos = selectionRange[1];
        return !coveredByRect(currPos, elemRect);
    };
}
