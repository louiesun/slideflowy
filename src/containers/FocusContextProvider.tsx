import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { file, nodeEdit } from '../action_packs'
import { FocusContextProvider as Component } from '../components/Selection/FocusContext'
import { IProjectNode } from '../types'

export const mapStateToProps = (state: any) => ({
  editable: !file.selectors.previewingFile(state),
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  restoreEditorAnchor(id: IProjectNode['id'], anchor: number) {
    dispatch(
      nodeEdit.actionCreators.restoreEditorAnchor({
        id,
        anchor,
      }),
    )
  },
  restoreImgFocus(id: IProjectNode['id'], imgUrl: string) {
    dispatch(
      nodeEdit.actionCreators.restoreImgFocus({
        id,
        imgUrl,
      }),
    )
  },
})

export const FocusContextProvider = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component)
