import { Popover } from '@nshq/react-popover'
import classNames from 'classnames'
import { memo, useCallback, useEffect, useState } from 'react'
import { $t } from '../../i18n'
import { ShortcutService } from '../../services/ShortcutService'
import { IProjectNode } from '../../types'
import { evolve, shallowChanged } from '../../utils/F/shallowChanged'
import { Notification } from '../../utils/Notification'
import {
  isDownloadDisabled,
  isLanding,
  nutstoreClient,
} from '../../utils/NutstoreSDK'
import { extractFirstLineFromHtmlText } from '../../utils/S'
import { useInject } from '../../utils/di'
import { generatePPT } from '../../utils/generatePPT'
import { AppHeaderMenu } from '../AppHeaderMenu'
import { Attach } from '../Attach'
import { Breadcrumb, BreadcrumbItemBase } from '../Breadcrumb'
import { MenuTip } from '../MenuTip'
import IconBack from './icon_back.svg'
import IconClose from './icon_close.svg'
import IconCollapse from './icon_collapse.svg'
import IconExpand from './icon_expand.svg'
import IconMindMap from './icon_mind_map.svg'
import IconMore from './icon_more.svg'
import IconPlay from './icon_play.svg'
import IconPPT from './icon_ppt.svg'
import IconSave from './icon_save.svg'
import IconSaved from './icon_saved.svg'
import IconSaving from './icon_saving.svg'
import IconUnsaved from './icon_unsaved.svg'
import './style.scss'

interface BreadcrumbItem extends BreadcrumbItemBase {
  id: string | null
}

export type SaveIconStatus =
  | 'changed'
  | 'saving'
  | 'saved'
  | 'failed'
  | undefined

export interface AppHeaderProps {
  fromMindMap: boolean
  className: string
  inChildPage: boolean
  isPreview: boolean
  fileName: string
  saveIconStatus: SaveIconStatus
  saveIconDisabled: boolean
  saveAndQuitIconDisabled: boolean
  parents: IProjectNode[]
  undoAvailable: boolean
  redoAvailable: boolean
  shortcutButtonVisible: boolean
  fileShareable: boolean
  slideVisible: boolean
  nodes: { [nodeId in IProjectNode['id']]: IProjectNode }
  rootNodeIds: string[]
  onSaveFile: () => void
  onSaveAndQuitFile: () => void
  onNodeSelectAsRoot: (item: { id: IProjectNode['id'] | null }) => void
  onUndo: () => void
  onRedo: () => void
  onToggleShortcutsList: () => void
  onToggleExportPanelVisible: () => void
  onTogglePlaySlide: () => void
  onToggleQuitSlide: () => void
  isSlideOpened: boolean
  slideBG: string
  setIsShowExportLoading: (v: boolean) => void
}

const _AppHeader = (props: AppHeaderProps) => {
  // 鼠标是否悬浮在菜单栏上
  const [isHover, setIsHover] = useState<boolean>(false)
  // 菜单栏是否展开
  const [expand, setExpand] = useState<boolean>(true)
  // 标记悬浮菜单按钮文字
  const [hoverMessage, setHoverMessage] = useState<string>('')
  // 标记当前提示信息对应的状态，0 对应 隐藏，1 对应思维导图预览，2 对应演示模式
  const [stateMessage, setStateMessage] = useState<number>(0)

  const shortcutManager = useInject(ShortcutService)


  const exportPPT = async () => {
    props.setIsShowExportLoading(true)
    const { nodes, rootNodeIds, fileName, slideBG } = props
    try {
      await generatePPT({
        nodes,
        rootNodeIds,
        fileName,
        slideBG,
      })
    } catch (error) {
      Notification.show({ text: $t('EXPORT_FAILED') })
    } finally {
      props.setIsShowExportLoading(false)
    }
  }

  const toggleExpand = () => {
    setExpand(!expand)
  }

  const handleMouseEnter = () => {
    setIsHover(true)
  }

  const handleMouseLeave = () => {
    setIsHover(false)
  }

  const calcPopoverStyle = () => {
    const header = document.getElementsByClassName('AppHeader')[0]
    const rect = header.getBoundingClientRect()
    return {
      zIndex: 4,
      position: 'fixed',
      top: `${rect.bottom - 12}px`,
      left: '16px',
      display: 'flex',
      transform: 'translateX(0)',
    } as React.CSSProperties
  }

  const shortcutTip = (name: string) => {
    return `${$t(name.toUpperCase())}.${shortcutManager.render(
      name.toLowerCase(),
    )}`
  }

  const generateBreadcrumb = (fileName: string, nodes: IProjectNode[]) => {
    return [
      {
        id: null,
        key: 'null',
        name: fileName,
      } as BreadcrumbItem,
    ].concat(
      nodes.map(n => ({
        ...n,
        key: String(n.id),
        name: extractFirstLineFromHtmlText(n.content),
      })),
    )
  }

  const onSaveAndQuitFile = useCallback(() => {
    props.onSaveAndQuitFile()
  }, [props.onSaveAndQuitFile])

  const containerClassName = classNames([
    'AppHeader',
    props.className,
    {
      'AppHeader--in-child': props.inChildPage,
    },
  ])

  const renderPopoverTrigger = useCallback(
    () => <IconMore className="icon-more" />,
    [],
  )

  const renderProjectNodeMenu = useCallback(
    () => (
      <AppHeaderMenu
        fileName={props.fileName}
        fileShareable={props.fileShareable}
        isPreview={props.isPreview}
        shortcutButtonVisible={props.shortcutButtonVisible}
        undoAvailable={props.undoAvailable}
        redoAvailable={props.redoAvailable}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        onToggleShortcutsList={props.onToggleShortcutsList}
        onToggleExportPanelVisible={props.onToggleExportPanelVisible}
      />
    ),
    [
      props.fileShareable,
      props.isPreview,
      props.shortcutButtonVisible,
      props.undoAvailable,
      props.redoAvailable,
      props.onUndo,
      props.onRedo,
      props.onToggleShortcutsList,
      props.setIsShowExportLoading,
    ],
  )

  const viewAsMindMap = () => {
    const nodes = props.nodes
    const keys = Object.keys(nodes)
    for (const key of keys) {
      const node = nodes[key]
      const parser = new DOMParser()
      const doc = parser.parseFromString(node.content, 'text/html')
      node.content = doc.body.textContent || ''
    }

    const mindMapViewer = document.createElement('iframe')
    mindMapViewer.setAttribute('id', 'mindmap-viewer')
    mindMapViewer.setAttribute('src', '/static/mindmap/view.html')
    mindMapViewer.style.position = 'fixed'
    mindMapViewer.style.top = '0'
    mindMapViewer.style.left = '0'
    mindMapViewer.style.margin = '0'
    mindMapViewer.style.border = 'none'
    mindMapViewer.style.padding = '0'
    mindMapViewer.style.width = '100%'
    mindMapViewer.style.height = '100%'
    mindMapViewer.style.zIndex = '9'

    document.body.appendChild(mindMapViewer)

    mindMapViewer.contentWindow?.addEventListener('load', () => {
      mindMapViewer.contentWindow?.postMessage(
        {
          type: 'file',
          filename: props.fileName + '.nol',
          content: {
            rootNodeIds: props.rootNodeIds,
            nodes: props.nodes,
          },
          nol: true,
        },
        location.origin,
      )
    })

    const handleCloseMessage = (e: any) => {
        if (e.data && e.data.type && e.data.type === 'close') {
            mindMapViewer.remove()
            window.removeEventListener('message', handleCloseMessage)
        }
    }

    window.addEventListener('message', handleCloseMessage)

    /* tslint:disable:no-string-literal */
    window['mindMapWindow'] = mindMapViewer.contentWindow
    /* tslint:disable:no-string-literal */
  }

  const toggleMindmap = () => {
    if (props.fromMindMap) {
      window.parent.postMessage({
        type: 'close',
      }, location.origin)
    } else {
      viewAsMindMap()
      // 之后代码更新会用到
      // const handleClose = (e: MessageEvent) => {
      //   if (e.data && e.data.type && e.data.type === 'close') {
      //     const mindMapViewer = document.getElementById('mindmap-viewer')
      //     mindMapViewer!.remove()
      //     window.removeEventListener('message', handleClose)
      //   }
      // }
      // window.addEventListener('message', handleClose)
    }
  }


  const closeStateMessage = () => {
    setStateMessage(0)
  }

  const isAdDemo = isLanding()
  const downloadDisabled = isDownloadDisabled()
  const isMobilePreview = nutstoreClient.isMobile && props.isPreview

  useEffect(() => {
    if (props.isSlideOpened) {
      setStateMessage(2)
    } else {
      if (props.fromMindMap) {
        setStateMessage(1)
      } else {
        setStateMessage(0)
      }
    }
  }, [props.isSlideOpened])

  return (
    <><div className={'AppHeader-background'} style={{ width: expand ? '100vw' : 0 }}/>
    <div
      className={`${containerClassName} ${isAdDemo ? 'is-demo-style' : ''}`}
      style={{
        minWidth: expand && !nutstoreClient.isMobile ? 480 : 0,
        width: expand ? 'calc(100% - 32px)' : nutstoreClient.isElectronClient ? 186 : 226,
        opacity: !expand && !isHover ? 0.4 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Attach when={stateMessage !== 0 && (props.isSlideOpened || props.fromMindMap) && expand && !nutstoreClient.isMobile && !isMobilePreview}>
        <div className="readonly">
          {stateMessage === 1 ? $t('NUTFLOWY_FROM_MINDMAP') : $t('NUTFLOWY_Slide_EDITING')}
          <div className="close-readonly-message-btn" onClick={closeStateMessage}>
            <IconClose/>
          </div>
        </div>
      </Attach>

      <Attach when={!props.isPreview && !props.isSlideOpened && !isMobilePreview}>
        <MenuTip
          message={$t('NUTFLOWY_MORE')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <Popover
            triggerClassName={classNames(['iconContainer'])}
            popoverClassName="AppHeader_popover"
            openOn="click"
            closeOn="clickOutside"
            trigger={renderPopoverTrigger}
            content={renderProjectNodeMenu}
            popoverStyle={calcPopoverStyle}
          />
        </MenuTip>
      </Attach>

      <Attach when={!props.isPreview && !isMobilePreview}>
        <MenuTip
          message={shortcutTip('save')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <div className="iconContainer" onClick={props.onSaveFile}>
            {props.saveIconStatus === 'saved' ? (
              <IconSaved />
            ) : props.saveIconStatus === 'changed' ? (
              <IconUnsaved />
            ) : props.saveIconStatus === 'saving' ? (
              <IconSaving />
            ) : (
              <IconSave />
            )}
          </div>
        </MenuTip>
      </Attach>

      <Attach when={expand && !props.isPreview && !isMobilePreview}>
        <div className="divider" />
      </Attach>

      <Attach when={expand}>
        <Breadcrumb<BreadcrumbItem>
          items={generateBreadcrumb(props.fileName, props.parents)}
          onClickItem={props.onNodeSelectAsRoot}
        />
      </Attach>

      <Attach when={!props.isPreview && !props.isSlideOpened && expand && !isMobilePreview}>
        <MenuTip
          message={$t('NUTFLOWY_MINDMAP')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <div
            className={'iconContainer' + (props.fromMindMap ? ' selected' : '')}
            onClick={toggleMindmap}
          >
            <IconMindMap />
          </div>
        </MenuTip>
      </Attach>

      <Attach when={!downloadDisabled && !nutstoreClient.isMobile && expand && !isMobilePreview}>
        <MenuTip
          message={$t('EXPORT_PPT')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <div className="iconContainer" onClick={exportPPT}>
            <IconPPT />
          </div>
        </MenuTip>
      </Attach>

      <Attach when={expand && !isMobilePreview}>
        <div className="divider" />
      </Attach>

      <Attach when={!props.isPreview && !props.isSlideOpened && !isMobilePreview}>
        <MenuTip
          message={expand ? $t('NUTFLOWY_COLLAPSE') : $t('NUTFLOWY_EXPAND')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <div className="iconContainer" onClick={toggleExpand}>
            {!expand ? <IconExpand /> : <IconCollapse />}
          </div>
        </MenuTip>
      </Attach>

      <Attach
        when={
          !props.isPreview &&
          !nutstoreClient.isDesktopClient &&
          !nutstoreClient.isElectronClient && 
          !isMobilePreview
        }
      >
        <MenuTip
          message={$t('NUTFLOWY_BACK')}
          hoverMessage={hoverMessage}
          setHoverMessage={setHoverMessage}
        >
          <div className="iconContainer" onClick={onSaveAndQuitFile}>
            <IconBack />
          </div>
        </MenuTip>
      </Attach>

      <Attach
        when={
          props.slideVisible && !props.isSlideOpened && !nutstoreClient.isMobile && !isMobilePreview
        }
      >
        <div
          className="button"
          style={{
            padding: expand ? '6px 12px' : '6px',
          }}
          onClick={props.onTogglePlaySlide}
        >
          <IconPlay fill="white" />
          {expand && (
            <span className="text" style={{ marginLeft: 8, height: 20 }}>
              {$t('NUTFLOWY_Slide_PLAY')}
            </span>
          )}
        </div>
      </Attach>

      <Attach when={props.isSlideOpened && !nutstoreClient.isMobile && !isMobilePreview}>
        <div className="button" onClick={props.onToggleQuitSlide}>
          <span className="text">{$t('NUTFLOWY_Slide_QUIT')}</span>
        </div>
      </Attach>
    </div></>
  )
}

_AppHeader.defaultProps = {
  className: '',
  inChildPage: false,
}

const isParentTreeChanged = (tree1: IProjectNode[], tree2: IProjectNode[]) => {
  return (
    tree1.map(n => n.id + n.content).join(',') !==
    tree2.map(n => n.id + n.content).join(',')
  )
}

export const AppHeader = memo(
  _AppHeader,
  (prevProps: AppHeaderProps, nextProps: AppHeaderProps) => {
    return !shallowChanged(
      prevProps,
      nextProps,
      evolve<AppHeaderProps>({
        parents: isParentTreeChanged,
      }),
    )
  },
)
