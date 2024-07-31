import { PositionRect, SelectionRange } from './types'
import { getElementPosRect, coveredByRect, rangeToPosRect } from './helpers'
import { Consumer, SelectionContextValue } from './SelectionContext'

export interface SelectionItemProps<T> {
  // DOM 对应的数据
  item: SelectionInnerItemProps<T>['item']
  // 是否要标记为选中
  shouldSelect: SelectionInnerItemProps<T>['shouldSelect']
  children: SelectionInnerItemProps<T>['children']
}

export const SelectionItem = function SelectionItem<T = any>(
  props: SelectionItemProps<T>,
) {
  return (
    <Consumer>
      {ctx => <SelectionInnerItem {...props} selectionContext={ctx} />}
    </Consumer>
  )
}

export interface SelectionItemContext {
  innerRef: SelectionInnerItem['innerRef']
  isStartPoint: boolean
  isEndPoint: boolean
  isSelecting: boolean
  selected: boolean
}

export interface SelectionInnerItemProps<T> {
  children: (props: SelectionItemContext) => React.ReactNode
  selectionContext: SelectionContextValue
  item: T
  shouldSelect: (
    elem: HTMLElement,
    pageSelectionRange: SelectionRange,
    screenSelectionRange: null | SelectionRange,
  ) => boolean
}

export interface SelectionInnerItemState {
  childProps: SelectionItemContext
}

export class SelectionInnerItem<T = any> extends React.PureComponent<
  SelectionInnerItemProps<T>,
  SelectionInnerItemState
> {
  private childRef?: HTMLElement | null

  readonly state: SelectionInnerItemState = {
    childProps: this.getChildProps(),
  }

  get selected() {
    return this.state.childProps.selected
  }

  constructor(props: SelectionInnerItemProps<T>) {
    super(props)

    this.innerRef = this.innerRef.bind(this)

    this.state = {
      childProps: this.getChildProps(),
    }
  }

  componentDidMount() {
    this.props.selectionContext.onSelectionItemDidMount(this)
    this.setState({
      childProps: this.getChildProps(this.props.selectionContext),
    })
  }

  componentDidUpdate(prevProps: SelectionInnerItemProps<T>) {
    if (this.props.selectionContext !== prevProps.selectionContext) {
      this.setState({
        childProps: this.getChildProps(this.props.selectionContext),
      })
    }
  }

  componentWillUnmount() {
    this.props.selectionContext.onSelectionItemWillUnmount(this)
  }

  render() {
    return this.props.children(this.state.childProps)
  }

  coveredByRect(r: PositionRect) {
    if (!this.childRef) return false
    return coveredByRect(getElementPosRect(this.childRef), r)
  }

  private getChildProps(ctx?: SelectionContextValue): SelectionItemContext {
    const defaultReturn = {
      innerRef: this.innerRef,
      isStartPoint: false,
      isEndPoint: false,
      isSelecting: false,
      selected: false,
    }

    if (!this.childRef || !(ctx && ctx.pageSelectionRange)) return defaultReturn

    const elemPosRect = getElementPosRect(this.childRef)
    const elemCovered = coveredByRect(elemPosRect, rangeToPosRect(ctx.pageSelectionRange))
    const selected = elemCovered && this.props.shouldSelect(this.childRef, ctx.pageSelectionRange, ctx.screenSelectionRange)

    if (!selected) return defaultReturn

    return {
      innerRef: this.innerRef,
      isStartPoint: coveredByRect(ctx.pageSelectionRange[0], elemPosRect),
      isEndPoint: coveredByRect(ctx.pageSelectionRange[1], elemPosRect),
      isSelecting: ctx.isSelecting,
      selected,
    }
  }

  private innerRef(element?: HTMLElement | null) {
    this.childRef = element
  }
}
