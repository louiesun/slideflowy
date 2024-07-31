import * as React from 'react'

export interface SimpleTipProps {
  message: string
  children: React.ReactNode
}

export const SimpleTip: React.FunctionComponent<SimpleTipProps> = props => {
  return (
    <div title={props.message}>{props.children}</div>
  )
}
