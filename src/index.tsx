import { createRoot } from 'react-dom/client'
import { Provider as ReduxProvider } from 'react-redux'
import { Provider as DiProvider } from 'react.di'
import whenDOMReady from 'when-dom-ready'
import { App } from './containers/App'
import { initI18n } from './i18n'
import { createStore } from './store'
import './styles/index.scss'
import { Slide } from './components/Slide'
import React from 'react'
import { container } from './utils/di'
import * as NutstoreSDK from './utils/NutstoreSDK'
import { initRaven, RavenErrorBoundary, Sentry } from './utils/Raven'

initRaven('https://4ec2b592160f49f88c8051c7da432406@sentry.jianguoyun.com/9')

Sentry.configureScope((scope) => {
  scope.setExtra('NutstoreSDK-version-expected', NutstoreSDK.expectedVersion)
  scope.setExtra('NutstoreSDK-version-actual', NutstoreSDK.actualVersion)
})

void whenDOMReady().then(() => {
  const isAdDemo = NutstoreSDK.isLanding()
  !isAdDemo && NutstoreSDK.appHelper.loading.show()
})

const parseQs = NutstoreSDK.parseQs(location.search)


void Promise.all([
  whenDOMReady(),
  !parseQs.isSlide ? createStore() : Promise.resolve(),
  initI18n(),
]).then(([, store]) => {
  const ctr = document.getElementById('root')
  
  const root = createRoot(ctr!)

  root.render(
    <RavenErrorBoundary>
      {!parseQs.isSlide && store ? (
        <ReduxProvider store={store}>
          {/* 需要手动对 DiProvider PropsType 中添加显式 children 声明，故此处选择直接采用 ignore */}
          {/* @ts-ignore */}
          <DiProvider container={container}>
            <App />
          </DiProvider>
        </ReduxProvider>
      ) : (
        <Slide />
      )}
    </RavenErrorBoundary>
  )
})
