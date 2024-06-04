import { useContext } from 'react';
import { ProjectNodeImageList } from '../containers/ProjectNodeImageList';
import { ProjectNodeContentView } from '../containers/ProjectNodeContentView';
import { ProjectNodeImageUploader } from '../containers/ProjectNodeImageUploader';
import { FocusContext } from './Selection/FocusContext';
export const ProjectNodeInner = props => {
    const ctx = useContext(FocusContext);
    return (React.createElement(React.Fragment, null,
        React.createElement(ProjectNodeContentView, { nodeId: props.nodeId, storeAnchor: ctx.storeAnchor }),
        React.createElement(ProjectNodeImageList, { nodeId: props.nodeId, selected: props.selected, storeImgUrl: ctx.storeImgUrl }),
        React.createElement(ProjectNodeImageUploader, { nodeId: props.nodeId })));
};
