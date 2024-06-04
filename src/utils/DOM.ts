export const inEditarea = (obj) => {
    if (!(obj instanceof HTMLElement))
        return false;
    const tagName = obj.tagName.toLowerCase();
    return (tagName === 'input' ||
        tagName === 'textarea' ||
        obj.closest('[contenteditable]'));
};
export function getElementRevPosRect(elem) {
    if (!elem)
        return;
    return elem.getBoundingClientRect();
}
export function getElementAbsPosRect(elem) {
    if (!elem)
        return;
    const { scrollingElement } = document;
    if (!scrollingElement)
        return;
    const elemRevRect = getElementRevPosRect(elem);
    const elemPosTop = scrollingElement.scrollTop + elemRevRect.top;
    const elemPosLeft = scrollingElement.scrollLeft + elemRevRect.left;
    return {
        ...elemRevRect,
        top: elemPosTop,
        left: elemPosLeft,
        bottom: elemPosTop + elemRevRect.height,
        right: elemPosLeft + elemRevRect.width,
    };
}
/**
 * 根据 MouseEvent 获取鼠标相对于视口（viewport）的位置
 */
export function getMouseBoundingPos(event) {
    return {
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
    };
}
