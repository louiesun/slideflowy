import { useState, useCallback, useRef, useEffect, useMemo, useImperativeHandle, useContext, } from 'react';
import { css } from 'astroturf';
import throttle from 'lodash/throttle';
import IconDrag from './icon_drag.svg';
import IconPreview from './icon_preview.svg';
import IconDelete from './icon_delete.svg';
import { useInject } from '../../utils/di';
import { c } from '../../utils/css';
import { FileService } from '../../services/FileService';
import { useDocumentEvent } from '../../utils/R';
import { ImagePreviewModalContext } from '../ImagePreviewModalContext';
const clsName = 'ProjectNodeImageList';
const cls = c(clsName);
export const ProjectNodeImageList = (props) => {
    const [previewUrls, setPreviewUrl] = useState([]);
    const [isResizingImage, setIsResizingImage] = useState(false);
    const childRef = useRef();
    const imagePreviewContextValue = useContext(ImagePreviewModalContext);
    const { setUrls, setVisible: setImagePreviewModalVisible, setUrl: setCurrentImageUrl, } = imagePreviewContextValue;
    const childMouseUpEvent = () => {
        if (childRef.current) {
            childRef.current.childMouseUpEvent();
        }
    };
    const fileService = useInject(FileService);
    const fetchUrls = useCallback(async (images) => {
        const mediumsPromise = images.map(async (i) => {
            if (i.type === 'httpLink')
                return i.data.link;
            // 图片获取失败暂时只展示无效图片
            return (await fileService.getPreviewLink(i.data)) || '';
        });
        // 等待所有的图片链接获取完成
        try {
            const previewUrls = await Promise.all(mediumsPromise);
            setPreviewUrl(previewUrls);
        }
        catch {
            // TODO: 这里有没有什么事情可以做
        }
    }, [setPreviewUrl]);
    const previewImg = async (index) => {
        // 创建一个微任务就能实现在 modal 显示之前将图片用新的 url 加载完成
        await setUrls?.(previewUrls);
        await setCurrentImageUrl?.(previewUrls[index]);
        setImagePreviewModalVisible?.(true);
    };
    useEffect(() => {
        if (props.node.images) {
            void fetchUrls(props.node.images);
        }
        else {
            setPreviewUrl([]);
        }
    }, [props.node.images, setPreviewUrl]);
    useEffect(() => {
        document.body.addEventListener('mouseup', childMouseUpEvent);
        return () => {
            document.body.removeEventListener('mouseup', childMouseUpEvent);
        };
    }, []);
    return (React.createElement("div", { className: clsName }, previewUrls.map((url, index) => {
        // url 是有可能重复的，所以我们加一个 index 再作为 key
        const key = url + index;
        return props.isPreviewing ? (React.createElement(PreviewOnlyNodeImage, { key: key, url: url, index: index, node: props.node, previewImg: () => previewImg(index) })) : props.isSlideOpened ? (React.createElement(PreviewImage, { key: key, url: url, index: index, node: props.node, postId: props.slideTabWindow, onChangeCurrentIndex: props.onChangeCurrentIndex })) : (React.createElement(EditableNodeImage, { key: key, url: url, index: index, node: props.node, isResizingImage: isResizingImage, setIsResizingImage: setIsResizingImage, onDeleteImage: props.onDeleteImage, onResizeImage: props.onResizeImage, childRef: childRef, previewImg: () => previewImg(index), focusCtx: props.focusCtx }));
    })));
};
// 播放slide时图片节点显示
function PreviewImage(props) {
    const imageWidth = useMemo(() => getImageWidth(props.node, props.index), [
        props.node,
        props.index,
    ]);
    return (React.createElement("div", { className: cls(['-item']) },
        React.createElement("img", { className: cls(['-preview-img']), style: imageWidth ? { width: imageWidth } : {}, src: props.url, onClick: () => {
                if (props.postId !== null) {
                    props.postId.postMessage({
                        type: 'CURRENT_INDEX',
                        body: 'props.node.id',
                    }, window.location.origin);
                    props.onChangeCurrentIndex(props.node.id);
                }
            } })));
}
function PreviewOnlyNodeImage(props) {
    const imageWidth = useMemo(() => getImageWidth(props.node, props.index), [
        props.node,
        props.index,
    ]);
    return (React.createElement("div", { className: cls(['-item']) },
        React.createElement("img", { className: cls(['-preview-img']), style: imageWidth ? { width: imageWidth } : {}, onClick: props.previewImg, onDoubleClick: props.previewImg, src: props.url })));
}
function EditableNodeImage(props) {
    const { isResizingImage, setIsResizingImage, childRef, previewImg } = props;
    const [lastPosition, setLastPosition] = useState(0);
    const [isFocusingImage, setIsFocusingImage] = useState(false);
    const [imageWidth, _setImageWidth] = useState(() => getImageWidth(props.node, props.index));
    const setImageWidth = useMemo(() => throttle((width) => _setImageWidth(width), 20), [_setImageWidth]);
    const imgRef = useRef(null);
    // 完成图片尺寸调整
    useDocumentEvent('mouseup', useCallback(() => {
        if (!lastPosition)
            return;
        setLastPosition(0);
        props.onResizeImage(props.node.id, props.index, imageWidth);
    }, [setLastPosition, props.onResizeImage, imageWidth]));
    // 进行图片尺寸调整
    useDocumentEvent('mousemove', useCallback((e) => {
        if (!isResizingImage)
            return;
        if (!imgRef.current)
            return;
        if (!lastPosition)
            return;
        setImageWidth(imgRef.current.clientWidth + (e.clientX - lastPosition) * 2);
        setLastPosition(e.clientX);
    }, [lastPosition, setLastPosition, setImageWidth]));
    const mouseUp = useCallback(() => {
        setIsResizingImage(false);
        if (!lastPosition)
            return;
        setLastPosition(0);
        props.onResizeImage(props.node.id, props.index, imageWidth);
    }, [setLastPosition, props.onResizeImage, imageWidth]);
    useImperativeHandle(childRef, () => ({
        childMouseUpEvent: () => {
            mouseUp();
        },
    }));
    const onStartResizingImage = useCallback((e) => {
        setIsResizingImage(true);
        e.preventDefault();
        setLastPosition(e.clientX);
    }, [setLastPosition]);
    const onWindowFocus = (event) => {
        if (event.target === window &&
            props.focusCtx.nodeId === props.node.id &&
            props.focusCtx.imgUrl === props.url) {
            setIsFocusingImage(true);
        }
    };
    useEffect(() => {
        window.addEventListener('focus', onWindowFocus);
        return () => {
            window.removeEventListener('focus', onWindowFocus);
        };
    });
    return (React.createElement("div", { tabIndex: 0, className: cls(['-item']), onFocus: () => {
            props.focusCtx.storeImgUrl(props.node.id, props.url);
            setIsFocusingImage(true);
        }, onBlur: () => {
            setIsFocusingImage(false);
        }, onKeyDownCapture: e => {
            if (e.key === 'Backspace' && isFocusingImage) {
                props.onDeleteImage(props.node.id, props.index);
            }
        } },
        React.createElement("img", { className: cls(['-preview-img']), ref: imgRef, onDoubleClick: previewImg, style: imageWidth ? { width: imageWidth } : {}, src: props.url }),
        React.createElement(IconDrag, { className: cls(['-dot', '-action']), onMouseDown: onStartResizingImage }),
        React.createElement(IconPreview, { className: cls(['-preview', '-action']), onClick: previewImg }),
        React.createElement(IconDelete, { className: cls(['-delete', '-action']), onClick: () => {
                props.onDeleteImage(props.node.id, props.index);
            } })));
}
// 图片默认宽度设置
function getImageWidth(node, index) {
    return node.images?.[index]?.width || 0;
}
css `
  .${clsName} {
    &-item {
      position: relative;
      display: block;
      width: fit-content;
      border: 1px dashed transparent;
      margin-bottom: 4px;

      &:focus {
        outline: none;
        border-color: #018dfb;

        .${clsName}-action {
          display: block;
        }
      }
    }

    &-preview-img {
      position: relative;
      display: block;
      max-width: 100%;
      max-height: 100%;
      min-width: 50px;
    }

    &-action {
      display: none;
      position: absolute;
      right: -12px;
      height: 24px;
      width: 24px;
      fill: #018dfb;
      cursor: pointer;
      background: transparent;
      z-index: 1;
    }

    &-dot {
      bottom: -12px;
    }

    &-preview {
      bottom: 20px;
    }

    &-delete {
      bottom: 52px;
    }
  }
`;
