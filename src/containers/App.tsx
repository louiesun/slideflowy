import { connect } from 'react-redux';
import { compose } from 'ramda';
import { hot } from 'react-hot-loader';
import { App as Component } from '../components/App';
import { projectNode, file, slide, app } from '../action_packs';
export const mapStateToProps = (state) => {
    // prettier-ignore
    const { selectedRootNodeId, getChildNodes, findParentTree } = projectNode.selectors;
    const rootNodeId = selectedRootNodeId(state);
    const parentTree = rootNodeId ? findParentTree(rootNodeId, state) : [];
    const nodes = rootNodeId
        ? getChildNodes({ nodeId: rootNodeId }, state)
        : getChildNodes({}, state);
    const previewingFile = file.selectors.previewingFile(state);
    return {
        fileName: file.selectors.getFileName(state),
        appendNodeIconVisible: !nodes.length && !previewingFile,
        previewingFile,
        selectedRootNodeId: rootNodeId,
        parents: parentTree,
        node: parentTree[parentTree.length - 1],
        requestingFileInfo: state.requestingFileInfo,
        slideBG: slide.selectors.bg(state),
        rootNodeIds: state.rootNodeIds,
        nodes: state.nodes,
        slideTabWindow: state.slideTabWindow,
        isSlideOpened: Boolean(state.isSlideOpened),
    };
};
export const mapDispatchToProps = (dispatch) => ({
    onSaveFile() {
        dispatch(file.actionCreators.saveFile(undefined));
    },
    onSaveAndQuitFile() {
        dispatch(file.actionCreators.saveAndQuitFile());
    },
    onNodeSelectAsRoot(info) {
        dispatch(projectNode.actionCreators.selectAsRoot({ id: info.id }));
    },
    onParentAppendNode(parentId) {
        dispatch(projectNode.actionCreators.addNode({ parentId }));
    },
    onAddId(id) {
        dispatch(app.actionCreators.onAddId(id));
    },
    onToggleSlide(isSlideOpened) {
        dispatch(app.actionCreators.onToggleSlide(isSlideOpened));
    },
    onChangeCurrentIndex(currentIndex) {
        dispatch(app.actionCreators.onChangeCurrentIndex(currentIndex));
    },
    setBG(bg) {
        dispatch(slide.actionCreators.setBG(bg));
    }
});
const connector = connect(mapStateToProps, mapDispatchToProps);
export const App = compose(hot(module), connector)(Component);
