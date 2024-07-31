export const emptyObj = {}
Object.freeze(emptyObj)
Object.preventExtensions(emptyObj)

export const emptyAry = []
Object.freeze(emptyAry)
Object.preventExtensions(emptyAry)

// 该返回空数组/空对象的时候都返回相同的值，这样子 PureComponent
// 对比的时候就会全等，就不会重新渲染组件了
export const checkSafe = <T>(a: T): T => {
  if (Array.isArray(a)) {
    return (a.length ? a : emptyAry) as any
  } else if (typeof a === 'object' && a) {
    return (Object.keys(a).length ? a : emptyObj) as any
  } else {
    return a
  }
}

export const BooleanT = <T>() => (a: unknown): a is T => Boolean(a)

export const identityT = <T>() => (a: T) => a

export const identity = <T>(a: T) => a

export const times = <T>(fn: (idx: number) => T, n: number): T[] => {
  const len = Number(n)
  let idx = 0
  let list: T[]

  if (len < 0 || isNaN(len)) {
    throw new RangeError('n must be a non-negative number')
  }
  list = new Array(len)
  while (idx < len) {
    list[idx] = fn(idx)
    idx += 1
  }
  return list
}

export const move = <T>(fromIndex: number, toIndex: number, list: T[]): T[] => {
  const result = list.slice()
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export const divideWhen = <T, S>(
  iteratee: (item: T, idx: number) => boolean,
  separator: S,
  a: T[],
) => {
  if (a.length < 2) return a
  return a.reduce((r, item, idx) => {
    r.push(item)
    if (idx !== a.length - 1 && iteratee(item, idx)) {
      r.push(separator)
    }
    return r
  }, [] as (T | S)[])
}

export const divideEvery = <T, S>(n: number, separator: S, a: T[]) => {
  return divideWhen((item, idx) => !((idx + 1) % n), separator, a)
}

export const prepend = <T>(
  predicate: (item: T) => boolean,
  item: T,
  list: T[],
): T[] => {
  const idx = list.findIndex(predicate)
  if (idx === -1) return list
  const result = list.slice()
  if (idx === 0) {
    result.unshift(item)
  } else {
    result.splice(idx, 0, item)
  }
  return result
}

export const append = <T>(
  predicate: (item: T) => boolean,
  item: T,
  list: T[],
): T[] => {
  const idx = list.findIndex(predicate)
  if (idx === -1) return list
  const result = list.slice()
  result.splice(idx + 1, 0, item)
  return result
}

export const random = (lower: number, upper: number) => {
  return lower + Math.floor(Math.random() * (upper - lower + 1))
}

export const randomHex = (() => {
  const chars = '0123456789abcdef'.split('')

  return (size?: number) => {
    if (size == null) size = 6
    return times(() => sample(chars), size).join('')
  }
})()

export const sample = <T>(list: T[]): T | undefined => {
  const length = list.length
  return length ? list[random(0, length - 1)] : undefined
}

export function mapkv<T1, T2>(
  iteratee: (v: T1, k: string) => [string, T2],
  obj: { [key: string]: T1 },
) {
  return Object.keys(obj).reduce((res, k) => {
    const [newK, newV] = iteratee(obj[k], k)
    res[newK] = newV
    return res
  }, {} as { [key: string]: T2 })
}

export function last<T>(items: [T, ...T[]]): T
export function last<T>(items: T[]): T | undefined
export function last<T>(items: T[]) {
  return items[items.length - 1]
}

export function noop(...args: any) {}

export function values<T>(obj: T): T[keyof T][] {
  return Object.keys(obj).map((k) => obj[k])
}

export function nonNull<T>(a: null | undefined | T): a is T {
  return a != null
}
