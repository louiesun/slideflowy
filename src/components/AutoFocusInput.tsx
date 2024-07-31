import { useRef, useCallback } from 'react'

export interface AutoFocusInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function AutoFocusInput(props: AutoFocusInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!ref.current) return
      ref.current.selectionStart = 0
      ref.current.selectionEnd = ref.current.value.length
      typeof props.onFocus === 'function' && props.onFocus(e)
    },
    [props.onFocus],
  )

  return <input ref={ref} {...props} onFocus={onFocus} />
}
