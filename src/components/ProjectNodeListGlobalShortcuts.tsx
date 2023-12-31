import { __decorate, __metadata } from "tslib";
import { Inject } from 'react.di';
import { osName } from '../utils/Platform';
import { $t } from '../i18n';
import { inEditarea } from '../utils/DOM';
import { ShortcutService } from '../services/ShortcutService';
export const ClipboardMimeType = 'application/x-nutsflowy-clipboard-data';
export class ProjectNodeListGlobalShortcuts extends React.PureComponent {
    shortcutManager;
    osName = osName();
    expanded = true;
    componentDidMount() {
        // 被嵌套在 iframe 里的情况下，刚打开网页时整个 window 都不会获得
        // 焦点，因此也会收不到 ctrl-a 快捷键的事件
        window.focus();
        document.addEventListener('keydown', this.onKeyboardPressed, false);
        document.addEventListener('copy', this.onCopySelectedNodes, false);
        document.addEventListener('cut', this.onCutSelectedNodes, false);
        if (this.osName === 'macOS') {
            this.shortcutManager.registerShortcut('undo', $t('NUTFLOWY_UNDO'), {
                meta: true,
                key: 'z',
            });
            this.shortcutManager.registerShortcut('redo', $t('NUTFLOWY_REDO'), {
                meta: true,
                shift: true,
                key: 'z',
            });
        }
        else {
            this.shortcutManager.registerShortcut('undo', $t('NUTFLOWY_UNDO'), {
                ctrl: true,
                key: 'z',
            });
            this.shortcutManager.registerShortcut('redo', $t('NUTFLOWY_REDO'), {
                ctrl: true,
                key: 'y',
            });
        }
        const ctrl = this.osName !== 'macOS';
        this.shortcutManager.registerShortcut('save', $t('SAVE'), {
            meta: !ctrl,
            ctrl,
            key: 's',
        });
        this.shortcutManager.registerShortcut('copy', $t('COPY'), {
            meta: !ctrl,
            ctrl,
            key: 'c',
        }, { safety: true });
        this.shortcutManager.registerShortcut('selectAll', $t('NUTFLOWY_SELECT_ALL_NODES'), { meta: !ctrl, ctrl, key: 'a' }, { safety: true });
        this.shortcutManager.registerShortcut('cut', $t('NUTFLOWY_CUT'), {
            meta: !ctrl,
            ctrl,
            key: 'x',
        });
        this.shortcutManager.registerShortcut('paste', $t('NUTFLOWY_PASTE'), {
            meta: !ctrl,
            ctrl,
            key: 'v',
        });
        this.shortcutManager.registerShortcut('delete', $t('DELETE'), {
            ctrl: true,
            shift: true,
            key: 'Backspace',
        });
        this.shortcutManager.registerShortcut('cancelEdit', $t('NUTFLOWY_CANCEL_EDIT'), { key: 'Escape' });
        this.shortcutManager.registerShortcut('indent', $t('NUTFLOWY_INDENT'), {
            key: 'Tab',
        });
        this.shortcutManager.registerShortcut('outdent', $t('NUTFLOWY_OUTDENT'), {
            shift: true,
            key: 'Tab',
        });
        const modifierKeysOptions = osName() === 'macOS' ? { meta: true } : { ctrl: true };
        this.shortcutManager.registerShortcut('richTextBold', $t('NUTFLOWY_RICHTEXT_MENUITEM_BOLD'), {
            ...modifierKeysOptions,
            key: 'B',
        });
        this.shortcutManager.registerShortcut('richTextItalic', $t('NUTFLOWY_RICHTEXT_MENUITEM_ITALIC'), {
            ...modifierKeysOptions,
            key: 'I',
        });
        this.shortcutManager.registerShortcut('richTextUnderline', $t('NUTFLOWY_RICHTEXT_MENUITEM_UNDERLINE'), {
            ...modifierKeysOptions,
            key: 'U',
        });
        this.shortcutManager.registerShortcut('textWrapping', $t('NUTFLOWY_TEXT_WRAPPING'), {
            ...modifierKeysOptions,
            key: '\u21B5',
        });
        this.shortcutManager.registerShortcut('expandOrCollapseAll', $t('NUTFLOWY_EXPAND_OR_COLLAPSE_ALL'), {
            meta: !ctrl,
            alt: ctrl,
            shift: true,
            key: '.',
        }, { safety: true });
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyboardPressed, false);
        document.removeEventListener('copy', this.onCopySelectedNodes, false);
        document.removeEventListener('cut', this.onCutSelectedNodes, false);
    }
    render() {
        return this.props.children;
    }
    onKeyboardPressed = (event) => {
        if (event.key === 'Backspace' && !inEditarea(event.target)) {
            // 防止触发历史后退功能
            event.preventDefault();
        }
        // (ctrl|cmd)-s 保存
        if (this.props.editable &&
            event.key === 's' &&
            (this.osName === 'macOS' ? event.metaKey : event.ctrlKey)) {
            this.props.onSaveFile();
            event.preventDefault();
            return;
        }
        // 按 Backspace/Delete 可以删除选中的节点
        if (this.props.selectedNodes.length &&
            this.props.editable &&
            (event.key === 'Backspace' || event.key === 'Delete')) {
            this.props.onDeleteNode(this.props.selectedNodes);
            return;
        }
        // Cmd-a/Ctrl-a 选中所有节点
        if (!inEditarea(event.target) &&
            event.key === 'a' &&
            ((this.osName === 'macOS' && event.metaKey) || event.ctrlKey)) {
            event.preventDefault();
            this.props.onSelectAllNodes();
            return;
        }
        // Cmd-Shift-z/Ctrl-Y 重做
        if (this.props.editable &&
            ((this.osName === 'macOS' &&
                event.metaKey &&
                event.shiftKey &&
                event.key === 'z') ||
                (event.ctrlKey && event.key === 'y'))) {
            this.props.onRedo();
            return;
        }
        // Cmd-z/Ctrl-z 撤销
        if (this.props.editable &&
            event.key === 'z' &&
            ((this.osName === 'macOS' && event.metaKey) || event.ctrlKey)) {
            this.props.onUndo();
            return;
        }
        // Cmd-Shift-./Alt-Shift-.全部展开/折叠
        if (event.code === 'Period' &&
            ((this.osName === 'macOS' && event.metaKey) || event.altKey) &&
            event.shiftKey) {
            this.expanded ? this.props.onCollapseAll() : this.props.onExpandAll();
            this.expanded = !this.expanded;
        }
    };
    onCopySelectedNodes = (event) => {
        if (!this.props.selectedNodes.length)
            return;
        this.props.onCopySelectedNodes(event);
    };
    onCutSelectedNodes = (event) => {
        if (!this.props.selectedNodes.length)
            return;
        if (!this.props.editable)
            return;
        this.props.onCutSelectedNodes(event);
    };
}
__decorate([
    Inject,
    __metadata("design:type", ShortcutService)
], ProjectNodeListGlobalShortcuts.prototype, "shortcutManager", void 0);
