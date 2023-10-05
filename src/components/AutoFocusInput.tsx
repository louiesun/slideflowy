import { useRef, useCallback } from 'react';
export function AutoFocusInput(props) {
    const ref = useRef(null);
    const onFocus = useCallback((e) => {
        if (!ref.current)
            return;
        ref.current.selectionStart = 0;
        ref.current.selectionEnd = ref.current.value.length;
        typeof props.onFocus === 'function' && props.onFocus(e);
    }, [props.onFocus]);
    return React.createElement("input", { ref: ref, ...props, onFocus: onFocus });
}
