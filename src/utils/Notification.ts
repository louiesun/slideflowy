import 'node-snackbar/dist/snackbar.min.css';
import { show as showSnackbar, } from 'node-snackbar';
import { $t } from '../i18n';
import { css } from 'astroturf';
export var Notification;
(function (Notification) {
    function show(options) {
        // snackbar 的 text 是使用 innerHTML 设置进去的，参数名称十分容易误
        // 导人，以为这个设置项是安全的。所以我们在这里做一些处理
        let text = '';
        if (options.text != null) {
            const elem = document.createElement('p');
            elem.className = 'snackbar-text';
            elem.textContent = options.text;
            text = elem.outerHTML;
        }
        else if (options.dangerouslyHTML != null) {
            text = options.dangerouslyHTML;
        }
        return showSnackbar({
            pos: 'bottom-center',
            actionText: $t('NUTFLOWY_DISMISS'),
            actionTextColor: '#cd8687',
            ...options,
            text,
        });
    }
    Notification.show = show;
})(Notification || (Notification = {}));
css `
  .snackbar-container * {
    font-weight: normal !important;
  }

  .snackbar-text {
    margin: 0;
    text-transform: capitalize;
  }
`;
