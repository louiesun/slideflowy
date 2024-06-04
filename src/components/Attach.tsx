export const Attach = React.memo(function Attach(props) {
    return ((props.when ? props.children || props.then : props.else) ||
        null);
});
