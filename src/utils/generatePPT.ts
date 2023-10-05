import pptxgen from "pptxgenjs";
import { clone, } from 'ramda';
import { random } from 'lodash';
import { UNSPLASH_COLLECTION } from '../common/backgroundImagePath';
import { FileService } from '../services/FileService';
import { HTMLStringParser } from './HTMLStringParser';
const fileService = new FileService();
var SlideMaster;
(function (SlideMaster) {
    SlideMaster["SlideMasterName"] = "SlideMaster";
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
export const generatePPT = ({ nodes, rootNodeIds, fileName, slideBG }) => {
    // 大体的思路就是把一维的节点数据先递归转为树形数据，然后在递归树形数据，为每一个节点设置 PPT 页面和文字之类的。
    const treeData = generateNodeTree(nodes, rootNodeIds);
    const rootNodeNumber = treeData.length;
    const pptx = new pptxgen();
    // 配置 PPT 母版
    configurePPTTemplate(pptx, slideBG);
    // 配置 PPT 首页
    configurePPTHomePage(pptx, fileName);
    // 配置 PPT 第二页
    configurePPTTitleNumberPage(pptx, fileName, rootNodeNumber);
    // 递归生成 PPT 页面，核心代码
    traverseTreeDataToGeneratePPTPage({ treeData, pptx, depth: 1, currentSerialNumber: '00' });
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
        result.push(rootNode);
    });
    return clone(result);
};
function recursivelyGenerateTree(ids, nodes) {
    const result = [];
    if (ids.length > 0) {
        ids.forEach(id => {
            const currentNode = nodes[id];
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
        title: SlideMaster.SlideMasterName,
        background: {
            path: backgroundPath
        }
    });
}
function getRandomBackgroundImageURL() {
    const imageQuantity = UNSPLASH_COLLECTION.length - 1;
    const randomNumber = random(imageQuantity);
    const result = `${UNSPLASH_COLLECTION[randomNumber]}.jpeg`;
    return result;
}
function configurePPTHomePage(pptx, fileName) {
    const page = pptx.addSlide({ masterName: SlideMaster.SlideMasterName });
    setPageCenterText({
        text: fileName,
        page,
        fontSize: 40,
        bold: true,
        color: '#FFFFFF',
    });
    return page;
}
function setPageCenterText({ page, fontSize, text, bold, color }) {
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
function configurePPTTitleNumberPage(pptx, fileName, rootNodeNumber) {
    const HALF_THE_WIDTH_OF_THE_DOT = 3;
    const page = pptx.addSlide({ masterName: SlideMaster.SlideMasterName });
    page.addText(fileName, {
        h: '20%',
        w: '50%',
        x: '25%',
        y: '15%',
        fontSize: 40,
        bold: true,
        color: '#FFFFFF',
        align: 'center',
    });
    for (let index = 1; index <= rootNodeNumber; index++) {
        setCircularNumberTitle({
            page,
            pptx,
            text: index < 10 ? `0${index}` : `${index}`,
            color: '#FFFFFF',
            fontSize: 12,
            x: `${(setCenterPositionPercentageBasedOnQuantity(rootNodeNumber) * index) - HALF_THE_WIDTH_OF_THE_DOT}%`,
            y: '70%'
        });
    }
    return page;
}
function setCircularNumberTitle({ page, pptx, fontSize = 12, text, graphicColor = '#678eff', color, h = 0.6, w = 0.6, x, y = '85%' }) {
    page.addText(text, {
        shape: pptx.ShapeType.ellipse,
        fill: {
            color: graphicColor,
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
function traverseTreeDataToGeneratePPTPage({ pptx, treeData, depth, currentSerialNumber }) {
    treeData?.forEach((node, index) => {
        const page = pptx.addSlide({ masterName: SlideMaster.SlideMasterName });
        currentSerialNumber = generateSequenceNumbersInMoreDepth(depth, index, currentSerialNumber);
        // 核心代码
        setTitleAndTextPositionBasedOnHierarchy({
            page,
            pptx,
            currentSerialNumber,
            depth,
            node,
            index
        });
        if (node.images) {
            // 核心代码
            setNotesIllustration({
                images: node.images,
                page
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
            traverseTreeDataToGeneratePPTPage({
                pptx,
                treeData: node.children,
                depth: depth + 1,
                currentSerialNumber
            });
        }
    });
}
function generateSequenceNumbersInMoreDepth(depth, index, currentSerialNumber) {
    if (depth === 1) {
        return index < 10 ? `0${index + 1}` : `${index + 1}`;
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
function setTitleAndTextPositionBasedOnHierarchy({ currentSerialNumber, depth, pptx, page, node, index }) {
    const textArr = getDisplayTextContent({ content: node.content });
    const textWidth = determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(node.images);
    if (depth <= 2) {
        setCircularTitleAndText({
            page,
            pptx,
            titleText: currentSerialNumber,
            textArr,
            textWidth
        });
    }
    else if (depth === 3) {
        setTheTitleAndTextPositionOfTheThirdLevel({
            page,
            pptx,
            titleText: currentSerialNumber,
            textArr,
            textWidth
        });
    }
    else if (depth === 4) {
        setTheTitleAndTextPositionOfTheFourthLayer({
            page,
            pptx,
            textArr,
            textWidth,
            subtitle: currentSerialNumber,
            headline: `${index + 1}`
        });
    }
    else {
        setTitleAndTextPositionAfterLevelFive({
            page,
            pptx,
            textArr,
            textWidth
        });
    }
}
function getDisplayTextContent({ content, }) {
    const parsers = new HTMLStringParser(content).getRoots();
    const textStyleType = '';
    const textColor = {
        style: ''
    };
    return getTextContentRecursively(parsers, textStyleType, textColor);
}
function determineTheWidthOfTheTextBoxBasedOnWhetherThereIsAnIllustration(images) {
    return images ? '48%' : '60%';
}
function setCircularTitleAndText({ page, pptx, titleText, textArr, textWidth = '60%', cYNumber = '48.5%', cXNumber = '10%', textColor = '#FFFFFF', }) {
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
        color: textColor
    });
}
function setTheTitleAndTextPositionOfTheThirdLevel({ pptx, page, titleText, textArr, textWidth }) {
    page.addText(titleText, {
        y: "51.1%",
        x: "10%",
        color: '#FFFFFF',
        fontSize: 12,
        h: 0.3,
        w: 0.5
    });
    setSmallDots({
        page,
        pptx,
        y: "52.8%",
        x: "15%"
    });
    setParagraphTextContent({
        textArr,
        w: textWidth,
        page
    });
}
function setTheTitleAndTextPositionOfTheFourthLayer({ page, pptx, subtitle, textArr, textWidth, headline }) {
    page.addText(subtitle, {
        y: "51.1%",
        x: "5%",
        color: '#FFFFFF',
        fontSize: 12,
        h: 0.3,
        w: 0.5
    });
    setCircularTitleAndText({
        page,
        pptx,
        titleText: headline,
        textArr,
        textWidth
    });
}
function setSmallDots({ page, pptx, x, y }) {
    setCircularNumberTitle({ page, pptx, text: '', color: '#FFFFFF', h: 0.1, w: 0.1, x, y });
}
function setTitleAndTextPositionAfterLevelFive({ pptx, page, textArr, textWidth }) {
    setSmallDots({
        page,
        pptx,
        y: "52.8%",
        x: "15%"
    });
    setParagraphTextContent({
        textArr,
        w: textWidth,
        page
    });
}
function setParagraphTextContent({ page, textArr, color = '#FFFFFF', w = '60%', y = '44.5%', x = '18%', }) {
    // 为一大段文字设置一个公共样式
    page.addText(textArr, {
        x,
        y,
        color,
        fontSize: 12,
        h: 1,
        w,
        lineSpacingMultiple: 1.5
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
                    breakLine: true
                }
            });
        }
        if (parser.parent === null && parser.text) {
            // 顶级节点的纯文本
            result.push({ text: parser.text });
        }
        if (parser.parent !== null && parser.text) {
            let color;
            if (textStyleType.includes(TextStyle.span)) {
                const [r, g, b] = stringToRGBArray(textColor.style);
                color = rgbToHex(r, g, b);
            }
            // 非顶级节点的纯文本 给每一小段文字设置样式
            const text = {
                text: parser.text,
                options: {
                    bold: textStyleType.includes(TextStyle.strong),
                    italic: textStyleType.includes(TextStyle.em),
                    underline: textStyleType.includes(TextStyle.u) ? {
                        style: 'dashLong'
                    } : undefined,
                    hyperlink: textStyleType.includes(TextStyle.a) ? {
                        url: parser.text
                    } : undefined,
                    color,
                }
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
function setNotesIllustration({ images, page }) {
    const imageCount = images.length;
    const HALF_THE_IMAGE_HEIGHT = 15;
    void getImageURLInNote(images).then(images => {
        images.forEach((url, index) => {
            imageToBase64URL(url, (base64Url) => {
                page.addImage({
                    data: base64Url,
                    sizing: {
                        type: 'contain',
                        w: '30%',
                        h: '30%',
                    },
                    x: '60%',
                    y: `${(setCenterPositionPercentageBasedOnQuantity(imageCount) * (index + 1)) - HALF_THE_IMAGE_HEIGHT}%`,
                });
            });
        });
    });
}
function setTheSubtitleNumberOfTheTopLevelTitle({ numberOfChildren, page, pptx }) {
    const HALF_THE_WIDTH_OF_THE_DOT = 3;
    for (let index = 1; index <= numberOfChildren; index++) {
        setCircularNumberTitle({
            page,
            pptx,
            text: `${index}.`,
            color: '#FFFFFF',
            graphicColor: '#678eff',
            fontSize: 8,
            x: '85%',
            y: `${(setCenterPositionPercentageBasedOnQuantity(numberOfChildren) * index) - HALF_THE_WIDTH_OF_THE_DOT}%`,
            w: 0.5,
            h: 0.5
        });
    }
}
function setCenterPositionPercentageBasedOnQuantity(nodeNumber) {
    return (100 / (nodeNumber + 1));
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
function imageToBase64URL(URL, callback) {
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
        callback(dataURL);
    };
    img.src = URL;
}
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
function stringToRGBArray(color) {
    const regex = /[0-9]{1,3}/g;
    return color.match(regex)?.map(Number) || [0, 0, 0];
}
