import { useEffect } from 'react';
import { useStatefulRef } from './useStatefulRef';
export const useForwardedRef = (forwardedRef) => {
    const innerRef = useStatefulRef(null);
    useEffect(() => {
        if (!forwardedRef)
            return;
        if (typeof forwardedRef === 'function') {
            forwardedRef(innerRef.current);
        }
        else {
            ;
            forwardedRef.current = innerRef.current;
        }
    });
    return innerRef;
};
