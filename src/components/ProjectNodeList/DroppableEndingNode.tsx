import { useDrop } from 'react-dnd';
import classnames from 'classnames';
import { selectors } from '../../action_packs/project_node';
const { isAncestor, isCoveredInSelectedNodeIds } = selectors;
export const DroppableEndingNode = (props) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'ProjectNode',
        collect: (monitor) => ({
            isOver: monitor.isOver()
        }),
        drop: (item, monitor) => {
            if (!monitor.isOver({ shallow: true }) ||
                (props.lastSelectedNodeIds.length !== 0 && isCoveredInSelectedNodeIds(props.noneNestedNodeList[props.noneNestedNodeList.length - 1].id, props.lastSelectedNodeIds))) {
                return;
            }
            const selectedNodeIds = props.lastSelectedNodeIds && props.lastSelectedNodeIds.length !== 0 ?
                props.lastSelectedNodeIds :
                [item.node.id];
            const topNodeIds = [];
            selectedNodeIds.forEach((id, idx) => {
                if (idx === 0) {
                    topNodeIds.push(id);
                    return;
                }
                if (!isAncestor(topNodeIds[topNodeIds.length - 1], id, props.nodes)) {
                    topNodeIds.push(id);
                }
            });
            const reversed = topNodeIds.reverse();
            reversed.forEach((id) => {
                props.onDrop(id);
            });
        }
    }), [props.nodes, props.noneNestedNodeList, props.lastSelectedNodeIds, props.onDrop]);
    return (React.createElement("div", { ref: drop, className: classnames([
            'DroppableEndingNode',
            {
                'DroppableEndingNode--hovering': isOver && (props.lastSelectedNodeIds.length === 0 ||
                    !isCoveredInSelectedNodeIds(props.noneNestedNodeList[props.noneNestedNodeList.length - 1].id, props.lastSelectedNodeIds))
            },
        ]) }));
};
