import classnames from 'classnames'
import { IProjectNode, UploadedImage } from '../../types'
import './style.scss'
import { $t } from '../../i18n'
import { FC } from 'react'
import { isSlideURL, addSlideParameter } from '../App'
import { onSlideChangeProps } from '../../action_packs/app'
import { nutstoreClient } from '../../utils/NutstoreSDK'
import { Notification } from '../../utils/Notification'
import Professional from './professional.svg'

type ProjectNodes = IProjectNode | IProjectNode[]

export interface ProjectNodeMenuProps {
  editable: boolean
  nodes: ProjectNodes
  slideId: Window | null
  onSlideChange: (slideChangeProps: onSlideChangeProps) => void
  onCompleteNode: (nodes: IProjectNode[]) => void
  onUncompleteNode: (nodes: IProjectNode[]) => void
  onDeleteNode: (nodes: IProjectNode[]) => void
  onExpandNode: (nodes: IProjectNode[]) => void
  onCollapseNode: (nodes: IProjectNode[]) => void
  onPrepareBeforeCopyNodes: (nodes: IProjectNode[]) => void
  onCopyText: (nodes: IProjectNode[]) => void
  onShowImageUploadModal?: (
    nodeId: IProjectNode['id'],
    type: UploadedImage['type'],
  ) => void
}

export interface ProjectNodeMenuState {
  isClient: boolean
  featureRestrictionEnabled: boolean
}

export class ProjectNodeMenu extends React.Component<ProjectNodeMenuProps, ProjectNodeMenuState> {
  constructor(props: ProjectNodeMenuProps) {
    super(props)
    this.state = {
      isClient: false,
      featureRestrictionEnabled: false,
    }
  }

  private get nodes() {
    return Array.isArray(this.props.nodes)
      ? this.props.nodes
      : [this.props.nodes]
  }

  private get slideId() {
    return this.props.slideId
  }

  componentDidMount(): void {
    const _isClient = nutstoreClient.isElectronClient
    this.setState({ isClient: _isClient })
    if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
      void nutstoreClient.getFeatureRestrictionEnabled().then((enabled) => {
        this.setState({ featureRestrictionEnabled: enabled })
      })
    } else {
      this.setState({ featureRestrictionEnabled: false })
    }
  }

  checkWhetherRunVipFeatures = () => {
    const { isClient, featureRestrictionEnabled } = this.state
    return new Promise(async (resolve) => {
      let isVip
      if (isClient && featureRestrictionEnabled && nutstoreClient.isPayingUser) {
        isVip = await nutstoreClient.isPayingUser()
      } else {
        isVip = false
      }
      if (isClient && featureRestrictionEnabled && !isVip && nutstoreClient.showPricingPlans) {
        nutstoreClient.showPricingPlans()
        resolve(false)
      } else {
        resolve(true)
      }
    })
  }


  render() {
    const { isClient, featureRestrictionEnabled } = this.state

    return (
      <ul className="ProjectNodeMenu">
        {
          this.slideId !== null && this.slideId !== undefined ? '' : (
            <li
              className={classnames({ hidden: false})}
              onClick={this.onFromThisNode}
            >
              {$t('NUTFLOWY_FROM_THIS_NODE')}
            </li>
          )
        }
        {this.props.editable &&
          !Array.isArray(this.props.nodes) &&
          typeof this.props.onShowImageUploadModal === 'function' && (
            <>
              {
                this.slideId !== null && this.slideId !== undefined ? '' : (
                  <li className='divider'/>
                )
              }
              <ImageUploadMenuItems
                node={this.props.nodes}
                onShowImageUploadModal={this.props.onShowImageUploadModal!}
              />
              <li className='divider'/>
            </>

          )}
        <li
          className={classnames({ hidden: !this.expandable() })}
          onClick={this.onExpandNode}
        >
          {$t('NUTFLOWY_EXPAND')}
        </li>
        <li
          className={classnames({ hidden: !this.collapsable() })}
          onClick={this.onCollapseNode}
        >
          {$t('NUTFLOWY_COLLAPSE')}
        </li>
        <li
          className={classnames({ hidden: !this.completable() })}
          onClick={this.onCompleteNode}
        >
          {$t('NUTFLOWY_COMPLETE')}
        </li>
        <li
          className={classnames({ hidden: !this.uncompletable() })}
          onClick={this.onUncompleteNode}
        >
          {$t('NUTFLOWY_UNCOMPLETE')}
        </li>
        <li onClick={this.onPrepareBeforeCopyNodes}>{$t('COPY')}</li>
        <li onClick={this.onCopyText}>
          {
            isClient && featureRestrictionEnabled && (
              <div className='svg-container'>
                <Professional width={'20px'} height={'20px'}/>
              </div>
            )
          }
          {$t('COPY_TEXT')}
        </li>
        <li
          className={classnames({ hidden: !this.props.editable })}
          onClick={this.onDelete}
        >
          {$t('DELETE')}
        </li>
      </ul>
    )
  }

  private onFromThisNode = () => {
    let slideUrl = window.location.href
    if (!isSlideURL()) {
      slideUrl = addSlideParameter()
    }
    const newSlideId = window.open(slideUrl, '', 'popup')
    this.props.onSlideChange({
      startNodeId: this.nodes[0].id,
      slideTabWindow: newSlideId,
      isSlideOpened: true,
    })
  }

  private onExpandNode = () => {
    this.props.onExpandNode(this.nodes)
  }

  private onCollapseNode = () => {
    this.props.onCollapseNode(this.nodes)
  }

  private onCompleteNode = () => {
    this.props.onCompleteNode(this.nodes)
  }

  private onUncompleteNode = () => {
    this.props.onUncompleteNode(this.nodes)
  }

  private onPrepareBeforeCopyNodes = () => {
    this.props.onPrepareBeforeCopyNodes(this.nodes)
  }

  private onCopyText = async () => {
    void this.checkWhetherRunVipFeatures().then(run => {
      if (!run) {
        return
      }
      try {
        this.props.onCopyText(this.nodes)
        Notification.show({ text: $t('COPY_TEXT_SUCCESSFULLY') })
      } catch (e) {
        Notification.show({ text: $t('COPY_TEXT_FAILED') })
      }
    })
  }

  private onDelete = () => {
    this.props.onDeleteNode(this.nodes)
  }

  private expandable() {
    const { nodes } = this.props
    if (Array.isArray(nodes)) {
      return true
    } else {
      return nodes.childrenIds.length && !nodes.expanded
    }
  }

  private collapsable() {
    const { nodes } = this.props
    if (Array.isArray(nodes)) {
      return true
    } else {
      return !this.expandable()
    }
  }

  private completable() {
    const { editable, nodes } = this.props
    if (!editable) return false
    if (Array.isArray(nodes)) {
      return true
    } else {
      return !nodes.completed
    }
  }

  private uncompletable() {
    const { editable, nodes } = this.props
    if (!editable) return false
    if (Array.isArray(nodes)) {
      return true
    } else {
      return !this.completable()
    }
  }
}

interface ImageUploadMenuItemsProps {
  node: IProjectNode
  onShowImageUploadModal: NonNullable<
    ProjectNodeMenuProps['onShowImageUploadModal']
  >
}

const ImageUploadMenuItems: FC<ImageUploadMenuItemsProps> = (props) => {
  return (
    <>
      <li
        onClick={() =>
          props.onShowImageUploadModal(props.node.id, 'parasiticMedium')
        }
      >
        {$t('NUTFOLWY_IMAGE')}
      </li>
      <li
        onClick={() => props.onShowImageUploadModal(props.node.id, 'httpLink')}
      >
        {$t('NUTFOLWY_IMAGE_LINK')}
      </li>
    </>
  )
}
