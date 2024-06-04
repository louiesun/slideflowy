import { useCallback, useEffect, useState } from 'react';
import { useInject } from '../../utils/di';
import { isLanding } from '../../utils/NutstoreSDK';
import { FileService } from '../../services/FileService';
import { ParasiticMediumModal } from './ParasiticMediumModal';
import { HttpLinkModal } from './HttpLinkModal';
import { getClipboardImageFile } from '../../services/ProjectNodeService';
const clsName = 'ProjectNodeImageUploader';
export const ProjectNodeImageUploader = (props) => {
    const fileService = useInject(FileService);
    const [uploadingFile, setUploadingFile] = useState(null);
    const onImageUploaded = useCallback((image) => {
        setUploadingFile(null);
        props.onInsertImage(props.node.id, {
            type: 'parasiticMedium',
            data: image,
        });
    }, [props.onInsertImage, props.node]);
    const onHttpLinkSubmitted = useCallback((link) => {
        props.onInsertImage(props.node.id, {
            type: 'httpLink',
            data: { link },
        });
    }, [props.onInsertImage, props.node]);
    const chooseUploadMethodBasedOnMode = () => {
        const isAdDemo = isLanding();
        if (isAdDemo) {
            return (link) => {
                setUploadingFile(null);
                onHttpLinkSubmitted(link);
            };
        }
        else {
            return onImageUploaded;
        }
    };
    const onHideModal = useCallback(() => {
        props.onHideImageUploadModal(props.node);
    }, [props.onHideImageUploadModal, props.node]);
    // 节点处于编辑状态时，按下粘贴快捷键能够上传图片
    useEffect(() => {
        if (props.isEditing) {
            document.addEventListener('paste', onPasteToInsert);
        }
        return () => {
            document.removeEventListener('paste', onPasteToInsert);
        };
        async function onPasteToInsert(event) {
            const file = getClipboardImageFile(event);
            if (!file)
                return;
            setUploadingFile(file);
        }
    }, [props.isEditing, props.node, props.onInsertImage, fileService]);
    return (React.createElement("div", { className: clsName },
        !uploadingFile ? null : (React.createElement(ParasiticMediumModal, { visible: true, fileToUpload: uploadingFile, onHideModal: onHideModal, onImageUploaded: chooseUploadMethodBasedOnMode() })),
        props.modalType !== 'parasiticMedium' ? null : (React.createElement(ParasiticMediumModal, { visible: true, onHideModal: onHideModal, onImageUploaded: chooseUploadMethodBasedOnMode() })),
        props.modalType !== 'httpLink' ? null : (React.createElement(HttpLinkModal, { visible: true, onHideModal: onHideModal, onHttpLinkSubmitted: onHttpLinkSubmitted }))));
};
