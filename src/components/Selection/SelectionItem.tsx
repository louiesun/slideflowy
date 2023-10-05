import { getElementPosRect, coveredByRect, rangeToPosRect } from './helpers';
import { Consumer } from './SelectionContext';
export const SelectionItem = function SelectionItem(props) {
    return (React.createElement(Consumer, null, ctx => React.createElement(SelectionInnerItem, { ...props, selectionContext: ctx })));
};
export class SelectionInnerItem extends React.PureComponent {
    childRef;
    state = {
        childProps: this.getChildProps(),
    };
    get selected() {
        return this.state.childProps.selected;
    }
    constructor(props) {
        super(props);
        this.innerRef = this.innerRef.bind(this);
        this.state = {
            childProps: this.getChildProps(),
        };
    }
    componentDidMount() {
        this.props.selectionContext.onSelectionItemDidMount(this);
        this.setState({
            childProps: this.getChildProps(this.props.selectionContext),
        });
    }
    componentDidUpdate(prevProps) {
        if (this.props.selectionContext !== prevProps.selectionContext) {
            this.setState({
                childProps: this.getChildProps(this.props.selectionContext),
            });
        }
    }
    componentWillUnmount() {
        this.props.selectionContext.onSelectionItemWillUnmount(this);
    }
    render() {
        return this.props.children(this.state.childProps);
    }
    coveredByRect(r) {
        if (!this.childRef)
            return false;
        return coveredByRect(getElementPosRect(this.childRef), r);
    }
    getChildProps(ctx) {
        const defaultReturn = {
            innerRef: this.innerRef,
            isStartPoint: false,
            isEndPoint: false,
            isSelecting: false,
            selected: false,
        };
        if (!this.childRef || !(ctx && ctx.pageSelectionRange))
            return defaultReturn;
        const elemPosRect = getElementPosRect(this.childRef);
        const elemCovered = coveredByRect(elemPosRect, rangeToPosRect(ctx.pageSelectionRange));
        const selected = elemCovered && this.props.shouldSelect(this.childRef, ctx.pageSelectionRange, ctx.screenSelectionRange);
        if (!selected)
            return defaultReturn;
        return {
            innerRef: this.innerRef,
            isStartPoint: coveredByRect(ctx.pageSelectionRange[0], elemPosRect),
            isEndPoint: coveredByRect(ctx.pageSelectionRange[1], elemPosRect),
            isSelecting: ctx.isSelecting,
            selected,
        };
    }
    innerRef(element) {
        this.childRef = element;
    }
}
