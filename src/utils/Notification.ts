import 'node-snackbar/dist/snackbar.min.css'
import {
  show as showSnackbar,
  ShowOptions as SnackbarShowOptions,
} from 'node-snackbar'
import { $t } from '../i18n'

export namespace Notification {
  export interface ShowOptions extends SnackbarShowOptions {
    /**
     * 设置显示通知 html ，当 text 设置项存在时，优先使用 text
     *
     * 如果使用了 dangerouslyHTML 设置项，那么 Notification.show 不会创
     * 建 .snackbar-text 元素，需要调用者自己处理
     */
    dangerouslyHTML?: string
  }

  export function show(options: ShowOptions) {
    // snackbar 的 text 是使用 innerHTML 设置进去的，参数名称十分容易误
    // 导人，以为这个设置项是安全的。所以我们在这里做一些处理
    let text = ''
    if (options.text != null) {
      const elem = document.createElement('p')
      elem.style.margin = '0'
      elem.style.textTransform = 'capitalize'
      elem.classList.add('snackbar-text')
      elem.textContent = options.text
      text = elem.outerHTML
    } else if (options.dangerouslyHTML != null) {
      text = options.dangerouslyHTML
    }

    return showSnackbar({
      pos: 'bottom-center',
      actionText: $t('NUTFLOWY_DISMISS'),
      actionTextColor: '#cd8687',
      ...options,
      text,
    })
  }
}
