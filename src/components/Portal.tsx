import { equals } from 'ramda';
export class Portal extends React.PureComponent {
    static defaultProps = {
        className: '',
        style: {},
        visible: false,
        onVisibleChange: () => { },
        closeOnClick: false,
        closeOnOutsideClick: false,
    };
    portal = document.createElement('div');
    componentDidMount() {
        this.updateNode(null, this.props);
        document.addEventListener('click', this.onClick);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.onClick);
        this.updateNode(this.props, null);
    }
    componentDidUpdate(prevProps) {
        this.updateNode(prevProps, this.props);
    }
    render() {
        return ReactDOM.createPortal(this.props.children, this.portal);
    }
    updateNode(prevProps, nextProps) {
        const root = this.portal;
        if (!prevProps || !nextProps || prevProps.parent !== nextProps.parent) {
            prevProps && (prevProps.parent || document.body).removeChild(this.portal);
            nextProps && (nextProps.parent || document.body).appendChild(this.portal);
        }
        if (nextProps) {
            if (!prevProps || prevProps.className !== nextProps.className) {
                root.setAttribute('class', nextProps.className.trim() || '');
            }
            const prevStyle = prevProps && prevProps.style;
            const nextStyle = nextProps.style;
            if (!equals(prevStyle, nextStyle)) {
                root.removeAttribute('style');
                Object.assign(root.style, { display: nextProps.visible ? 'block' : 'none' }, nextStyle);
            }
            else {
                root.style.display = nextProps.visible ? 'block' : 'none';
            }
        }
    }
    onClick = (event) => {
        if (!this.props.visible)
            return;
        if (!(event.target instanceof HTMLElement))
            return;
        const root = this.portal;
        if (!root || (event.button && event.button !== 0))
            return;
        if (root.contains(event.target)) {
            this.props.closeOnClick && this.props.onVisibleChange(false);
        }
        else {
            this.props.closeOnOutsideClick && this.props.onVisibleChange(false);
        }
    };
}
