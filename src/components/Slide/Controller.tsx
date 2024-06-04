import './Controller.scss';
import { useCallback, useEffect, useState } from "react";
import { c } from '../../utils/css';
import { $t } from "../../i18n";
import { SimpleTip } from '../SimpleTip';
import IconRestart from './icon_restart.svg';
import IconSwitch from './icon_switch.svg';
import IconPrev from './icon_prev.svg';
import IconNext from './icon_next.svg';
import IconFullscreen from './icon_fullscreen.svg';
import IconExitFullscreen from './icon_fullscreen-exit.svg';
import IconZoomIn from './text_zoom_in.svg';
import IconZoomOut from './text_zoom_out.svg';
import classNames from 'classnames';
const clsName = 'Controller';
const cls = c(clsName);
export const Controller = (props) => {
    const [levelCount, setLevelCount] = useState(0);
    const { steps, zoom, switchBG, restart, prev, next, requestFullscreen, exitFullscreen, showController, controller, fullscreen, isPreview, backgroundLoading, stepName, stepIndex } = props;
    useEffect(() => {
        let count = 0;
        for (let i = 0; i <= stepIndex; ++i) {
            if (steps[i].name === 'level') {
                count++;
            }
        }
        setLevelCount(count);
    });
    const onClickSwitchBtn = useCallback(() => {
        stepName === 'main' && switchBG();
    }, [stepName, switchBG]);
    const clickToZoom = () => {
        if (levelCount === 0)
            return;
        const nodes = document.getElementsByClassName('text-content');
        props.clickToZoom(nodes[levelCount]);
    };
    return (React.createElement("div", { className: classNames(clsName, controller ? 'show' : 'hide'), onClick: e => {
            showController();
            e.stopPropagation();
        } },
        React.createElement("div", { className: cls('-nav-bar') },
            React.createElement("div", { className: "btn home-btn", onClick: restart },
                React.createElement(SimpleTip, { message: $t('SLIDE_BACK') },
                    React.createElement(IconRestart, { key: "icon-home", className: "icon icon-home" }))),
            React.createElement("div", { className: "btn prev-btn", onClick: prev },
                React.createElement(SimpleTip, { message: $t('SLIDE_PREVIOUS') },
                    React.createElement(IconPrev, { key: "icon-prev", className: "icon icon-prev" }))),
            React.createElement("div", { className: "btn next-btn", onClick: next },
                React.createElement(SimpleTip, { message: $t('SLIDE_NEXT') },
                    React.createElement(IconNext, { key: "icon-next", className: "icon icon-next" }))),
            React.createElement("div", { className: cls('-divide') }),
            React.createElement("div", { className: classNames([
                    'btn zoom-btn',
                    { 'disabled': stepName !== 'level' }
                ]), onClick: clickToZoom }, !zoom ? (React.createElement(SimpleTip, { message: $t('SLIDE_ZOOM_IN') },
                React.createElement(IconZoomIn, { key: "icon-zoom-in", className: 'icon icon-zoom-in' }))) : (React.createElement(SimpleTip, { message: $t('SLIDE_ZOOM_OUT') },
                React.createElement(IconZoomOut, { key: "icon-zoom-out", className: 'icon icon-zoom-out' })))),
            React.createElement("div", { className: cls('-divide') }),
            !isPreview ? (React.createElement("div", { className: classNames([
                    'btn switch-btn',
                    { 'bg-loading': backgroundLoading },
                    { 'disabled': stepName !== 'main' },
                ]), onClick: onClickSwitchBtn },
                React.createElement(SimpleTip, { message: stepName === 'main'
                        ? $t('SLIDE_CHANGE_BG')
                        : $t('SLIDE_CHANGE_BG_DISABLED') },
                    React.createElement(IconSwitch, { key: "icon-switch", className: "icon icon-home" })))) : null,
            fullscreen ? (React.createElement("div", { className: "btn exit-fullscreen-btn", onClick: exitFullscreen },
                React.createElement(SimpleTip, { message: $t('SLIDE_EXIT_FULLSCREEN') },
                    React.createElement(IconExitFullscreen, { key: "icon-exit-fullscreen", className: "icon icon-exit-fullscreen" })))) : (React.createElement("div", { className: "btn fullscreen-btn", onClick: requestFullscreen },
                React.createElement(SimpleTip, { message: $t('SLIDE_FULLSCREEN') },
                    React.createElement(IconFullscreen, { key: "icon-fullscreen", className: "icon icon-fullscreen" })))))));
};
