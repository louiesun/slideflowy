import './ZoomContainer.scss';
import { useState } from "react";
import { ZoomContextProvider } from './ZoomContext';
export const ZoomContainer = props => {
    const [zoomEl, setZoomEl] = useState();
    return (React.createElement("div", { className: "zoom-container", ref: el => setZoomEl(el || undefined) }, !zoomEl ? null : (React.createElement(ZoomContextProvider, { container: zoomEl }, props.children))));
};
