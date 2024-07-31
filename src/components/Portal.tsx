import { equals } from 'ramda'

export interface PortalProps {
  parent?: HTMLElement
  children: React.ReactNode

  className: string
  style: Partial<CSSStyleDeclaration>

  visible: boolean
  onVisibleChange: (visible: boolean) => void
  closeOnClick: boolean
  closeOnOutsideClick: boolean
}

export class Portal extends React.PureComponent<PortalProps> {
  static defaultProps = {
    className: '',
    style: {},

    visible: false,
    onVisibleChange: () => {},
    closeOnClick: false,
    closeOnOutsideClick: false,
  }

  portal = document.createElement('div')

  componentDidMount() {
    this.updateNode(null, this.props)
    document.addEventListener('click', this.onClick)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClick)
    this.updateNode(this.props, null)
  }

  componentDidUpdate(prevProps: PortalProps) {
    this.updateNode(prevProps, this.props)
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.portal)
  }

  private updateNode(
    prevProps: PortalProps | null,
    nextProps: PortalProps,
  ): void
  private updateNode(
    prevProps: PortalProps,
    nextProps: PortalProps | null,
  ): void
  private updateNode(
    prevProps: PortalProps | null,
    nextProps: PortalProps | null,
  ) {
    const root = this.portal

    if (!prevProps || !nextProps || prevProps.parent !== nextProps.parent) {
      prevProps && (prevProps.parent || document.body).removeChild(this.portal)
      nextProps && (nextProps.parent || document.body).appendChild(this.portal)
    }

    if (nextProps) {
      if (!prevProps || prevProps.className !== nextProps.className) {
        root.setAttribute('class', nextProps.className.trim() || '')
      }

      const prevStyle = prevProps && prevProps.style
      const nextStyle = nextProps.style
      if (!equals(prevStyle, nextStyle)) {
        root.removeAttribute('style')
        Object.assign(
          root.style,
          { display: nextProps.visible ? 'block' : 'none' },
          nextStyle,
        )
      } else {
        root.style.display = nextProps.visible ? 'block' : 'none'
      }
    }
  }

  private onClick = (event: MouseEvent) => {
    if (!this.props.visible) return
    if (!(event.target instanceof HTMLElement)) return
    const root = this.portal
    if (!root || (event.button && event.button !== 0)) return
    if (root.contains(event.target)) {
      this.props.closeOnClick && this.props.onVisibleChange(false)
    } else {
      this.props.closeOnOutsideClick && this.props.onVisibleChange(false)
    }
  }
}
