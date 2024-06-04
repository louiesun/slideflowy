import { connect } from 'react-redux';
import { file, nodeEdit } from '../action_packs';
import { FocusContextProvider as Component } from '../components/Selection/FocusContext';
export const mapStateToProps = (state) => ({
    editable: !file.selectors.previewingFile(state),
});
export const mapDispatchToProps = (dispatch) => ({
    restoreEditorAnchor(id, anchor) {
        dispatch(nodeEdit.actionCreators.restoreEditorAnchor({
            id,
            anchor,
        }));
    },
    restoreImgFocus(id, imgUrl) {
        dispatch(nodeEdit.actionCreators.restoreImgFocus({
            id,
            imgUrl,
        }));
    },
});
export const FocusContextProvider = connect(mapStateToProps, mapDispatchToProps)(Component);
