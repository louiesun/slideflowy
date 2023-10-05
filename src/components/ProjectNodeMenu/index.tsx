import classnames from 'classnames';
import './style.scss';
import { $t } from '../../i18n';
export class ProjectNodeMenu extends React.PureComponent {
    get nodes() {
        return Array.isArray(this.props.nodes)
            ? this.props.nodes
            : [this.props.nodes];
    }
    render() {
        return (React.createElement("ul", { className: "ProjectNodeMenu" },
            React.createElement("li", { className: classnames({ hidden: !this.expandable() }), onClick: this.onExpandNode }, $t('NUTFLOWY_EXPAND')),
            React.createElement("li", { className: classnames({ hidden: !this.collapsable() }), onClick: this.onCollapseNode }, $t('NUTFLOWY_COLLAPSE')),
            React.createElement("li", { className: classnames({ hidden: !this.completable() }), onClick: this.onCompleteNode }, $t('NUTFLOWY_COMPLETE')),
            React.createElement("li", { className: classnames({ hidden: !this.uncompletable() }), onClick: this.onUncompleteNode }, $t('NUTFLOWY_UNCOMPLETE')),
            React.createElement("li", { onClick: this.onCopy }, $t('COPY')),
            React.createElement("li", { className: classnames({ hidden: !this.props.editable }), onClick: this.onDelete }, $t('DELETE')),
            this.props.editable &&
                !Array.isArray(this.props.nodes) &&
                typeof this.props.onShowImageUploadModal === 'function' && (React.createElement(ImageUploadMenuItems, { node: this.props.nodes, onShowImageUploadModal: this.props.onShowImageUploadModal }))));
    }
    onExpandNode = () => {
        this.props.onExpandNode(this.nodes);
    };
    onCollapseNode = () => {
        this.props.onCollapseNode(this.nodes);
    };
    onCompleteNode = () => {
        this.props.onCompleteNode(this.nodes);
    };
    onUncompleteNode = () => {
        this.props.onUncompleteNode(this.nodes);
    };
    onCopy = () => {
        this.props.onCopyNode(this.nodes);
    };
    onDelete = () => {
        this.props.onDeleteNode(this.nodes);
    };
    expandable() {
        const { nodes } = this.props;
        if (Array.isArray(nodes)) {
            return true;
        }
        else {
            return nodes.childrenIds.length && !nodes.expanded;
        }
    }
    collapsable() {
        const { nodes } = this.props;
        if (Array.isArray(nodes)) {
            return true;
        }
        else {
            return !this.expandable();
        }
    }
    completable() {
        const { editable, nodes } = this.props;
        if (!editable)
            return false;
        if (Array.isArray(nodes)) {
            return true;
        }
        else {
            return !nodes.completed;
        }
    }
    uncompletable() {
        const { editable, nodes } = this.props;
        if (!editable)
            return false;
        if (Array.isArray(nodes)) {
            return true;
        }
        else {
            return !this.completable();
        }
    }
}
const ImageUploadMenuItems = (props) => {
    return (React.createElement(React.Fragment, null,
        React.createElement("li", { onClick: () => props.onShowImageUploadModal(props.node.id, 'parasiticMedium') }, $t('NUTFOLWY_IMAGE')),
        React.createElement("li", { onClick: () => props.onShowImageUploadModal(props.node.id, 'httpLink') }, $t('NUTFOLWY_IMAGE_LINK'))));
};
