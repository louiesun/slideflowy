import './ProseMirrorLinkEditor.scss';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import IconDone from './icon_done.svg';
import IconDelete from './icon_delete.svg';
import IconEdit from './icon_edit.svg';
import { useForwardedRef } from '../../utils/hooks/useForwardedRef';
const ClassName = 'ProseMirrorLinkEditor';
export const ProseMirrorLinkEditor = React.forwardRef((props, ref) => {
    const containerRef = useForwardedRef(ref);
    const textRef = useRef(null);
    const linkRef = useRef(null);
    const [editable, setEditable] = useState(props.editable);
    const { style, state, onDelete } = props;
    const onDone = () => {
        props.onDone(textRef.current?.value || '', linkRef.current?.value || '');
    };
    const onEdit = () => {
        setEditable(true);
    };
    const handleMouseDownOutside = useCallback((event) => {
        if (!(event.target instanceof Element))
            return;
        if (style.display === 'none')
            return;
        if (!containerRef.current?.contains(event.target)) {
            props.onBlur();
        }
    }, [style]);
    useEffect(() => {
        setEditable(props.editable);
        if (textRef.current)
            textRef.current.value = state.text;
        if (linkRef.current)
            linkRef.current.value = state.link;
        document.addEventListener('mousedown', handleMouseDownOutside);
        return () => {
            document.removeEventListener('mousedown', handleMouseDownOutside);
        };
    }, [props.editable, state, handleMouseDownOutside]);
    useEffect(() => {
        if (editable)
            linkRef.current?.focus();
    }, [editable]);
    return (React.createElement("div", { className: ClassName, ref: containerRef, style: style },
        React.createElement("div", { className: `${ClassName}__inputs` },
            editable && (React.createElement("div", { className: `${ClassName}__input` },
                React.createElement("div", { className: `${ClassName}__input-label` }, "\u6587\u672C"),
                React.createElement("input", { ref: textRef, defaultValue: state.text }))),
            React.createElement("div", { className: `${ClassName}__input` },
                editable && React.createElement("div", { className: `${ClassName}__input-label` }, "\u94FE\u63A5"),
                React.createElement("input", { ref: linkRef, defaultValue: state.link, readOnly: !editable }))),
        React.createElement("div", { className: `${ClassName}__operations` },
            React.createElement("div", { className: classNames([
                    `${ClassName}__operation`,
                    {
                        show: editable,
                    },
                ]), onClick: onDone },
                React.createElement(IconDone, null)),
            React.createElement("div", { className: classNames([
                    `${ClassName}__operation`,
                    {
                        show: !editable,
                    },
                ]), onClick: onEdit },
                React.createElement(IconEdit, null)),
            React.createElement("div", { className: classNames([
                    `${ClassName}__operation`,
                    {
                        show: !editable,
                    },
                ]), onClick: onDelete },
                React.createElement(IconDelete, null)))));
});
