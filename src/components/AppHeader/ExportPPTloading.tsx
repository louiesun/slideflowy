import './style.scss';
import ExportLoading from './exportPPTLoading.gif';
import { $t } from '../../i18n';
export const ExportPPTloading = () => {
    return React.createElement("div", { className: 'ExportPPTloading' },
        React.createElement("div", { className: "loading-card" },
            React.createElement("img", { className: "loading-img", src: ExportLoading }),
            React.createElement("p", { className: "loading-text" }, $t('EXPORT_PPT_LOADING'))));
};
