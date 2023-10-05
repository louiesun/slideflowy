import { css } from 'astroturf';
export const ProgressBar = (props) => {
    return (React.createElement("div", null,
        React.createElement("div", { className: "Progress-progress" },
            React.createElement("div", { className: "Progress-progress__inner" },
                React.createElement("div", { style: {
                        width: props.percent * 100 + '%',
                    }, className: "Progress-progress__bg" })))));
};
css `
  .Progress {
    &-progress {
      height: 8px;
      width: 100%;
      &__inner {
        width: 100%;
        height: 100%;
      }
      &__bg {
        border-radius: 4px;
        height: 100%;
        background: #3184ee;
        transition: all 0.2s linear;
      }
    }
  }
`;
