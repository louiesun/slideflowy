import { connect } from 'react-redux';
import { Popover } from '@c4605/react-popover';
import { selectors } from '../action_packs/project_node';
export const mapStateToProps = (state) => ({
    disabled: selectors.getDraggingNodeIds(state).length > 0,
});
export const ProjectNodePopover = connect(mapStateToProps)(Popover);
