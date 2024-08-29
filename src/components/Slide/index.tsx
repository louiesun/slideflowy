import './style.scss'
import classNames from 'classnames'
import { IProjectNode } from '../../types'
import { AdvancedSlide } from './AdvancedSlide'
import { nutstoreClient } from 'NutstoreSDK'
import { ZoomContainer } from './ZoomContainer'
import { ZoomContext } from './ZoomContext'

const SLIDE_THEME_ADVANCED: string = 'advanced'

interface IState {
  isDataReceived: boolean
  loading: boolean
  theme: string
  fullscreen: boolean
  loadingProgressValue: number
  isPreview: boolean
  fileName: string
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  slideBG: string
  nodeId: string
}

export class Slide extends React.Component<{}, IState> {
  state: IState = {
    isDataReceived: false,
    loading: true,
    theme: SLIDE_THEME_ADVANCED,
    fullscreen: false,
    loadingProgressValue: 0,
    isPreview: false,
    fileName: '',
    rootNodeIds: [],
    nodes: {},
    slideBG: '',
    nodeId: ''
  }

  private setBG = (bg: string) => {
    this.setState(
      {
        slideBG: bg,
      },
      () => {
        window.opener.postMessage(
          {
            type: 'BACKGROUND_IMAGE',
            body: this.state.slideBG,
          },
          window.location.href,
        )
      },
    )
  }

  private SlideRef = React.createRef<HTMLDivElement>()
  private documentOriginalStyle: {
    height: string | null
    overflow: string | null
  }

  private endLoading = () => {
    this.setState({
      loading: false,
    })
  }

  private requestFullscreen = async () => {
    try {
      /* tslint:disable:no-string-literal */
      // 移动端默认横屏
      if (nutstoreClient.isMobile) {
        screen['lockOrientationUniversal'] =
          screen['lockOrientation'] ||
          screen['mozLockOrientation'] ||
          screen['msLockOrientation']
        screen['lockOrientationUniversal'] &&
          screen['lockOrientationUniversal']('landscape-primary')

        screen.orientation &&
          screen.orientation.lock &&
          screen.orientation.lock('landscape-primary')
      }
      if (this.SlideRef.current) {
        if (this.SlideRef.current.requestFullscreen) {
          await this.SlideRef.current.requestFullscreen()
        } else if (this.SlideRef.current['mozRequestFullScreen']) {
          await this.SlideRef.current['mozRequestFullScreen']()
        } else if (this.SlideRef.current['webkitRequestFullscreen']) {
          await this.SlideRef.current['webkitRequestFullscreen']()
        }
      }
      /* tslint:disable:no-string-literal */

      // 通过 SDK 调用 lightApp 的全屏API
      nutstoreClient.EnterFullScreen()
      this.setState({ fullscreen: true })
    } catch (error) {
      // 如果 iframe 没有设置 allowFullScreen="true" 那么就会出现请求进入全屏异常
      // 为了不影响页面正常渲染，捕获异常后，只在 console 中输出即可
      console.error('request fullscreen failed', error)
    }
  }

  private exitFullscreen = async () => {
    /* tslint:disable:no-string-literal */
    if (window.document.exitFullscreen) {
      await window.document.exitFullscreen()
    } else if (window.document['mozExitFullscreen']) {
      await window.document['mozExitFullscreen']()
    } else if (window.document['webkitExitFullscreen']) {
      await window.document['webkitExitFullscreen']()
    }
    /* tslint:disable:no-string-literal */

    // 通过 SDK 调用 lightApp 的全屏API
    nutstoreClient.ExitFullScreen()
    this.setState({ fullscreen: false })
  }

  private onFullscreenChange = () => {
    if (!document.fullscreenElement && !document['webkitFullscreenElement']) {
      this.setState({ fullscreen: false })
    } else {
      this.setState({ fullscreen: true })
    }
  }

  private updateLoadingProgressValue = (value: number) => {
    this.setState({
      loadingProgressValue: value,
    })
  }

  private stateResponse = (event: MessageEvent) => {
    if (event.data.type !== 'STATE_RESPONSE') return
    this.setState({
      isPreview: event.data.body.isPreview,
      fileName: event.data.body.fileName,
      rootNodeIds: event.data.body.rootNodeIds,
      nodes: event.data.body.nodes,
      slideBG: event.data.body.slideBG,
      isDataReceived: true,
      nodeId: event.data.body.startNodeId
    })
  }

  private close = (event: MessageEvent) => {
    if (event.data.type !== 'CLOSE') return
    window.close()
  }

  private onBeforeunload = (event: BeforeUnloadEvent) => {
    if (window.opener !== null) {
      window.opener.postMessage(
        {
          type: 'SLIDE_ACTIVELY_CLOSE',
          body: '',
        },
        window.location.href,
      )
    }
  }

  async componentDidMount() {
    // 保存原始尺寸信息
    this.documentOriginalStyle = { ...document.documentElement.style }
    // 设置html height: 100%以保证显示效果
    document.documentElement.style.height = '100%'
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange)

    // 监听 windows lightApp 的 fullscreen change 事件
    nutstoreClient.onFullscreenChange(
      () => {
        this.setState({ fullscreen: true })
      },
      () => {
        this.setState({ fullscreen: false })
      },
    )
    // 监听app发送过来的POSTMessage
    window.addEventListener('message', this.stateResponse, false)
    window.addEventListener('message', this.close, false)
    // window.addEventListener('message', this.onMessageHandler, false)
    // 监听window关闭事件
    window.addEventListener('beforeunload', this.onBeforeunload, false)
    // 向app发送postMessage说明准备好接收数据
    if (window.opener !== null) {
      window.opener.postMessage(
        {
          type: 'SLIDE_IS_READY',
          body: '',
        },
        window.location.href,
      )
    }
  }

  componentWillUnmount() {
    // 结束放映后清除html style
    document.documentElement.style.height =
      this.documentOriginalStyle.height || ''
    document.documentElement.style.overflow =
      this.documentOriginalStyle.overflow || ''
    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
    document.removeEventListener(
      'webkitfullscreenchange',
      this.onFullscreenChange,
    )
    // window.removeEventListener('message', this.onMessageHandler, false)
    window.removeEventListener('beforeunload', this.onBeforeunload, false)
    window.removeEventListener('message', this.stateResponse, false)
    window.removeEventListener('message', this.close, false)
  }

  render() {
    const {
      state,
      updateLoadingProgressValue,
      endLoading,
      requestFullscreen,
      exitFullscreen,
      setBG,
    } = this

    document.title = this.state.fileName

    return (
      <div>
        <div
          className="Slide"
          ref={this.SlideRef}
          style={{ display: state.loading ? 'none' : 'block' }}
        >
          {state.isDataReceived ? (
            <ZoomContainer>
              <ZoomContext.Consumer>
                {({ zoom }) => (
                  <AdvancedSlide
                    isPreview={state.isPreview}
                    fileName={state.fileName}
                    rootNodeIds={state.rootNodeIds}
                    nodes={state.nodes}
                    slideBG={state.slideBG}
                    setBG={setBG}
                    fullscreen={state.fullscreen}
                    updateLoadingProgressValue={updateLoadingProgressValue}
                    endLoading={endLoading}
                    requestFullscreen={requestFullscreen}
                    exitFullscreen={exitFullscreen}
                    zoom={zoom}
                    nodeId={state.nodeId}
                  />
                )}
              </ZoomContext.Consumer>
            </ZoomContainer>
          ) : null}
          <div className={classNames('mask')} />
        </div>
        <div
          className={classNames('mask-fade-away')}
          style={{
            display: state.loading ? 'block' : 'none',
          }}
        />
      </div>
    )
  }
}
