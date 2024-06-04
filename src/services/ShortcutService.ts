import { __decorate } from "tslib";
import { osName } from '../utils/Platform';
import { BooleanT } from '../utils/F';
import { injectable } from 'inversify';
import { EventBus } from '../utils/EventBus';
const commonKbdSymbolMap = {
    arrowup: '\u2191',
    arrowdown: '\u2193',
};
const macKbdSymbolMap = {
    ...commonKbdSymbolMap,
    meta: '\u2318',
    ctrl: '\u2303',
    shift: '\u21E7',
    alt: '\u2325',
    tab: '\u21E5',
    enter: '\u21B5',
    capslock: '\u21EA',
    backspace: '\u232B',
};
const windowsKbdNameMap = {
    meta: 'Win',
};
const macosKbdNameMap = {
    meta: 'Command',
    ctrl: 'Control',
    alt: 'Option',
};
let ShortcutService = class ShortcutService extends EventBus {
    modifierKeys = [
        'meta',
        'ctrl',
        'alt',
        'shift',
        'key',
    ];
    shortcuts = {};
    registerShortcut(id, name, shortcut, info = {}) {
        const item = { id, name, shortcut, info };
        this.shortcuts[id] = item;
        this.emit('add', item);
    }
    readable(shortcut, style = 'symbol') {
        return this.modifierKeys
            .map(k => !shortcut[k] ? null : this.transformSymbol(k, shortcut, style))
            .filter(BooleanT());
    }
    render(id, style = 'symbol') {
        const shortcutItem = this.shortcuts[id];
        if (!shortcutItem)
            return '';
        const kbds = this.readable(shortcutItem.shortcut);
        if (osName() === 'macOS') {
            return kbds.join('');
        }
        else {
            return kbds.join(' + ');
        }
    }
    map(f) {
        return Object.keys(this.shortcuts).map(id => f(this.shortcuts[id], id));
    }
    transformSymbol(type, shortcut, style) {
        let res = type === 'key' ? shortcut.key : type;
        const osname = osName();
        if (style === 'symbol') {
            if (osname === 'macOS') {
                res = macKbdSymbolMap[res.toLowerCase()] || res;
            }
            else {
                res = commonKbdSymbolMap[res.toLowerCase()] || res;
            }
        }
        else {
            if (osname === 'macOS') {
                res = macosKbdNameMap[res.toLowerCase()] || res;
            }
            else if (osname === 'Windows') {
                res = windowsKbdNameMap[res.toLowerCase()] || res;
            }
        }
        return res[0].toUpperCase() + res.toLowerCase().slice(1);
    }
};
ShortcutService = __decorate([
    injectable()
], ShortcutService);
export { ShortcutService };
