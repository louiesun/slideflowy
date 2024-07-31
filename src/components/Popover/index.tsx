import classnames from 'classnames'
import { identityT } from '../../utils/F'
import { Portal } from '../Portal'
import './style.scss'

export interface PopoverPropsBase {
  appearDelay: number
  disappearDelay: number
  triggerClassName: string
  containerClassName: string
  openOn: 'none' | 'hover' | 'click' | 'focus'
  closeOnClick: boolean
  disabled: boolean
  trigger?: () => React.ReactNode
  content: () => React.ReactNode
}

export interface PopoverPropsSelfHostVisible extends PopoverPropsBase {}

export interface PopoverPropsDelegateVisible extends PopoverPropsBase {
  popoverTop?: number
  popoverLeft?: number
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}

export type PopoverProps =
  | PopoverPropsSelfHostVisible
  | PopoverPropsDelegateVisible

export interface PopoverState {
  visible: boolean
  popoverTop: number
  popoverLeft: number
}

let popoverContainer: HTMLDivElement | null = null

export class Popover extends React.PureComponent<PopoverProps, PopoverState> {
  static defaultProps = {
    appearDelay: 0,
    disappearDelay: 0,
    triggerClassName: '',
    containerClassName: '',
    openOn: 'none' as 'none',
    closeOnClick: true,
    disabled: false,
    onVisibleChange: identityT<boolean>(),
  }

  readonly state: PopoverState = {
    visible: false,
    popoverTop: 0,
    popoverLeft: 0,
  }

  private triggerRef = React.createRef<HTMLDivElement>()

  componentDidUpdate(prevProps: PopoverProps) {
    if (
      this.visibleDelegated(this.props) &&
      prevProps.disabled !== this.props.disabled &&
      this.props.disabled
    ) {
      this.changeVisible(false)
    }
  }

  render() {
    if (!popoverContainer) {
      popoverContainer = document.createElement('div')
      document.body.appendChild(popoverContainer)
    }

    return (
      <React.Fragment>
        {typeof this.props.trigger !== 'function' ? null : (
          <div
            ref={this.triggerRef}
            tabIndex={-1}
            className={classnames([
              'Popover__trigger',
              this.props.triggerClassName,
            ])}
            onClick={this.onClick}
            onFocus={this.onFocus}
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}
          >
            {this.props.trigger()}
          </div>
        )}
        {this.props.disabled ? null : (
          <Portal
            parent={popoverContainer}
            className={`Popover__container ${this.props.containerClassName}`}
            style={this.portalStyle()}
            closeOnClick={this.props.closeOnClick}
            visible={this.visible}
            onVisibleChange={this.changeVisible}
          >
            <div
              className="Popover__content"
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            >
              {this.visible ? this.props.content() : null}
            </div>
          </Portal>
        )}
      </React.Fragment>
    )
  }

  private visibleDelegated(
    props: PopoverProps,
  ): props is PopoverPropsDelegateVisible {
    return 'visible' in this.props
  }

  private get visible() {
    if (this.props.disabled) return false
    if (this.visibleDelegated(this.props)) {
      return this.props.visible
    } else {
      return this.state.visible
    }
  }

  private portalStyle() {
    const defaultStyle = {
      display: 'block',
      visibility: this.visible ? 'visible' : 'hidden',
      transitionDelay: this.visible
        ? `${this.props.appearDelay / 1000}s`
        : `${this.props.disappearDelay / 1000}s`,
    }

    if ('popoverTop' in this.props && this.props.popoverTop != null) {
      return Object.assign(defaultStyle, {
        top: `${this.props.popoverTop}px`,
        left: `${this.props.popoverLeft}px`,
      })
    } else {
      return Object.assign(defaultStyle, {
        top: `${this.state.popoverTop}px`,
        left: `${this.state.popoverLeft}px`,
      })
    }
  }

  private changeVisible = (visible: boolean) => {
    if (this.visibleDelegated(this.props)) {
      this.props.onVisibleChange(visible)
    } else {
      this.setState({ visible })
    }
  }

  private showPopover() {
    if (this.props.disabled) return
    if (!document.scrollingElement) return
    const trigger = this.triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    this.setState({
      popoverTop: document.scrollingElement.scrollTop + rect.bottom,
      popoverLeft:
        document.scrollingElement.scrollLeft + rect.left + rect.width / 2,
    })
    this.changeVisible(true)
  }

  private onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.openOn !== 'click') return
    this.showPopover()
  }

  private onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (this.props.openOn !== 'focus') return
    this.showPopover()
  }

  private onMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.openOn !== 'hover') return
    this.showPopover()
  }

  private onMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.disabled) return
    if (this.props.openOn !== 'hover') return
    this.changeVisible(false)
  }
}
