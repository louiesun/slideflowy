import { DropTarget, } from 'react-dnd';
import classnames from 'classnames';
import { pipe } from 'ramda';
import { identity } from '../../utils/F';
// https://github.com/react-dnd/react-dnd/blob/934efc81871f30c6038e2dc52be1504fe38132e7/packages/documentation/examples/04%20Sortable/Simple/Card.tsx#L33
const targetSpec = {
    drop(props, monitor, component) {
        if (!monitor.isOver({ shallow: true }))
            return;
        props.onDrop(monitor.getItem().node.id);
    },
};
export class UnwrappedDroppableEndingNode extends React.Component {
    static defaultProps = {
        connectDropTarget: identity,
    };
    render() {
        return this.props.connectDropTarget((React.createElement("div", { className: classnames([
                'DroppableEndingNode',
                {
                    'DroppableEndingNode--hovering': this.props.isOver,
                },
            ]) })));
    }
}
export const DroppableEndingNode = pipe(DropTarget('ProjectNode', targetSpec, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({ shallow: true }),
})))(UnwrappedDroppableEndingNode);
