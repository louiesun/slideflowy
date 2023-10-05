import * as React from 'react';
import { Portal } from '@c4605/react-portal';
let popoverContainer = null;
/**
 * By default, the visible state hosted by Popover.
 *
 * If supplied `visible` prop, Popover will follow the
 * [State Up](https://reactjs.org/docs/lifting-state-up.html) pattern, and when
 * need change visible state, will callback `onVisibleChange(expectedVisibleState)`
 */
export class Popover extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            visible: false,
            popoverTop: 0,
            popoverLeft: 0,
        };
        this.triggerContainerRef = React.createRef();
        this.contentContainerRef = React.createRef();
        this.clickClose = (event) => {
            // istanbul ignore next
            if (!this.triggerContainerRef.current)
                return;
            // istanbul ignore next
            if (!this.contentContainerRef.current)
                return;
            // istanbul ignore next
            if (!(event.target instanceof HTMLElement))
                return;
            if (this.props.closeOn === 'click') {
                return true;
            }
            const clickInside = this.triggerContainerRef.current.contains(event.target) ||
                this.contentContainerRef.current.contains(event.target);
            if (this.props.closeOn === 'clickInside') {
                return clickInside;
            }
            else if (this.props.closeOn === 'clickOutside') {
                return !clickInside;
            }
            // istanbul ignore next
            return;
        };
        this.changeVisible = (visible, reason) => {
            // istanbul ignore next
            visible = this.props.disabled ? false : visible;
            if (this.visibleDelegated) {
                // istanbul ignore next
                if (this.visible === visible)
                    return;
                this.props.onVisibleChange(visible, reason);
            }
            else {
                this.setState({ visible });
            }
        };
        this.onTriggerClick = (event) => {
            if (this.props.disabled)
                return;
            if (this.props.openOn !== 'click')
                return;
            // istanbul ignore next
            if (!document.scrollingElement)
                return;
            // istanbul ignore next
            if (!this.triggerContainerRef.current)
                return;
            this.setState(this.getPositionInfo(this.triggerContainerRef.current, document.scrollingElement));
            this.changeVisible(true, { event: event.nativeEvent });
        };
        this.onMouseEnter = (event) => {
            if (this.props.disabled)
                return;
            if (this.props.openOn !== 'hover')
                return;
            // istanbul ignore next
            if (!document.scrollingElement)
                return;
            // istanbul ignore next
            if (!this.triggerContainerRef.current)
                return;
            this.setState(this.getPositionInfo(this.triggerContainerRef.current, document.scrollingElement));
            this.changeVisible(true, { event: event.nativeEvent });
        };
        this.onMouseLeave = (event) => {
            // istanbul ignore next
            if (this.props.disabled)
                return;
            if (this.props.closeOn !== 'hover')
                return;
            this.changeVisible(false, { event: event.nativeEvent });
        };
    }
    static get popoverContainer() {
        return popoverContainer;
    }
    render() {
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { ref: this.triggerContainerRef, className: `Popover__trigger ${this.props.triggerClassName}`, onClick: this.onTriggerClick, onMouseEnter: this.onMouseEnter, onMouseLeave: this.onMouseLeave }, this.props.trigger()),
            React.createElement(Portal, { className: `Popover__container ${this.props.popoverClassName}`, style: this.popoverStyle(), parent: this.getPopoverParent(), clickClose: this.clickClose, visible: this.visible, onVisibleChange: this.changeVisible },
                React.createElement("div", { ref: this.contentContainerRef, className: "Popover__content", onMouseEnter: this.onMouseEnter, onMouseLeave: this.onMouseLeave }, !this.visible ? null : this.props.content()))));
    }
    getPopoverParent() {
        if (this.props.inline)
            return null;
        if (!popoverContainer) {
            popoverContainer = document.createElement('div');
            document.body.appendChild(popoverContainer);
        }
        return popoverContainer;
    }
    popoverStyle() {
        if (this.props.disabled)
            return;
        // istanbul ignore next
        if (!document.scrollingElement)
            return;
        // istanbul ignore next
        if (!this.triggerContainerRef.current)
            return;
        return this.props.popoverStyle({
            visible: this.visible,
            ...this.getPositionInfo(this.triggerContainerRef.current, document.scrollingElement),
        });
    }
    get visibleDelegated() {
        return 'visible' in this.props;
    }
    get visible() {
        if (this.props.disabled)
            return false;
        if (this.visibleDelegated) {
            return !!this.props.visible;
        }
        else {
            return this.state.visible;
        }
    }
    getPositionInfo(trigger, scrollingElement) {
        const rect = trigger.getBoundingClientRect();
        return {
            popoverTop: scrollingElement.scrollTop + rect.bottom,
            popoverLeft: scrollingElement.scrollLeft + rect.left + rect.width / 2,
        };
    }
}
Popover.displayName = 'Popover';
Popover.defaultProps = {
    triggerClassName: '',
    popoverClassName: '',
    openOn: 'hover',
    closeOn: 'hover',
    disabled: false,
    inline: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onVisibleChange: /* istanbul ignore next */ () => { },
    popoverStyle: (info) => ({
        position: 'absolute',
        top: `${info.popoverTop}px`,
        left: `${info.popoverLeft}px`,
        display: 'block',
        visibility: info.visible ? 'visible' : 'hidden',
        transform: 'translateX(-50%)',
    }),
};
//# sourceMappingURL=Popover.js.map