import { DragSource, DropTarget, } from 'react-dnd';
import { findDOMNode } from 'react-dom';
import classnames from 'classnames';
import { pipe } from 'ramda';
import { ProjectNode } from '../../containers/ProjectNode';
import { SelectionItem, getElementPosRect, moveDirection, } from '../Selection';
import { identity } from '../../utils/F';
import { nodeSeeminglyAppendSiblingAvailable } from '../../services/ProjectNodeService';
import { evolve } from '../../utils/F/shallowChanged';
import shallowEqual from 'shallowequal';
const sourceSpec = {
    canDrag(props) {
        return props.draggable;
    },
    beginDrag(props) {
        props.onDragStart(props.node.id);
        return props;
    },
    endDrag(props) {
        props.onDragEnd(props.node.id);
    },
};
// https://github.com/react-dnd/react-dnd/blob/934efc81871f30c6038e2dc52be1504fe38132e7/packages/documentation/examples/04%20Sortable/Simple/Card.tsx#L33
const targetSpec = {
    hover(props, monitor, component) {
        if (!component)
            return;
        component.setState(dndHoverIntent(props, monitor, component));
    },
    drop(props, monitor, component) {
        const info = dndHoverIntent(props, monitor, component);
        if (!info.dndMoveIntend)
            return;
        props.onReordered(monitor.getItem().node.id, props.node.id, info.dndMoveIntend);
    },
};
function dndHoverIntent(props, monitor, component) {
    const defaultReturn = { dndMoveIntend: null };
    if (!monitor.isOver({ shallow: true }))
        return defaultReturn;
    const dragItem = monitor.getItem();
    const dropItem = props.node;
    const dragId = dragItem.node.id;
    const dropId = dropItem.id;
    // Don't replace items with themselves
    if (dragId === dropId)
        return defaultReturn;
    // Determine rectangle on screen
    const hoveredElem = findDOMNode(component);
    if (!(hoveredElem instanceof HTMLElement))
        return defaultReturn;
    const hoverBoundingRect = hoveredElem.getBoundingClientRect();
    // Determine mouse position
    const clientOffset = monitor.getClientOffset();
    if (!clientOffset)
        return defaultReturn;
    const dndMoveIntend = {
        relation: 'sibling',
        position: 'after',
    };
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    // 光标在覆盖的元素上半部分时在元素前方插入，在下半部分时在后方插入
    if (hoverClientY < hoverMiddleY) {
        dndMoveIntend.position = 'before';
    }
    else {
        dndMoveIntend.position = 'after';
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;
        // 如果节点看起来没办法追加同级节点
        if (!nodeSeeminglyAppendSiblingAvailable(props.node) ||
            hoverClientX > 100) {
            dndMoveIntend.relation = 'child';
        }
        else {
            dndMoveIntend.relation = 'sibling';
        }
    }
    if (dndMoveIntend.position === 'after' &&
        dndMoveIntend.relation === 'child' &&
        dropItem.childrenIds.indexOf(dragId) === 0) {
        return defaultReturn;
    }
    return { dndMoveIntend };
}
export class UnwrappedDraggableProjectNode extends React.Component {
    static defaultProps = {
        isSelectedInState: false,
        connectDragSource: identity,
        connectDragPreview: identity,
        connectDropTarget: identity,
    };
    state = {
        dndMoveIntend: null,
    };
    shouldComponentUpdate(nextProps, nextState) {
        return (!shallowEqual(this.state, nextState) ||
            !shallowEqual(this.props, nextProps, evolve({
                node: (a, b) => a.id === b.id,
                siblingNodes: (a, b) => a.map(n => n.id).join(',') === b.map(n => n.id).join(','),
            })));
    }
    render() {
        return this.props.connectDropTarget((React.createElement("div", { ref: this.innerRef, className: classnames([
                'DraggableProjectNode',
                {
                    ...this.getContainerDndRelatedClasses(),
                    'DraggableProjectNode--dragging': this.props.isDragging,
                },
            ]) },
            React.createElement(DraggableProjectNodeInner, { isSelectedInState: this.props.isSelectedInState, node: this.props.node, wrapDragHandle: this.wrapDragHandle }))));
    }
    innerRef = (elem) => {
        this.props.innerElemRef(this.props.node.id, elem);
    };
    getContainerDndRelatedClasses() {
        if (!this.props.isOver)
            return {};
        if (!this.state.dndMoveIntend)
            return {};
        return {
            'DraggableProjectNode--hover-intend-before': this.state.dndMoveIntend.position === 'before',
            'DraggableProjectNode--hover-intend-after': this.state.dndMoveIntend.position === 'after',
            'DraggableProjectNode--hover-intend-sibling': this.state.dndMoveIntend.relation === 'sibling',
            'DraggableProjectNode--hover-intend-child': this.state.dndMoveIntend.relation === 'child',
        };
    }
    wrapDragHandle = (renderer) => {
        return this.props.connectDragSource(renderer());
    };
}
export const DraggableProjectNode = pipe(DropTarget('ProjectNode', targetSpec, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({ shallow: true }),
})), DragSource('ProjectNode', sourceSpec, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
})))(UnwrappedDraggableProjectNode);
class DraggableProjectNodeInner extends React.Component {
    shouldComponentUpdate(nextProps) {
        return !shallowEqual(this.props, nextProps, evolve({
            node: (a, b) => a.id === b.id,
        }));
    }
    render() {
        return (React.createElement(SelectionItem, { item: this.props.node, shouldSelect: this.shouldSelect, children: ctx => (React.createElement(ProjectNode, { itemRef: ctx.innerRef, selected: ctx.isSelecting ? ctx.selected : this.props.isSelectedInState, nodeId: this.props.node.id, wrapDragHandle: this.props.wrapDragHandle })) }));
    }
    // 当处于选择过程中时，确保鼠标有足够多的位移，否则可能是点击
    shouldSelect = (elem, pageSelectionRange) => {
        const elemRect = getElementPosRect(elem);
        const currPos = pageSelectionRange[1];
        const direction = moveDirection(pageSelectionRange);
        if (!direction)
            return false;
        if (direction.down) {
            return currPos.top - elemRect.top > 10;
        }
        else if (direction.up) {
            return elemRect.bottom - currPos.top > 10;
        }
        else {
            return true;
        }
    };
}
