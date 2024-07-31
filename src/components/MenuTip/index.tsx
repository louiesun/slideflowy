import { useState } from 'react'
import { calcTextWidth } from '../../utils/calcTextWidth'
import './index.scss'

export interface SimpleTipProps {
  message: string
  hoverMessage: string
  setHoverMessage: (message: string) => void
  children: React.ReactNode
}

export const MenuTip = (props: SimpleTipProps) => {
  const { message, hoverMessage, setHoverMessage } = props

  const [visible, setVisible] = useState(false)

  const [text, shortcut] = message.split('.')

  const handleMouseEnter = () => {
    setVisible(true)
    setHoverMessage(message)
  }

  const handleMouseLeave = () => {
    setVisible(false)
    setHoverMessage('')
  }

  return (
    <div
      className="menu-tip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {props.children}
      {visible && message === hoverMessage && (
        <div className={'menu-tip'}>
          <div
            className={'menu-tip-text'}
            style={{
              width: calcTextWidth(text) + 4,
            }}
          >
            {text}
          </div>
          {shortcut && (
            <div
              className={'menu-tip-shortcut'}
              style={{
                width: calcTextWidth(shortcut) + 2,
              }}
            >
              {shortcut}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
