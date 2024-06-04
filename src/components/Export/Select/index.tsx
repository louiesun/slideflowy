import { useEffect, useState, useRef } from 'react';
import { nutstoreClient } from '../../../utils/NutstoreSDK';
import Expand from './expand.svg';
import Collapse from './collapse.svg';
import Professional from './professional.svg';
import './style.scss';
export const Select = (props) => {
    const ref = useRef(null);
    const { defaultValue, items, changeCallback } = props;
    const [value, setValue] = useState(defaultValue);
    const [expand, setExpand] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [featureRestrictionEnabled, setFeatureRestrictionEnabled] = useState(false);
    const handleToggleStatus = () => {
        setExpand(!expand);
    };
    const handleClick = (v) => {
        return () => {
            setValue(v);
            setExpand(false);
            changeCallback(v.item);
        };
    };
    useEffect(() => {
        const _isClient = nutstoreClient.isElectronClient;
        setIsClient(_isClient);
        if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
            void nutstoreClient.getFeatureRestrictionEnabled().then(enabled => setFeatureRestrictionEnabled(enabled));
        }
        else {
            setFeatureRestrictionEnabled(false);
        }
    }, []);
    useEffect(() => {
        const handleWindowClick = (e) => {
            const node = ref.current;
            const clickNode = e.target;
            if (node.contains(clickNode)) {
                return;
            }
            setExpand(false);
        };
        window.addEventListener('click', handleWindowClick);
        return () => {
            window.removeEventListener('click', handleWindowClick);
        };
    }, []);
    return (React.createElement("div", { ref: ref, className: "select-container" },
        React.createElement("div", { className: "select-header", onClick: handleToggleStatus },
            React.createElement("div", { className: "select-value" },
                isClient && featureRestrictionEnabled && value.vip && (React.createElement("div", { className: 'select-option-vip' },
                    React.createElement(Professional, { width: '20px', height: '20px' }))),
                React.createElement("div", { className: 'select-option-text' }, value.item)),
            React.createElement("div", { className: "select-toggle" }, expand ? React.createElement(Collapse, null) : React.createElement(Expand, null))),
        expand && (React.createElement("div", { className: "select-options" }, items.map(item => (React.createElement("div", { key: item.item, className: 'select-option' +
                (item === value ? ' select-option-selected' : ''), onClick: handleClick(item) },
            isClient && featureRestrictionEnabled && item.vip && (React.createElement("div", { className: 'select-option-vip' },
                React.createElement(Professional, { width: '20px', height: '20px' }))),
            React.createElement("div", { className: 'select-option-text' }, item.item))))))));
};
