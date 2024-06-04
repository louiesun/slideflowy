import { useCallback, useEffect, useMemo, useState } from 'react';
export const FocusContext = React.createContext({
    storeAnchor: (id, anchor) => { },
    storeImgUrl: (id, url) => { },
});
export const FocusContextProvider = props => {
    const [nodeId, setNodeId] = useState();
    const [anchor, setAnchor] = useState();
    const [imgUrl, setImgUrl] = useState();
    const onWindowFocus = useCallback((event) => {
        if (props.editable && event.target === window && nodeId) {
            if (anchor !== undefined) {
                props.restoreEditorAnchor(nodeId, anchor);
            }
            else if (imgUrl !== undefined) {
                props.restoreImgFocus(nodeId, imgUrl);
            }
        }
    }, [nodeId, anchor, imgUrl]);
    useEffect(() => {
        window.addEventListener('focus', onWindowFocus);
        return () => {
            window.removeEventListener('focus', onWindowFocus);
        };
    }, [onWindowFocus]);
    const contextValue = useMemo(() => ({
        storeAnchor: (id, anchor) => {
            setNodeId(id);
            setAnchor(anchor);
            setImgUrl(undefined);
        },
        storeImgUrl: (id, url) => {
            setNodeId(id);
            setImgUrl(url);
            setAnchor(undefined);
        },
    }), [setNodeId, setAnchor, setImgUrl]);
    return (React.createElement(FocusContext.Provider, { value: contextValue }, props.children));
};
