import classnames from 'classnames';
import { DraggableProjectNode, } from './DraggableProjectNode';
import { ProjectNodeListRootWrapper, } from './ProjectNodeListRootWrapper';
import { ProjectNodeListContext, } from './ProjectNodeListContext';
import './style.scss';
import { evolve, shallowChanged } from '../../utils/F/shallowChanged';
import { DroppableEndingNode, } from './DroppableEndingNode';
export class ProjectNodeList extends React.Component {
    static defaultProps = {
        isRoot: false,
        header: null,
        footer: null,
    };
    shouldComponentUpdate(nextProps) {
        return Boolean(shallowChanged(this.props, nextProps, evolve({
            noneNestedNodeList: (a, b) => a.map((n) => n.id).join(',') !== b.map((n) => n.id).join(','),
        })));
    }
    render() {
        if (this.props.isRoot) {
            return this.renderOuter(this.renderInner());
        }
        else {
            return this.renderInner();
        }
    }
    renderOuter(inner) {
        return (React.createElement(ProjectNodeListRootWrapper, { ...this.props },
            this.props.header,
            inner,
            this.props.footer));
    }
    renderInner() {
        return React.createElement(ProjectNodeListContext.Consumer, { children: this.renderProjectNode });
    }
    renderProjectNode = (ctx) => (React.createElement("div", { className: classnames([
            'ProjectNodeList',
            { 'ProjectNodeList--dragging': this.props.dragging },
        ]) },
        this.props.noneNestedNodeList.map((n, idx) => (React.createElement(DraggableProjectNode, { key: n.id, innerElemRef: ctx.registerListItem, index: idx, node: n, isDraggingCovered: !this.props.draggingCoveredNodeIds ? false : Boolean(this.props.draggingCoveredNodeIds[n.id]), isSelectedInState: this.props.selectedNodes.indexOf(n) > -1, nodes: this.props.nodes, draggable: this.props.editable, onDragStart: ctx.onDragStart, onDragEnd: ctx.onDragEnd, onReordered: this.props.onReordered, lastSelectedNodeIds: this.props.lastSelectedNodeIds || [], draggingCoveredNodeIds: this.props.draggingCoveredNodeIds, cancelSelectedNodeIds: this.props.cancelSelectedNodeIds }))),
        React.createElement(DroppableEndingNode, { nodes: this.props.nodes, noneNestedNodeList: this.props.noneNestedNodeList, lastSelectedNodeIds: this.props.lastSelectedNodeIds || [], onDrop: this.props.onMoveToEnd })));
}
