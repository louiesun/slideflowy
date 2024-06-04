import './ImageViewer.scss';
import classNames from 'classnames';
import IconClose from './icon_close.svg';
import IconPrev from './icon_image_preview_prev.svg';
import IconNext from './icon_image_preview_next.svg';
import IconZoomIn from './icon_zoom_in.svg';
import IconZoomOut from './icon_zoom_out.svg';
import IconReset from './icon_reset.svg';
import { useCallback, useRef } from 'react';
import throttle from 'lodash/throttle';
const ZOOM_STEP = 0.4;
const ZOOM_MAX = '3';
const ZOOM_MIN = '0.2';
export const ImageViewer = (props) => {
    const { isViewingImg, hideImgViewer, imgRef, imgIndex, previewUrlsLength, prevImg, nextImg } = props;
    const transform = useRef({
        scale: 1,
        x: 0,
        y: 0,
    });
    const dragging = useRef(false);
    const updateImgTransform = () => {
        const { scale, x, y } = transform.current;
        if (imgRef.current) {
            imgRef.current.style.transition = 'none';
            if (imgRef.current.style.top === '50%') {
                imgRef.current.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(${scale})`;
            }
            else {
                imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            }
        }
    };
    const zoomIn = () => {
        if (transform.current.scale.toFixed(0) !== ZOOM_MAX) {
            transform.current.scale += ZOOM_STEP;
            updateImgTransform();
        }
    };
    const zoomOut = () => {
        if (transform.current.scale.toFixed(1) !== ZOOM_MIN) {
            transform.current.scale -= ZOOM_STEP;
            updateImgTransform();
        }
    };
    const reset = useCallback(() => {
        transform.current = {
            scale: 1,
            x: 0,
            y: 0,
        };
        updateImgTransform();
    }, []);
    const handleWheel = throttle((event) => {
        if (event.deltaY || event.deltaX) {
            // 优先使用纵轴的差值
            const delta = event.deltaY || event.deltaX;
            delta > 0 ? zoomOut() : zoomIn();
        }
    }, 20);
    const handleDragOnImg = (event) => {
        if (dragging.current && 'movementX' in event && 'movementY' in event) {
            // Safari 中鼠标拖拽 movement 值变化量较小，通过 webkitForce 属性可以区分是触摸板
            // 还是鼠标，鼠标拖拽将 movement 值按照设备像素密度放大倍数
            /* tslint:disable:no-string-literal */
            if ('webkitForce' in event && event['webkitForce'] === 0) {
                transform.current.x += event['movementX'] * window.devicePixelRatio;
                transform.current.y += event['movementY'] * window.devicePixelRatio;
            }
            else {
                transform.current.x += event['movementX'];
                transform.current.y += event['movementY'];
            }
            /* tslint:disable:no-string-literal */
            updateImgTransform();
        }
    };
    const handleHideEvent = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();
        reset();
        hideImgViewer();
    }, [reset]);
    return (React.createElement("div", { className: classNames('img-viewer', isViewingImg ? 'show' : 'hide'), onClick: (event) => {
            event.stopPropagation();
        }, onWheel: (event) => {
            event.persist();
            handleWheel(event);
        } },
        React.createElement("div", { className: "close", onClick: handleHideEvent },
            React.createElement(IconClose, { key: "icon-close", className: "icon icon-close" })),
        React.createElement("div", { className: `prev ${imgIndex !== 0 ? 'visible' : ''}`, onClick: prevImg },
            React.createElement(IconPrev, { width: '56px', height: '56px' })),
        React.createElement("div", { className: "img-viewer-container" },
            React.createElement("img", { draggable: false, ref: imgRef, onMouseDown: () => {
                    dragging.current = true;
                }, onMouseMove: handleDragOnImg, onMouseUp: () => {
                    dragging.current = false;
                }, onMouseLeave: () => {
                    dragging.current = false;
                }, 
                // 每次图片变更都重置一下
                onLoad: reset })),
        React.createElement("div", { className: `next ${imgIndex !== previewUrlsLength - 1 ? 'visible' : ''}`, onClick: nextImg },
            React.createElement(IconNext, { width: '56px', height: '56px' })),
        React.createElement("div", { className: 'scale' },
            React.createElement("div", { className: 'zoom-in' },
                React.createElement(IconZoomIn, { onClick: zoomIn, width: '20px', height: '20px' })),
            React.createElement("div", { className: 'zoom-out' },
                React.createElement(IconZoomOut, { onClick: zoomOut, width: '20px', height: '20px' })),
            React.createElement("div", { className: 'reset' },
                React.createElement(IconReset, { onClick: reset, width: '20px', height: '20px' }))),
        React.createElement("div", { className: classNames('img-viewer-mask') })));
};
