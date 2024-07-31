import './Advanced.scss'
import classNames from 'classnames'
import convert from 'color-convert'
import { IProjectNode } from '../../types'
import { Content } from './Content'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
import { ImageList } from './ImageList'
import { ImageViewer } from './ImageViewer'
import { Controller } from './Controller'
import { Zoom } from '../../utils/zoom'
import { ClassValue } from 'classnames/types'
import { UNSPLASH_COLLECTION } from '../../common/backgroundImagePath'
import { DeferredPromise } from '../../utils/DeferredPromise'
import { $t } from '../../i18n'
import { extractFirstLineFromHtmlText } from '../../utils/S'

const SUFFIX_WEBP = '.webp'
const SUFFIX_JPEG = '.jpeg'

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

const contentHeight = 928.8 // 928.8 = CANVAS_HEIGHT * 0.86   内容占86%
const blankHeight = 75.6 // 75.6 = CANVAS_HEIGHT * 0.07    留白7%

const COLOR_SCHEMA = {
  // font color
  'rgb(144, 148, 160)': 'rgb(194, 196, 204)',
  'rgb(255, 42, 24)': 'rgb(255, 42, 24)',
  'rgb(255, 157, 28)': 'rgb(255, 219, 88)',
  'rgb(97, 190, 87)': 'rgb(82, 231, 12)',
  'rgb(26, 214, 206)': 'rgb(58, 255, 247)',
  'rgb(16, 127, 252)': 'rgb(98, 183, 255)',
  'rgb(148, 102, 255)': 'rgb(171, 125, 255)',

  // background color
  'rgb(248, 240, 9)': 'rgba(248, 240, 9, 0.40)',
  'rgba(144, 148, 160, 0.24)': 'rgba(194, 196, 204, 0.40)',
  'rgba(255, 42, 24, 0.24)': 'rgba(255, 42, 24, 0.40)',
  'rgba(255, 157, 28, 0.24)': 'rgba(255, 219, 88, 0.40)',
  'rgba(97, 190, 87, 0.24)': 'rgba(82, 231, 12, 0.40)',
  'rgba(26, 214, 206, 0.24)': 'rgba(58, 255, 247, 0.40)',
  'rgba(16, 127, 252, 0.24)': 'rgba(98, 183, 255, 0.40)',
  'rgba(148, 102, 255, 0.24)': 'rgba(171, 125, 255, 0.40)',
}

// 检查当前浏览器是否支持webp
const webp =
  document
    .createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0

interface AdvancedSlideProps {
  isPreview: boolean
  fileName: string
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  slideBG: string
  fullscreen: boolean
  updateLoadingProgressValue: (value: number) => void
  endLoading: () => void
  requestFullscreen: () => void
  exitFullscreen: () => void
  setBG: (bg: string) => void
  zoom?: Zoom
  nodeId: string
}

interface AdvancedSlideState {
  zoom: boolean
  loading: boolean
  backgroundLoading: boolean
  controller: boolean
  /**
   * step 是代表当前在哪个阶段
   * main 大标题
   * home 大标题的下一步，即第一次显示一级序号，与后续的一级节点不同，在往前倒退的时候是退到大标题
   * menu 一级序号，在往前倒退的时候会退到上一个一级节点
   * level 实际的文档内容
   */
  stepName: 'main' | 'home' | 'menu' | 'level' | 'end'
  stepIndex: number
  // 当前第一级节点的index，主要用来控制一级节点序号的排列
  l1Index: number
  // 当前第三级节点的index，用来控制非当前三级节点序号透明度，避免遮挡其他元素
  l3Index: number | null
  // 当前的层级深度
  depth: number
  currentNodes: IProjectNode[]
  bgTransform: string
  verticalFit: boolean
  scale: number
  isViewingImg: boolean
  previewUrls: string[]
  viewingImgIndex: number
  loadingProgressValue: number
  lastNode: IProjectNode | null
  isFirst: boolean
}

export interface Step {
  name: 'main' | 'home' | 'menu' | 'level' | 'end'
  index?: number
  node: IProjectNode | null
  currentNodes: IProjectNode[]
  depth: number
  parent?: IProjectNode
  duration: number
  transform: {
    translateX: number
    translateY: number
  }
  id: string
}

export class AdvancedSlide extends React.PureComponent<
  AdvancedSlideProps,
  AdvancedSlideState
> {
  state: AdvancedSlideState = {
    zoom: false,
    loading: true,
    backgroundLoading: false,
    controller: true,
    stepName: 'main',
    stepIndex: 0,
    l1Index: 0,
    l3Index: null,
    depth: 0,
    currentNodes: [],
    bgTransform: '',
    verticalFit: false,
    scale: 1,
    isViewingImg: false,
    previewUrls: [],
    viewingImgIndex: 0,
    loadingProgressValue: 0,
    lastNode: null,
    isFirst: true
  }

  private imgRelativePathMap = new Map<string, DeferredPromise<string>>()

  private canvasRef = React.createRef<HTMLDivElement>()
  private backgroundRef = React.createRef<HTMLDivElement>()
  private imgViewerRef = React.createRef<HTMLImageElement>()
  private lastNodeRef = React.createRef<HTMLDivElement>()
  private topicsRef = React.createRef<HTMLDivElement>()
  private backgroundUrl: string = this.props.slideBG
  private backgroundIndex: number = this.backgroundUrl
    ? UNSPLASH_COLLECTION.indexOf(this.backgroundUrl)
    : 0
  private closed: boolean = false
  private animating: boolean = false
  private steps: Step[] = []
  // 如果是不支持webp的浏览器，背景图使用jpeg
  private bgSuffix: string = !webp ? SUFFIX_JPEG : SUFFIX_WEBP

  // 处理content中的字体颜色，以便在暗色背景中能看得清
  private brightenColor = (content: string): string => {
    return (
      content
        // 清理因复制黏贴带过来的白色背景
        .replace(/background-color: rgb\(255, 255, 255\)/gi, '')
        .replace(
          /rgb\(([\d]*), ([\d]*), ([\d]*)\)/gi,
          match => COLOR_SCHEMA[match] || match,
        )
        .replace(
          /rgba\(([\d]*), ([\d]*), ([\d]*), ([\d]*[/.]*[\d]*)\)/gi,
          match => COLOR_SCHEMA[match] || match,
        )
        .replace(
          /rgb\(([\d]*), ([\d]*), ([\d]*)\)/gi,
          (match, p1, p2, p3, offset, string) => {
            const hsl = convert.rgb.hsl([p1, p2, p3])
            if (hsl[2] < 50) {
              hsl[2] = 100 - hsl[2]
              const rgb = convert.hsl.rgb(hsl)
              return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
            } else {
              return `rgb(${p1}, ${p2}, ${p3})`
            }
          },
        )
        .split('black')
        .join('white')
    )
  }

  // 点击内容区域放大或还原
  private clickToZoom = (ele: HTMLElement): void => {
    if (this.props.zoom) {
      this.setState({
        zoom: this.props.zoom.zoomLevel() === 1
      })
      this.props.zoom.to({
        element: ele
      })
    }
  }

  private changeViewingImg = () => {
    const src = this.state.previewUrls[this.state.viewingImgIndex]
    const imgViewer = this.imgViewerRef.current

    if (this.state.isViewingImg && imgViewer) {
      imgViewer.src = src
      imgViewer.onload = () => {
        imgViewer.style.width = `${imgViewer.naturalWidth}px`
        imgViewer.style.height = `${imgViewer.naturalHeight}px`
        imgViewer.style.opacity = '1'
      }
      imgViewer.style.top = '50%'
      imgViewer.style.left = '50%'
      imgViewer.style.transform = 'translate(-50%, -50%)'
      imgViewer.style.maxWidth = '100%'
      imgViewer.style.maxHeight = '100%'
      imgViewer.style.transition = 'all ease-in-out 0.3s'
    }
  }

  private imagePreviewResponse = (event: MessageEvent) => {
    if (this.imgRelativePathMap.has(event.data.body.relativePath)) {
      const res = event.data.body.url
      const deferred = this.imgRelativePathMap.get(event.data.body.relativePath)
      deferred && deferred.resolve(res)
    }
  }

  private startViewingImg = async () => {
    const node = this.steps[this.state.stepIndex].node
    if (node && node.images && node.images.length) {
      const mediumsPromise = node.images.map(i => {
        if (i.type === 'httpLink') return i.data.link
        const deferred = new DeferredPromise<string>()
        this.imgRelativePathMap.set(i.data.relativePath, deferred)
        window.opener.postMessage(
          {
            type: 'REQUEST_IMAGE',
            body: {
              data: i.data,
              relativePath: i.data.relativePath,
            },
          },
          window.location.origin,
        )
        return deferred.promise
      })

      // 等待所有的图片链接获取完成
      const previewUrls: string[] = await Promise.all(mediumsPromise)
      this.setState(
        {
          previewUrls,
          viewingImgIndex: 0,
          isViewingImg: true,
        },
        this.changeViewingImg,
      )
    }
  }

  private hideImgViewer = (e?: React.MouseEvent<HTMLDivElement>): void => {
    e?.stopPropagation()
    e?.preventDefault()
    this.setState({ isViewingImg: false })
    const imgViewer = this.imgViewerRef.current
    if (imgViewer) {
      imgViewer.style.opacity = '0'
      imgViewer.style.width = '0'
      imgViewer.style.height = '0'
      imgViewer.style.transitionDuration = '0s'
      setTimeout(() => {
        imgViewer.src = ''
      })
    }
  }

  private gotoByNodeId = (nodeId: string): void => {
    this.steps.forEach((step, index) => {
      if (step.node?.id === nodeId) {
        this.doTransform(index)
      }
    })
  }

  private onContentClick = (
    e: React.MouseEvent<HTMLElement>,
    nodeId: string,
  ): void => {
    if (e.target instanceof HTMLAnchorElement && e.target.href) return
    e.stopPropagation()
    e.preventDefault()
    const { stepName } = this.state
    if (stepName === 'home' || stepName === 'menu') {
      this.gotoByNodeId(nodeId)
    } else {
      if (this.state.zoom) {
        this.clickToZoom(e.currentTarget)
      }
    }
  }

  private buildContent = (node: IProjectNode, classes: ClassValue[]) => (
    <div className={classNames(classes)}>
      {node.content && (
        <Content
          className="text-content"
          dangerousHTML={this.brightenColor(node.content)}
          onClick={e => this.onContentClick(e, node.id)}
        />
      )}
      {node.images && node.images.length > 0 && (
        <ImageList
          className="img-content"
          previewUrls={node.imagePreviewUrls || []}
          images={node.images}
          withText={Boolean(node.content)}
          imgViewerRef={this.imgViewerRef}
          canvasRef={this.canvasRef}
          scale={this.state.scale}
          verticalFit={this.state.verticalFit}
          isViewingImg={this.state.isViewingImg}
          startViewImg={(urls, index) => {
            this.setState({
              isViewingImg: true,
              previewUrls: urls,
              viewingImgIndex: index,
            })
          }}
        />
      )}
    </div>
  )

  private buildLevel1 = (node: IProjectNode, index: number): JSX.Element => {
    const currentNodes = []
    currentNodes[1] = node

    this.steps.push({
      name: 'level',
      depth: 1,
      index,
      node,
      currentNodes,
      duration: 1500,
      transform: {
        translateX: 0,
        translateY: 0,
      },
      id: node.id,
    })

    const l1Index = this.state.l1Index
    const length = this.props.rootNodeIds.length
    const odd = index % 2
    const l1Height =
      length > 5 ? contentHeight / 3 : contentHeight / Math.ceil(length / 2)
    const top =
      Math.floor(index / 2) * l1Height +
      l1Height / 2 +
      blankHeight -
      l1Height * (length > 5 ? Math.floor(l1Index / 2) : 0) -
      // 40 是序号的一半方便居中
      40
    const main = this.state.stepName === 'main'
    const home = this.state.stepName === 'home'
    const menu = this.state.stepName === 'menu'
    const isCurrentLevel =
      this.state.stepName === 'level' && this.state.depth === 1
    const active =
      this.state.currentNodes[1] && node.id === this.state.currentNodes[1].id
    const textAndImage = Boolean(
      node.content && node.images && node.images.length > 0,
    )

    return (
      <div
        className={classNames('level1', { active })}
        key={node.id}
        style={{
          transform:
            main || home || menu
              ? `translate3D(${odd ? 1080 : 120}px, ${top}px, 0)`
              : active
              ? `translate3D(100px, 500px, 0)`
              : `translate3D(${odd ? 1080 : 120}px, ${top}px, 200px)`,
          transitionDelay: home || menu ? `${index * 0.1 + 0.5}s` : '0s',
          perspectiveOrigin: `${odd ? 1080 : 120}px ${top}px`,
        }}
      >
        <div
          className={classNames('title', 'l1')}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            this.gotoByNodeId(node.id)
          }}
        >
          {index < 9 ? '0' + (index + 1) : index + 1}
        </div>
        {node.content && (
          <Content
            className="indicator-content"
            dangerousHTML={this.brightenColor(extractFirstLineFromHtmlText(node.content))}
            onClick={e => this.onContentClick(e, node.id)}
          />
        )}
        {this.buildContent(node, [
          'content',
          'l1',
          {
            isCurrentLevel,
            textAndImage,
          },
        ])}
        <div className="next-level">
          {this.buildLevel2(node, [...currentNodes])}
        </div>
      </div>
    )
  }

  private buildLevel2 = (
    parent: IProjectNode,
    ancestorNodes: IProjectNode[],
  ): JSX.Element[] => {
    const elements: JSX.Element[] = []

    if (parent.childrenIds && parent.childrenIds.length > 0) {
      const l = parent.childrenIds.length
      const startOffset = l < 7 ? (l - 1) * 0.5 : 3

      parent.childrenIds.forEach((id, index) => {
        const num: string = index + 1 + '.'
        const node = this.props.nodes[id]
        const parentActive =
          this.state.currentNodes[1] &&
          this.state.currentNodes[1].id === parent.id
        const selfActive =
          this.state.currentNodes[2] && this.state.currentNodes[2].id === id
        const activeIndex =
          parentActive && this.state.currentNodes[2]
            ? parent.childrenIds.indexOf(this.state.currentNodes[2].id)
            : -1
        const transform = {
          translateX: Math.cos((index * 50 * Math.PI) / 180) * 100,
          translateY: Math.sin((index * 50 * Math.PI) / 180) * 100,
        }
        const isCurrentLevel =
          this.state.stepName === 'level' && this.state.depth === 2
        const textAndImage = Boolean(
          node.content && node.images && node.images.length > 0,
        )

        let activeTranslateY = ''
        if (this.state.currentNodes[3] && selfActive) {
          const seq3l =
            node.childrenIds.indexOf(this.state.currentNodes[3].id) + 1
          activeTranslateY = `${-100 * seq3l}px`
        }

        const currentNodes = [...ancestorNodes]
        currentNodes[2] = node

        this.steps.push({
          name: 'level',
          depth: 2,
          index,
          node,
          currentNodes,
          parent,
          duration: 1000,
          transform,
          id,
        })

        elements.push(
          <div
            className={classNames(
              'level2',
              parentActive && selfActive ? 'active' : 'inactive',
            )}
            key={node.id}
            style={
              parentActive
                ? this.state.currentNodes[2]
                  ? {
                      transform: `rotate(${(index - activeIndex) * 5}deg)
                        translate(1600px)
                        rotate(${(index - activeIndex) * -5}deg)`,
                      transitionDelay: `0s`,
                      top: activeTranslateY,
                    }
                  : {
                      transform: `rotate(${(index - startOffset) * 5}deg)
                        translate(1600px)
                        rotate(${(index - startOffset) * -5}deg)`,
                      transitionDelay: `${index * 0.1 + 0.5}s`,
                    }
                : {
                    transform: `rotate(${(index - startOffset) * 5 + 5}deg)
                      translate(1600px)
                      rotate(${-((index - startOffset) * 5 + 5)}deg)`,
                    transitionDelay: '0s',
                  }
            }
          >
            <div
              className={classNames('title', 'l2', {
                closer: this.state.l3Index && this.state.l3Index === 0,
                faraway: this.state.l3Index && this.state.l3Index === 1,
                disappear: this.state.l3Index && this.state.l3Index > 1,
              })}
            >
              {num}
            </div>
            {this.buildContent(node, [
              'content',
              'l2',
              {
                isCurrentLevel,
                textAndImage,
              },
            ])}
            <div className="next-level">
              {this.buildLevel3(node, [...currentNodes], num, transform)}
            </div>
          </div>,
        )
      })
    }

    return elements
  }

  private buildLevel3 = (
    parent: IProjectNode,
    ancestorNodes: IProjectNode[],
    number: string,
    transformP: { translateX: number; translateY: number },
  ): JSX.Element[] => {
    const elements: JSX.Element[] = []

    if (parent.childrenIds && parent.childrenIds.length > 0) {
      parent.childrenIds.forEach((id, index) => {
        const num: string = number + (index + 1)
        const node = this.props.nodes[id]
        const transform = {
          translateX: transformP.translateX,
          translateY: transformP.translateY + ((index + 1) % 6) * 100,
        }
        const isCurrentLevel =
          this.state.stepName === 'level' && this.state.depth === 3
        const textAndImage = Boolean(
          node.content && node.images && node.images.length > 0,
        )

        const currentNodes = [...ancestorNodes]
        currentNodes[3] = node

        this.steps.push({
          name: 'level',
          index,
          node,
          currentNodes,
          depth: 3,
          parent,
          duration: 1000,
          transform,
          id,
        })

        elements.push(
          <div
            className={classNames('level3', {
              active:
                this.state.currentNodes[3] &&
                this.state.currentNodes[3].id === node.id,
              closer:
                this.state.l3Index &&
                Math.abs(index - this.state.l3Index) === 1,
              faraway:
                this.state.l3Index &&
                Math.abs(index - this.state.l3Index) === 2,
              disappear:
                this.state.l3Index && Math.abs(index - this.state.l3Index) > 2,
            })}
            key={node.id}
            style={{
              transform: `translate(-80px, ${(index + 1) * 100}px)`,
              transitionDelay: `${index * 0.1}s`,
            }}
          >
            <div className={classNames('title', 'l3')}>
              <span>{num}</span>
            </div>
            <div className="dot" />
            <div className="decorate-line-v" />
            {this.buildContent(node, [
              'content',
              'l3',
              {
                isCurrentLevel,
                textAndImage,
              },
            ])}
            <div className="next-level">
              {this.buildLevel4(node, [...currentNodes], transform)}
            </div>
          </div>,
        )
      })
    }

    return elements
  }

  private buildLevel4 = (
    parent: IProjectNode,
    ancestorNodes: IProjectNode[],
    transformP: { translateX: number; translateY: number },
  ) => {
    const elements: JSX.Element[] = []

    if (parent.childrenIds && parent.childrenIds.length > 0) {
      parent.childrenIds.forEach((id, index) => {
        const num: string = index + 1 + ''
        const node = this.props.nodes[id]
        const transform = {
          translateX: transformP.translateX + ((index + 1) % 6) * 100,
          translateY: transformP.translateY,
        }
        const isCurrentLevel =
          this.state.stepName === 'level' && this.state.depth === 4
        const textAndImage = Boolean(
          node.content && node.images && node.images.length > 0,
        )

        const currentNodes = [...ancestorNodes]
        currentNodes[4] = node

        this.steps.push({
          name: 'level',
          index,
          node,
          currentNodes,
          depth: 4,
          parent,
          duration: 1000,
          transform,
          id,
        })

        const stepIndex = this.steps.length - 1

        elements.push(
          <div
            className={classNames('level4', {
              active:
                this.state.currentNodes[4] &&
                this.state.currentNodes[4].id === node.id,
              leaving: stepIndex === this.state.stepIndex - 1,
              entering: stepIndex === this.state.stepIndex + 1,
            })}
            key={node.id}
            style={{ transform: `translate(77.5px, 0)` }}
          >
            <div className={classNames('title', 'l4')}>
              <span>{num}</span>
            </div>
            {this.buildContent(node, [
              'content',
              'l4',
              {
                isCurrentLevel,
                textAndImage,
              },
            ])}
            <div className="next-level">
              {this.buildLevelGT4(node, [...currentNodes], 5, transform)}
            </div>
          </div>,
        )
      })
    }

    return elements
  }

  private buildLevelGT4 = (
    parent: IProjectNode,
    ancestorNodes: IProjectNode[],
    depth: number,
    transformP: { translateX: number; translateY: number },
  ) => {
    const elements: JSX.Element[] = []

    if (parent.childrenIds && parent.childrenIds.length > 0) {
      parent.childrenIds.forEach((id, index) => {
        const node = this.props.nodes[id]
        const isCurrentLevel =
          this.state.stepName === 'level' && this.state.depth === depth
        const textAndImage = Boolean(
          node.content && node.images && node.images.length > 0,
        )

        const currentNodes = [...ancestorNodes]
        currentNodes[depth] = node

        this.steps.push({
          name: 'level',
          index,
          node,
          currentNodes,
          depth,
          parent,
          duration: 1000,
          transform: transformP,
          id,
        })

        const stepIndex = this.steps.length - 1
        const leaving = stepIndex === this.state.stepIndex - 1
        const leavingToNextLevel = leaving && this.state.depth > depth

        elements.push(
          <div
            className={classNames('levelGT4', {
              active:
                this.state.currentNodes[depth] &&
                this.state.currentNodes[depth].id === node.id,
              isCurrentLevel,
              leaving,
            })}
            key={node.id}
          >
            <div
              className={classNames('dot', {
                isCurrentLevel,
                leavingToNextLevel,
              })}
            />
            {this.buildContent(node, [
              'content',
              'lgt4',
              {
                isCurrentLevel,
                textAndImage,
                leavingToNextLevel,
              },
            ])}
            <div className="next-level">
              {this.buildLevelGT4(
                node,
                [...currentNodes],
                depth + 1,
                transformP,
              )}
            </div>
          </div>,
        )
      })
    }

    return elements
  }

  private buildPanel = () => {
    const elements: JSX.Element[] = []
    if (!this.props.rootNodeIds) return
    this.props.rootNodeIds.forEach((id, index) => {
      this.steps.push({
        name: index > 0 ? 'menu' : 'home',
        node: null,
        currentNodes: [],
        depth: 0,
        duration: 1500,
        transform: {
          translateX: 0,
          translateY: 0,
        },
        id,
      })
      elements.push(this.buildLevel1(this.props.nodes[id], index))
    })

    this.steps.push({
      name: 'end',
      node: null,
      currentNodes: [],
      depth: 0,
      duration: 1500,
      transform: {
        translateX: 0,
        translateY: 0,
      },
      id: 'end',
    })

    if (this.props.nodeId !== '' && this.state.isFirst) {
      this.setState({
        isFirst: false
      })
      for (let i = 0; i < this.steps.length; ++i) {
        if (this.steps[i].id === this.props.nodeId && this.steps[i].node !== null) {
          this.doTransform(i)
          this.sendIndex(i)
          break
        }
      }
    }
    
    return elements
  }

  private getBgPicture = async () => {
    if (!this.backgroundUrl) {
      const length = UNSPLASH_COLLECTION.length
      this.backgroundIndex = Math.floor(Math.random() * (length - 1))
      this.backgroundUrl = UNSPLASH_COLLECTION[this.backgroundIndex]
      // 随机选择一张图片后就保存下来，等到用户手动去切换背景后再更新
      this.props.setBG(this.backgroundUrl)
    }

    // 兼容旧版本中保存的带有后缀的背景链接
    if (this.backgroundUrl.indexOf('.webp') !== -1) {
      this.backgroundUrl = this.backgroundUrl.split('.webp')[0]
    }
    const bg = this.backgroundUrl + this.bgSuffix

    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = bg
    }).then(() => {
      // 成功加载完图片后为背景更换图片URL
      if (this.backgroundRef.current) {
        this.backgroundRef.current.style.backgroundImage = `url('${bg}')`
      }
    })
  }

  // 计算画布需要缩放多少来适应屏幕
  private adjustCanvasSize = () => {
    return new Promise<void>((resolve, reject) => {
      const isLandscape = screen.orientation
        ? screen.orientation.type.indexOf('landscape') > -1
        : window.matchMedia('(orientation: landscape)').matches
      const width = isLandscape ? window.innerWidth : window.innerHeight
      const height = isLandscape ? window.innerHeight : window.innerWidth
      const verticalFit = width / CANVAS_WIDTH > height / CANVAS_HEIGHT
      const scale = verticalFit ? height / CANVAS_HEIGHT : width / CANVAS_WIDTH

      this.setState({ verticalFit, scale }, resolve)

      if (this.canvasRef.current) {
        const { state } = this
        this.canvasRef.current.style.transform = `
          translate(-50%, -50%)
          rotate(${isLandscape ? 0 : '90deg'})
          scale(${state.scale})
        `
      }
    })
  }

  private endLoading() {
    this.setState({ loading: false })
    this.props.endLoading()
    setTimeout(() => {
      this.adjustContent()  
    })
  }

  private async init() {
    // 从Unsplash加载背景图
    try {
      await this.getBgPicture()
    } catch (e) {
      // 忽略获取背景图的异常
    }

    // 如果用户在初始化完成前就关闭了slide，则需要中断后续操作
    if (this.closed) return

    // 调整画布尺寸以适应当前窗口大小
    await this.adjustCanvasSize()

    // 显示导航栏并触发导航栏自动隐藏
    await this.showController()

    this.endLoading()
  }

  private runAnimation = () => {
    this.animating = true
    setTimeout(() => {
      this.animating = false
    }, 1 || this.steps[this.state.stepIndex].duration)
  }

  private doTransform = (index: number) => {
    const step = this.steps[index]
    const lastStep = index > 0 ? this.steps[index - 1] : undefined
    const { state, props } = this
    const currentNodes = step.currentNodes
    const topics = this.topicsRef.current
    let bgTransform = ''
    let l1Index = index > 0 ? state.l1Index : 0
    let l3Index = null

    if (step.name === 'level' && step.depth === 1 && step.index) {
      l1Index = step.index
    }

    const bgTranslateX = 30 - (l1Index ? (l1Index < 3 ? l1Index * 10 : 30) : 0)

    switch (step.name) {
      case 'main':
        bgTransform = 'translate(0px, 0px) scale(1)'
        break
      case 'home':
      case 'menu':
        bgTransform = 'translate(0, -15%) scale(2)'
        break
      case 'level':
        if (step.depth === 1) {
          if (step.node) l1Index = props.rootNodeIds.indexOf(step.node.id)
          bgTransform = `translate(${bgTranslateX}%, -35%) scale(4)`
        } else {
          if (step.depth === 3 && step.index) l3Index = step.index
          bgTransform = `translate(
              calc(${bgTranslateX}% - ${1600 - step.transform.translateX}px),
              calc(-35% ${
                step.transform.translateY > 0
                  ? '- ' + step.transform.translateY
                  : '+ ' + Math.abs(step.transform.translateY)
              }px)
            ) scale(4)`
        }
        break
      default:
        break
    }

    // 如果一级节点列表页面有滚动，先重置滚动
    if (topics && Number(topics.getAttribute('translateY'))) {
      topics.style.transform = 'translateY(0)'
      topics.setAttribute('translateY', '0')
    }

    this.setState({
      stepName: step.name,
      depth: step.depth,
      stepIndex: index,
      l1Index,
      l3Index,
      currentNodes,
      bgTransform,
      viewingImgIndex: -1,
      previewUrls: [],
    })
    this.runAnimation()

    if (this.lastNodeRef.current) {
      // 先隐藏，然后使用上个节点的 content 更新文本内容，再显示出来
      this.lastNodeRef.current.style.opacity = '0'
      if (
        step.name !== 'main' &&
        step.name !== 'home' &&
        step.name !== 'menu' &&
        step.name !== 'end'
      ) {
        setTimeout(() => {
          this.setState({
            lastNode: lastStep?.node || null,
          })
          if (this.lastNodeRef.current)
            this.lastNodeRef.current.style.opacity = '0.7'
        }, 250 /** 动画持续时间的一半 */)
      }
    }
  }

  private restart = () => {
    if (this.animating || this.state.stepIndex === 0) return
    this.doTransform(0)
  }

  private prev = () => {
    if (this.animating) return
    if (this.state.stepIndex === 0) {
      return
    }
    const index = this.state.stepIndex - 1
    this.doTransform(index)
    this.sendIndex(index)
  }

  // 根据index找到slide对应id
  private sendIndex = (idx: number) => {
    this.setState({
      zoom: false
    })
    this.steps.forEach((value, index) => {
      if (index === idx) {
        window.opener.postMessage(
          {
            type: 'SEND_INDEX_FROM_SLIDE',
            body: value.id,
          },
          window.location.origin,
        )
      }
    })
  }

  private next = () => {
    if (this.animating) return
    const index = this.state.stepIndex + 1
    if (index >= this.steps.length) {
      this.restart()
      return
    }
    this.doTransform(index)
    this.sendIndex(index)
  }

  private prevImg = () => {
    const imgIndex = this.state.viewingImgIndex
    if (imgIndex <= 0) {
      this.hideImgViewer()
    } else {
      this.setState(
        {
          viewingImgIndex: imgIndex - 1,
        },
        this.changeViewingImg,
      )
    }
  }

  private nextImg = () => {
    const imgIndex = this.state.viewingImgIndex
    if (imgIndex >= this.state.previewUrls.length - 1) {
      this.hideImgViewer()
    } else {
      this.setState(
        {
          viewingImgIndex: imgIndex + 1,
        },
        this.changeViewingImg,
      )
    }
  }

  private showController = (event?: React.MouseEvent<HTMLDivElement>) => {
    return new Promise<void>((resolve, reject) => {
      // 鼠标移动触发导航栏显示，5秒鼠标未动则隐藏导航栏
      this.setState({ controller: true }, resolve)

      this.debounceHideController()

      if (event) event.stopPropagation()
    })
  }

  private hideController = () => {
    this.setState({ controller: false })
  }

  private debounceHideController = debounce(this.hideController, 5000)

  private adjustContent = () => {
    const contents = document.getElementsByClassName('text-content')
    for (const content of contents) {
      if (content.clientHeight > 880) {
        content.classList.add('with-scroll-bar')
      }
    }
  }

  private onClickPanel = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation()
    } else {
      // 如果是放大状态，先还原
      const zoom = this.props.zoom
      if (zoom && zoom.zoomLevel() !== 1) {
        zoom && zoom.reset()
        this.setState({
          zoom: false
        })
      } else {
        this.next()
      }
    }
  }

  private handleKeyEvent = (event: KeyboardEvent) => {
    if (this.state.loading) return

    switch (event.code) {
      case 'PageUp':
      case 'ArrowLeft':
      case 'ArrowUp':
        if (!this.state.isViewingImg) {
          this.prev()
        } else {
          this.prevImg()
        }
        break
      case 'Enter':
      case 'PageDown':
      case 'ArrowRight':
      case 'ArrowDown':
        if (!this.state.isViewingImg) {
          this.next()
        } else {
          this.nextImg()
        }
        break
      case 'Space':
        if (!this.state.isViewingImg) {
          const images = this.steps[this.state.stepIndex].node?.images
          const previewUrls = this.state.previewUrls
          if (images && images.length) {
            if (previewUrls && previewUrls.length) {
              this.setState(
                {
                  isViewingImg: true,
                },
                this.changeViewingImg,
              )
            } else {
              void this.startViewingImg()
            }
          } else {
            this.next()
          }
        } else {
          this.hideImgViewer()
        }
        event.stopImmediatePropagation()
        event.preventDefault()
        break
      case 'Escape':
        if (this.state.isViewingImg) {
          this.hideImgViewer()
        }
        break
      default:
        break
    }
  }

  private switchBG = async () => {
    if (this.state.backgroundLoading) return
    this.setState({ backgroundLoading: true })
    // 加载背景图时，鼠标显示loading状态
    document.body.style.cursor = 'wait'
    const length = UNSPLASH_COLLECTION.length
    this.backgroundIndex = (this.backgroundIndex + 1) % length
    this.backgroundUrl = UNSPLASH_COLLECTION[this.backgroundIndex]
    this.props.setBG(this.backgroundUrl)
    const bg = this.backgroundUrl + this.bgSuffix

    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = bg
    }).then(() => {
      // 成功加载完图片后为背景更换图片URL
      if (this.backgroundRef.current) {
        this.backgroundRef.current.style.backgroundImage = `url('${bg}')`
      }
      // css加载图片还是需要一点时间的，延迟1秒还原鼠标状态
      setTimeout(() => {
        this.setState({ backgroundLoading: false })
        document.body.style.cursor = ''
      }, 1000)
    })
  }

  private currentIndex = (event: MessageEvent) => {
    const currentIndex = event.data.body
    this.steps.map((step, index) => {
      if (step.id === currentIndex) {
        this.doTransform(index)
      }
    })
  }

  private listenerMessageEvent = (event: MessageEvent) => {
    switch (event.data.type) {
      case 'CURRENT_INDEX': {
        this.currentIndex(event)
        break
      }
      case 'IMAGE_RESPONSE': {
        this.imagePreviewResponse(event)
        break
      }
    }
  }

  private getScrollTransformYRange = (): [number, number] => {
    if (this.props.rootNodeIds.length > 5) {
      const unit = -(contentHeight / 3)
      const delta = Math.floor(this.state.l1Index / 2) * unit
      const initTop =
        unit * (Math.floor((this.props.rootNodeIds.length - 5) / 2) + 1)

      return [initTop - delta, 0 - delta]
    } else {
      return [0, 0]
    }
  }

  private throttledWheelHandler = throttle(
    (event: React.WheelEvent) => {
      const topics = this.topicsRef.current
      if (
        topics &&
        (this.state.stepName === 'home' || this.state.stepName === 'menu')
      ) {
        const scrollStep = 300
        const range = this.getScrollTransformYRange()
        const translateY = Number(topics.getAttribute('translateY'))
        if (event.deltaY > 0) {
          const newTranslateY =
            translateY - scrollStep < range[0]
              ? range[0]
              : translateY - scrollStep
          topics.style.transform = `translateY(${newTranslateY}px)`
          topics.setAttribute('translateY', `${newTranslateY}`)
        } else {
          const newTranslateY =
            translateY + scrollStep > range[1]
              ? range[1]
              : translateY + scrollStep
          topics.style.transform = `translateY(${newTranslateY}px)`
          topics.setAttribute('translateY', `${newTranslateY}`)
        }
      }
    },
    100,
    { leading: true },
  )

  private onTopicsWheel = (event: React.WheelEvent) => {
    event.persist()
    this.throttledWheelHandler(event)
  }

  componentDidMount() {
    // 确保元素渲染完成再初始化
    this.init()
    window.addEventListener('resize', this.adjustCanvasSize)
    window.addEventListener('orientationchange', this.adjustCanvasSize)
    window.addEventListener('keydown', this.handleKeyEvent)
    // 监听app发送过来的POSTMessage
    window.addEventListener('message', this.listenerMessageEvent, false)
  }

  componentWillUnmount() {
    // unMount之后不能再调用setState
    // 需要清除之前设置的debounce
    this.debounceHideController.cancel()

    // promise中所有后续的setState都需要取消
    this.closed = true
    window.removeEventListener('resize', this.adjustCanvasSize)
    window.removeEventListener('orientationchange', this.adjustCanvasSize)
    window.removeEventListener('keydown', this.handleKeyEvent)
    window.removeEventListener('message', this.listenerMessageEvent, false)
  }

  render() {
    // 渲染时将队列清空
    this.steps = []
    this.steps.push({
      name: 'main',
      node: null,
      currentNodes: [],
      depth: 0,
      duration: 1500,
      transform: {
        translateX: 0,
        translateY: 0,
      },
      id: '',
    })
    // TODO: 渲染节点前计算动画序列，这样可以一部分一部分得渲染节点，应该可以提升一些性能

    const { state, props } = this

    return (
      <div
        className={classNames(
          'canvas',
          'advanced',
          state.loading ? 'loading' : '',
          `${state.stepName}${
            state.depth > 0 ? (state.depth > 4 ? 'GT4' : state.depth) : ''
          }`,
        )}
        style={{
          transform: `translate(-50%, -50%) scale(${state.scale})`,
        }}
        ref={this.canvasRef}
        onClick={this.onClickPanel}
        onMouseMove={this.showController}
      >
        <div
          className="background"
          ref={this.backgroundRef}
          style={{ transform: state.bgTransform }}
        />
        <div className="last-node" ref={this.lastNodeRef}>
          <Content
            className="text-content"
            dangerousHTML={
              state.lastNode
                ? this.brightenColor(state.lastNode.content)
                : props.fileName
            }
          />
          <div className="decorate-line" />
        </div>
        <div className="panel" onWheel={this.onTopicsWheel}>
          <div className="container filename">
            <h1>{props.fileName}</h1>
            <div className="decorate-line" />
          </div>
          <div className="topics" ref={this.topicsRef}>
            {this.buildPanel()}
          </div>
        </div>
        <Controller
          steps={this.steps}
          switchBG={this.switchBG}
          restart={this.restart}
          prev={this.prev}
          next={this.next}
          doTransform={this.doTransform}
          zoom={this.state.zoom}
          clickToZoom={this.clickToZoom}
          requestFullscreen={props.requestFullscreen}
          exitFullscreen={props.exitFullscreen}
          fullscreen={props.fullscreen}
          isPreview={props.isPreview}
          backgroundLoading={state.backgroundLoading}
          stepName={state.stepName}
          stepIndex={state.stepIndex}
          totalStep={this.steps.length}
          controller={state.controller}
          showController={this.showController}
          fileName={props.fileName}
          rootNodeIds={props.rootNodeIds}
          nodes={props.nodes}
        />
        <ImageViewer
          imgRef={this.imgViewerRef}
          isViewingImg={this.state.isViewingImg}
          hideImgViewer={this.hideImgViewer}
          imgIndex={this.state.viewingImgIndex}
          previewUrlsLength={this.state.previewUrls.length}
          prevImg={this.prevImg}
          nextImg={this.nextImg}
        />
        <div className="end">{$t('SLIDE_END')}</div>
      </div>
    )
  }
}
