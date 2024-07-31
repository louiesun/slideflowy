import { useState, useCallback } from 'react'
import { $t } from '../../i18n'
import { Modal } from '../Modal'
import CloseIcon from '../../assets/images/icon_close.svg'
import './HttpLinkModal.scss'

interface HttpLinkModalProps {
  visible: boolean
  onHideModal: () => void
  onHttpLinkSubmitted: (link: string | null) => void
}

export function HttpLinkModal(props: HttpLinkModalProps) {
  const [linkValue, setLinkValue] = useState('')

  const [warnningVisible, setWarningVisible] = useState(false)

  const onHttpLinkSubmitted = useCallback(() => {
    if (isValidLink(linkValue)) {
      props.onHttpLinkSubmitted(linkValue)
    } else {
      setWarningVisible(true)
    }

    function isValidLink(val: string) {
      return /^(http(s)?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/i.test(val)
    }
  }, [setWarningVisible, props.onHttpLinkSubmitted, linkValue])

  return (
    <Modal
      visible={props.visible}
      onVisibleChange={visible => visible || props.onHideModal()}
    >
      <div className="HttpLinkModal">
        <CloseIcon onClick={props.onHideModal} className="close-icon" />
        <h3 className="title">{$t('NUTFOLWY_IMAGE_LINK')}</h3>
        <div className="HttpLinkModal-main">
          <p className="HttpLinkModal-main__hint">
            {$t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK')}:
          </p>
          <input
            placeholder={$t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK_ENTER')}
            className="HttpLinkModal-main__text"
            type="text"
            value={linkValue}
            onChange={e => setLinkValue(e.currentTarget.value)}
            onKeyDown={e => e.key === 'Enter' && onHttpLinkSubmitted()}
          />
          <p className="HttpLinkModal-main__error">
            {warnningVisible
              ? $t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK_INCORRECT')
              : ''}
          </p>
        </div>
        <div className="HttpLinkModal-footer">
          <div
            onClick={props.onHideModal}
            className="HttpLinkModal-button HttpLinkModal-button__cancel"
          >
            {$t('NUTFOLWY_CANCEL')}
          </div>
          <div
            onClick={onHttpLinkSubmitted}
            className="HttpLinkModal-button HttpLinkModal-button__confirm"
          >
            {$t('NUTFOLWY_CONFIRM')}
          </div>
        </div>
      </div>
    </Modal>
  )
}
