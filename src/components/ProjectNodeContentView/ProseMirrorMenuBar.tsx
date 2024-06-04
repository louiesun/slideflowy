import classnames from 'classnames';
import { zipObj } from 'ramda';
import { schema, hasMark } from '../../services/ProseMirrorService';
import { renderMenuItems, availableColors, clearColor, } from './ProseMirrorMenuBarHelper';
import './ProseMirrorMenuBar.scss';
import { isCtrlPressed } from '../../utils/K';
import { createRestoreFocusElement } from './InnerProseMirrorEditorView';
export class ProseMirrorMenuBar extends React.PureComponent {
    static defaultProps = {
        style: {},
        onBlur: () => { },
    };
    state = {};
    containerRef = React.createRef();
    renderMenuItems = renderMenuItems;
    contains(element) {
        if (!this.containerRef.current)
            return false;
        return this.containerRef.current.contains(element);
    }
    /**
     * 处理一下期待 MenuBar 出现的位置，因为希望是顶上的小箭头
     * 对准对应位置
     */
    wrapPosition(pos) {
        return {
            // 气泡顶上的小箭头高度为 8px
            top: pos.top + 8,
            // 气泡顶上的小箭头宽度为 16px ，右移了 16px
            left: pos.left - 16 - 16 / 2,
        };
    }
    toggleBodyVisual(type) {
        const menuBodyVisible = this.state.menuBodyVisible === type ? undefined : type;
        this.setState({ menuBodyVisible });
        return menuBodyVisible;
    }
    markColor = (color) => (e) => {
        this.props.onApplyMark(schema.marks.color, { color });
        this.props.onEditorRetrieveFocus();
    };
    markBGColor = (BGColor) => (e) => {
        this.props.onApplyMark(schema.marks.BGColor, { BGColor });
        this.props.onEditorRetrieveFocus();
    };
    onEditorKeyDown(event) {
        if (!isCtrlPressed(event))
            return;
        if (event.key === 'u') {
            this.markHelpers.underline.toggleMark();
            return true;
        }
        if (event.key === 'i') {
            this.markHelpers.italic.toggleMark();
            return true;
        }
        if (event.key === 'b') {
            this.markHelpers.bold.toggleMark();
            return true;
        }
        if (event.key === 'd') {
            this.markHelpers.strikethrough.toggleMark();
        }
        return false;
    }
    markHelpers = zipObj(Object.keys(schema.marks), Object.keys(schema.marks).map(markName => {
        const markType = schema.marks[markName];
        const has = () => hasMark(markType)(this.props.editorState);
        return {
            hasMark: has,
            toggleMark: () => has()
                ? this.props.onCleanMark(markType)
                : this.props.onApplyMark(markType),
        };
    }));
    wrapMenuClickEvents(props = {}, title) {
        return {
            ...props,
            title,
        };
    }
    onCleanColor = () => {
        this.props.onCleanMark(schema.marks.color);
        this.props.onCleanMark(schema.marks.BGColor);
    };
    renderMenuItem({ className, title, ...props }) {
        return (React.createElement("div", { key: className, className: `ProseMirrorMenuBar__Item ProseMirrorMenuBar__Item--${className}`, ...props }, title ? (React.createElement("div", { className: "ProseMirrorMenuBar__ItemTooltip" }, title)) : null));
    }
    renderColorPanel() {
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { key: "font-color-row", className: "ProseMirrorMenuBar__ColorRow" }, availableColors.fontColor.map(c => this.renderColorCell(c))),
            React.createElement("div", { key: "background-color-row", className: "ProseMirrorMenuBar__ColorRow" }, availableColors.backgroundColor.map(c => this.renderBGColorCell(c)))));
    }
    renderColorCell(color) {
        if (color === clearColor) {
            return (React.createElement("span", { key: color, className: "ProseMirrorMenuBar__ColorRow__Clear", ...this.wrapMenuClickEvents({
                    onClick: this.onCleanColor,
                }) }));
        }
        return (React.createElement("span", { key: color, style: { color }, ...this.wrapMenuClickEvents({
                onClick: this.markColor(color),
            }) }, "A"));
    }
    renderBGColorCell(color) {
        return (React.createElement("span", { key: color, style: { color: '#0D0D0D', backgroundColor: color }, ...this.wrapMenuClickEvents({
                onClick: this.markBGColor(color),
            }) }, "A"));
    }
    render() {
        return createRestoreFocusElement(React.createElement("div", { ref: this.containerRef, className: "ProseMirrorMenuBar", style: this.props.style },
            React.createElement("div", { className: "ProseMirrorMenuBar__Header" }, this.renderMenuItems()),
            React.createElement("div", { style: !this.state.menuBodyVisible ? { display: 'none' } : {}, className: classnames([
                    'ProseMirrorMenuBar__Body',
                    `ProseMirrorMenuBar__Body--${this.state.menuBodyVisible}`,
                ]) }, this.state.menuBodyVisible === 'color'
                ? this.renderColorPanel()
                : null)));
    }
}
