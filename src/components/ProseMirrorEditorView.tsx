import { EditorView } from 'prosemirror-view';
import classNames from 'classnames';
import { assignRef } from '../utils/R';
export class ProseMirrorEditorView extends React.PureComponent {
    editorView;
    containerElem = null;
    containerReactNode = null;
    componentWillUnmount() {
        this.editorView && this.editorView.destroy();
        this.editorView = null;
        this.refreshEditorViewRef();
    }
    componentDidUpdate(prevProps) {
        if (this.editorView && prevProps.editorState !== this.props.editorState) {
            this.editorView.updateState(this.props.editorState);
        }
        if (this.editorView && (prevProps.editorProps !== this.props.editorProps || prevProps.onDispatchTransaction !== this.props.onDispatchTransaction)) {
            this.editorView.update({
                ...this.props.editorProps,
                state: this.props.editorState,
                dispatchTransaction: this.props.onDispatchTransaction,
            });
        }
    }
    contains(element) {
        if (!this.editorView)
            return false;
        return this.editorView.dom.contains(element);
    }
    render() {
        if (this.containerReactNode) {
            return this.containerReactNode;
        }
        return (this.containerReactNode = (React.createElement("div", { className: classNames('ProseMirrorEditorView', this.props.className), ref: this.createEditorView, ...this.props.containerProps })));
    }
    createEditorView = (element) => {
        this.containerElem = element;
        if (!element) {
            this.editorView = null;
            return;
        }
        this.editorView = new EditorView(element, {
            ...this.props.editorProps,
            state: this.props.editorState,
            dispatchTransaction: this.props.onDispatchTransaction,
        });
        this.refreshEditorViewRef();
    };
    refreshEditorViewRef() {
        assignRef(this.editorView, this.props.editorViewRef);
    }
}
