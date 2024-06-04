import { useCallback, useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { ShareDialogContent } from '../../components/ShareDialogContent';
import { connect } from 'react-redux';
import { useModal } from '../../components/Modal';
import { $t } from '../../i18n';
import { useInject } from '../../utils/di';
import { FileService } from '../../services/FileService';
const name = 'ShareFileButton';
function InnerShareFileButton(props) {
    const fileSerivce = useInject(FileService);
    const [isGenerating, setGenerating] = useState(false);
    const [policy, setPolicy] = useState();
    const renderContent = useCallback((ctrl) => props.fileName &&
        policy && (React.createElement(ShareDialogContent, { fileName: props.fileName, sharePolicy: policy, closeDialog: () => {
            ctrl.setVisible(false);
            props.onShareModalClose?.();
        } })), [props.fileName, policy, ShareDialogContent]);
    const [modalElement, modalCtrl] = useModal({
        portalClassName: `${name}__Modal`,
        // React 更新到 18 后这个地方会报错，并且此处应该是依赖类型声明有误的原因
        // 原本报错也并不影响实际运行，但是当编译到 nutstore-editors 时不允许报错，故最终采用 ignore
        // @ts-ignore
        children: renderContent,
        bodyRef: props.modalRef
    });
    const onGenerateShareLink = useCallback(async () => {
        setGenerating(true);
        try {
            setPolicy(await fileSerivce.shareFile());
            modalCtrl.show();
        }
        catch { }
        setGenerating(false);
    }, [setGenerating, setPolicy, modalCtrl]);
    const onClickShare = useCallback(() => {
        if (policy) {
            modalCtrl.show();
        }
        else if (!isGenerating) {
            void onGenerateShareLink();
        }
    }, [policy, isGenerating, onGenerateShareLink, modalCtrl]);
    return (React.createElement("div", { className: classNames(name, { disabled: isGenerating }) },
        React.createElement("div", { onClick: onClickShare }, isGenerating ?
            $t('NUTFLOWY_PREPARING') :
            $t('SHARE')),
        modalElement));
}
const mapStateToProps = (state) => ({
    fileName: state.nutstoreFile ? state.nutstoreFile.fileName : '',
});
const mapDispatchToProps = (dispatch) => ({});
export const ShareFileButton = connect(mapStateToProps, mapDispatchToProps)(InnerShareFileButton);
css `
  .${name} {
    &__Modal {
      .Modal__body {
        max-width: 576px;
        width: calc(100% - 72px);
        border-radius: 6px;
        background: #fff;
      }
    }
  }
`;
