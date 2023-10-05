import * as React from 'react';
import * as ReactDOM from 'react-dom';
import shallowEqual from 'shallowequal';
export class Portal extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.portal = document.createElement('div');
        this._onClickDocument = (event) => {
            /* istanbul ignore next */
            if (!this.props.visible)
                return;
            if (this.props.clickClose(event)) {
                this.props.onVisibleChange(false);
            }
        };
    }
    componentDidMount() {
        document.addEventListener('click', this._onClickDocument);
        this._updateNode(null, this.props);
    }
    componentDidUpdate(prevProps) {
        this._updateNode(prevProps, this.props);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this._onClickDocument);
        this._updateNode(this.props, null);
    }
    render() {
        return ReactDOM.createPortal(this.props.children, this.portal);
    }
    _updateNode(prevProps, nextProps) {
        const { portal } = this;
        if (!prevProps || !nextProps || prevProps.parent !== nextProps.parent) {
            this._operateParent(prevProps, parent => parent.removeChild(this.portal));
            this._operateParent(nextProps, parent => parent.appendChild(this.portal));
        }
        if (nextProps) {
            if (!prevProps || prevProps.className !== nextProps.className) {
                portal.className = nextProps.className.trim() || '';
            }
            const prevStyle = prevProps && prevProps.style;
            const nextStyle = nextProps.style;
            if (!shallowEqual(prevStyle, nextStyle)) {
                portal.style.cssText = '';
                Object.assign(portal.style, { display: nextProps.visible ? null : 'none' }, nextStyle);
                Object.keys(nextStyle)
                    .filter(p => p.startsWith('--'))
                    .forEach(p => {
                    portal.style.setProperty(p, nextStyle[p]);
                });
            }
            else {
                if (nextProps.visible) {
                    portal.style.removeProperty('display');
                }
                else {
                    portal.style.display = 'none';
                }
            }
        }
    }
    _operateParent(props, operator) {
        if (!props)
            return;
        if (typeof props.parent === 'function') {
            operator(props.parent());
        }
        else {
            operator(props.parent);
        }
    }
}
Portal.displayName = 'Portal';
Portal.defaultProps = {
    parent: () => document.body,
    className: '',
    style: {},
    visible: true,
    onVisibleChange() { },
    clickClose(event) {
        /* istanbul ignore next */
        return event.button && event.button !== 0;
    },
};
//# sourceMappingURL=Portal.js.map