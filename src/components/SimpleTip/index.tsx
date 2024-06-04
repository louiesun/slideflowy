import * as React from 'react';
export const SimpleTip = props => {
    return (React.createElement("div", { title: props.message }, props.children));
};
