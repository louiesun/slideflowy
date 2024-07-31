export function delay(timeout: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, timeout)
  })
}

export type DeferResolve<T> = (value?: T | PromiseLike<T> | undefined) => void

export type DeferReject<T> = (reason: any) => void

export type Defer<T> = {
  promise: Promise<T>
  resolve: DeferResolve<T>
  reject: DeferReject<T>
}

export function createDefer<T>(): Defer<T> {
  let resolve: DeferResolve<T> = () => {}
  let reject: DeferReject<T> = () => {}
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}

const immediate = (cb: () => void) => Promise.resolve().then(cb)
export function nextTick(): Promise<void>
export function nextTick<T = any>(cb: () => T | Promise<T>): Promise<T | void>
export function nextTick<T = any>(cb?: () => T | Promise<T>): Promise<T| void> {
  return new Promise<T | void>((resolve, reject) => {
    void immediate(() => {
      if (typeof cb === 'function') {
        const res = cb()
        if (isPromise(res)) {
          res.then(resolve, reject)
        } else {
          resolve(res)
        }
      } else {
        resolve()
      }
    })
  })
}

export function isPromise<T>(obj: any): obj is PromiseLike<T> {
  return obj && typeof obj.then === 'function'
}
