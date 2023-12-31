import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as DiProvider } from 'react.di';
import whenDOMReady from 'when-dom-ready';
import { App } from './containers/App';
import { initI18n } from './i18n';
import { createStore } from './store';
import './styles/index.scss';
import { Slide } from './components/Slide';
import React from 'react';
import { container } from './utils/di';
import * as NutstoreSDK from './utils/NutstoreSDK';
import { initRaven, RavenErrorBoundary, Sentry } from './utils/Raven';
initRaven('https://4ec2b592160f49f88c8051c7da432406@sentry.jianguoyun.com/9');
Sentry.configureScope((scope) => {
    scope.setExtra('NutstoreSDK-version-expected', NutstoreSDK.expectedVersion);
    scope.setExtra('NutstoreSDK-version-actual', NutstoreSDK.actualVersion);
});
void whenDOMReady().then(() => {
    const isAdDemo = NutstoreSDK.isLanding();
    !isAdDemo && NutstoreSDK.appHelper.loading.show();
});
const parseQs = NutstoreSDK.parseQs(location.search);
void Promise.all([
    whenDOMReady(),
    !parseQs.isSlide ? createStore() : Promise.resolve(),
    initI18n(),
]).then(([, store]) => {
    ReactDOM.render(React.createElement(RavenErrorBoundary, null, !parseQs.isSlide && store ? (React.createElement(ReduxProvider, { store: store },
        React.createElement(DiProvider, { container: container },
            React.createElement(App, null)))) : (React.createElement(Slide, null))), document.getElementById('root'));
});
