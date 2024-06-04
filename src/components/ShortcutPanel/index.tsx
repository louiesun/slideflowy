import classnames from 'classnames';
import { divideEvery } from '../../utils/F';
import { osName } from '../../utils/Platform';
import { ShortcutService } from '../../services/ShortcutService';
import { $t } from '../../i18n';
import './style.scss';
import { useInject } from '../../utils/di';
import { useCallback, useEffect, useState, useMemo } from 'react';
function useShortcutChangedTime() {
    const manager = useInject(ShortcutService);
    const [shortcutChangedAt, shortcutChanged] = useState(Date.now());
    useEffect(() => {
        /**
         * 在调用 useState 和 useEffect 的回调执行之间会有一段空隙时间，这段时间里
         * manager 可能会注册一些新的快捷键，对比这之间的变化的逻辑写起来有点麻烦
         * ，而大部分快捷键又恰好是这之间注册的，所以干脆直接触发一次渲染
         */
        shortcutChanged(Date.now());
        return manager.on('add', () => {
            shortcutChanged(Date.now());
        });
    }, [manager, shortcutChanged]);
    return shortcutChangedAt;
}
export function ShortcutPanel(props) {
    const manager = useInject(ShortcutService);
    const shortcutChangedAt = useShortcutChangedTime();
    const shortcutList = useMemo(() => manager.map(({ name, shortcut, info }) => !props.inPreviewMode || info.safety
        ? renderShortcutItem(manager, name, shortcut)
        : null), [shortcutChangedAt]);
    const toggleOpen = useCallback(() => props.onVisibleChanged(!props.visible), [
        props.onVisibleChanged,
        props.visible,
    ]);
    return (React.createElement("div", { className: classnames([
            'ShortcutPanel',
            {
                'ShortcutPanel--opened': props.visible,
            },
        ]) },
        React.createElement("h3", { className: "ShortcutPanel__title" }, $t('NUTFLOWY_SHORTCUT_LIST')),
        shortcutList,
        React.createElement("button", { onClick: toggleOpen, className: "ShortcutPanel__close-panel" })));
}
function renderShortcutItem(manager, name, shortcut) {
    return (React.createElement("dl", { key: name, className: "ShortcutPanel__item" },
        React.createElement("dt", { className: "ShortcutPanel__name" }, name),
        React.createElement("dd", { title: manager.readable(shortcut, 'text').join(' + '), className: "ShortcutPanel__detail" }, renderDisplayable(manager, shortcut))));
}
function renderDisplayable(manager, shortcut) {
    const kbds = manager
        .readable(shortcut, 'symbol')
        .map(key => React.createElement("kbd", { key: key }, key));
    if (osName() === 'macOS') {
        return kbds;
    }
    else {
        return divideEvery(1, '+', kbds);
    }
}
