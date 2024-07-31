import './Controller.scss'
import { FC, useCallback, useEffect, useState } from "react"
import { c } from '../../utils/css'
import { $t } from "../../i18n"
import { IProjectNode } from "../../types"
import { SimpleTip } from '../SimpleTip'
import IconRestart from './icon_restart.svg'
import IconSwitch from './icon_switch.svg'
import IconPrev from './icon_prev.svg'
import IconNext from './icon_next.svg'
import IconFullscreen from './icon_fullscreen.svg'
import IconExitFullscreen from './icon_fullscreen-exit.svg'
import IconZoomIn from './text_zoom_in.svg'
import IconZoomOut from './text_zoom_out.svg'
import classNames from 'classnames'
import { Step } from './AdvancedSlide'

const clsName = 'Controller'
const cls = c(clsName)

interface ControllerProps {
  steps: Step[],
  switchBG: () => void,
  restart: () => void,
  prev: () => void,
  next: () => void,
  doTransform: (index: number) => void,
  zoom: boolean,
  clickToZoom: (ele: HTMLElement) => void,
  requestFullscreen: () => void,
  exitFullscreen: () => void,
  showController: () => void,
  controller: boolean,
  fullscreen: boolean,
  isPreview: boolean,
  backgroundLoading: boolean,
  stepName: string,
  stepIndex: number,
  totalStep: number,
  fileName: string,
  rootNodeIds: IProjectNode['id'][],
  nodes: { [id in IProjectNode['id']]: IProjectNode },
}

export const Controller: FC<ControllerProps> = (props) => {
  const [levelCount, setLevelCount] = useState<number>(0)

  const {
    steps,
    zoom,
    switchBG,
    restart,
    prev,
    next,
    requestFullscreen,
    exitFullscreen,
    showController,
    controller,
    fullscreen,
    isPreview,
    backgroundLoading,
    stepName,
    stepIndex
  } = props

  useEffect(() => {
    let count = 0
    for (let i = 0; i <= stepIndex; ++i) {
      if (steps[i].name === 'level') {
        count ++
      }
    }
    setLevelCount(count)
  })

  const onClickSwitchBtn = useCallback(() => {
    stepName === 'main' && switchBG()
  }, [stepName, switchBG])

  const clickToZoom = () => {
    if (levelCount === 0) return
    const nodes = document.getElementsByClassName('text-content')
    props.clickToZoom(nodes[levelCount] as HTMLElement)
  }

  return (
    <div
      className={classNames(clsName, controller ? 'show' : 'hide')}
      onClick={e => {
        showController()
        e.stopPropagation()
      }}
    >
      <div className={cls('-nav-bar')}>
        <div className="btn home-btn" onClick={restart}>
          <SimpleTip message={$t('SLIDE_BACK')}>
            <IconRestart key="icon-home" className="icon icon-home" />
          </SimpleTip>
        </div>
        <div className="btn prev-btn" onClick={prev}>
          <SimpleTip message={$t('SLIDE_PREVIOUS')}>
            <IconPrev key="icon-prev" className="icon icon-prev" />
          </SimpleTip>
        </div>
        <div className="btn next-btn" onClick={next}>
          <SimpleTip message={$t('SLIDE_NEXT')}>
            <IconNext key="icon-next" className="icon icon-next" />
          </SimpleTip>
        </div>
        <div className={cls('-divide')} />
        <div 
          className={classNames([
            'btn zoom-btn',
            { 'disabled': stepName !== 'level' }
          ])}
          onClick={clickToZoom}
        >
          {
            !zoom ? (
              <SimpleTip message={$t('SLIDE_ZOOM_IN')}>
                <IconZoomIn key="icon-zoom-in" className='icon icon-zoom-in' />
              </SimpleTip>
            ) : (
              <SimpleTip message={$t('SLIDE_ZOOM_OUT')}>
                <IconZoomOut key="icon-zoom-out" className='icon icon-zoom-out' />
              </SimpleTip>
            )
          }
        </div>
        <div className={cls('-divide')} />
        {!isPreview ? (
          <div
            className={classNames([
              'btn switch-btn',
              { 'bg-loading': backgroundLoading },
              { 'disabled': stepName !== 'main' },
            ])}
            onClick={onClickSwitchBtn}
          >
            <SimpleTip message={
                stepName === 'main'
                ? $t('SLIDE_CHANGE_BG')
                : $t('SLIDE_CHANGE_BG_DISABLED')
              }
            >
              <IconSwitch
                key="icon-switch"
                className="icon icon-home"
              />
            </SimpleTip>
          </div>
        ) : null}
        {fullscreen ? (
          <div
            className="btn exit-fullscreen-btn"
            onClick={exitFullscreen}
          >
            <SimpleTip message={$t('SLIDE_EXIT_FULLSCREEN')}>
              <IconExitFullscreen
                key="icon-exit-fullscreen"
                className="icon icon-exit-fullscreen"
              />
            </SimpleTip>
          </div>
        ) : (
          <div
            className="btn fullscreen-btn"
            onClick={requestFullscreen}
          >
            <SimpleTip message={$t('SLIDE_FULLSCREEN')}>
              <IconFullscreen
                key="icon-fullscreen"
                className="icon icon-fullscreen"
              />
            </SimpleTip>
          </div>
        )}
      </div>
    </div>
  )
}
