import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView, EditorProps } from 'prosemirror-view'
import {mathSerializer } from "@benrbray/prosemirror-math"
import classNames from 'classnames'
import { assignRef, Ref } from '../utils/R'
import '@benrbray/prosemirror-math/style/math.css'
import 'katex/dist/katex.min.css'

export interface ProseMirrorEditorViewProps {
  className?: string
  editorViewRef?: Ref<EditorView>
  editorState: EditorState
  onDispatchTransaction: (tr: Transaction) => void
  containerProps: React.HTMLAttributes<HTMLDivElement>
  editorProps: EditorProps
}

export class ProseMirrorEditorView extends React.PureComponent<
  ProseMirrorEditorViewProps
> {
  editorView: EditorView | null

  containerElem: HTMLElement | null = null

  containerReactNode: React.ReactNode | null = null

  componentWillUnmount() {
    this.editorView && this.editorView.destroy()
    this.editorView = null
    this.refreshEditorViewRef()
  }

  componentDidUpdate(prevProps: ProseMirrorEditorViewProps) {
    if (this.editorView && prevProps.editorState !== this.props.editorState) {
      this.editorView.updateState(this.props.editorState)
    }
    if (this.editorView && (prevProps.editorProps !== this.props.editorProps || prevProps.onDispatchTransaction !== this.props.onDispatchTransaction)) {
      this.editorView.update({
        ...this.props.editorProps,
        state: this.props.editorState,
        dispatchTransaction: this.props.onDispatchTransaction,
      })
    }
  }

  contains(element: Node) {
    if (!this.editorView) return false
    return this.editorView.dom.contains(element)
  }

  render() {
    if (this.containerReactNode) {
      return this.containerReactNode
    }

    return (this.containerReactNode = (
      <div
        className={classNames('ProseMirrorEditorView', this.props.className)}
        ref={this.createEditorView}
        {...this.props.containerProps}
      />
    ))
  }

  private createEditorView = (element: HTMLDivElement | null) => {
    this.containerElem = element

    if (!element) {
      this.editorView = null
      return
    }

    this.editorView = new EditorView(element, {
      ...this.props.editorProps,
      state: this.props.editorState,
      dispatchTransaction: this.props.onDispatchTransaction,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice)
      }
    })
    this.refreshEditorViewRef()
  }

  private refreshEditorViewRef() {
    assignRef(this.editorView, this.props.editorViewRef)
  }
}
