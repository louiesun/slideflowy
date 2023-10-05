import './style.scss';
export const Breadcrumb = ({ items, onClickItem, }) => (React.createElement("div", { className: "Breadcrumb" },
    React.createElement("ul", { className: "Breadcrumb__list" }, items.map(n => (React.createElement("li", { key: n.key, onClick: () => onClickItem(n) },
        React.createElement("div", { className: "Breadcrumb__list-text", dangerouslySetInnerHTML: { __html: n.name } })))))));
