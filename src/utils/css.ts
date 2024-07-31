import _classnames from 'classnames'
import { ClassValue } from 'classnames/types'

/**
 * @return 返回一个新函数，使用方式和 npm 包 classnames 一致，唯一的区别是第一个
 *     参数生成的所有类名前面会添加 `componentName` 前缀
 */
export const c = (
  componentName: string,
  classnameGenerator: c.ClassnameGenerator = _classnames,
): c.ClassnameGenerator =>
  function classnames(firstClassName, ...rest): string {
    if (firstClassName != null) {
      const fstCls = _classnames(firstClassName)
        .split(' ')
        .filter(Boolean)
        .map((n) => `${componentName}${n}`)
      return classnameGenerator(fstCls, ...rest)
    } else {
      return classnameGenerator(componentName)
    }
  }
export namespace c {
  export type ClassnameGenerator = (...classes: ClassValue[]) => string
}
