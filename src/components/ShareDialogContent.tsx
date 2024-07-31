import IconClose from '../assets/images/icon_close.svg'
import { noop } from '../utils/F'
import { models } from '../utils/NutstoreSDK'
import { $t } from '../i18n'
import { AutoFocusInput } from './AutoFocusInput'
import { Notification } from '../utils/Notification'
import clipboardCopy from 'clipboard-copy'
import './ShareDialogContent.scss'

export interface ShareDialogContentProps {
  fileName: string
  sharePolicy: models.api.SharePolicy
  closeDialog?: () => void
}

export function ShareDialogContent(props: ShareDialogContentProps) {
  const { SharingScope } = models.api
  const shareScope = (() => {
    switch (true) {
      case props.sharePolicy.acl === SharingScope.Everyone:
        return $t('NUTFLOWY_SHARE_SCOPE__EVERYONE')
      case props.sharePolicy.acl === SharingScope.SignedIn:
        return $t('NUTFLOWY_SHARE_SCOPE__SIGNED_IN')
      case props.sharePolicy.acl === SharingScope.Invited:
        return $t('NUTFLOWY_SHARE_SCOPE__INVITED')
    }
    return ''
  })()

  const copyLink = () => {
    if (props.closeDialog) props.closeDialog()
    clipboardCopy(props.sharePolicy.url)
      .then(() => {
        Notification.show({ text: $t('COPY_LINK_SUCCESS') })
      })
      .catch(() => {
        Notification.show({ text: $t('COPY_LINK_ERROR') })
      })
  }

  const shareScopeMessage = $t('NUTFLOWY_SHARE_SCOPE').replace('%s', shareScope)

  return (
    <article className={ShareDialogContent.name}>
      <div className={`${ShareDialogContent.name}__head`}>
        {$t('NUTFLOWY_SHARE_FILE').replace('%s', props.fileName)}
        {typeof props.closeDialog !== 'function' ? null : (
          <IconClose
            className={`${ShareDialogContent.name}__head-close`}
            onClick={props.closeDialog}
          />
        )}
      </div>
      <div className={`${ShareDialogContent.name}__body`}>
        <p className="copy-link-tip">{$t('COPY_THEN_SEND_LINK_TO_FRIENDS')}</p>
        <AutoFocusInput
          type="text"
          readOnly={true}
          className={`${ShareDialogContent.name}__input`}
          value={props.sharePolicy.url}
          onChange={noop}
        />
        <p className="share-scope-tip">{shareScopeMessage}</p>
        <p className="copy-link">
          <span onClick={copyLink}>{$t('COPY_LINK')}</span>
        </p>
      </div>
    </article>
  )
}
