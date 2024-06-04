export const emptyObj = {};
Object.freeze(emptyObj);
Object.preventExtensions(emptyObj);
export const emptyAry = [];
Object.freeze(emptyAry);
Object.preventExtensions(emptyAry);
// 该返回空数组/空对象的时候都返回相同的值，这样子 PureComponent
// 对比的时候就会全等，就不会重新渲染组件了
export const checkSafe = (a) => {
    if (Array.isArray(a)) {
        return (a.length ? a : emptyAry);
    }
    else if (typeof a === 'object' && a) {
        return (Object.keys(a).length ? a : emptyObj);
    }
    else {
        return a;
    }
};
export const BooleanT = () => (a) => Boolean(a);
export const identityT = () => (a) => a;
export const identity = (a) => a;
export const times = (fn, n) => {
    const len = Number(n);
    let idx = 0;
    let list;
    if (len < 0 || isNaN(len)) {
        throw new RangeError('n must be a non-negative number');
    }
    list = new Array(len);
    while (idx < len) {
        list[idx] = fn(idx);
        idx += 1;
    }
    return list;
};
export const move = (fromIndex, toIndex, list) => {
    const result = list.slice();
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
};
export const divideWhen = (iteratee, separator, a) => {
    if (a.length < 2)
        return a;
    return a.reduce((r, item, idx) => {
        r.push(item);
        if (idx !== a.length - 1 && iteratee(item, idx)) {
            r.push(separator);
        }
        return r;
    }, []);
};
export const divideEvery = (n, separator, a) => {
    return divideWhen((item, idx) => !((idx + 1) % n), separator, a);
};
export const prepend = (predicate, item, list) => {
    const idx = list.findIndex(predicate);
    if (idx === -1)
        return list;
    const result = list.slice();
    if (idx === 0) {
        result.unshift(item);
    }
    else {
        result.splice(idx, 0, item);
    }
    return result;
};
export const append = (predicate, item, list) => {
    const idx = list.findIndex(predicate);
    if (idx === -1)
        return list;
    const result = list.slice();
    result.splice(idx + 1, 0, item);
    return result;
};
export const random = (lower, upper) => {
    return lower + Math.floor(Math.random() * (upper - lower + 1));
};
export const randomHex = (() => {
    const chars = '0123456789abcdef'.split('');
    return (size) => {
        if (size == null)
            size = 6;
        return times(() => sample(chars), size).join('');
    };
})();
export const sample = (list) => {
    const length = list.length;
    return length ? list[random(0, length - 1)] : undefined;
};
export function mapkv(iteratee, obj) {
    return Object.keys(obj).reduce((res, k) => {
        const [newK, newV] = iteratee(obj[k], k);
        res[newK] = newV;
        return res;
    }, {});
}
export function last(items) {
    return items[items.length - 1];
}
export function noop(...args) { }
export function values(obj) {
    return Object.keys(obj).map((k) => obj[k]);
}
export function nonNull(a) {
    return a != null;
}
