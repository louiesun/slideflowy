import { createContext, useEffect, useMemo } from "react";
import { Zoom } from "../../utils/zoom";
export const ZoomContext = createContext({});
export const ZoomContextProvider = (props) => {
    const { container } = props;
    const zoomContextValue = useMemo(() => ({
        zoom: new Zoom(container),
    }), [container]);
    useEffect(() => {
        return () => {
            zoomContextValue.zoom?.clearSideEffect();
        };
    }, []);
    return (React.createElement(ZoomContext.Provider, { value: zoomContextValue }, props.children));
};
