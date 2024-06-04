import IconClose from '../assets/images/icon_close.svg';
import { css } from 'astroturf';
import { noop } from '../utils/F';
import { models } from '../utils/NutstoreSDK';
import { $t } from '../i18n';
import { AutoFocusInput } from './AutoFocusInput';
import { Notification } from '../utils/Notification';
import clipboardCopy from 'clipboard-copy';
export function ShareDialogContent(props) {
    const { SharingScope } = models.api;
    const shareScope = (() => {
        switch (true) {
            case props.sharePolicy.acl === SharingScope.Everyone:
                return $t('NUTFLOWY_SHARE_SCOPE__EVERYONE');
            case props.sharePolicy.acl === SharingScope.SignedIn:
                return $t('NUTFLOWY_SHARE_SCOPE__SIGNED_IN');
            case props.sharePolicy.acl === SharingScope.Invited:
                return $t('NUTFLOWY_SHARE_SCOPE__INVITED');
        }
        return '';
    })();
    const copyLink = () => {
        if (props.closeDialog)
            props.closeDialog();
        clipboardCopy(props.sharePolicy.url).then(() => {
            Notification.show({ text: $t('COPY_LINK_SUCCESS') });
        }).catch(() => {
            Notification.show({ text: $t('COPY_LINK_ERROR') });
        });
    };
    const shareScopeMessage = $t('NUTFLOWY_SHARE_SCOPE').replace('%s', shareScope);
    return (React.createElement("article", { className: ShareDialogContent.name },
        React.createElement("div", { className: `${ShareDialogContent.name}__head` },
            $t('NUTFLOWY_SHARE_FILE').replace('%s', props.fileName),
            typeof props.closeDialog !== 'function' ? null : (React.createElement(IconClose, { className: `${ShareDialogContent.name}__head-close`, onClick: props.closeDialog }))),
        React.createElement("div", { className: `${ShareDialogContent.name}__body` },
            React.createElement("p", { className: "copy-link-tip" }, $t('COPY_THEN_SEND_LINK_TO_FRIENDS')),
            React.createElement(AutoFocusInput, { type: "text", readOnly: true, className: `${ShareDialogContent.name}__input`, value: props.sharePolicy.url, onChange: noop }),
            React.createElement("p", { className: "share-scope-tip" }, shareScopeMessage),
            React.createElement("p", { className: "copy-link" },
                React.createElement("span", { onClick: copyLink }, $t('COPY_LINK'))))));
}
css `
  @import '../styles/mixins/text-ellipsis';
  
  .ShareFileButton__Modal {
    .Modal__overlay {
      background-color: rgba(0, 0, 0, .6);
    }
    
    .Modal__body {
      border-radius: 4px;
    }
  }

  .ShareDialogContent {
    &__head {
      $height: 50px;
      position: relative;
      height: $height;
      line-height: $height;
      border-bottom: 1px solid #d8d8d8;
      text-align: center;
      font-family: SourceHanSansCN;
      font-size: 16px;
      color: #626262;

      &-close {
        $size: 16px;
        position: absolute;
        top: ($height - $size) / 2;
        right: ($height - $size) / 2;
        width: $size;
        height: $size;
        cursor: pointer;
      }
    }
    
    &__body {
      padding: 0 40px;
      
      > p {
        margin: 0;
        font-size: 14px;
      }

      .copy-link-tip {
        margin-top: 32px;
        color: #575757;
      }

      .share-scope-tip {
        color: #626262;
        text-transform: capitalize;
      }

      .copy-link {
        margin: 40px 0 25px 0;
        text-align: right;

        span {
          color: #107ffc;
          cursor: pointer;
          
          &:hover {
            opacity: 0.75;
          }
        }
      }
    }

    &__input {
      display: block;
      width: 100%;
      -webkit-appearance: none;
      -moz-appearance: none;
      border-radius: 4px;
      border: 1px solid #3399ff;
      margin: 18px 0;
      padding: 8px;
      font-size: 14px;
      background: #fff;
      color: #575757;

      &:focus {
        outline: 0;
        box-shadow: 0 0 0 2px rgba(45, 140, 240, .2);
      }
    }
  }
`;
