import { useCallback, memo } from 'react';
import classNames from 'classnames';
import { Attach } from '../Attach';
import { CollapseIndicator } from './CollapseIndicator';
import { $t } from '../../i18n';
import { shallowChanged, evolve } from '../../utils/F/shallowChanged';
import { usePopoverMenu } from './PopoverMenu';
import './style.scss';
import { nutstoreClient } from '../../utils/NutstoreSDK';
import { ProjectNodeInner } from '../ProjectNodeInner';
export const ProjectNodeSelectedClassName = 'ProjectNode--selected';
function PureProjectNode(props) {
    const toggleNodeExpand = useCallback(() => {
        props.node.expanded
            ? props.onCollapseNode([props.node])
            : props.onExpandNode([props.node]);
    }, [props.node, props.onCollapseNode, props.onExpandNode]);
    const renderBullet = useCallback(() => (React.createElement("div", { className: "ProjectNode__bullet-trigger" },
        React.createElement("a", { className: classNames('ProjectNode__bullet'), title: $t('NUTFLOWY_ENTER'), onClick: () => props.onSelectAsRoot(props.node.id) }))), [props.node.id, props.onSelectAsRoot]);
    const [popoverMenu, popoverMenuVisible] = usePopoverMenu({
        editable: props.editable,
        nodes: props.node,
        onCompleteNode: props.onCompleteNode,
        onUncompleteNode: props.onUncompleteNode,
        onDeleteNode: props.onDeleteNode,
        onExpandNode: props.onExpandNode,
        onCollapseNode: props.onCollapseNode,
        onCopyNode: props.onCopyNode,
        onShowImageUploadModal: props.onShowImageUploadModal,
    });
    const renderLevelFences = useCallback(() => {
        const fences = [];
        for (let i = 0; i < props.node.depth; i++) {
            fences.push(React.createElement("div", { key: i, className: classNames([
                    'ProjectNode__fence',
                    {
                        withImage: props.node.images?.length,
                    },
                ]), style: {
                    left: -i * 30,
                } }));
        }
        return React.createElement(React.Fragment, null, fences);
    }, [props.node.depth]);
    return (React.createElement("div", { className: classNames([
            'ProjectNode',
            {
                'ProjectNode--has-child': props.node.children.length,
                'ProjectNode--expanded': props.node.expanded,
                'ProjectNode--completed': props.node.completed,
                'ProjectNode--menu-visible': popoverMenuVisible,
                [ProjectNodeSelectedClassName]: props.selected,
            },
        ]) },
        React.createElement("div", { ref: props.itemRef, className: "ProjectNode__item", style: {
                marginLeft: props.node.depth * 30,
            } },
            renderLevelFences(),
            React.createElement(Attach, { when: nutstoreClient.isDesktop }, popoverMenu),
            !props.node.children.length ? null : (React.createElement(CollapseIndicator, { expanded: props.node.expanded, onClick: toggleNodeExpand, title: props.node.expanded
                    ? $t('NUTFLOWY_COLLAPSE')
                    : $t('NUTFLOWY_EXPAND') })),
            props.wrapDragHandle(renderBullet),
            React.createElement(ProjectNodeInner, { nodeId: props.node.id }))));
}
(function (PureProjectNode) {
    PureProjectNode.defaultProps = {
        editable: true,
        selected: false,
        itemRef: () => { },
        wrapDragHandle: (renderer) => renderer(),
    };
    function arePropsEqual(prevProps, nextProps) {
        return !shallowChanged(prevProps, nextProps, evolve({
            node: (a, b) => ['id', 'expanded', 'completed', 'childrenIds', 'depth'].find((k) => a[k] !== b[k]) || false,
        }));
    }
    PureProjectNode.arePropsEqual = arePropsEqual;
})(PureProjectNode || (PureProjectNode = {}));
export const ProjectNode = memo(PureProjectNode, PureProjectNode.arePropsEqual);
