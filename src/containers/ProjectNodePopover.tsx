import { connect } from 'react-redux';
import { Popover } from '@nshq/react-popover';
import { selectors } from '../action_packs/project_node';
export const mapStateToProps = (state) => ({
    disabled: Object.keys(selectors.getDraggingNodeIds(state)).length > 0,
});
export const ProjectNodePopover = connect(mapStateToProps)(Popover);
