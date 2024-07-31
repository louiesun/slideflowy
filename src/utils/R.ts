// R 代表的是 React

import { RefObject, useCallback, useEffect } from 'react'
import { ConnectedComponentClass } from 'react-redux'

export { RefObject } from 'react'

export type Connector<P = any> = (
  Component: React.ComponentType<P>,
) => ConnectedComponentClass<React.ComponentType<P>, P>

export interface ForwardingRef<T> extends RefObject<T> {
  (instance: T | null): any
}

export type CallbackFef<V> = (instance: V | null) => any

export type Ref<V> = null | CallbackFef<V> | RefObject<V> | ForwardingRef<V>

/**
 * 这个函数用来给 React 的 ref 属性传值
 *
 * * 目前主要的 ref 参数有两种：函数和 RefObject ，每次要给 ref 传值时都
 *   做这么一个判断很麻烦
 * * RefObject.current 在 TypeScript 里是 Readonly 的，每次给它赋值的时候
 *   要写成 (RefObject as any).current = xxx ，很麻烦，而且也不安全（我们
 *   要压缩 any 出现的数量）
 */
export function assignRef<V>(refValue: V | null, ref: Ref<V> | undefined) {
  if (typeof ref === 'function') {
    ref(refValue)
  }

  if (ref && 'current' in ref) {
    ;(ref as any).current = refValue
  }
}

/**
 * 接收若干 refs 然后生成一个新的 React.Ref ，收到的值会代理到所有接收的 refs
 */
export function forwardRefs<V>(...refs: (Ref<V> | undefined)[]) {
  return (instance: V | null) => {
    refs.forEach((ref) => assignRef(instance, ref))
  }
}

/**
 * 创建一个能代理 instance 给其他 ref 的 Ref
 *
 * 由于 React 在设置 ref 的值的时候会先判断 ref 是不是函数，所以我们这么做是可
 * 行的
 *
 * 给 ref 传值的代码：https://github.com/facebook/react/blob/6da04b5d886b272e241178694e15ced22c5a2c05/packages/react-reconciler/src/ReactFiberCommitWork.js#L705
 * 把 ref 清空的代码：https://github.com/facebook/react/blob/6da04b5d886b272e241178694e15ced22c5a2c05/packages/react-reconciler/src/ReactFiberCommitWork.js#L198
 *
 * 使用场景：
 *
```typescript
interface ExampleProps {
  viewRef: Ref<HTMLDivElement>
}

class Example extends PureComponent {
  private viewRef = createProxyRef<HTMLDivElement>(elem => {
    assignRef(elem, this.props.viewRef)
  })

  componentDidMount() {
    // this.viewRef 可以像普通的 RefObject 一样用
    this.viewRef!.current
  }

  render() {
    return (<div ref={this.viewRef} />)
  }
}
```
 */
export function createForwardingRef<T>(
  relayer: CallbackFef<T>,
): ForwardingRef<T> {
  function forwardingRef(instance: T | null) {
    relayer(instance)
    forwardingRef.current = instance
  }

  forwardingRef.current = null as T | null

  return forwardingRef as any
}

export const ConcurrentMode: React.ComponentClass = (React as any)
  .unstable_ConcurrentMode

export const useDocumentEvent = <K extends keyof DocumentEventMap>(
  type: keyof DocumentEventMap,
  listener: (event: DocumentEventMap[K]) => any,
  options: Parameters<Document['addEventListener']>[2] & {
    /** autoBinding 默认为 true */
    autoBinding?: boolean
  } = {},
) => {
  const bind = useCallback(() => {
    document.addEventListener(type, listener, options)
  }, [type, listener, options])

  const unbind = useCallback(() => {
    document.removeEventListener(type, listener, options)
  }, [type, listener, options])

  const { autoBinding = true } = options
  useEffect(() => {
    if (!autoBinding) return

    bind()
    return unbind
  }, [bind, unbind, autoBinding])

  return {
    bind,
    unbind,
  }
}
