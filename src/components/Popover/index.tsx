import classnames from 'classnames';
import { identityT } from '../../utils/F';
import { Portal } from '../Portal';
import './style.scss';
let popoverContainer = null;
export class Popover extends React.PureComponent {
    static defaultProps = {
        appearDelay: 0,
        disappearDelay: 0,
        triggerClassName: '',
        containerClassName: '',
        openOn: 'none',
        closeOnClick: true,
        disabled: false,
        onVisibleChange: identityT(),
    };
    state = {
        visible: false,
        popoverTop: 0,
        popoverLeft: 0,
    };
    triggerRef = React.createRef();
    componentDidUpdate(prevProps) {
        if (this.visibleDelegated(this.props) &&
            prevProps.disabled !== this.props.disabled &&
            this.props.disabled) {
            this.changeVisible(false);
        }
    }
    render() {
        if (!popoverContainer) {
            popoverContainer = document.createElement('div');
            document.body.appendChild(popoverContainer);
        }
        return (React.createElement(React.Fragment, null,
            typeof this.props.trigger !== 'function' ? null : (React.createElement("div", { ref: this.triggerRef, tabIndex: -1, className: classnames([
                    'Popover__trigger',
                    this.props.triggerClassName,
                ]), onClick: this.onClick, onFocus: this.onFocus, onMouseEnter: this.onMouseEnter, onMouseLeave: this.onMouseLeave }, this.props.trigger())),
            this.props.disabled ? null : (React.createElement(Portal, { parent: popoverContainer, className: `Popover__container ${this.props.containerClassName}`, style: this.portalStyle(), closeOnClick: this.props.closeOnClick, visible: this.visible, onVisibleChange: this.changeVisible },
                React.createElement("div", { className: "Popover__content", onMouseEnter: this.onMouseEnter, onMouseLeave: this.onMouseLeave }, this.visible ? this.props.content() : null)))));
    }
    visibleDelegated(props) {
        return 'visible' in this.props;
    }
    get visible() {
        if (this.props.disabled)
            return false;
        if (this.visibleDelegated(this.props)) {
            return this.props.visible;
        }
        else {
            return this.state.visible;
        }
    }
    portalStyle() {
        const defaultStyle = {
            display: 'block',
            visibility: this.visible ? 'visible' : 'hidden',
            transitionDelay: this.visible
                ? `${this.props.appearDelay / 1000}s`
                : `${this.props.disappearDelay / 1000}s`,
        };
        if ('popoverTop' in this.props && this.props.popoverTop != null) {
            return Object.assign(defaultStyle, {
                top: `${this.props.popoverTop}px`,
                left: `${this.props.popoverLeft}px`,
            });
        }
        else {
            return Object.assign(defaultStyle, {
                top: `${this.state.popoverTop}px`,
                left: `${this.state.popoverLeft}px`,
            });
        }
    }
    changeVisible = (visible) => {
        if (this.visibleDelegated(this.props)) {
            this.props.onVisibleChange(visible);
        }
        else {
            this.setState({ visible });
        }
    };
    showPopover() {
        if (this.props.disabled)
            return;
        if (!document.scrollingElement)
            return;
        const trigger = this.triggerRef.current;
        if (!trigger)
            return;
        const rect = trigger.getBoundingClientRect();
        this.setState({
            popoverTop: document.scrollingElement.scrollTop + rect.bottom,
            popoverLeft: document.scrollingElement.scrollLeft + rect.left + rect.width / 2,
        });
        this.changeVisible(true);
    }
    onClick = (event) => {
        if (this.props.openOn !== 'click')
            return;
        this.showPopover();
    };
    onFocus = (event) => {
        if (this.props.openOn !== 'focus')
            return;
        this.showPopover();
    };
    onMouseEnter = (event) => {
        if (this.props.openOn !== 'hover')
            return;
        this.showPopover();
    };
    onMouseLeave = (event) => {
        if (this.props.disabled)
            return;
        if (this.props.openOn !== 'hover')
            return;
        this.changeVisible(false);
    };
}
