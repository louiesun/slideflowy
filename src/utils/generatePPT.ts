import pptxgen from '@nshq/pptxgenjs'
import PptxGenJS from '@nshq/pptxgenjs/types/index'
import { IProjectNode, UploadedImage } from '../types/index'
import { clone } from 'ramda'
import { random } from 'lodash'
import { UNSPLASH_COLLECTION } from '../common/backgroundImagePath'
import { FileService } from '../services/FileService'
import { HTMLStringParser, NodeType } from './HTMLStringParser'
import { $t } from '../i18n'

const fileService = new FileService()

interface IProjectNodeTree extends IProjectNode {
  children?: IProjectNodeTree[],
  parent?: IProjectNodeTree,
  fileName?: string
}

enum SlideMaster {
  MainBG = 'MainBG',
  BlurBG = 'BlurBG',
}

enum TextStyle {
  strong = 'bold',
  em = 'italic',
  u = 'underline',
  span = 'color',
  a = 'hyperlink',
  br = 'br',
}

const HALF_THE_WIDTH_OF_THE_DOT = 3
const INDICATOR_MAX_QUANTITY = 8

type Nodes = {
  [nodeId in IProjectNode['id']]: IProjectNodeTree
}

type RootNodeIds = IProjectNode['id'][]

interface GeneratePPTParams {
  nodes: Nodes
  rootNodeIds: RootNodeIds
  fileName: string
  slideBG?: string
}

export const generatePPT = async ({
  nodes,
  rootNodeIds,
  fileName,
  slideBG,
}: GeneratePPTParams) => {
  // 大体的思路就是把一维的节点数据先递归转为树形数据，然后在递归树形数据，为每一个节点设置 PPT 页面和文字之类的。
  const treeData = generateNodeTree(fileName, nodes, rootNodeIds)
  const pptx = new pptxgen()
  // 配置 PPT 母版
  configurePPTTemplate(pptx, slideBG)
  // 配置 PPT 首页
  configurePPTHomePage(pptx, fileName)
  // 递归生成 PPT 页面，核心代码
  await traverseTreeDataToGeneratePPTPage({
    treeData,
    pptx,
    depth: 1,
    currentSerialNumber: '00',
  })
  // 输出 PPT
  return pptx.writeFile({
    fileName: `${fileName}.pptx`,
  })
}

export const generateNodeTree = (
  fileName: string,
  nodes: Nodes,
  rootNodeIds: RootNodeIds,
): IProjectNodeTree[] => {
  const result: IProjectNodeTree[] = []
  rootNodeIds?.forEach(rootNodeId => {
    const rootNode = nodes[rootNodeId]
    rootNode.fileName = fileName
    if (rootNode.childrenIds.length > 0) {
      rootNode.children = []
      rootNode.children = recursivelyGenerateTree(fileName, rootNode.childrenIds, nodes)
      rootNode.children.forEach(child => (child.parent = rootNode))
    }
    // ProseMirror 在处理连续空格时使用的是 &nbsp;
    // 但是 PPT 会把 &nbsp; 当成普通的字符串，所以这里要替换掉
    rootNode.content = rootNode.content.replace(/\&nbsp;/g, ' ')
    result.push(rootNode)
  })
  return clone<IProjectNodeTree[]>(result)
}

function recursivelyGenerateTree(
  fileName: string,
  ids: string[],
  nodes: Nodes,
): IProjectNodeTree[] {
  const result: IProjectNodeTree[] = []
  if (ids.length > 0) {
    ids.forEach(id => {
      const currentNode = nodes[id]
      currentNode.fileName = fileName
      currentNode.content = currentNode.content.replace(/\&nbsp;/g, ' ')
      result.push(currentNode)
      if (currentNode.childrenIds.length > 0) {
        currentNode.children = []
        currentNode.children = currentNode.children.concat(
          recursivelyGenerateTree(fileName, currentNode.childrenIds, nodes),
        )
        currentNode.children.forEach(child => (child.parent = currentNode))
      }
    })
  }
  return result
}

function configurePPTTemplate(pptx: pptxgen, slideBG?: string) {
  let backgroundPath = ''
  if (slideBG) {
    backgroundPath = `${slideBG}.jpeg`
  } else {
    backgroundPath = getRandomBackgroundImageURL()
  }
  pptx.defineSlideMaster({
    title: SlideMaster.MainBG,
    background: {
      path: backgroundPath,
    },
  })
  pptx.defineSlideMaster({
    title: SlideMaster.BlurBG,
    background: {
      path: backgroundPath.replace(/\.jpeg$/, '-blur.jpeg'),
    },
  })
}

function getRandomBackgroundImageURL(): string {
  const imageQuantity = UNSPLASH_COLLECTION.length - 1
  const randomNumber = random(imageQuantity)
  const result = `${UNSPLASH_COLLECTION[randomNumber]}.jpeg`
  return result
}

function configurePPTHomePage(pptx: pptxgen, fileName: string): pptxgen.Slide {
  const page = pptx.addSlide({
    masterName: SlideMaster.MainBG,
    transition: true,
    transitionType: 'Fade',
  })
  setPageCenterText({
    text: fileName,
    page,
    fontSize: 40,
    bold: true,
    color: '#FFFFFF',
  })
  return page
}

function setPageCenterText({
  page,
  fontSize,
  text,
  bold,
  color,
}: {
  page: pptxgen.Slide
  fontSize: number
  text: string
  bold: boolean
  color: string
}) {
  page.addText(text, {
    h: '50%',
    w: '50%',
    x: '25%',
    y: '25%',
    fontSize,
    align: 'center',
    bold,
    color,
  })
}

function configurePPTTitleNumberPage(
  pptx: pptxgen,
  serialNumber: number,
  treeData: IProjectNodeTree[],
): pptxgen.Slide | undefined {
  const cycles = treeData.length
  const page = pptx.addSlide({
    masterName: SlideMaster.BlurBG,
    transition: true,
    transitionType: 'Circle',
  })
  let yPositionIndex = 0
  const getYPosition = (
    yPositionIndex: number,
    serialNumber: number,
  ): pptxgen.Coord => {
    if (cycles < 3) {
      return '45.5%'
    } else if (cycles < 5) {
      if (yPositionIndex === 1) {
        return '20%'
      } else {
        return '60%'
      }
    } else {
      return `${
        10 + 30 * (yPositionIndex - 1 - Math.floor((serialNumber - 1) / 2))
      }%`
    }
  }
  for (let index = 1; index <= cycles; index++) {
    if (index % 2 === 1) {
      yPositionIndex++
    }
    const positionMap: pptxgen.Coord[] = ['55%', '5%']
    const textArr = getDisplayTextContent({
      content: treeData[index - 1].content,
    })
    const text =
      textArr[0]?.text && textArr[0]?.text.length >= 50
        ? `${textArr[0]?.text?.substring(0, 50)}...`
        : textArr[0]?.text
    setSerialNumberAndTitleOfTheMenuPage({
      page,
      pptx,
      titleText: index < 10 ? `0${index}` : `${index}`,
      textArr: [
        {
          ...textArr[0],
          text,
        },
      ],
      textWidth: '30%',
      cXNumber: positionMap[index % 2],
      cYNumber: getYPosition(yPositionIndex, serialNumber),
    })
  }

  if (treeData[serialNumber - 1].childrenIds.length > 0) {
    setTheSubtitleNumberOfTheTopLevelTitle({
      page,
      pptx,
      numberOfChildren: treeData[serialNumber - 1].childrenIds.length,
      offset: 40,
    })
  }
  return page
}

function setSerialNumberAndTitleOfTheMenuPage({
  page,
  pptx,
  titleText,
  textArr,
  textWidth = '60%',
  cYNumber = '45%',
  cXNumber = '10%',
  textColor = '#FFFFFF',
}: {
  page: pptxgen.Slide
  pptx: pptxgen
  titleText: string
  textArr: PptxGenJS.TextProps[]
  textWidth?: pptxgen.Coord
  x?: pptxgen.Coord
  cYNumber?: pptxgen.Coord
  cXNumber?: pptxgen.Coord
  textColor?: string
}) {
  setCircularNumberTitle({
    page,
    pptx,
    text: titleText,
    color: textColor,
    fontSize: 12,
    x: `${typeof cXNumber === 'string' ? parseInt(cXNumber, 10) : 10}%`,
    y: cYNumber,
  })
  setParagraphTextContent({
    page,
    textArr,
    w: textWidth,
    h: 0.6,
    fontSize: 18,
    color: textColor,
    x: `${typeof cXNumber === 'string' ? parseInt(cXNumber, 10) + 10 : 10}%`,
    y: cYNumber,
  })
}

function setCircularNumberTitle({
  page,
  pptx,
  fontSize = 12,
  text,
  graphicColor = '#678eff',
  transparency = 0,
  color,
  h = 0.6,
  w = 0.6,
  x,
  y = '85%',
}: {
  page: pptxgen.Slide
  fontSize?: number
  text: string
  color: string
  pptx: pptxgen
  graphicColor?: string
  transparency?: number
  h?: number
  w?: number
  x: pptxgen.Coord
  y?: pptxgen.Coord
}) {
  page.addText(text, {
    shape: pptx.ShapeType.ellipse,
    fill: {
      color: graphicColor,
      transparency,
    },
    color,
    align: 'center',
    fontSize,
    h,
    w,
    x,
    y,
  })
}

function traverseTreeDataToGeneratePPTPage({
  pptx,
  treeData,
  depth,
  currentSerialNumber,
}: {
  pptx: pptxgen
  treeData: IProjectNodeTree[]
  depth: number
  currentSerialNumber: string
}): Promise<void | void[]> {
  return Promise.all(
    treeData?.map(async (node: IProjectNodeTree, index: number) => {
      if (depth === 1) {
        configurePPTTitleNumberPage(pptx, index + 1, clone(treeData))
      }
      const page = pptx.addSlide({
        masterName: SlideMaster.BlurBG,
        transition: true,
        transitionType: 'Morph',
      })
      currentSerialNumber = generateSequenceNumbersInMoreDepth(
        depth,
        index,
        currentSerialNumber,
      )
      // 核心代码
      setTitleAndTextPositionBasedOnHierarchy({
        page,
        pptx,
        currentSerialNumber,
        depth,
        node,
        index,
      })

      if (node.images && node.images.length) {
        // 核心代码
        await setNotesIllustration({
          images: node.images,
          page,
          depth,
        })
      }

      if (depth === 1 && node.childrenIds.length > 0) {
        // 核心代码
        setTheSubtitleNumberOfTheTopLevelTitle({
          page,
          pptx,
          numberOfChildren: node.childrenIds.length,
        })
      }

      if (node.children && node.children.length > 0) {
        await traverseTreeDataToGeneratePPTPage({
          pptx,
          treeData: node.children,
          depth: depth + 1,
          currentSerialNumber,
        })
      }
    }),
  )
}

function generateSequenceNumbersInMoreDepth(
  depth: number,
  index: number,
  currentSerialNumber: string,
) {
  if (depth === 1) {
    return index < 9 ? `0${index + 1}` : `${index + 1}`
  } else if (depth === 2) {
    return `${index + 1}.`
  } else if (depth === 3) {
    return `${parseInt(currentSerialNumber, 10)}.${index + 1}`
  } else if (depth === 4) {
    return currentSerialNumber
  }
  return ''
}

function setTitleAndTextPositionBasedOnHierarchy({
  currentSerialNumber,
  depth,
  pptx,
  page,
  node,
  index,
}: {
  currentSerialNumber: string
  depth: number
  index: number
  pptx: pptxgen
  page: pptxgen.Slide
  node: IProjectNodeTree
}) {
  const textArr = getDisplayTextContent({ content: node.content })
  const textWidth = determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(
    node.images,
  )
  page.addText(depth === 1 ? node.fileName || $t('NUTFLOWY') : node.parent?.content!, {
    x: 0.2,
    y: "-40%",
    color:"#FFFFFF",
    fontSize: 18,
    w: "100%",
    h: "100%",
    transparency: 20,
  })
  page.addShape('rect', {
    w: 0.75,
    h: 0.03,
    x: 0.3,
    y: 0.85,
    fill: {
      color: "#678eff",
      transparency: 20,
    }
  })

  if (depth <= 2) {
    setCircularTitleAndText({
      page,
      pptx,
      titleText: currentSerialNumber,
      textArr,
      textWidth,
      timing: depth === 2 || index > 0,
    })
  } else if (depth === 3) {
    setTheTitleAndTextPositionOfTheThirdLevel({
      page,
      pptx,
      titleText: currentSerialNumber,
      textArr,
      textWidth,
    })
  } else if (depth === 4) {
    setTheTitleAndTextPositionOfTheFourthLayer({
      page,
      pptx,
      textArr,
      textWidth,
      subtitle: currentSerialNumber,
      headline: `${index + 1}`,
    })
  } else {
    setTitleAndTextPositionAfterLevelFive({
      page,
      pptx,
      textArr,
      textWidth,
    })
  }
}

function getDisplayTextContent({
  content,
}: {
  content: string
}): pptxgen.TextProps[] {
  const parsers = new HTMLStringParser(content).getRoots()
  const textStyleType = ''
  const textColor = {
    style: '',
  }
  return getTextContentRecursively(parsers, textStyleType, textColor)
}

function determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(
  images: UploadedImage[] | undefined,
) {
  return images && images.length ? '32%' : '70%'
}

function setCircularTitleAndText({
  page,
  pptx,
  titleText,
  textArr,
  textWidth = '60%',
  cYNumber = '45%',
  cXNumber = '10%',
  textColor = '#FFFFFF',
  timing = false,
}: {
  page: pptxgen.Slide
  pptx: pptxgen
  titleText: string
  textArr: PptxGenJS.TextProps[]
  textWidth?: pptxgen.Coord
  x?: pptxgen.Coord
  cYNumber?: pptxgen.Coord
  cXNumber?: pptxgen.Coord
  textColor?: string
  timing?: boolean
}) {
  setCircularNumberTitle({
    page,
    pptx,
    text: titleText,
    color: textColor,
    fontSize: 12,
    x: cXNumber,
    y: cYNumber,
  })
  setParagraphTextContent({
    page,
    textArr,
    w: textWidth,
    color: textColor,
    timing,
  })
}

function setTheTitleAndTextPositionOfTheThirdLevel({
  pptx,
  page,
  titleText,
  textArr,
  textWidth,
}: {
  pptx: pptxgen
  page: pptxgen.Slide
  titleText: string
  textArr: PptxGenJS.TextProps[]
  textWidth?: pptxgen.Coord
}) {
  page.addText(titleText, {
    y: '47.5%',
    x: '10%',
    color: '#FFFFFF',
    fontSize: 12,
    h: 0.3,
    w: 0.5,
  })
  setSmallDots({
    page,
    pptx,
  })
  setParagraphTextContent({
    textArr,
    w: textWidth,
    page,
    timing: true,
  })
}

function setTheTitleAndTextPositionOfTheFourthLayer({
  page,
  pptx,
  subtitle,
  textArr,
  textWidth,
  headline,
}: {
  page: pptxgen.Slide
  pptx: pptxgen
  subtitle: string
  headline: string
  textArr: PptxGenJS.TextProps[]
  textWidth?: pptxgen.Coord
}) {
  page.addText(subtitle, {
    y: '47.5%',
    x: '5%',
    color: '#FFFFFF',
    fontSize: 12,
    h: 0.3,
    w: 0.5,
  })
  setCircularTitleAndText({
    page,
    pptx,
    titleText: headline,
    textArr,
    textWidth,
    timing: true,
  })
}

function setSmallDots({
  page,
  pptx,
  x = '15%',
  y = '49.2%',
}: {
  page: pptxgen.Slide
  pptx: pptxgen
  graphicColor?: string
  h?: number
  w?: number
  x?: pptxgen.Coord
  y?: pptxgen.Coord
}) {
  setCircularNumberTitle({
    page,
    pptx,
    text: '',
    color: '#FFFFFF',
    h: 0.1,
    w: 0.1,
    x,
    y,
  })
}

function setTitleAndTextPositionAfterLevelFive({
  pptx,
  page,
  textArr,
  textWidth,
}: {
  pptx: pptxgen
  page: pptxgen.Slide
  textArr: PptxGenJS.TextProps[]
  textWidth?: pptxgen.Coord
}) {
  setSmallDots({
    page,
    pptx,
  })
  setParagraphTextContent({
    textArr,
    w: textWidth,
    page,
    timing: true,
  })
}

function setParagraphTextContent({
  page,
  textArr,
  fontSize = 32,
  color = '#FFFFFF',
  w = '60%',
  h = '90%',
  y = '5%',
  x = '18%',
  timing = false,
}: {
  page: pptxgen.Slide
  textArr: PptxGenJS.TextProps[]
  fontSize?: number
  w?: pptxgen.Coord
  h?: pptxgen.Coord
  y?: pptxgen.Coord
  x?: pptxgen.Coord
  color?: string
  timing?: boolean
}) {
  // 为一大段文字设置一个公共样式
  page.addText(textArr, {
    x,
    y,
    color,
    fontSize,
    h,
    w,
    lineSpacingMultiple: 1,
    valign: 'middle',
    fit: 'shrink',
    timing,
  })
}

function getTextContentRecursively(
  parsers: NodeType[],
  textStyleType: string,
  textColor: { style: string },
): pptxgen.TextProps[] {
  let result: pptxgen.TextProps[] = []
  parsers.forEach(parser => {
    if (parser.name === TextStyle.br) {
      // 换行标签
      result.push({
        text: '',
        options: {
          breakLine: true,
        },
      })
    }
    if (parser.parent === null && parser.text) {
      // 顶级节点的纯文本
      result.push({ text: parser.text })
    }
    if (parser.parent !== null && parser.text) {
      let color: string | undefined
      if (textStyleType.includes(TextStyle.span)) {
        if (textColor.style.includes('#')) {
          color = `#${textColor.style.split('#')[1].toLowerCase()}`
        } else {
          const [r, g, b] = convertColorToRGBArray(textColor.style)
          color = rgbToHex(r, g, b)
        }
      }
      // 非顶级节点的纯文本 给每一小段文字设置样式
      const text: pptxgen.TextProps = {
        text: parser.text,
        options: {
          bold: textStyleType.includes(TextStyle.strong),
          italic: textStyleType.includes(TextStyle.em),
          underline: textStyleType.includes(TextStyle.u)
            ? {
                style: 'dashLong',
              }
            : undefined,
          hyperlink: textStyleType.includes(TextStyle.a)
            ? {
                url: parser.text,
              }
            : undefined,
          color,
        },
      }
      result.push(text)
    }
    if (parser.name) {
      textStyleType += `${TextStyle[parser.name]}*`
    }
    if (parser.attrs && parser.attrs.style) {
      textColor = { style: parser.attrs.style }
    }
    if (parser.children && parser.children.length > 0) {
      result = result.concat(
        getTextContentRecursively(parser.children, textStyleType, textColor),
      )
    }
  })
  return result
}

function getSizeAndPositionOfImageBasedOnQuantityAndIndex(
  quantity: number,
  index: number,
  depth: number,
  width: number,
  height: number,
): Partial<pptxgen.ImageProps> {
  const IMAGE_PANEL_HEIGHT = 80
  const IMAGE_PANEL_WIDTH =
    IMAGE_PANEL_HEIGHT * (9 / 16) - (depth === 1 ? 8 : 0)
  const effect = quantity < 5 ? 'Fade' : 'Switch'
  let w
  let h
  let x
  let y

  if (quantity === 2) {
    x = 50
    y = index > 0 ? 51 : 10
    w = IMAGE_PANEL_WIDTH
    h = IMAGE_PANEL_HEIGHT / 2 - 1
  } else if (quantity === 3) {
    if (index < 2) {
      y = 10
      w = IMAGE_PANEL_WIDTH / 2 - 1
      x = index === 0 ? 50 : 50 + w + 2
    } else {
      x = 50
      y = 51
      w = IMAGE_PANEL_WIDTH
    }
    h = IMAGE_PANEL_HEIGHT / 2 - 1
  } else if (quantity === 4) {
    w = IMAGE_PANEL_WIDTH / 2 - 1
    h = IMAGE_PANEL_HEIGHT / 2 - 1
    x = index % 2 === 0 ? 50 : 50 + w + 2
    y = index < 2 ? 10 : 51
  } else {
    x = 50
    y = 10
    w = IMAGE_PANEL_WIDTH
    h = IMAGE_PANEL_HEIGHT
  }
  if (width / height > (w * 16) / 9 / h) {
    const containerHeight = h
    h = (((w * 16) / 9) * height) / width
    y += (containerHeight - h) / 2
  } else {
    const containerWidth = w
    w = (((h * 9) / 16) * width) / height
    x += (containerWidth - w) / 2
  }

  return {
    sizing: {
      type: 'cover',
      w: `${w}%`,
      h: `${h}%`,
    },
    x: `${x}%`,
    y: `${y}%`,
    timing: true,
    effect,
  }
}

function setNotesIllustration({
  images,
  page,
  depth,
}: {
  images: UploadedImage[]
  page: pptxgen.Slide
  depth: number
}): Promise<void | void[]> {
  const imageCount = images.length
  return getImageURLInNote(images).then(images => {
    return Promise.all(
      images.map(async (url, index) => {
        const imageData = await imageToBase64URL(url)
        if (imageData.dataURL !== '') {
          page.addImage({
            data: imageData.dataURL,
            ...getSizeAndPositionOfImageBasedOnQuantityAndIndex(
              imageCount,
              index,
              depth,
              imageData.img.naturalWidth,
              imageData.img.naturalHeight,
            ),
          })
        }
      }),
    )
  })
}

function setTheSubtitleNumberOfTheTopLevelTitle({
  numberOfChildren,
  page,
  pptx,
  offset = 0,
}: {
  numberOfChildren: number
  page: pptxgen.Slide
  pptx: pptxgen
  offset?: number
}) {
  const quantity = Math.min(numberOfChildren, INDICATOR_MAX_QUANTITY)
  for (let index = 1; index <= quantity; index++) {
    setCircularNumberTitle({
      page,
      pptx,
      text: `${index}.`,
      color: '#FFFFFF',
      graphicColor: '#678eff',
      transparency: 80,
      fontSize: 10,
      x: `${getOffsetXBasedOnQuantityAndIndex(quantity, index - 1) + offset}%`,
      y: `${
        getPositionYBasedOnQuantityAndIndex(quantity, index - 1) -
        HALF_THE_WIDTH_OF_THE_DOT
      }%`,
      w: 0.5,
      h: 0.5,
    })
  }
}

// 按照宽高比 16:9 运用三角函数计算 X 轴偏移位置
function getOffsetXBasedOnQuantityAndIndex(quantity: number, index: number) {
  if (quantity === INDICATOR_MAX_QUANTITY) {
    return (
      80 *
        Math.cos(
          ((Math.atan2(3.5, 16 * 0.8) * 2) / (INDICATOR_MAX_QUANTITY - 2)) *
            Math.abs(index - (INDICATOR_MAX_QUANTITY - 2) / 2),
        ) +
      10
    )
  } else {
    return (
      80 *
        Math.cos(
          ((Math.atan2(3.5, 16 * 0.8) * 2) / (quantity - 1)) *
            Math.abs(index - (quantity - 1) / 2),
        ) +
      10
    )
  }
}

// 按照宽高比 16:9 运用三角函数计算 Y 轴偏移位置
function getPositionYBasedOnQuantityAndIndex(quantity: number, index: number) {
  if (quantity === INDICATOR_MAX_QUANTITY) {
    return (
      ((16 *
        0.8 *
        Math.sin(
          ((Math.atan2(3.5, 16 * 0.8) * 2) / (INDICATOR_MAX_QUANTITY - 2)) *
            (index - (INDICATOR_MAX_QUANTITY - 2) / 2),
        )) /
        9 +
        0.5) *
      100
    )
  } else {
    return (
      ((16 *
        0.8 *
        Math.sin(
          ((Math.atan2(3.5, 16 * 0.8) * 2) / (quantity - 1)) *
            (index - (quantity - 1) / 2),
        )) /
        9 +
        0.5) *
      100
    )
  }
}

async function getImageURLInNote(images: UploadedImage[]): Promise<string[]> {
  const imageURLS = images.map(async image => {
    if (image.type === 'httpLink') {
      return image.data.link
    }
    return (await fileService.getPreviewLink(image.data)) || ''
  })
  let previewUrls: string[] = []
  try {
    previewUrls = await Promise.all(imageURLS)
  } catch {
    // TODO: 这里有没有什么事情可以做
  }
  return previewUrls
}

function imageToBase64URL(
  URL: string,
): Promise<{ dataURL: string; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    if (!ctx) {
      return
    }
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      canvas.height = img.height
      canvas.width = img.width
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve({ dataURL, img })
    }
    img.onerror = event => {
      console.error(
        'imageToBase64URL error: image load failed with URL',
        URL,
        event,
      )
      resolve({ dataURL: '', img })
    }
    img.src = URL
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

function convertColorToRGBArray(color: string): number[] {
  const regex = /[0-9]{1,3}/g
  return color.match(regex)?.map(Number) || [0, 0, 0]
}
