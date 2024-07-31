import classnames from 'classnames'
import { MarkType } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { zipObj } from 'ramda'
import { schema, hasMark } from '../../services/ProseMirrorService'
import { SimpleObj } from '../../types'
import {
  renderMenuItems,
  availableColors,
  clearColor,
} from './ProseMirrorMenuBarHelper'
import './ProseMirrorMenuBar.scss'
import { isCtrlPressed } from '../../utils/K'
import { createRestoreFocusElement } from './InnerProseMirrorEditorView'

export interface ProseMirrorMenuBarProps {
  editorState: EditorState
  style: React.CSSProperties
  onEditorRetrieveFocus: () => void
  onApplyMark: (mark: MarkType, attrs?: SimpleObj) => void
  onCleanMark: (mark: MarkType) => void
  onRemoveStyle: () => void
  onBlur: () => void
  onEditLink: () => void
}

interface ProseMirrorMenuBarState {
  menuBodyVisible?: 'color'
}

export class ProseMirrorMenuBar extends React.PureComponent<
  ProseMirrorMenuBarProps,
  ProseMirrorMenuBarState
> {
  static defaultProps = {
    style: {},
    onBlur: () => {},
  }

  readonly state: ProseMirrorMenuBarState = {}

  private containerRef = React.createRef<HTMLDivElement>()

  private renderMenuItems = renderMenuItems

  public contains(element: Node) {
    if (!this.containerRef.current) return false
    return this.containerRef.current.contains(element)
  }

  /**
   * 处理一下期待 MenuBar 出现的位置，因为希望是顶上的小箭头
   * 对准对应位置
   */
  public wrapPosition(pos: { left: number; top: number }) {
    return {
      // 气泡顶上的小箭头高度为 8px
      top: pos.top + 8,
      // 气泡顶上的小箭头宽度为 16px ，右移了 16px
      left: pos.left - 16 - 16 / 2,
    }
  }

  protected toggleBodyVisual(type: ProseMirrorMenuBarState['menuBodyVisible']) {
    const menuBodyVisible =
      this.state.menuBodyVisible === type ? undefined : type

    this.setState({ menuBodyVisible })

    return menuBodyVisible
  }

  private markColor = (color: string) => (e: React.MouseEvent<HTMLElement>) => {
    this.props.onApplyMark(schema.marks.color, { color })
    this.props.onEditorRetrieveFocus()
  }

  private markBGColor = (BGColor: string) => (
    e: React.MouseEvent<HTMLElement>,
  ) => {
    this.props.onApplyMark(schema.marks.BGColor, { BGColor })
    this.props.onEditorRetrieveFocus()
  }

  public onEditorKeyDown(event: KeyboardEvent) {
    if (!isCtrlPressed(event)) return

    if (event.key === 'u') {
      this.markHelpers.underline.toggleMark()
      return true
    }

    if (event.key === 'i') {
      this.markHelpers.italic.toggleMark()
      return true
    }

    if (event.key === 'b') {
      this.markHelpers.bold.toggleMark()
      return true
    }

    if (event.key === 'd') {
      this.markHelpers.strikethrough.toggleMark()
    }

    return false
  }

  protected markHelpers: {
    [K in keyof typeof schema.marks]: {
      hasMark: () => boolean
      toggleMark: () => void
    }
  } = zipObj(
    Object.keys(schema.marks),
    Object.keys(schema.marks).map(markName => {
      const markType: MarkType = schema.marks[markName] as any
      const has = () => hasMark(markType)(this.props.editorState)
      return {
        hasMark: has,
        toggleMark: () =>
          has()
            ? this.props.onCleanMark(markType)
            : this.props.onApplyMark(markType),
      }
    }),
  ) as any

  protected wrapMenuClickEvents<T extends HTMLElement>(
    props: React.HTMLAttributes<T> = {},
    title?: string,
  ): React.HTMLAttributes<T> {
    return {
      ...props,
      title,
    }
  }

  private onCleanColor = () => {
    this.props.onCleanMark(schema.marks.color)
    this.props.onCleanMark(schema.marks.BGColor)
  }

  protected renderMenuItem({
    className,
    title,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        key={className}
        className={`ProseMirrorMenuBar__Item ProseMirrorMenuBar__Item--${className}`}
        {...props}
      >
        {title ? (
          <div className="ProseMirrorMenuBar__ItemTooltip">{title}</div>
        ) : null}
      </div>
    )
  }

  private renderColorPanel() {
    return (
      <>
        <div key="font-color-row" className="ProseMirrorMenuBar__ColorRow">
          {availableColors.fontColor.map(c => this.renderColorCell(c))}
        </div>
        <div
          key="background-color-row"
          className="ProseMirrorMenuBar__ColorRow"
        >
          {availableColors.backgroundColor.map(c => this.renderBGColorCell(c))}
        </div>
      </>
    )
  }

  private renderColorCell(color: string) {
    if (color === clearColor) {
      return (
        <span
          key={color}
          className="ProseMirrorMenuBar__ColorRow__Clear"
          {...this.wrapMenuClickEvents({
            onClick: this.onCleanColor,
          })}
        />
      )
    }

    return (
      <span
        key={color}
        style={{ color }}
        {...this.wrapMenuClickEvents({
          onClick: this.markColor(color),
        })}
      >
        A
      </span>
    )
  }

  private renderBGColorCell(color: string) {
    return (
      <span
        key={color}
        style={{ color: '#0D0D0D', backgroundColor: color }}
        {...this.wrapMenuClickEvents({
          onClick: this.markBGColor(color),
        })}
      >
        A
      </span>
    )
  }

  render() {
    return createRestoreFocusElement(
      <div
        ref={this.containerRef}
        className="ProseMirrorMenuBar"
        style={this.props.style}
      >
        <div className="ProseMirrorMenuBar__Header">
          {this.renderMenuItems()}
        </div>
        <div
          style={!this.state.menuBodyVisible ? { display: 'none' } : {}}
          className={classnames([
            'ProseMirrorMenuBar__Body',
            `ProseMirrorMenuBar__Body--${this.state.menuBodyVisible}`,
          ])}
        >
          {this.state.menuBodyVisible === 'color'
            ? this.renderColorPanel()
            : null}
        </div>
      </div>,
    )
  }
}
