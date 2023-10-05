import { Modal } from '../Modal';
import { createContext, useCallback, useRef, useState } from 'react';
import { c } from '../../utils/css';
import { css } from 'astroturf';
import IconClose from './icon_close.svg';
import IconPrev from './icon_prev.svg';
import IconNext from './icon_next.svg';
import IconZoomIn from './icon_zoom_in.svg';
import IconZoomOut from './icon_zoom_out.svg';
import IconReset from './icon_reset.svg';
import throttle from 'lodash/throttle';
const clsName = 'ImagePreviewModal';
const cls = c(clsName);
const ZOOM_STEP = 0.1;
const ZOOM_MAX = '3';
const ZOOM_MIN = '0.5';
export const ImagePreviewModalContext = createContext({});
export const ImagePreviewModalContextProvider = (props) => {
    const [visible, setVisible] = useState(false);
    const [urls, setUrls] = useState([]);
    const [url, setUrl] = useState('');
    const bodyRef = useRef(null);
    const imgRef = useRef(null);
    const dragging = useRef(false);
    const transform = useRef({
        scale: 1,
        x: 0,
        y: 0,
    });
    const close = () => {
        setVisible(false);
    };
    const updateImgTransform = () => {
        const { scale, x, y } = transform.current;
        if (imgRef.current) {
            imgRef.current.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(${scale})`;
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
    const prev = useCallback(() => {
        reset();
        setUrl((prevUrl) => {
            const index = urls.indexOf(prevUrl);
            if (index > 0)
                return urls[index - 1];
            return prevUrl;
        });
    }, [reset, urls]);
    const next = useCallback(() => {
        reset();
        setUrl((prevUrl) => {
            const index = urls.indexOf(prevUrl);
            if (index < urls.length - 1)
                return urls[index + 1];
            return prevUrl;
        });
    }, [reset, urls]);
    const handleWheelOnImg = throttle((event) => {
        if (event.deltaY || event.deltaX) {
            // 优先使用纵轴的差值
            const delta = event.deltaY || event.deltaX;
            delta < 0 ? zoomIn() : zoomOut();
        }
    }, 100);
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
    const ImagePreviewModalContextValue = {
        setVisible,
        setUrls,
        setUrl: (url) => {
            reset();
            setUrl(url);
        },
    };
    return (React.createElement(ImagePreviewModalContext.Provider, { value: ImagePreviewModalContextValue },
        props.children,
        React.createElement(Modal, { visible: visible, onVisibleChange: setVisible, bodyClassName: clsName, bodyRef: bodyRef, backdropClassName: cls('__background') },
            React.createElement("div", { className: cls('__preview') },
                React.createElement("div", { className: cls('__prev', 'nav-btn', {
                        visible: urls.indexOf(url) > 0,
                    }), onClick: prev },
                    React.createElement(IconPrev, null)),
                React.createElement("div", { className: cls('__img-container') },
                    React.createElement("img", { src: url, ref: imgRef, draggable: false, onWheel: (event) => {
                            event.persist();
                            handleWheelOnImg(event);
                        }, onMouseDown: () => {
                            dragging.current = true;
                        }, onMouseMove: handleDragOnImg, onMouseUp: () => {
                            dragging.current = false;
                        }, onMouseLeave: () => {
                            dragging.current = false;
                        } })),
                React.createElement("div", { className: cls('__next', 'nav-btn', {
                        visible: urls.indexOf(url) < urls.length - 1,
                    }), onClick: next },
                    React.createElement(IconNext, null))),
            React.createElement("div", { className: cls('__scale') },
                React.createElement("div", { className: cls('__scale_panel') },
                    React.createElement("div", { className: cls('__scale_zoom-in', 'zoom-btn') },
                        React.createElement(IconZoomIn, { onClick: zoomIn })),
                    React.createElement("div", { className: cls('__scale_zoom-out', 'zoom-btn') },
                        React.createElement(IconZoomOut, { onClick: zoomOut })),
                    React.createElement("div", { className: cls('__scale_reset', 'zoom-btn') },
                        React.createElement(IconReset, { onClick: reset }))),
                React.createElement(IconClose, { className: cls('__close'), onClick: close })))));
};
css `
  .${clsName} {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    user-select: none;

    &__preview {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;

      .nav-btn {
        visibility: hidden;
        width: 100px;
        height: 100px;
        padding: 20px;
        cursor: pointer;

        &.visible {
          visibility: visible;
        }

        svg {
          width: 56px;
          height: 56px;
        }
      }
    }

    &__img-container {
      flex: 1;
      height: 100%;
      margin-top: 24px;
      overflow: hidden;

      img {
        position: relative;
        border-style: none;
        max-width: 100%;
        max-height: 100%;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        -webkit-user-select: none;
        cursor: grab;
      }
    }

    &__scale {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      height: 100px;
    }

    &__scale_panel {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      width: 204px;
      height: 56px;
      background: #1e1e1e;
      border-radius: 8px;

      .zoom-btn {
        width: 24px;
        height: 24px;
        cursor: pointer;
      }
    }

    &__close {
      position: absolute;
      top: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      cursor: pointer;
    }

    &__background {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.64);
    }
  }
`;
