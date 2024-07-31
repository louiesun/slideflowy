import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { dragDropContextOptions } from '../ProjectNodeList/DragDropContextOptions'
import classnames from 'classnames'
import { IProjectNode } from '../../types'
import { nutstoreClient, parseQs } from '../../utils/NutstoreSDK'
import { useInject } from '../../utils/di'
import { osName } from '../../utils/Platform'
import { ProjectNodeList } from '../../containers/ProjectNodeList'
import { AppHeader } from '../../containers/AppHeader'
import { ShortcutPanel } from '../ShortcutPanel'
import { ProjectNodeInner } from '../ProjectNodeInner'
import IconPlus from './icon_plus.svg'
import './style.scss'
import { FileService } from '../../services/FileService'
import { ImagePreviewModalContextProvider } from '../ImagePreviewModalContext'
import { onSlideChangeProps } from '../../action_packs/app'
import { FocusContextProvider } from '../../containers/FocusContextProvider'
import { Export } from '../Export'
import { Exportloading } from './Exportloading'

const isShortcutPanelAvailable = !nutstoreClient.isMobile
// 还未确定要不要在移动端显示该功能，目前先放出来开效果
const isSlideAvailable = true

export interface AppProps {
  slideId: Window | null
  startNodeId: IProjectNode['id']
  fileName: string
  appendNodeIconVisible: boolean
  previewingFile: boolean
  selectedRootNodeId: IProjectNode['id'] | null
  node: IProjectNode
  onParentAppendNode: (parentNodeId: IProjectNode['id'] | null) => void
  requestingFileInfo: boolean
  slideBG: string
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  slideTabWindow: Window | null
  isSlideOpened: boolean
  onSlideChange: (slideChangeProps: onSlideChangeProps) => void
  setBG: (bg: string) => void
  noneNestedNodeList: IProjectNode[]
}

const shortcutsBtnNotifyStorageKey = 'headerShortcutsBtnClicked'

export const isSlideURL = () => {
  const searchParams = parseQs(location.search)
  return !!searchParams.isSlide
}

export const addSlideParameter = () => {
  const myURL = new URL(location.href)
  myURL.searchParams.set('isSlide', 'true')
  return myURL.href
}

export function App(props: AppProps) {
  const { slideId } = props
  const fileService = useInject(FileService)
  const slideIsReadyRef = useRef(false)
  const [exportPanelVisible, setExportPanelVisible] = useState(false)
  // 是否显示导出加载中
  const [isShowExportLoading, setIsShowExportLoading] = useState<boolean>(false)

  const slideIsReady = (event: MessageEvent) => {
    if (slideId !== null) {
      slideIsReadyRef.current = true
      slideId.postMessage(
        {
          type: 'STATE_RESPONSE',
          body: {
            isPreview: props.previewingFile,
            fileName: props.fileName,
            rootNodeIds: props.rootNodeIds,
            nodes: props.nodes,
            slideBG: props.slideBG,
            startNodeId: props.startNodeId,
          },
        },
        window.location.origin,
      )
    }
  }

  const closeSlide = () => {
    props.onSlideChange({
      startNodeId: '',
      slideTabWindow: null,
      isSlideOpened: false,
      currentIndex: '', // 当前播放的slide为空
    })
  }

  const requestImage = async (event: MessageEvent) => {
    const imgUrl = await fileService
      .getPreviewLink(event.data.body.data)
      .catch(() => '')
    if (slideId !== null) {
      slideId.postMessage(
        {
          type: 'IMAGE_RESPONSE',
          body: {
            url: imgUrl,
            relativePath: event.data.body.relativePath,
          },
        },
        window.location.origin,
      )
    }
  }
  const setBackgroundImage = (event: MessageEvent) => {
    props.setBG(event.data.body)
  }

  const messageHandler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return

    switch (event.data.type) {
      case 'SLIDE_IS_READY':
        slideIsReady(event)
        break
      case 'SLIDE_ACTIVELY_CLOSE':
        closeSlide()
        break
      case 'REQUEST_IMAGE':
        void requestImage(event)
        break
      case 'BACKGROUND_IMAGE':
        setBackgroundImage(event)
        break
      default:
        break
    }
  }
  void fileService.handlePostMessage()

  useEffect(() => void (document.title = props.fileName), [props.fileName])

  useEffect(() => {
    window.addEventListener('message', messageHandler, false)

    return () => {
      window.removeEventListener('message', messageHandler, false)
    }
  }, [props.slideTabWindow])

  const [state, setState] = useState({
    shortcutsListVisible: localStorage[shortcutsBtnNotifyStorageKey] === 'true',
  })

  const onShortcutPanelVisibleChanged = useCallback(
    (visible: boolean) => {
      setState({
        shortcutsListVisible: visible,
      })
    },
    [setState],
  )

  const onToggleShortcutsList = useCallback(() => {
    setState(state => {
      localStorage[shortcutsBtnNotifyStorageKey] = String(
        !state.shortcutsListVisible,
      )

      return {
        shortcutsListVisible: !state.shortcutsListVisible,
      }
    })
  }, [setState])

  const onToggleExportPanelVisible = useCallback(() => {
    setExportPanelVisible(!exportPanelVisible)
  }, [exportPanelVisible, setExportPanelVisible])

  const onTogglePlaySlide = () => {
    let slideUrl = window.location.href
    if (!isSlideURL()) {
      slideUrl = addSlideParameter()
    }
    const newSlideId = window.open(slideUrl, '', 'popup')
    props.onSlideChange({
      startNodeId: '',
      slideTabWindow: newSlideId,
      isSlideOpened: true,
    })
  }

  const onToggleQuitSlide = () => {
    if (slideId !== null && slideIsReadyRef.current) {
      slideId.postMessage(
        {
          type: 'CLOSE',
          body: '',
        },
        window.location.origin,
      )
      closeSlide()
      slideIsReadyRef.current = false
    }
  }

  const { selectedRootNodeId, node, requestingFileInfo } = props

  const os = osName()
  const systemClassName = os ? `App--in-platform-${os.toLowerCase()}` : ''

  return requestingFileInfo ? null : (
    <DndProvider
      options={dragDropContextOptions}
      backend={nutstoreClient.isMobile ? TouchBackend : HTML5Backend}
    >
      <div
        className={classnames([
          'App',
          systemClassName,
          {
            'App--preview': props.previewingFile,
            'App--in-mobile': nutstoreClient.isMobile,
          },
        ])}
      >
        <div className="App__container">
          <AppHeader
            inChildPage={Boolean(selectedRootNodeId)}
            onToggleShortcutsList={onToggleShortcutsList}
            onToggleExportPanelVisible={onToggleExportPanelVisible}
            shortcutButtonVisible={isShortcutPanelAvailable}
            slideVisible={isSlideAvailable}
            onTogglePlaySlide={onTogglePlaySlide}
            onToggleQuitSlide={onToggleQuitSlide}
            setIsShowExportLoading={setIsShowExportLoading}
          />

          <ImagePreviewModalContextProvider>
            <FocusContextProvider>
              <ProjectNodeList
                isRoot={true}
                parentNodeId={selectedRootNodeId}
                header={
                  !selectedRootNodeId ? null : (
                    <h1 className="App__page-node-content">
                      <ProjectNodeInner selected={true} nodeId={node.id} />
                    </h1>
                  )
                }
                footer={
                  !props.appendNodeIconVisible ? null : (
                    <div
                      className="App__append-node"
                      onClick={() =>
                        props.onParentAppendNode(selectedRootNodeId)
                      }
                    >
                      <IconPlus className="icon-append-node" />
                    </div>
                  )
                }
              />
            </FocusContextProvider>
          </ImagePreviewModalContextProvider>

          {isShortcutPanelAvailable ? (
            <ShortcutPanel
              inPreviewMode={props.previewingFile}
              visible={state.shortcutsListVisible}
              onVisibleChanged={onShortcutPanelVisibleChanged}
            />
          ) : null}

          {
            exportPanelVisible && createPortal(
              <Export
                fileName={props.fileName}
                noneNestedNodeList={props.noneNestedNodeList}
                clickCallback={() => { setExportPanelVisible(false) }}
                setIsShowExportLoading={setIsShowExportLoading}
              />,
              document.body
            )
          }

          {isShowExportLoading && <Exportloading />}
        </div>
      </div>
    </DndProvider>
  )
}
