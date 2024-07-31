import { SelectionRange } from './types'
import { SelectionInnerItem } from './SelectionItem'

export type SelectionContextValue = (
  | {
    isSelecting: boolean
    pageSelectionRange: SelectionRange
    screenSelectionRange: null | SelectionRange
    onSelectionItemDidMount: (item: SelectionInnerItem) => void
    onSelectionItemWillUnmount: (item: SelectionInnerItem) => void
    }
  | {
    isSelecting: boolean
    pageSelectionRange: null
    screenSelectionRange: null
    onSelectionItemDidMount: (item: SelectionInnerItem) => void
    onSelectionItemWillUnmount: (item: SelectionInnerItem) => void
  }
)

export const { Provider, Consumer } = React.createContext<SelectionContextValue>({
  isSelecting: false,
  pageSelectionRange: null,
  screenSelectionRange: null,
  onSelectionItemDidMount: () => {},
  onSelectionItemWillUnmount: () => {},
})
