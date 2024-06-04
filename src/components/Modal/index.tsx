export * from '@c4605/react-modal';
import { css } from 'astroturf';
css `
  // 当模态对话框打开的时候，给程序的根元素创建一个层叠上下文，这样模态对话框的
  // portal 就不会被程序主体设置了 z-index 的元素给盖住了（比如 AppHeader）
  //
  // 不能给 #root 用 transform: scale(1) ，这会导致顶栏的 position: fixed 跟随效
  // 果失效，变成类似 static 的效果
  .Modal__html--visible #root {
    will-change: opacity;
  }

  .Modal__backdrop,
  .Modal__body {
    position: fixed;
  }
  .Modal__backdrop {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgb(0, 0, 0, 0.2);
  }
`;
