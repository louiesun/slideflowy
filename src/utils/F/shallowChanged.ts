export function shallowChanged(objA, objB, compare, compareContext) {
    let ret = compare ? compare.call(compareContext, objA, objB) : undefined;
    if (ret !== undefined)
        return ret;
    if (objA === objB)
        return false;
    if (typeof objA !== 'object' || !objA || typeof objB !== 'object' || !objB) {
        return true;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
    if (keysA.length !== keysB.length) {
        return true;
    }
    // Test for A's keys different from B.
    for (const key of keysA) {
        if (!bHasOwnProperty(key)) {
            return key;
        }
        const valueA = objA[key];
        const valueB = objB[key];
        // prettier-ignore
        ret = compare ? compare.call(compareContext, valueA, valueB, key) : undefined;
        if (ret !== undefined)
            return ret;
        if (valueA !== valueB) {
            return key;
        }
    }
    return false;
}
/**
 * `shallowEqual` 和 `shallowChanged` 函数的帮助函数，帮助更简单地自定义
 * customer
 *
 * @example
 *
```js
const a = { other: 'xxx', node: { id: 1, content: 'xxx' } }
const b = { other: 'xxx', node: { id: 1, content: 'xxxx' } }

shallowEqual(a, b, evolve<Tree>({
  node: (a, b) => a.id !== b.id,
}))
```
 */
export function evolve(customer) {
    // 需要同时支持 shallowEqual 和 shallowChanged
    // shallowEqual 的类型里不允许 compare 返回 string
    // 所以我们这里把类型改成 any
    return (objA, objB, indexOrKey) => {
        if (!indexOrKey)
            return;
        const compare = customer[indexOrKey];
        if (!compare || typeof customer[indexOrKey] !== 'function')
            return;
        return compare(objA, objB, indexOrKey);
    };
}
export function logShallowChanged(propName, ...obj) {
    if (typeof propName === 'boolean') {
        console.log('shallowChanged: ', propName);
        return;
    }
    console.log('shallowChanged: ', propName, ...obj.map(o => o[propName]));
}
