import './ProseMirrorLinkEditor.scss'
import classNames from 'classnames'
import { useCallback, useEffect, useRef, useState } from 'react'
import IconDone from './icon_done.svg'
import IconDelete from './icon_delete.svg'
import IconEdit from './icon_edit.svg'
import { useForwardedRef } from '../../utils/hooks/useForwardedRef'

const ClassName = 'ProseMirrorLinkEditor'

export interface ProseMirrorLinkEditorProps {
  editable: boolean
  style: React.CSSProperties
  state: {
    text: string
    link: string
  }
  onDone: (text: string, link: string) => void
  onDelete: () => void
  onBlur: () => void
}

export const ProseMirrorLinkEditor = React.forwardRef<
  HTMLDivElement,
  ProseMirrorLinkEditorProps
>((props, ref) => {
  const containerRef = useForwardedRef(ref)
  const textRef = useRef<HTMLInputElement | null>(null)
  const linkRef = useRef<HTMLInputElement | null>(null)

  const [editable, setEditable] = useState(props.editable)

  const { style, state, onDelete } = props

  const onDone = () => {
    props.onDone(textRef.current?.value || '', linkRef.current?.value || '')
  }
  const onEdit = () => {
    setEditable(true)
  }

  const handleMouseDownOutside = useCallback(
    (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      if (style.display === 'none') return
      if (!containerRef.current?.contains(event.target)) {
        props.onBlur()
      }
    },
    [style],
  )

  useEffect(() => {
    setEditable(props.editable)

    if (textRef.current) textRef.current.value = state.text
    if (linkRef.current) linkRef.current.value = state.link

    document.addEventListener('mousedown', handleMouseDownOutside)

    return () => {
      document.removeEventListener('mousedown', handleMouseDownOutside)
    }
  }, [props.editable, state, handleMouseDownOutside])

  useEffect(() => {
    if (editable) linkRef.current?.focus()
  }, [editable])

  return (
    <div className={ClassName} ref={containerRef} style={style}>
      <div className={`${ClassName}__inputs`}>
        {editable && (
          <div className={`${ClassName}__input`}>
            <div className={`${ClassName}__input-label`}>文本</div>
            <input ref={textRef} defaultValue={state.text} />
          </div>
        )}
        <div className={`${ClassName}__input`}>
          {editable && <div className={`${ClassName}__input-label`}>链接</div>}
          <input ref={linkRef} defaultValue={state.link} readOnly={!editable} />
        </div>
      </div>
      <div className={`${ClassName}__operations`}>
        <div
          className={classNames([
            `${ClassName}__operation`,
            {
              show: editable,
            },
          ])}
          onClick={onDone}
        >
          <IconDone />
        </div>
        <div
          className={classNames([
            `${ClassName}__operation`,
            {
              show: !editable,
            },
          ])}
          onClick={onEdit}
        >
          <IconEdit />
        </div>
        <div
          className={classNames([
            `${ClassName}__operation`,
            {
              show: !editable,
            },
          ])}
          onClick={onDelete}
        >
          <IconDelete />
        </div>
      </div>
    </div>
  )
})
