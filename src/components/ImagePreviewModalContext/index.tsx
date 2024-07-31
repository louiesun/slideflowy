import { nutstoreClient } from '../../utils/NutstoreSDK'
import { Modal } from '../Modal'
import {
  createContext,
  FC,
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react'
import { c } from '../../utils/css'
import IconClose from './icon_close.svg'
import IconPrev from './icon_prev.svg'
import IconNext from './icon_next.svg'
import IconZoomIn from './icon_zoom_in.svg'
import IconZoomOut from './icon_zoom_out.svg'
import IconReset from './icon_reset.svg'
import throttle from 'lodash/throttle'
import './style.scss'

const clsName = 'ImagePreviewModal'
const cls = c(clsName)

const ZOOM_STEP = 0.4
const ZOOM_MAX = '3'
const ZOOM_MIN = '0.2'

export interface ImagePreviewModalContextValue {
  setVisible?: (visible: boolean) => void
  setUrls?: (urls: string[]) => void
  setUrl?: (url: string) => void
}

export const ImagePreviewModalContext = createContext<
  ImagePreviewModalContextValue
>({})

export const ImagePreviewModalContextProvider: FC<{
  children: React.ReactNode
}> = (props): JSX.Element => {
  const [visible, setVisible] = useState<boolean>(false)
  const [urls, setUrls] = useState<string[]>([])
  const [url, setUrl] = useState<string>('')

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragging = useRef<boolean>(false)
  const transform = useRef<{
    scale: number
    x: number
    y: number
  }>({
    scale: 1,
    x: 0,
    y: 0,
  })

  const close = () => {
    setVisible(false)
  }

  const updateImgTransform = () => {
    const { scale, x, y } = transform.current
    if (imgRef.current) {
      if (nutstoreClient.isMobile) {
        imgRef.current.style.transform = `scale(${scale})`
      } else {
        imgRef.current.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(${scale})`
      }
    }
  }

  const zoomIn = () => {
    if (transform.current.scale.toFixed(0) !== ZOOM_MAX) {
      transform.current.scale += ZOOM_STEP
      updateImgTransform()
    }
  }

  const zoomOut = () => {
    if (transform.current.scale.toFixed(1) !== ZOOM_MIN) {
      transform.current.scale -= ZOOM_STEP
      updateImgTransform()
    }
  }

  const reset = useCallback(() => {
    transform.current = {
      scale: 1,
      x: 0,
      y: 0,
    }
    updateImgTransform()
  }, [])

  const prev = useCallback(() => {
    reset()
    setUrl(prevUrl => {
      const index = urls.indexOf(prevUrl)
      if (index > 0) return urls[index - 1]
      return prevUrl
    })
  }, [reset, urls])

  const next = useCallback(() => {
    reset()
    setUrl(prevUrl => {
      const index = urls.indexOf(prevUrl)
      if (index < urls.length - 1) return urls[index + 1]
      return prevUrl
    })
  }, [reset, urls])

  const handleWheelOnImg = throttle(
    (event: React.WheelEvent<HTMLImageElement>) => {
      if (event.deltaY || event.deltaX) {
        // 优先使用纵轴的差值
        const delta = event.deltaY || event.deltaX
        delta < 0 ? zoomIn() : zoomOut()
      }
    },
    20,
  )

  const handleDragOnImg = (event: React.MouseEvent<HTMLImageElement>) => {
    if (dragging.current && 'movementX' in event && 'movementY' in event) {
      // Safari 中鼠标拖拽 movement 值变化量较小，通过 webkitForce 属性可以区分是触摸板
      // 还是鼠标，鼠标拖拽将 movement 值按照设备像素密度放大倍数
      /* tslint:disable:no-string-literal */
      if ('webkitForce' in event && event['webkitForce'] === 0) {
        transform.current.x += event['movementX'] * window.devicePixelRatio
        transform.current.y += event['movementY'] * window.devicePixelRatio
      } else {
        transform.current.x += event['movementX']
        transform.current.y += event['movementY']
      }
      /* tslint:disable:no-string-literal */
      updateImgTransform()
    }
  }

  const ImagePreviewModalContextValue = useMemo(
    () => ({
      setVisible,
      setUrls,
      setUrl,
      reset,
    }),
    [setVisible, setUrls, setUrl, reset],
  )

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (visible) {
        if (e.key === 'ArrowLeft' && urls.indexOf(url) > 0) {
          prev()
        } else if (
          e.key === 'ArrowRight' &&
          urls.indexOf(url) < urls.length - 1
        ) {
          next()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, urls, url, prev, next])

  return (
    <ImagePreviewModalContext.Provider value={ImagePreviewModalContextValue}>
      {props.children}

      <Modal
        visible={visible}
        onVisibleChange={setVisible}
        bodyClassName={clsName}
        bodyRef={bodyRef}
        backdropClassName={cls('__background')}
      >
        <div className={cls('__preview')}>
          <div
            className={cls('__prev', 'nav-btn', 'nav-btn-left', {
              visible: urls.indexOf(url) > 0,
            })}
            onClick={prev}
          >
            <IconPrev />
          </div>
          <div className={cls(nutstoreClient.isMobile ? '__img-container-mobile' : '__img-container')}>
            <img
              src={url}
              ref={imgRef}
              draggable={false}
              onWheel={event => {
                event.persist()
                handleWheelOnImg(event)
              }}
              onMouseDown={() => {
                dragging.current = true
              }}
              onMouseMove={handleDragOnImg}
              onMouseUp={() => {
                dragging.current = false
              }}
              onMouseLeave={() => {
                dragging.current = false
              }}
            />
          </div>
          <div
            className={cls('__next', 'nav-btn', 'nav-btn-right', {
              visible: urls.indexOf(url) < urls.length - 1,
            })}
            onClick={next}
          >
            <IconNext />
          </div>
        </div>
        <div className={cls('__scale')}>
          <div className={cls('__scale_panel')}>
            <div className={cls('__scale_zoom-in', 'zoom-btn')}>
              <IconZoomIn onClick={zoomIn} width="20px" height="20px" />
            </div>
            <div className={cls('__scale_zoom-out', 'zoom-btn')}>
              <IconZoomOut onClick={zoomOut} width="20px" height="20px" />
            </div>
            <div className={cls('__scale_reset', 'zoom-btn')}>
              <IconReset onClick={reset} width="20px" height="20px" />
            </div>
          </div>
          <IconClose className={cls('__close')} onClick={close} />
        </div>
      </Modal>
    </ImagePreviewModalContext.Provider>
  )
}
