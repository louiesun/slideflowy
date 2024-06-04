import { useRef, useState } from 'react';
export const useStatefulRef = (initialVal = null) => {
    // tslint:disable-next-line:prefer-const
    let [current, setCurrent] = useState(initialVal);
    const { current: ref } = useRef({
        current,
    });
    Object.defineProperty(ref, 'current', {
        get: () => current,
        set(v) {
            if (!Object.is(current, v)) {
                current = v;
                setCurrent(v);
            }
        },
    });
    return ref;
};
