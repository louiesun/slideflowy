export function shallowChanged<T>(objA: T, objB: T): boolean | keyof T
export function shallowChanged<T, TCtx = any>(
  objA: T,
  objB: T,
  compare: shallowChanged.Customizer<T, TCtx>,
  compareContext?: TCtx,
): boolean | keyof T
export function shallowChanged<T, TCtx = any>(
  objA: T,
  objB: T,
  compare?: shallowChanged.Customizer<T, TCtx>,
  compareContext?: TCtx,
) {
  let ret = compare ? compare.call(compareContext, objA, objB) : undefined

  if (ret !== undefined) return ret

  if (objA === objB) return false

  if (typeof objA !== 'object' || !objA || typeof objB !== 'object' || !objB) {
    return true
  }

  const keysA = Object.keys(objA) as (keyof T)[]
  const keysB = Object.keys(objB) as (keyof T)[]

  const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB)

  if (keysA.length !== keysB.length) {
    return true
  }

  // Test for A's keys different from B.
  for (const key of keysA) {
    if (!bHasOwnProperty(key)) {
      return key
    }

    const valueA = objA[key]
    const valueB = objB[key]

    // prettier-ignore
    ret = compare ? compare.call(compareContext, valueA, valueB, key) : undefined
    if (ret !== undefined) return ret

    if (valueA !== valueB) {
      return key
    }
  }

  return false
}

export namespace shallowChanged {
  export type Customizer<T, TCtx = any> = (
    this: TCtx,
    objA: any,
    objB: any,
    indexOrKey?: keyof T,
  ) => boolean | string | undefined
}

type ShallowComparer<T> = {
  [K in keyof T]?: (
    objA: T[K],
    objB: T[K],
    indexOrKey?: K,
  ) => boolean | string | undefined
}
/**
 * `shallowEqual` 和 `shallowChanged` 函数的帮助函数，帮助更简单地自定义
 * customer
 *
 * @example
 *
```js
const a = { other: 'xxx', node: { id: 1, content: 'xxx' } }
const b = { other: 'xxx', node: { id: 1, content: 'xxxx' } }

shallowEqual(a, b, evolve<Tree>({
  node: (a, b) => a.id !== b.id,
}))
```
 */
export function evolve<T>(customer: ShallowComparer<T>) {
  // 需要同时支持 shallowEqual 和 shallowChanged
  // shallowEqual 的类型里不允许 compare 返回 string
  // 所以我们这里把类型改成 any
  return <K extends keyof T>(objA: T[K], objB: T[K], indexOrKey?: K): any => {
    if (!indexOrKey) return

    const compare = customer[indexOrKey]

    if (!compare || typeof customer[indexOrKey] !== 'function') return

    return compare(objA, objB, indexOrKey)
  }
}

export function logShallowChanged<T>(propName: boolean | keyof T, ...obj: T[]) {
  if (typeof propName === 'boolean') {
    console.log('shallowChanged: ', propName)
    return
  }

  console.log('shallowChanged: ', propName, ...obj.map(o => o[propName]))
}
