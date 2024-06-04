import pptxgen from '@nshq/pptxgenjs';
import { clone } from 'ramda';
import { random } from 'lodash';
import { UNSPLASH_COLLECTION } from '../common/backgroundImagePath';
import { FileService } from '../services/FileService';
import { HTMLStringParser } from './HTMLStringParser';
const fileService = new FileService();
var SlideMaster;
(function (SlideMaster) {
    SlideMaster["MainBG"] = "MainBG";
    SlideMaster["BlurBG"] = "BlurBG";
})(SlideMaster || (SlideMaster = {}));
var TextStyle;
(function (TextStyle) {
    TextStyle["strong"] = "bold";
    TextStyle["em"] = "italic";
    TextStyle["u"] = "underline";
    TextStyle["span"] = "color";
    TextStyle["a"] = "hyperlink";
    TextStyle["br"] = "br";
})(TextStyle || (TextStyle = {}));
const HALF_THE_WIDTH_OF_THE_DOT = 3;
const INDICATOR_MAX_QUANTITY = 8;
export const generatePPT = async ({ nodes, rootNodeIds, fileName, slideBG, }) => {
    // 大体的思路就是把一维的节点数据先递归转为树形数据，然后在递归树形数据，为每一个节点设置 PPT 页面和文字之类的。
    const treeData = generateNodeTree(nodes, rootNodeIds);
    const pptx = new pptxgen();
    // 配置 PPT 母版
    configurePPTTemplate(pptx, slideBG);
    // 配置 PPT 首页
    configurePPTHomePage(pptx, fileName);
    // 递归生成 PPT 页面，核心代码
    await traverseTreeDataToGeneratePPTPage({
        treeData,
        pptx,
        depth: 1,
        currentSerialNumber: '00',
    });
    // 输出 PPT
    return pptx.writeFile({
        fileName: `${fileName}.pptx`,
    });
};
export const generateNodeTree = (nodes, rootNodeIds) => {
    const result = [];
    rootNodeIds?.forEach(rootNodeId => {
        const rootNode = nodes[rootNodeId];
        if (rootNode.childrenIds.length > 0) {
            rootNode.children = [];
            rootNode.children = recursivelyGenerateTree(rootNode.childrenIds, nodes);
        }
        // ProseMirror 在处理连续空格时使用的是 &nbsp;
        // 但是 PPT 会把 &nbsp; 当成普通的字符串，所以这里要替换掉
        rootNode.content = rootNode.content.replace(/\&nbsp;/g, ' ');
        result.push(rootNode);
    });
    return clone(result);
};
function recursivelyGenerateTree(ids, nodes) {
    const result = [];
    if (ids.length > 0) {
        ids.forEach(id => {
            const currentNode = nodes[id];
            currentNode.content = currentNode.content.replace(/\&nbsp;/g, ' ');
            result.push(currentNode);
            if (currentNode.childrenIds.length > 0) {
                currentNode.children = [];
                currentNode.children = currentNode.children.concat(recursivelyGenerateTree(currentNode.childrenIds, nodes));
            }
        });
    }
    return result;
}
function configurePPTTemplate(pptx, slideBG) {
    let backgroundPath = '';
    if (slideBG) {
        backgroundPath = `${slideBG}.jpeg`;
    }
    else {
        backgroundPath = getRandomBackgroundImageURL();
    }
    pptx.defineSlideMaster({
        title: SlideMaster.MainBG,
        background: {
            path: backgroundPath,
        },
    });
    pptx.defineSlideMaster({
        title: SlideMaster.BlurBG,
        background: {
            path: backgroundPath.replace(/\.jpeg$/, '-blur.jpeg'),
        },
    });
}
function getRandomBackgroundImageURL() {
    const imageQuantity = UNSPLASH_COLLECTION.length - 1;
    const randomNumber = random(imageQuantity);
    const result = `${UNSPLASH_COLLECTION[randomNumber]}.jpeg`;
    return result;
}
function configurePPTHomePage(pptx, fileName) {
    const page = pptx.addSlide({
        masterName: SlideMaster.MainBG,
        transition: true,
        transitionType: 'Fade',
    });
    setPageCenterText({
        text: fileName,
        page,
        fontSize: 40,
        bold: true,
        color: '#FFFFFF',
    });
    return page;
}
function setPageCenterText({ page, fontSize, text, bold, color, }) {
    page.addText(text, {
        h: '50%',
        w: '50%',
        x: '25%',
        y: '25%',
        fontSize,
        align: 'center',
        bold,
        color,
    });
}
function configurePPTTitleNumberPage(pptx, serialNumber, treeData) {
    const cycles = treeData.length;
    const page = pptx.addSlide({
        masterName: SlideMaster.BlurBG,
        transition: true,
        transitionType: 'Circle',
    });
    let yPositionIndex = 0;
    const getYPosition = (yPositionIndex, serialNumber) => {
        if (cycles < 3) {
            return '45.5%';
        }
        else if (cycles < 5) {
            if (yPositionIndex === 1) {
                return '20%';
            }
            else {
                return '60%';
            }
        }
        else {
            return `${10 + 30 * (yPositionIndex - 1 - Math.floor((serialNumber - 1) / 2))}%`;
        }
    };
    for (let index = 1; index <= cycles; index++) {
        if (index % 2 === 1) {
            yPositionIndex++;
        }
        const positionMap = ['55%', '5%'];
        const textArr = getDisplayTextContent({
            content: treeData[index - 1].content,
        });
        const text = textArr[0]?.text && textArr[0]?.text.length >= 50
            ? `${textArr[0]?.text?.substring(0, 50)}...`
            : textArr[0]?.text;
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
        });
    }
    if (treeData[serialNumber - 1].childrenIds.length > 0) {
        setTheSubtitleNumberOfTheTopLevelTitle({
            page,
            pptx,
            numberOfChildren: treeData[serialNumber - 1].childrenIds.length,
            offset: 40,
        });
    }
    return page;
}
function setSerialNumberAndTitleOfTheMenuPage({ page, pptx, titleText, textArr, textWidth = '60%', cYNumber = '45%', cXNumber = '10%', textColor = '#FFFFFF', }) {
    setCircularNumberTitle({
        page,
        pptx,
        text: titleText,
        color: textColor,
        fontSize: 12,
        x: `${typeof cXNumber === 'string' ? parseInt(cXNumber, 10) : 10}%`,
        y: cYNumber,
    });
    setParagraphTextContent({
        page,
        textArr,
        w: textWidth,
        h: 0.6,
        fontSize: 18,
        color: textColor,
        x: `${typeof cXNumber === 'string' ? parseInt(cXNumber, 10) + 10 : 10}%`,
        y: cYNumber,
    });
}
function setCircularNumberTitle({ page, pptx, fontSize = 12, text, graphicColor = '#678eff', transparency = 0, color, h = 0.6, w = 0.6, x, y = '85%', }) {
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
    });
}
function traverseTreeDataToGeneratePPTPage({ pptx, treeData, depth, currentSerialNumber, }) {
    return Promise.all(treeData?.map(async (node, index) => {
        if (depth === 1) {
            configurePPTTitleNumberPage(pptx, index + 1, clone(treeData));
        }
        const page = pptx.addSlide({
            masterName: SlideMaster.BlurBG,
            transition: true,
            transitionType: 'Morph',
        });
        currentSerialNumber = generateSequenceNumbersInMoreDepth(depth, index, currentSerialNumber);
        // 核心代码
        setTitleAndTextPositionBasedOnHierarchy({
            page,
            pptx,
            currentSerialNumber,
            depth,
            node,
            index,
        });
        if (node.images && node.images.length) {
            // 核心代码
            await setNotesIllustration({
                images: node.images,
                page,
                depth,
            });
        }
        if (depth === 1 && node.childrenIds.length > 0) {
            // 核心代码
            setTheSubtitleNumberOfTheTopLevelTitle({
                page,
                pptx,
                numberOfChildren: node.childrenIds.length,
            });
        }
        if (node.children && node.children.length > 0) {
            await traverseTreeDataToGeneratePPTPage({
                pptx,
                treeData: node.children,
                depth: depth + 1,
                currentSerialNumber,
            });
        }
    }));
}
function generateSequenceNumbersInMoreDepth(depth, index, currentSerialNumber) {
    if (depth === 1) {
        return index < 9 ? `0${index + 1}` : `${index + 1}`;
    }
    else if (depth === 2) {
        return `${index + 1}.`;
    }
    else if (depth === 3) {
        return `${parseInt(currentSerialNumber, 10)}.${index + 1}`;
    }
    else if (depth === 4) {
        return currentSerialNumber;
    }
    return '';
}
function setTitleAndTextPositionBasedOnHierarchy({ currentSerialNumber, depth, pptx, page, node, index, }) {
    const textArr = getDisplayTextContent({ content: node.content });
    const textWidth = determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(node.images);
    if (depth <= 2) {
        setCircularTitleAndText({
            page,
            pptx,
            titleText: currentSerialNumber,
            textArr,
            textWidth,
            timing: depth === 2 || index > 0,
        });
    }
    else if (depth === 3) {
        setTheTitleAndTextPositionOfTheThirdLevel({
            page,
            pptx,
            titleText: currentSerialNumber,
            textArr,
            textWidth,
        });
    }
    else if (depth === 4) {
        setTheTitleAndTextPositionOfTheFourthLayer({
            page,
            pptx,
            textArr,
            textWidth,
            subtitle: currentSerialNumber,
            headline: `${index + 1}`,
        });
    }
    else {
        setTitleAndTextPositionAfterLevelFive({
            page,
            pptx,
            textArr,
            textWidth,
        });
    }
}
function getDisplayTextContent({ content, }) {
    const parsers = new HTMLStringParser(content).getRoots();
    const textStyleType = '';
    const textColor = {
        style: '',
    };
    return getTextContentRecursively(parsers, textStyleType, textColor);
}
function determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(images) {
    return images && images.length ? '32%' : '70%';
}
function setCircularTitleAndText({ page, pptx, titleText, textArr, textWidth = '60%', cYNumber = '45%', cXNumber = '10%', textColor = '#FFFFFF', timing = false, }) {
    setCircularNumberTitle({
        page,
        pptx,
        text: titleText,
        color: textColor,
        fontSize: 12,
        x: cXNumber,
        y: cYNumber,
    });
    setParagraphTextContent({
        page,
        textArr,
        w: textWidth,
        color: textColor,
        timing,
    });
}
function setTheTitleAndTextPositionOfTheThirdLevel({ pptx, page, titleText, textArr, textWidth, }) {
    page.addText(titleText, {
        y: '47.5%',
        x: '10%',
        color: '#FFFFFF',
        fontSize: 12,
        h: 0.3,
        w: 0.5,
    });
    setSmallDots({
        page,
        pptx,
    });
    setParagraphTextContent({
        textArr,
        w: textWidth,
        page,
        timing: true,
    });
}
function setTheTitleAndTextPositionOfTheFourthLayer({ page, pptx, subtitle, textArr, textWidth, headline, }) {
    page.addText(subtitle, {
        y: '47.5%',
        x: '5%',
        color: '#FFFFFF',
        fontSize: 12,
        h: 0.3,
        w: 0.5,
    });
    setCircularTitleAndText({
        page,
        pptx,
        titleText: headline,
        textArr,
        textWidth,
        timing: true,
    });
}
function setSmallDots({ page, pptx, x = '15%', y = '49.2%', }) {
    setCircularNumberTitle({
        page,
        pptx,
        text: '',
        color: '#FFFFFF',
        h: 0.1,
        w: 0.1,
        x,
        y,
    });
}
function setTitleAndTextPositionAfterLevelFive({ pptx, page, textArr, textWidth, }) {
    setSmallDots({
        page,
        pptx,
    });
    setParagraphTextContent({
        textArr,
        w: textWidth,
        page,
        timing: true,
    });
}
function setParagraphTextContent({ page, textArr, fontSize = 32, color = '#FFFFFF', w = '60%', h = '90%', y = '5%', x = '18%', timing = false, }) {
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
    });
}
function getTextContentRecursively(parsers, textStyleType, textColor) {
    let result = [];
    parsers.forEach(parser => {
        if (parser.name === TextStyle.br) {
            // 换行标签
            result.push({
                text: '',
                options: {
                    breakLine: true,
                },
            });
        }
        if (parser.parent === null && parser.text) {
            // 顶级节点的纯文本
            result.push({ text: parser.text });
        }
        if (parser.parent !== null && parser.text) {
            let color;
            if (textStyleType.includes(TextStyle.span)) {
                if (textColor.style.includes('#')) {
                    color = `#${textColor.style.split('#')[1].toLowerCase()}`;
                }
                else {
                    const [r, g, b] = convertColorToRGBArray(textColor.style);
                    color = rgbToHex(r, g, b);
                }
            }
            // 非顶级节点的纯文本 给每一小段文字设置样式
            const text = {
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
            };
            result.push(text);
        }
        if (parser.name) {
            textStyleType += `${TextStyle[parser.name]}*`;
        }
        if (parser.attrs && parser.attrs.style) {
            textColor = { style: parser.attrs.style };
        }
        if (parser.children && parser.children.length > 0) {
            result = result.concat(getTextContentRecursively(parser.children, textStyleType, textColor));
        }
    });
    return result;
}
function getSizeAndPositionOfImageBasedOnQuantityAndIndex(quantity, index, depth, width, height) {
    const IMAGE_PANEL_HEIGHT = 80;
    const IMAGE_PANEL_WIDTH = IMAGE_PANEL_HEIGHT * (9 / 16) - (depth === 1 ? 8 : 0);
    const effect = quantity < 5 ? 'Fade' : 'Switch';
    let w;
    let h;
    let x;
    let y;
    if (quantity === 2) {
        x = 50;
        y = index > 0 ? 51 : 10;
        w = IMAGE_PANEL_WIDTH;
        h = IMAGE_PANEL_HEIGHT / 2 - 1;
    }
    else if (quantity === 3) {
        if (index < 2) {
            y = 10;
            w = IMAGE_PANEL_WIDTH / 2 - 1;
            x = index === 0 ? 50 : 50 + w + 2;
        }
        else {
            x = 50;
            y = 51;
            w = IMAGE_PANEL_WIDTH;
        }
        h = IMAGE_PANEL_HEIGHT / 2 - 1;
    }
    else if (quantity === 4) {
        w = IMAGE_PANEL_WIDTH / 2 - 1;
        h = IMAGE_PANEL_HEIGHT / 2 - 1;
        x = index % 2 === 0 ? 50 : 50 + w + 2;
        y = index < 2 ? 10 : 51;
    }
    else {
        x = 50;
        y = 10;
        w = IMAGE_PANEL_WIDTH;
        h = IMAGE_PANEL_HEIGHT;
    }
    if (width / height > (w * 16) / 9 / h) {
        const containerHeight = h;
        h = (((w * 16) / 9) * height) / width;
        y += (containerHeight - h) / 2;
    }
    else {
        const containerWidth = w;
        w = (((h * 9) / 16) * width) / height;
        x += (containerWidth - w) / 2;
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
    };
}
function setNotesIllustration({ images, page, depth, }) {
    const imageCount = images.length;
    return getImageURLInNote(images).then(images => {
        return Promise.all(images.map(async (url, index) => {
            const imageData = await imageToBase64URL(url);
            if (imageData.dataURL !== '') {
                page.addImage({
                    data: imageData.dataURL,
                    ...getSizeAndPositionOfImageBasedOnQuantityAndIndex(imageCount, index, depth, imageData.img.naturalWidth, imageData.img.naturalHeight),
                });
            }
        }));
    });
}
function setTheSubtitleNumberOfTheTopLevelTitle({ numberOfChildren, page, pptx, offset = 0, }) {
    const quantity = Math.min(numberOfChildren, INDICATOR_MAX_QUANTITY);
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
            y: `${getPositionYBasedOnQuantityAndIndex(quantity, index - 1) -
                HALF_THE_WIDTH_OF_THE_DOT}%`,
            w: 0.5,
            h: 0.5,
        });
    }
}
// 按照宽高比 16:9 运用三角函数计算 X 轴偏移位置
function getOffsetXBasedOnQuantityAndIndex(quantity, index) {
    if (quantity === INDICATOR_MAX_QUANTITY) {
        return (80 *
            Math.cos(((Math.atan2(3.5, 16 * 0.8) * 2) / (INDICATOR_MAX_QUANTITY - 2)) *
                Math.abs(index - (INDICATOR_MAX_QUANTITY - 2) / 2)) +
            10);
    }
    else {
        return (80 *
            Math.cos(((Math.atan2(3.5, 16 * 0.8) * 2) / (quantity - 1)) *
                Math.abs(index - (quantity - 1) / 2)) +
            10);
    }
}
// 按照宽高比 16:9 运用三角函数计算 Y 轴偏移位置
function getPositionYBasedOnQuantityAndIndex(quantity, index) {
    if (quantity === INDICATOR_MAX_QUANTITY) {
        return (((16 *
            0.8 *
            Math.sin(((Math.atan2(3.5, 16 * 0.8) * 2) / (INDICATOR_MAX_QUANTITY - 2)) *
                (index - (INDICATOR_MAX_QUANTITY - 2) / 2))) /
            9 +
            0.5) *
            100);
    }
    else {
        return (((16 *
            0.8 *
            Math.sin(((Math.atan2(3.5, 16 * 0.8) * 2) / (quantity - 1)) *
                (index - (quantity - 1) / 2))) /
            9 +
            0.5) *
            100);
    }
}
async function getImageURLInNote(images) {
    const imageURLS = images.map(async (image) => {
        if (image.type === 'httpLink') {
            return image.data.link;
        }
        return (await fileService.getPreviewLink(image.data)) || '';
    });
    let previewUrls = [];
    try {
        previewUrls = await Promise.all(imageURLS);
    }
    catch {
        // TODO: 这里有没有什么事情可以做
    }
    return previewUrls;
}
function imageToBase64URL(URL) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        if (!ctx) {
            return;
        }
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve({ dataURL, img });
        };
        img.onerror = event => {
            console.error('imageToBase64URL error: image load failed with URL', URL, event);
            resolve({ dataURL: '', img });
        };
        img.src = URL;
    });
}
function rgbToHex(r, g, b) {
    return ('#' +
        [r, g, b]
            .map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        })
            .join(''));
}
function convertColorToRGBArray(color) {
    const regex = /[0-9]{1,3}/g;
    return color.match(regex)?.map(Number) || [0, 0, 0];
}
