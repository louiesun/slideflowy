import { identity } from '../../utils/F';
export const ProjectNodeListContext = React.createContext({
    registerListItem: identity,
    onDragStart: identity,
    onDragEnd: identity,
});
