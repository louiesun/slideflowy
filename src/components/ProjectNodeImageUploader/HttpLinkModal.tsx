import { useState, useCallback } from 'react';
import { css } from 'astroturf';
import { $t } from '../../i18n';
import { Modal } from '../Modal';
import CloseIcon from '../../assets/images/icon_close.svg';
export function HttpLinkModal(props) {
    const [linkValue, setLinkValue] = useState('');
    const [warnningVisible, setWarningVisible] = useState(false);
    const onHttpLinkSubmitted = useCallback(() => {
        if (isValidLink(linkValue)) {
            props.onHttpLinkSubmitted(linkValue);
        }
        else {
            setWarningVisible(true);
        }
        function isValidLink(val) {
            return /^(http(s)?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/i.test(val);
        }
    }, [setWarningVisible, props.onHttpLinkSubmitted, linkValue]);
    return (React.createElement(Modal, { visible: props.visible, onVisibleChange: (visible) => visible || props.onHideModal() },
        React.createElement("div", { className: "HttpLinkModal" },
            React.createElement(CloseIcon, { onClick: props.onHideModal, className: "close-icon" }),
            React.createElement("h3", { className: "title" }, $t('NUTFOLWY_IMAGE_LINK')),
            React.createElement("div", { className: "HttpLinkModal-main" },
                React.createElement("p", { className: "HttpLinkModal-main__hint" },
                    $t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK'),
                    ":"),
                React.createElement("input", { placeholder: $t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK_ENTER'), className: "HttpLinkModal-main__text", type: "text", value: linkValue, onChange: (e) => setLinkValue(e.currentTarget.value), onKeyDown: (e) => e.key === 'Enter' && onHttpLinkSubmitted() }),
                React.createElement("p", { className: "HttpLinkModal-main__error" }, warnningVisible
                    ? $t('NUTFOLWY_IMAGE_TIP_IMAGE_LINK_INCORRECT')
                    : '')),
            React.createElement("div", { className: "HttpLinkModal-footer" },
                React.createElement("div", { onClick: props.onHideModal, className: "HttpLinkModal-button HttpLinkModal-button__cancel" }, $t('NUTFOLWY_CANCEL')),
                React.createElement("div", { onClick: onHttpLinkSubmitted, className: "HttpLinkModal-button HttpLinkModal-button__confirm" }, $t('NUTFOLWY_CONFIRM'))))));
}
css `
  .HttpLinkModal {
    padding: 24px 46px 40px;
    width: 540px;
    background: #fff;
    border-radius: 12px;
    .close-icon {
      position: absolute;
      right: 20px;
      top: 20px;
      cursor: pointer;
      width: 20px;
      height: 20px;
    }
    > h3 {
      font-size: 18px;
      font-weight: 400;
      color: #333;
      margin: 0;
      text-align: center;
    }
    .HttpLinkModal-main {
      &__hint {
        line-height: 24px;
        font-size: 18px;
        font-weight: 400;
        color: #707070;
      }
      &__text {
        text-indent: 16px;
        width: 100%;
        height: 40px;
        outline: none;
      }
      &__error {
        line-height: 32px;
        color: #ff6868;
        font-size: 14px;
        font-weight: 400;
        text-indent: 16px;
      }
    }
    .HttpLinkModal-footer {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }
    .HttpLinkModal-button {
      padding: 0 16px;
      height: 40px;
      border-radius: 4px;
      text-align: center;
      line-height: 40px;
      cursor: pointer;
      text-transform: uppercase;
      &__confirm {
        background: #3184ee;
        color: #fff;
      }
      &__cancel {
        margin-right: 16px;
        color: #b7b7b7;
        border: 1px solid #b7b7b7;
      }
    }
  }
`;
