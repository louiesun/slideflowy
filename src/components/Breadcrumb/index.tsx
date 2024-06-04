import { useCallback } from 'react';
import { nutstoreClient } from '../../utils/NutstoreSDK';
import Right from './right.svg';
import './style.scss';
export const Breadcrumb = ({ items, onClickItem, }) => {
    const renderBreadcrumb = useCallback(() => {
        const isMobile = nutstoreClient.isMobile;
        if (items.length <= 2 || !isMobile) {
            return items.map((n, idx) => (React.createElement(React.Fragment, null,
                React.createElement("li", { className: ["Breadcrumb__list__item", idx === items.length - 1 ? "Breadcrumb__list__last__item" : ""].join(' '), key: n.key, onClick: () => onClickItem(n) },
                    React.createElement("div", { className: ["Breadcrumb__list__item__text", idx === 0 ? "Breadcrumb__list__item__highlight" : ""].join(' '), dangerouslySetInnerHTML: { __html: n.name } })),
                idx !== items.length - 1 && (React.createElement("li", { className: "Breadcrumb__list__arrow", key: `${n.key}-arrow` },
                    React.createElement(Right, null))))));
        }
        else {
            const first = items[0];
            const last = items[items.length - 1];
            const penultimate = items[items.length - 2];
            return (React.createElement(React.Fragment, null,
                React.createElement("li", { className: "Breadcrumb__list__item", key: first.key, onClick: () => onClickItem(first) },
                    React.createElement("div", { className: "Breadcrumb__list__item__text Breadcrumb__list__item__highlight", dangerouslySetInnerHTML: { __html: first.name } })),
                React.createElement("li", { className: "Breadcrumb__list__arrow", key: `${first.key}-arrow` },
                    React.createElement(Right, null)),
                React.createElement("li", { className: "Breadcrumb__list__item", key: penultimate.key, onClick: () => onClickItem(penultimate) },
                    React.createElement("div", { className: "Breadcrumb__list__item__text Breadcrumb__list__item__highlight", dangerouslySetInnerHTML: { __html: '...' } })),
                React.createElement("li", { className: "Breadcrumb__list__arrow", key: `${penultimate.key}-arrow` },
                    React.createElement(Right, null)),
                React.createElement("li", { className: "Breadcrumb__list__item Breadcrumb__list__last__item", key: last.key, onClick: () => onClickItem(last) },
                    React.createElement("div", { className: "Breadcrumb__list__item__text Breadcrumb__list__item__highlight", dangerouslySetInnerHTML: { __html: last.name } }))));
        }
    }, [items, onClickItem]);
    return (React.createElement("div", { className: nutstoreClient.isMobile ? "Breadcrumb-mobile" : "Breadcrumb" },
        React.createElement("ul", { className: "Breadcrumb__list" }, renderBreadcrumb())));
};
