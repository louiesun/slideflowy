import { connect } from 'react-redux'
import { Popover, PopoverProps } from '@nshq/react-popover'
import { selectors } from '../action_packs/project_node'

export type ProjectNodePopoverProps = PopoverProps

export const mapStateToProps = (state: any) => ({
  disabled: Object.keys(selectors.getDraggingNodeIds(state)).length > 0,
})

export const ProjectNodePopover = connect(mapStateToProps)(Popover)