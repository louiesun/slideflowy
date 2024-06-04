import classnames from 'classnames';
import './style.scss';
import { $t } from '../../i18n';
import { isSlideURL, addSlideParameter } from '../App';
import { nutstoreClient } from '../../utils/NutstoreSDK';
import { Notification } from '../../utils/Notification';
import Professional from './professional.svg';
export class ProjectNodeMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isClient: false,
            featureRestrictionEnabled: false,
        };
    }
    get nodes() {
        return Array.isArray(this.props.nodes)
            ? this.props.nodes
            : [this.props.nodes];
    }
    get slideId() {
        return this.props.slideId;
    }
    componentDidMount() {
        const _isClient = nutstoreClient.isElectronClient;
        this.setState({ isClient: _isClient });
        if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
            void nutstoreClient.getFeatureRestrictionEnabled().then((enabled) => {
                this.setState({ featureRestrictionEnabled: enabled });
            });
        }
        else {
            this.setState({ featureRestrictionEnabled: false });
        }
    }
    checkWhetherRunVipFeatures = () => {
        const { isClient, featureRestrictionEnabled } = this.state;
        return new Promise(async (resolve) => {
            let isVip;
            if (isClient && featureRestrictionEnabled && nutstoreClient.isPayingUser) {
                isVip = await nutstoreClient.isPayingUser();
            }
            else {
                isVip = false;
            }
            if (isClient && featureRestrictionEnabled && !isVip && nutstoreClient.showPricingPlans) {
                nutstoreClient.showPricingPlans();
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    };
    render() {
        const { isClient, featureRestrictionEnabled } = this.state;
        return (React.createElement("ul", { className: "ProjectNodeMenu" },
            this.slideId !== null && this.slideId !== undefined ? '' : (React.createElement("li", { className: classnames({ hidden: false }), onClick: this.onFromThisNode }, $t('NUTFLOWY_FROM_THIS_NODE'))),
            this.props.editable &&
                !Array.isArray(this.props.nodes) &&
                typeof this.props.onShowImageUploadModal === 'function' && (React.createElement(React.Fragment, null,
                this.slideId !== null && this.slideId !== undefined ? '' : (React.createElement("li", { className: 'divider' })),
                React.createElement(ImageUploadMenuItems, { node: this.props.nodes, onShowImageUploadModal: this.props.onShowImageUploadModal }),
                React.createElement("li", { className: 'divider' }))),
            React.createElement("li", { className: classnames({ hidden: !this.expandable() }), onClick: this.onExpandNode }, $t('NUTFLOWY_EXPAND')),
            React.createElement("li", { className: classnames({ hidden: !this.collapsable() }), onClick: this.onCollapseNode }, $t('NUTFLOWY_COLLAPSE')),
            React.createElement("li", { className: classnames({ hidden: !this.completable() }), onClick: this.onCompleteNode }, $t('NUTFLOWY_COMPLETE')),
            React.createElement("li", { className: classnames({ hidden: !this.uncompletable() }), onClick: this.onUncompleteNode }, $t('NUTFLOWY_UNCOMPLETE')),
            React.createElement("li", { onClick: this.onPrepareBeforeCopyNodes }, $t('COPY')),
            React.createElement("li", { onClick: this.onCopyText },
                isClient && featureRestrictionEnabled && (React.createElement("div", { className: 'svg-container' },
                    React.createElement(Professional, { width: '20px', height: '20px' }))),
                $t('COPY_TEXT')),
            React.createElement("li", { className: classnames({ hidden: !this.props.editable }), onClick: this.onDelete }, $t('DELETE'))));
    }
    onFromThisNode = () => {
        let slideUrl = window.location.href;
        if (!isSlideURL()) {
            slideUrl = addSlideParameter();
        }
        const newSlideId = window.open(slideUrl, '', 'popup');
        this.props.onSlideChange({
            startNodeId: this.nodes[0].id,
            slideTabWindow: newSlideId,
            isSlideOpened: true,
        });
    };
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
    onPrepareBeforeCopyNodes = () => {
        this.props.onPrepareBeforeCopyNodes(this.nodes);
    };
    onCopyText = async () => {
        void this.checkWhetherRunVipFeatures().then(run => {
            if (!run) {
                return;
            }
            try {
                this.props.onCopyText(this.nodes);
                Notification.show({ text: $t('COPY_TEXT_SUCCESSFULLY') });
            }
            catch (e) {
                Notification.show({ text: $t('COPY_TEXT_FAILED') });
            }
        });
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
