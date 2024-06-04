export const { Provider, Consumer } = React.createContext({
    isSelecting: false,
    pageSelectionRange: null,
    screenSelectionRange: null,
    onSelectionItemDidMount: () => { },
    onSelectionItemWillUnmount: () => { },
});
