type Children = React.ReactElement<any> | null

export interface AttachProps {
  when?: boolean
  children?: Children | Children[]
  then?: Children | Children[]
  else?: Children | Children[]
}

export const Attach = React.memo<AttachProps>(function Attach(props) {
  return (
    ((props.when ? props.children || props.then : props.else) as Children) ||
    null
  )
})
