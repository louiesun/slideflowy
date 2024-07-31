import { MutableRefObject, Ref, useEffect } from 'react'
import { useStatefulRef } from './useStatefulRef'

export const useForwardedRef = <T>(
  forwardedRef: Ref<T>,
): MutableRefObject<T> => {
  const innerRef = useStatefulRef<T>(null)
  useEffect(() => {
    if (!forwardedRef) return

    if (typeof forwardedRef === 'function') {
      forwardedRef(innerRef.current)
    } else {
      ;(forwardedRef as MutableRefObject<T | null>).current = innerRef.current
    }
  })

  return innerRef
}
