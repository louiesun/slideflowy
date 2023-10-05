import { css } from 'astroturf';
import { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { $t } from '../../i18n';
import CloseIcon from '../../assets/images/icon_close.svg';
import { FileService } from '../../services/FileService';
import { useInject } from '../../utils/di';
import { ParasiticMedium, isLanding } from '../../utils/NutstoreSDK';
import { NutstoreSDK as NutstoreSDKET } from '../../utils/ErrorTranslator';
import { Modal } from '../Modal';
import { ProgressBar } from '../ProgressBar';
import UploadImageIcon from './icon_upload_image.svg';
import { getClipboardImageFile } from '../../services/ProjectNodeService';
import { uploadedImageFileToBase64URL } from '../../utils/advertisingPagePreviewDemo';
const UPLOAD_INPUT_ACCEPT = ParasiticMedium.fileExceededLimit(ParasiticMedium.Type.Image).type.join(',');
export function ParasiticMediumModal(props) {
    const fileService = useInject(FileService);
    // 上传进度
    const [progress, setProgress] = useState(0);
    // 拖拽状态
    const [isDragOver, setDragOver] = useState(false);
    // 上传状态
    const [isUploading, setIsUploading] = useState(false);
    // 通过各个途径添加文件后统一处理图片上传
    const uploadFile = useCallback(async (file) => {
        const isAdDemo = isLanding();
        setIsUploading(true);
        let result;
        if (isAdDemo) {
            result = await uploadedImageFileToBase64URL(file);
        }
        else {
            // fileService.uploadImage 里已经做了错误处理了，所以这里就不需要做了
            result = await fileService
                .uploadImage(file, (progressEvent) => {
                setProgress(progressEvent.loaded / progressEvent.total);
            })
                .finally(() => {
                setProgress(0);
                setIsUploading(false);
            });
        }
        if (result) {
            props.onImageUploaded(result);
        }
        props.onHideModal();
    }, [props.onImageUploaded, props.onHideModal]);
    // 弹窗选择图片框
    const onPickImage = useCallback(() => {
        if (isUploading)
            return;
        pickImage((e) => {
            const file = e.target.files?.[0];
            if (file)
                void uploadFile(file);
        }, { accept: UPLOAD_INPUT_ACCEPT });
    }, [isUploading]);
    useEffect(() => {
        props.fileToUpload && void uploadFile(props.fileToUpload);
    }, [props.fileToUpload]);
    // 剪切事件监听
    useEffect(() => {
        // 剪切板复制
        const onPasteFile = (event) => {
            const file = getClipboardImageFile(event);
            if (file)
                void uploadFile(file);
        };
        document.addEventListener('paste', onPasteFile);
        return () => document.removeEventListener('paste', onPasteFile);
    }, []);
    // 拖拽结束时判断是否是图片
    const onFileDrop = useCallback(async (e) => {
        e.preventDefault();
        setDragOver(false);
        const entry = e.dataTransfer.items[0];
        if (entry.kind !== 'file')
            return;
        const file = entry.getAsFile();
        if (file)
            void uploadFile(file);
    }, [setDragOver, uploadFile]);
    // 改变拖拽框样式
    const onFileDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, [setDragOver]);
    // 改变拖拽框样式
    const onFileDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, [setDragOver]);
    const MAX_SIZE_TIP = $t('NUTFLOWY_IMAGE_TIP_MAX_SIZE').replace('{{size}}', NutstoreSDKET.ParasiticMedium.utils.formatSize(ParasiticMedium.fileExceededLimit(ParasiticMedium.Type.Image).size, 'M'));
    return (React.createElement(Modal, { visible: props.visible, onVisibleChange: (visible) => visible || props.onHideModal() },
        React.createElement("div", { className: "ParasiticMediumModal" },
            React.createElement(CloseIcon, { onClick: props.onHideModal, className: "close-icon" }),
            React.createElement("h3", { className: "title" }, $t('NUTFOLWY_IMAGE_TIP_ADD')),
            React.createElement("div", { onDrop: onFileDrop, onDragOver: onFileDragOver, onDragLeave: onFileDragLeave, className: classNames('UploadRegin', { isDragOver }), onClick: onPickImage },
                React.createElement("div", { className: "UploadRegin-main" }, isUploading ? (React.createElement(React.Fragment, null,
                    React.createElement(UploadImageIcon, { className: "filterGrey" }),
                    React.createElement("div", { className: "UploadRegin-main__uploading" },
                        React.createElement("p", null, $t('NUTFOLWY_IMAGE_TIP_UPLOADING')),
                        React.createElement("div", { className: "uploadProgress" },
                            React.createElement(ProgressBar, { height: 10, percent: progress }))))) : (React.createElement(React.Fragment, null,
                    React.createElement(UploadImageIcon, null),
                    React.createElement("div", { className: "UploadRegin-main__init" },
                        React.createElement("div", { className: "UploadRegin-main__views" },
                            React.createElement("p", null,
                                React.createElement("span", null, $t('NUTFOLWY_IMAGE_TIP_GRAG_OR')),
                                React.createElement("span", { className: "blue" }, $t('NUTFOLWY_IMAGE_TIP_CLICK'))),
                            React.createElement("span", { className: "tip" },
                                "\uFF08",
                                MAX_SIZE_TIP,
                                "\uFF09"))))))))));
}
function pickImage(onSubmitted, options) {
    const el = document.createElement('input');
    Object.assign(el, options);
    el.type = 'file';
    el.onchange = (e) => {
        if (!(e.target instanceof HTMLInputElement))
            return;
        onSubmitted(e);
    };
    el.click();
}
css `
  .ParasiticMediumModal {
    padding: 24px 46px 40px;
    width: 540px;
    background: #fff;
    border-radius: 12px;
    p {
      margin: 0;
    }
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
    .UploadRegin {
      margin-top: 24px;
      padding-top: 40px;
      padding-bottom: 40px;
      border: 1px dashed rgba(112, 112, 112, 1);
      border-radius: 8px;
      cursor: pointer;
      &.isDragOver {
        background: #e6f1ff;
        border-color: #3a95ff;
      }
      &-main {
        > svg {
          display: block;
          margin: 0 auto;
          &.filterGrey {
            filter: grayscale(100%);
          }
        }
        &__uploading {
          margin-top: 16px;

          .uploadProgress {
            margin: 16px 40px 0;
          }
          > p {
            text-align: center;
            color: #707070;
          }
        }
        &__views {
          margin: 8px 40px 0;
          text-align: center;
          font-size: 14px;
          > p {
            margin: 0;
            color: #707070;
            .blue {
              color: #3184ee;
              margin-left: 6px;
            }
          }

          .tip {
            margin-top: 8px;
            color: #b7b7b7;
          }
        }
      }
    }

    .UploadImageStatus {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 16px;
      height: 16px;
      .uploadFileName {
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .failed {
        color: #ff3311;
      }
    }
  }
`;
