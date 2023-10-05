import { ProjectNodeImageList } from '../containers/ProjectNodeImageList';
import { ProjectNodeContentView } from '../containers/ProjectNodeContentView';
import { ProjectNodeImageUploader } from '../containers/ProjectNodeImageUploader';
import { FocusContext } from './Selection/FocusContext';
export const ProjectNodeInner = (props) => {
    return (React.createElement(FocusContext.Consumer, null, (ctx) => (React.createElement(React.Fragment, null,
        React.createElement(ProjectNodeContentView, { nodeId: props.nodeId, focusCtx: ctx }),
        React.createElement(ProjectNodeImageList, { nodeId: props.nodeId, focusCtx: ctx }),
        React.createElement(ProjectNodeImageUploader, { nodeId: props.nodeId })))));
};
