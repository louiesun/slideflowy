import { getBrowserName } from './Platform'
/**
 * 使用输入法时(Input Method Editors/IME) 
 * 在safari浏览器上与在chrome/firefox浏览器上有不同的表现
 * 
 *  - 在chrome/firefox上用户完成非英文输入按下Enter键确定输入结果时，先触发了keydown事件，然后才触发compositionend事件(相隔0-1ms，应该是一个微任务)
 *  - 在safari上进行同样的操作 会先触发了compositionend事件，然后才触发keydown事件(相隔5ms左右) 
 * 
 * 我们当前用的promsemirror在用户输入时的判断逻辑是通过监听compositionstart和compositionend的触发标志用户是否在输入中。
 * 所以在safari上keydown事件触发时用户总是输入完成状态，导致在用户确定输入(输入完成按下Enter键)的操作会触发promsemirror中keydown事件的回调,从而产生确定输入换行问题。而chrome/firefox中可以正常判断上述情况，所有不会触发回调。
 * 
 * 解决方案(新版的prosemirror已经解决这个问题了。这边按照prosemirror进行了修复)
 * 监听与keydown事件相同容器的compositionend事件，记录下时间compositionEndedAt
 * 在keydown事件触发时，查看isComposing属性以及在safari上判断keydown与compositionEndedAt的时间差
 * 
 * 参考资料 
 * https://www.w3.org/TR/uievents/#keys-IME
 * https://github.com/w3c/uievents/issues/202
 * https://github.com/ProseMirror/prosemirror-view/blob/b5420e17f2486e1633a2c06c0a6b25a60b276c5f/src/input.js#L389
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
 * 
 */

export class CompositionManager {
  private compositionEndedAt = -2e8

  isComposing(event: KeyboardEvent): boolean {
    if (event.isComposing) return true

    if (getBrowserName() === 'Safari') {
      const isComposing =
        Math.abs(event.timeStamp - this.compositionEndedAt) < 500
      this.compositionEndedAt = -2e8
      return isComposing
    }

    return false
  }

  constructor(container: HTMLElement) {
    container.addEventListener('compositionend', (e) => {
      this.compositionEndedAt = e.timeStamp
    })
  }
}
