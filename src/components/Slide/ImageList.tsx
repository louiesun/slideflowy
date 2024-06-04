import './ImageList.scss';
import { useCallback, useEffect, useState } from 'react';
import { c } from '../../utils/css';
import classNames from 'classnames';
import { DeferredPromise } from '../../utils/DeferredPromise';
const clsName = 'SlideImageList';
const cls = c(clsName);
export const ImageList = (props) => {
    const [previewUrls, setPreviewUrl] = useState([]);
    const map = new Map();
    const imageResponse = (event) => {
        if (event.data.type === 'IMAGE_RESPONSE' &&
            map.has(event.data.body.relativePath)) {
            const res = event.data.body.url;
            const deferred = map.get(event.data.body.relativePath);
            deferred.resolve(res);
        }
    };
    const fetchUrls = useCallback(async (images) => {
        if (props.previewUrls.length > 0) {
            setPreviewUrl(props.previewUrls);
            return;
        }
        const mediumsPromise = images.map(async (i) => {
            if (i.type === 'httpLink')
                return i.data.link;
            const deferred = new DeferredPromise();
            map.set(i.data.relativePath, deferred);
            window.opener.postMessage({
                type: 'REQUEST_IMAGE',
                body: {
                    data: i.data,
                    relativePath: i.data.relativePath,
                },
            }, window.location.origin);
            return await deferred.promise.then((value) => {
                return value;
            });
        });
        // 等待所有的图片链接获取完成
        const previewUrls = await Promise.all(mediumsPromise).catch(() => []);
        setPreviewUrl(previewUrls);
    }, [props.previewUrls, setPreviewUrl]);
    const clickOnImage = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();
        const img = event.currentTarget;
        const imgViewer = props.imgViewerRef.current;
        const canvas = props.canvasRef.current;
        if (imgViewer && canvas) {
            const rect = img.getBoundingClientRect();
            imgViewer.onload = () => {
                // 等到图片加载完成再展示，保证动画效果
                // 同时保存图片列表和当前预览图片的下标，方便前后切换
                props.startViewImg(previewUrls, previewUrls.findIndex((url) => img.src.indexOf(url) > -1));
                imgViewer.style.opacity = '1';
                imgViewer.style.transitionDuration = '0.3s';
                setTimeout(() => {
                    if (canvas.clientWidth >= img.naturalWidth &&
                        canvas.clientHeight >= img.naturalHeight) {
                        imgViewer.style.width = `${img.naturalWidth}px`;
                        imgViewer.style.height = `${img.naturalHeight}px`;
                        imgViewer.style.top = `${(canvas.clientHeight - img.naturalHeight) / 2}px`;
                        imgViewer.style.left = `${(canvas.clientWidth - img.naturalWidth) / 2}px`;
                    }
                    else {
                        if (canvas.clientWidth / img.naturalWidth >
                            canvas.clientHeight / img.naturalHeight) {
                            const width = (img.naturalWidth * canvas.clientHeight) / img.naturalHeight;
                            imgViewer.style.width = `${width}px`;
                            imgViewer.style.height = `${canvas.clientHeight}px`;
                            imgViewer.style.top = '0';
                            imgViewer.style.left = `${(canvas.clientWidth - width) / 2}px`;
                        }
                        else {
                            const height = (img.naturalHeight * canvas.clientWidth) / img.naturalWidth;
                            imgViewer.style.width = `${canvas.clientWidth}px`;
                            imgViewer.style.height = `${height}px`;
                            imgViewer.style.top = `${(canvas.clientHeight - height) / 2}px`;
                            imgViewer.style.left = '0';
                        }
                    }
                });
                // 宽高和位置变化完成后，重置 top left transform 以便衔接后续 transform 变化
                imgViewer.ontransitionend = () => {
                    imgViewer.style.transitionDuration = '0s';
                    imgViewer.style.top = '50%';
                    imgViewer.style.left = '50%';
                    imgViewer.style.transform = 'translate(-50%, -50%)';
                    imgViewer.ontransitionend = null;
                    setTimeout(() => {
                        imgViewer.style.transitionDuration = '0.3s';
                    });
                };
            };
            imgViewer.src = img.src;
            imgViewer.style.width = `${img.width}px`;
            imgViewer.style.height = `${img.height}px`;
            imgViewer.style.transform = 'none';
            if (props.verticalFit) {
                imgViewer.style.top = `${rect.top / props.scale}px`;
                imgViewer.style.left = `${(rect.left -
                    (window.innerWidth - canvas.clientWidth * props.scale) / 2) /
                    props.scale}px`;
            }
            else {
                imgViewer.style.top = `${(rect.top -
                    (window.innerHeight - canvas.clientHeight * props.scale) / 2) /
                    props.scale}px`;
                imgViewer.style.left = `${rect.left / props.scale}px`;
            }
        }
    }, [previewUrls, props.scale, props.verticalFit]);
    useEffect(() => {
        window.addEventListener('message', imageResponse, false);
        return () => {
            window.removeEventListener('message', imageResponse, false);
        };
    }, [props.images]);
    useEffect(() => {
        void fetchUrls(props.images);
    }, [props.images]);
    return (React.createElement("div", { className: classNames(clsName, props.className) },
        React.createElement("div", { className: cls('-container', { withText: props.withText }, { multiImage: props.images.length > 1 }, { moreThan2: props.images.length > 2 }, { moreThan3: props.images.length > 3 }, { moreThan4: props.images.length > 4 }) }, previewUrls.map((url, index) => {
            // url 是有可能重复的，所以我们加一个 index 再作为 key
            const key = url + index;
            return React.createElement("img", { key: key, src: url, onClick: clickOnImage });
        }))));
};
