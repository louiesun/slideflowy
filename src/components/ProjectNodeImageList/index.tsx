import { useState, useCallback, useRef, useEffect, useMemo, useImperativeHandle, useContext, } from 'react';
import { css } from 'astroturf';
import throttle from 'lodash/throttle';
import { useInject } from '../../utils/di';
import { c } from '../../utils/css';
import { $t } from '../../i18n';
import { Notification } from '../../utils/Notification';
import { FileService } from '../../services/FileService';
import { useDocumentEvent } from '../../utils/R';
import { ImagePreviewModalContext } from '../ImagePreviewModalContext';
import { ProjectNodeImageListItemPopover } from './ProjectNodeImageListItemPopover';
const clsName = 'ProjectNodeImageList';
const cls = c(clsName);
const Mask = ({ selected }) => {
    return (React.createElement("div", { style: {
            display: selected ? 'block' : 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(189, 211, 247, 0.4)'
        } }));
};
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
        if (props.fromMindMap) {
            window.parent?.postMessage({
                type: 'image',
                imageData: {
                    id: props.node.id,
                    ...images[0].data,
                },
            }, location.origin);
        }
        else {
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
        }
    }, [setPreviewUrl]);
    const previewImg = async (index) => {
        // 创建一个微任务就能实现在 modal 显示之前将图片用新的 url 加载完成
        await setUrls?.(previewUrls);
        await setCurrentImageUrl?.(previewUrls[index]);
        setImagePreviewModalVisible?.(true);
    };
    const onMoveUpImage = (index) => {
        props.onMoveUpImage(props.node.id, index);
    };
    const onMoveDownImage = (index) => {
        props.onMoveDownImage(props.node.id, index);
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setImagePreviewModalVisible?.(false);
        }
    };
    useEffect(() => {
        if (props.node.imagePreviewUrls) {
            setPreviewUrl(props.node.imagePreviewUrls);
        }
        else if (props.node.images) {
            void fetchUrls(props.node.images);
        }
        else {
            setPreviewUrl([]);
        }
    }, [props.node.imagePreviewUrls, props.node.images, setPreviewUrl]);
    useEffect(() => {
        document.body.addEventListener('mouseup', childMouseUpEvent);
        return () => {
            document.body.removeEventListener('mouseup', childMouseUpEvent);
        };
    }, []);
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });
    return (React.createElement("div", { className: clsName }, previewUrls.map((url, index) => {
        // url 是有可能重复的，所以我们加一个 index 再作为 key
        const key = url + index;
        return props.isPreviewing ? (React.createElement(PreviewOnlyNodeImage, { key: key, url: url, index: index, node: props.node, selected: props.selected, previewImg: () => previewImg(index) })) : props.isSlideOpened || props.fromMindMap ? (React.createElement(PreviewImage, { key: key, url: url, index: index, node: props.node, selected: props.selected, postId: props.slideTabWindow, onChangeCurrentIndex: props.onChangeCurrentIndex })) : (React.createElement(EditableNodeImage, { key: key, url: url, index: index, node: props.node, selected: props.selected, isResizingImage: isResizingImage, setIsResizingImage: setIsResizingImage, canMoveUp: index !== 0, canMoveDown: index !== previewUrls.length - 1, onMoveUpImage: () => {
                onMoveUpImage(index);
            }, onMoveDownImage: () => {
                onMoveDownImage(index);
            }, onDeleteImage: props.onDeleteImage, onResizeImage: props.onResizeImage, childRef: childRef, previewImg: () => previewImg(index), storeImgUrl: props.storeImgUrl }));
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
                        body: props.node.id,
                    }, window.location.origin);
                    props.onChangeCurrentIndex(props.node.id);
                }
            } }),
        React.createElement(Mask, { selected: props.selected })));
}
function PreviewOnlyNodeImage(props) {
    const imageWidth = useMemo(() => getImageWidth(props.node, props.index), [
        props.node,
        props.index,
    ]);
    return (React.createElement("div", { className: cls(['-item']) },
        React.createElement("img", { className: cls(['-preview-img']), style: imageWidth ? { width: imageWidth } : {}, onClick: props.previewImg, onDoubleClick: props.previewImg, src: props.url }),
        React.createElement(Mask, { selected: props.selected })));
}
function EditableNodeImage(props) {
    const { isResizingImage, setIsResizingImage, childRef, previewImg } = props;
    const [lastPosition, setLastPosition] = useState(0);
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
    const onDownloadImage = () => {
        const a = document.createElement('a');
        a.href = props.url;
        a.download = 'image.png';
        a.click();
        Notification.show({ text: $t('NUTFLOWY_DOWNLOADING') });
    };
    const onCopyImage = async () => {
        try {
            if (navigator.clipboard) {
                const blob = await toPngBlob(props.url);
                const clipboardItems = [
                    new ClipboardItem({
                        [blob.type]: blob,
                    }),
                ];
                await navigator.clipboard.write(clipboardItems);
            }
            else {
                const base64 = await toPngBase64(props.url);
                const img = new Image();
                img.src = base64;
                document.body.appendChild(img);
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    selection.removeAllRanges();
                }
                const range = document.createRange();
                range.selectNode(img);
                selection?.addRange(range);
                document.execCommand('copy');
                selection?.removeAllRanges();
                document.body.removeChild(img);
            }
            Notification.show({ text: $t('NUTFLOWY_COPY_SUCCEED') });
        }
        catch (error) {
            Notification.show({ text: $t('NUTFLOWY_COPY_FAILED') });
            console.error(error);
        }
        async function toPngBlob(url) {
            let img = new Image();
            let c = document.createElement('canvas');
            try {
                return await new Promise((resolve, reject) => {
                    img.onload = () => {
                        if (!img || !c) {
                            reject(new Error(`Failed to convert image, image url:${url}`));
                            return;
                        }
                        const ctx = c.getContext('2d');
                        if (!ctx) {
                            reject(new Error('ctx is null'));
                            return;
                        }
                        c.width = img.width;
                        c.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        c.toBlob(blob => {
                            if (!blob) {
                                reject(new Error(`Failed to convert image, image url:${url}`));
                                return;
                            }
                            resolve(blob);
                        }, 'image/png');
                    };
                    img.onerror = () => reject(new Error(`Image load failed`));
                    img.src = url;
                });
            }
            finally {
                img = null;
                c = null;
            }
        }
        async function toPngBase64(url) {
            let img = new Image();
            let c = document.createElement('canvas');
            try {
                return await new Promise((resolve, reject) => {
                    img.onload = () => {
                        if (!img || !c) {
                            reject(new Error(`Failed to convert image, image url:${url}`));
                            return;
                        }
                        const ctx = c.getContext('2d');
                        if (!ctx) {
                            reject(new Error('ctx is null'));
                            return;
                        }
                        c.width = img.width;
                        c.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        resolve(c.toDataURL('image/png'));
                    };
                    img.onerror = () => reject(new Error(`Image load failed`));
                    img.src = url;
                });
            }
            finally {
                img = null;
                c = null;
            }
        }
    };
    const renderPopoverTrigger = () => (React.createElement("div", { tabIndex: 0, className: cls(['-item']), onFocus: () => {
            props.storeImgUrl(props.node.id, props.url);
        }, onKeyDownCapture: e => {
            if (e.key === 'Backspace') {
                props.onDeleteImage(props.node.id, props.index);
            }
        } },
        React.createElement("img", { className: cls(['-preview-img']), ref: imgRef, onDoubleClick: previewImg, style: imageWidth ? { width: imageWidth } : {}, src: props.url }),
        React.createElement("div", { className: cls(['-action']), onMouseDown: onStartResizingImage }),
        React.createElement(Mask, { selected: props.selected })));
    return (React.createElement(ProjectNodeImageListItemPopover, { imgRef: imgRef, canMoveUp: props.canMoveUp, canMoveDown: props.canMoveDown, onPreviewImage: previewImg, onCopyImage: onCopyImage, onDownloadImage: onDownloadImage, onMoveUpImage: props.onMoveUpImage, onMoveDownImage: props.onMoveDownImage, onDeleteImage: () => {
            props.onDeleteImage(props.node.id, props.index);
        }, renderPopoverTrigger: renderPopoverTrigger }));
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
      border: 2px solid transparent;
      margin-bottom: 4px;

      &:focus {
        outline: none;
        border-color: #107FFC;

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
      width: 12px;
      height: 12px;
      position: absolute;
      right: -6px;
      bottom: -6px;
      background: white;
      border: 2px solid #107FFC;
      border-radius: 6px;
      cursor: pointer;
    }
  }
`;
