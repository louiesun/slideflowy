import * as Sentry from '@sentry/browser'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { Reducer } from 'redux'

export { Sentry }

export interface RavenErrorBoundaryProps {
  children?: React.ReactNode;
}

export class RavenErrorBoundary extends React.PureComponent<
  RavenErrorBoundaryProps
> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error })
    Sentry.configureScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key])
      })
    })
    Sentry.captureException(error)
  }

  render() {
    return this.props.children
  }
}

export const catchReducerErrors = (reducer: Reducer): Reducer => {
  return (state, action) => {
    try {
      return reducer(state, action)
    } catch (error) {
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error))
      }
      return state
    }
  }
}

// TOOD: 出错后整个 EpicMiddleware 会需要进行一次重置，需要提示用户程序异常
export const catchEpicErrors = (action$: Observable<any>) => {
  return action$.pipe(
    catchError((error: any) => {
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error))
      }
      return action$
    }),
  )
}

export const initRaven = (
  dsn: string,
  initOptions?: Partial<Sentry.BrowserOptions>,
) => {
  const debug = process.env.NODE_ENV !== 'production'
  Sentry.init({
    ...initOptions,
    dsn,
    release: VERSION,
    debug,
    beforeSend(event, hint) {
      if (hint && hint.originalException) {
        if (
          hint.originalException.message.indexOf('DesktopClientObject') > -1
        ) {
          return null
        }
      } else {
        console.error(event.message, event)
      }

      return debug ? null : event
    },
  })
}
