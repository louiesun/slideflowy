import { Observable, Subscriber } from 'rxjs'

export const create = <T, AT extends any[]>(creator: (observer: Subscriber<T>, ...args: AT) => void | Promise<void>) =>
  (...args: AT) =>
    new Observable<T>(observer => {
      try {
        const res = creator(observer, ...args)
        if (res && typeof res.then === 'function') {
          res.then(
            observer.complete.bind(observer),
            observer.error.bind(observer),
          )
        } else {
          observer.complete()
        }
      } catch (err) {
        observer.error(err)
      }
    })
