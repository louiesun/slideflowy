import React, { useCallback, memo } from 'react'
import classNames from 'classnames'
import { IProjectNode } from '../../types'
import { ProjectNodeMenuProps } from '../ProjectNodeMenu'
import { Attach } from '../Attach'
import { CollapseIndicator } from './CollapseIndicator'
import { $t } from '../../i18n'
import { shallowChanged, evolve } from '../../utils/F/shallowChanged'
import { usePopoverMenu } from './PopoverMenu'
import './style.scss'
import { nutstoreClient } from '../../utils/NutstoreSDK'
import { ProjectNodeInner } from '../ProjectNodeInner'
import { onSlideChangeProps } from '../../action_packs/app'

export const ProjectNodeSelectedClassName = 'ProjectNode--selected'

export interface ProjectNodeProps {
  editable: boolean
  selected: boolean
  slideId: Window | null
  node: IProjectNode
  dragSourceRef: any
  itemRef: (element?: React.ReactNode | Element | null) => void
  onSlideChange: (slideChangeProps: onSlideChangeProps) => void
  onCompleteNode: ProjectNodeMenuProps['onCompleteNode']
  onUncompleteNode: ProjectNodeMenuProps['onUncompleteNode']
  onDeleteNode: ProjectNodeMenuProps['onDeleteNode']
  onExpandNode: ProjectNodeMenuProps['onExpandNode']
  onCollapseNode: ProjectNodeMenuProps['onCollapseNode']
  onPrepareBeforeCopyNodes: ProjectNodeMenuProps['onPrepareBeforeCopyNodes']
  onCopyText: ProjectNodeMenuProps['onCopyText']
  onSelectAsRoot: (nodeId: IProjectNode['id']) => void
  onShowImageUploadModal: ProjectNodeMenuProps['onShowImageUploadModal']
  updateSelectedNodeIds: () => void
  cancelSelectedNodeIds: () => void
}

function PureProjectNode(props: ProjectNodeProps) {
  const toggleNodeExpand = useCallback(() => {
    props.node.expanded
      ? props.onCollapseNode([props.node])
      : props.onExpandNode([props.node])
  }, [props.node, props.onCollapseNode, props.onExpandNode])

  const renderBullet = useCallback(
    () => (
      <div 
        ref={props.dragSourceRef}
        className="ProjectNode__bullet-trigger">
        <a
          className={classNames('ProjectNode__bullet')}
          title={$t('NUTFLOWY_ENTER')}
          onClick={() => props.onSelectAsRoot(props.node.id)}
          onMouseDown={() => {
            if (props.selected) {
              props.updateSelectedNodeIds()
            } else {
              props.cancelSelectedNodeIds()
            }
          }}
        />
      </div>
    ),
    [props.node.id, props.onSelectAsRoot, props.selected],
  )

  const [popoverMenu, popoverMenuVisible] = usePopoverMenu({
    editable: props.editable,
    nodes: props.node,
    slideId: props.slideId,
    onSlideChange: props.onSlideChange,
    onCompleteNode: props.onCompleteNode,
    onUncompleteNode: props.onUncompleteNode,
    onDeleteNode: props.onDeleteNode,
    onExpandNode: props.onExpandNode,
    onCollapseNode: props.onCollapseNode,
    onPrepareBeforeCopyNodes: props.onPrepareBeforeCopyNodes,
    onCopyText: props.onCopyText,
    onShowImageUploadModal: props.onShowImageUploadModal,
  })

  const renderLevelFences = useCallback(() => {
    const fences = []
    for (let i = 0; i < props.node.depth; i++) {
      fences.push(
        <div
          key={i}
          className={classNames([
            'ProjectNode__fence',
            {
              withImage: props.node.images?.length,
            },
          ])}
          style={{
            left: -i * 30,
          }}
        />,
      )
    }
    return <>{fences}</>
  }, [props.node.depth])

  return (
    <div
      className={classNames([
        'ProjectNode',
        {
          'ProjectNode--has-child': props.node.childrenIds.length,
          'ProjectNode--expanded': props.node.expanded,
          'ProjectNode--completed': props.node.completed,
          'ProjectNode--menu-visible': popoverMenuVisible,
          [ProjectNodeSelectedClassName]: props.selected,
        },
      ])}
    >
      <div
        ref={props.itemRef}
        className="ProjectNode__item"
        style={{
          marginLeft: props.node.depth * 30,
        }}
      >
        {renderLevelFences()}
        <Attach when={nutstoreClient.isDesktop}>{popoverMenu}</Attach>

        {!props.node.childrenIds.length ? null : (
          <CollapseIndicator
            expanded={props.node.expanded}
            onClick={toggleNodeExpand}
            title={
              props.node.expanded
                ? $t('NUTFLOWY_COLLAPSE')
                : $t('NUTFLOWY_EXPAND')
            }
          />
        )}

        {renderBullet()}
        <ProjectNodeInner nodeId={props.node.id} selected={props.selected}/>
      </div>
    </div>
  )
}

namespace PureProjectNode {
  export const defaultProps = {
    editable: true,
    selected: false,
    itemRef: () => {}
  }

  export function arePropsEqual(
    prevProps: ProjectNodeProps,
    nextProps: ProjectNodeProps,
  ) {
    return !shallowChanged(
      prevProps,
      nextProps,
      evolve<ProjectNodeProps>({
        node: (a, b) =>
          ['id', 'expanded', 'completed', 'childrenIds', 'depth'].find(
            (k) => a[k] !== b[k],
          ) || false,
      }),
    )
  }
}

export const ProjectNode = memo(PureProjectNode, PureProjectNode.arePropsEqual)
