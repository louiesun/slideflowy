import { useCallback, useState } from 'react'
import classNames from 'classnames'
import { ShareDialogContent } from '../../components/ShareDialogContent'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { State } from '../../action_packs/file'
import { useModal, ModalProps } from '../../components/Modal'
import { $t } from '../../i18n'
import { useInject } from '../../utils/di'
import { FileService } from '../../services/FileService'
import { models } from '../../utils/NutstoreSDK'
import './style.scss'

const name = 'ShareFileButton'

interface InnerShareFileButtonProps {
  fileName?: string
  onShareModalClose?: () => void
  modalRef?: ModalProps['bodyRef']
  children?: React.ReactNode
}

function InnerShareFileButton(props: InnerShareFileButtonProps) {
  const fileSerivce = useInject(FileService)

  const [isGenerating, setGenerating] = useState(false)

  const [policy, setPolicy] = useState<undefined | models.api.SharePolicy>()

  const renderContent = useCallback(
    (ctrl: useModal.Helpers) =>
      props.fileName &&
      policy && (
        <ShareDialogContent
          fileName={props.fileName}
          sharePolicy={policy}
          closeDialog={() => {
            ctrl.setVisible(false)
            props.onShareModalClose?.()
          }}
        />
      ),
    [props.fileName, policy, ShareDialogContent],
  )

  const [modalElement, modalCtrl] = useModal({
    portalClassName: `${name}__Modal`,
    // React 更新到 18 后这个地方会报错，并且此处应该是依赖类型声明有误的原因
    // 原本报错也并不影响实际运行，但是当编译到 nutstore-editors 时不允许报错，故最终采用 ignore
    // @ts-ignore
    children: renderContent,
    bodyRef: props.modalRef,
  })

  const onGenerateShareLink = useCallback(async () => {
    setGenerating(true)
    try {
      setPolicy(await fileSerivce.shareFile())
      modalCtrl.show()
    } catch {}
    setGenerating(false)
  }, [setGenerating, setPolicy, modalCtrl])

  const onClickShare = useCallback(() => {
    if (policy) {
      modalCtrl.show()
    } else if (!isGenerating) {
      void onGenerateShareLink()
    }
  }, [policy, isGenerating, onGenerateShareLink, modalCtrl])

  return (
    <div className={classNames(name, { disabled: isGenerating })}>
      <div onClick={onClickShare}>
        {isGenerating ? $t('NUTFLOWY_PREPARING') : $t('SHARE')}
      </div>
      {modalElement}
    </div>
  )
}

const mapStateToProps = (state: State) => ({
  fileName: state.nutstoreFile ? state.nutstoreFile.fileName : '',
})

const mapDispatchToProps = (dispatch: Dispatch) => ({})

export const ShareFileButton = connect(
  mapStateToProps,
  mapDispatchToProps,
)(InnerShareFileButton)
