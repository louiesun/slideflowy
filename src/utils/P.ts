export function delay(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
    });
}
export function createDefer() {
    let resolve = () => { };
    let reject = () => { };
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return { promise, resolve, reject };
}
const immediate = (cb) => Promise.resolve().then(cb);
export function nextTick(cb) {
    return new Promise((resolve, reject) => {
        void immediate(() => {
            if (typeof cb === 'function') {
                const res = cb();
                if (isPromise(res)) {
                    res.then(resolve, reject);
                }
                else {
                    resolve(res);
                }
            }
            else {
                resolve();
            }
        });
    });
}
export function isPromise(obj) {
    return obj && typeof obj.then === 'function';
}
