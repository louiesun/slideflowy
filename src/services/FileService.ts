import { __decorate } from "tslib";
import { injectable } from 'inversify';
import { createStore } from '../store';
import { actionCreators as NodeActions } from '../action_packs/project_node';
import { $t } from '../i18n';
import { Notification } from '../utils/Notification';
import { errors, ParasiticMedium } from '../utils/NutstoreSDK';
import { NutstoreSDK as NutstoreSDKET } from '../utils/ErrorTranslator';
import { base64ToFile } from '../utils/base64ToFile';
let FileService = class FileService {
    async shareFile() {
        const store = await createStore();
        const { nutstoreFile } = store.getState();
        if (!nutstoreFile)
            return;
        try {
            return await nutstoreFile.share();
        }
        catch (_err) {
            const message = (() => {
                if (_err instanceof errors.ApiError)
                    return $t('GENERAL_ERROR_MSG');
                switch (_err.errorCode) {
                    case 'NeedSmsAuthentication':
                        return $t('USER_FORCE_ENABLE_TF_AUTH_MESSAGE');
                    case 'SandboxAccessDenied':
                        return $t('PUB_WARNING_SANDBOXDENY');
                    case 'GroupSharingDenied':
                        return $t('ERROR_SHARING_TO_SOME_GROUP_IS_DENIED');
                    case 'SandboxAccessDenied':
                        return $t('NO_RIGHT_TO_COMPLETE_REQUEST');
                    case 'DisabledByTeamAdmin':
                        return $t('SHARE_OUTER_TEAM_DISABLED_TIP');
                    case 'DisabledForFreeUser':
                        return $t('ERROR_CODE_DISABLE_FOR_FREE_USER');
                    default:
                        return $t('GENERAL_ERROR_MSG');
                }
            })();
            Notification.show({ text: message });
            return;
        }
    }
    async getPreviewLink(mediumJson) {
        const store = await createStore();
        const { nutstoreFile } = store.getState();
        if (!nutstoreFile)
            return;
        try {
            const medium = ParasiticMedium.fromJSON(mediumJson);
            return await medium.toPreviewURL(nutstoreFile);
        }
        catch (_) {
            // TODO: 思考一下这里是不是应该做点什么
            return;
        }
    }
    async uploadImage(_file, onUploadProgress) {
        const store = await createStore();
        const { nutstoreFile } = store.getState();
        if (!nutstoreFile)
            return;
        const file = typeof _file === 'string' ? base64ToFile(_file) : _file;
        const limit = ParasiticMedium.fileExceededLimit(ParasiticMedium.Type.Image, file);
        if (limit) {
            let reason = JSON.stringify(limit);
            if (limit.type) {
                reason = $t('NUTFLOWY_IMAGE_UPLOAD_IMAGE_TYPE_ERROR').replace('{{types}}', NutstoreSDKET.ParasiticMedium.utils.mimeTypeToExtName(limit.type));
            }
            else if (limit.size) {
                reason = $t('NUTFLOWY_IMAGE_UPLOAD_IMAGE_SIZE_ERROR').replace('{{size}}', NutstoreSDKET.ParasiticMedium.utils.formatSize(limit.size, 'M'));
            }
            Notification.show({
                text: $t('NUTFLOWY_IMAGE_UPLOAD_FAILD$REASON').replace('{{reason}}', reason),
            });
            return;
        }
        try {
            const response = await ParasiticMedium.upload({
                fileName: file.name,
                fileData: file,
                fileType: ParasiticMedium.Type.Image,
                hostFile: nutstoreFile,
                type: ParasiticMedium.Type.Image,
                onUploadProgress,
            });
            return ParasiticMedium.create({
                type: ParasiticMedium.Type.Image,
                relativePath: response.relativePath,
                accessToken: response.token,
                bundled: response.bundled,
            }).toJSON();
        }
        catch (error) {
            const reason = NutstoreSDKET.ParasiticMedium.upload(error);
            const msg = $t('NUTFLOWY_IMAGE_UPLOAD_FAILD$REASON').replace('{{reason}}', reason || $t('ERR_UNKNOWN'));
            Notification.show({ text: msg });
            return;
        }
    }
    async handlePostMessage() {
        const store = await createStore();
        window.addEventListener('message', (event) => {
            const { nutstoreFile } = store.getState();
            if (!nutstoreFile)
                return;
            if (event.origin !== location.origin) {
                return;
            }
            else {
                const data = event.data;
                switch (data.type) {
                    case 'image':
                        if (data.imageData) {
                            const imageData = data.imageData;
                            let media;
                            if (typeof imageData === 'object') {
                                media = ParasiticMedium.fromJSON(imageData);
                            }
                            else if (typeof imageData === 'string') {
                                if (ParasiticMedium.isGeneratedReadableURL(imageData)) {
                                    media = ParasiticMedium.fromReadableURL(imageData);
                                }
                            }
                            if (media) {
                                void media.toPreviewURL(nutstoreFile).then((previewUrl) => {
                                    /* tslint:disable:no-string-literal */
                                    ;
                                    window['mindMapWindow'].postMessage({
                                        type: 'previewUrl',
                                        url: previewUrl,
                                        imageData,
                                    }, location.origin);
                                    /* tslint:disable:no-string-literal */
                                });
                            }
                        }
                        break;
                    case 'previewUrl':
                        if (data.url && data.imageData) {
                            const { imageData } = data;
                            store.dispatch(NodeActions.setImagePreviewUrls({
                                id: imageData.id,
                                urls: [data.url],
                            }));
                        }
                        break;
                }
            }
        });
    }
};
FileService = __decorate([
    injectable()
], FileService);
export { FileService };
