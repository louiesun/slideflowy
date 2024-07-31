import { ProseMirrorMenuBar } from './ProseMirrorMenuBar'
import { nextTick } from '../../utils/P'
import { $t } from '../../i18n'

export const clearColor = '@@clear@@'

export const availableColors = {
  fontColor: [
    clearColor,
    '#9094A0',
    '#FF2A18',
    '#FF9D1C',
    '#61BE57',
    '#1AD6CE',
    '#107FFC',
    '#9466FF',
  ],
  backgroundColor: [
    'rgba(248, 240, 9, 1)',
    'rgba(144, 148, 160, 0.24)',
    'rgba(255, 42, 24, 0.24)',
    'rgba(255, 157, 28, 0.24)',
    'rgba(97, 190, 87, 0.24)',
    'rgba(26, 214, 206, 0.24)',
    'rgba(16, 127, 252, 0.24)',
    'rgba(148, 102, 255, 0.24)',
  ],
}

export function renderMenuItems(this: ProseMirrorMenuBar) {
  const i: typeof this['renderMenuItem'] = ({ title, ...props }) =>
    this.renderMenuItem(
      wrapAutoRestoreFocusMouseEvents.call(this, props, title),
    )

  return [
    i({
      className: `bold ${this.markHelpers.bold.hasMark() ? 'active' : ''}`,
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_BOLD'),
      onClick: this.markHelpers.bold.toggleMark,
    }),
    i({
      className: `italic ${this.markHelpers.italic.hasMark() ? 'active' : ''}`,
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_ITALIC'),
      onClick: this.markHelpers.italic.toggleMark,
    }),
    i({
      className: `underline ${
        this.markHelpers.underline.hasMark() ? 'active' : ''
      }`,
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_UNDERLINE'),
      onClick: this.markHelpers.underline.toggleMark,
    }),
    i({
      className: `strikethrough`,
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_STRIKETHROUGH'),
      onClick: this.markHelpers.strikethrough.toggleMark,
    }),
    i({ className: 'divider' }),
    this.renderMenuItem(
      this.wrapMenuClickEvents(
        {
          className: 'color',
          onClick: async e => {
            if (this.toggleBodyVisual('color')) {
              await nextTick()
              this.props.onEditorRetrieveFocus()
            }
          },
        },
        $t('NUTFLOWY_RICHTEXT_MENUITEM_COLOR'),
      ),
    ),
    i({
      className: `link ${this.markHelpers.link.hasMark() ? 'disabled' : ''}`,
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_EDIT_LINK'),
      onClick: () => {
        if (!this.markHelpers.link.hasMark()) this.props.onEditLink()
      },
    }),
    i({
      className: 'removeFormatting',
      title: $t('NUTFLOWY_RICHTEXT_MENUITEM_CLEAR_STYLE'),
      onClick: this.props.onRemoveStyle,
    }),
  ]
}

function wrapAutoRestoreFocusMouseEvents<T extends HTMLElement>(
  this: ProseMirrorMenuBar,
  props: React.HTMLAttributes<T> = {},
  title?: string,
): React.HTMLAttributes<T> {
  return this.wrapMenuClickEvents(
    {
      ...props,
      onMouseUp: e => {
        typeof props.onMouseUp === 'function' && props.onMouseUp(e)
        this.setState({ menuBodyVisible: undefined })
      },
    },
    title,
  )
}
