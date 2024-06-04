import { Observable } from 'rxjs';
export const create = (creator) => (...args) => new Observable(observer => {
    try {
        const res = creator(observer, ...args);
        if (res && typeof res.then === 'function') {
            res.then(observer.complete.bind(observer), observer.error.bind(observer));
        }
        else {
            observer.complete();
        }
    }
    catch (err) {
        observer.error(err);
    }
});
