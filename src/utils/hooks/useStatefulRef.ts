import { MutableRefObject, useRef, useState } from 'react'

export const useStatefulRef = <T = any>(
  initialVal = null,
): MutableRefObject<T> => {
  // tslint:disable-next-line:prefer-const
  let [current, setCurrent] = useState<T | null>(initialVal)

  const { current: ref } = useRef({
    current,
  })

  Object.defineProperty(ref, 'current', {
    get: () => current as T,
    set(v: T) {
      if (!Object.is(current, v)) {
        current = v
        setCurrent(v)
      }
    },
  })

  return ref as MutableRefObject<T>
}
