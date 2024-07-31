import { baseBrowserName } from '../../utils/Platform'

export const dragDropContextOptions = { window }

// 火狐中国版有一个自带插件叫 “附加组件管理器” ，里面内置一个叫做拖拽手势
// 的功能，这个功能会在网页上注入一段代码，在 window 上监听 dnd 相关事件，
// 并且在 drop 事件的处理函数里阻止冒泡
// react-dnd 默认是在 window 上监听的 dnd 事件，这个时候就会收不到 drop 事件
// 所以需要把注册事件的函数代理到 body 上，在插件之前收到 drop 事件
if (baseBrowserName() === 'Firefox') {
  const shittyCNFirefoxBuiltinAddonDndWorkaroundWindow = new Proxy(window, {
    get: (obj, prop) => {
      if (prop === 'addEventListener') {
        return obj.document.body.addEventListener.bind(obj.document.body)
      } else {
        const res = obj[prop]
        if (typeof res === 'function') {
          return function(this: any) {
            if (!this || this === shittyCNFirefoxBuiltinAddonDndWorkaroundWindow) {
              return res.apply(obj, arguments)
            } else {
              return res.apply(this, arguments)
            }
          }
        } else {
          return res
        }
      }
    },
  })

  dragDropContextOptions.window = shittyCNFirefoxBuiltinAddonDndWorkaroundWindow
}
