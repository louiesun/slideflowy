import { ParasiticMedium as PM, errors } from '../NutstoreSDK'
import { $t } from '../../i18n'

const { KnownErrorEdge, RequestErrorCode } = errors

export namespace ParasiticMedium {
  export namespace utils {
    export function mimeTypeToExtName(types: string[]): string {
      return types.map(t => t.split('/', 2)[1]).join(', ')
    }

    export function formatSize(sizes: [number], unit: 'M' = 'M'): string {
      let suffix = 'B'
      let friendlySize = sizes[0]

      if (unit === 'M') {
        // 其实严格来说文件尺寸应该用单位 MiB ，但是考虑到普通用户不知道这个单位的具体
        // 含义，而且 Windows 上面文件尺寸的显示单位依旧是 MB （虽然是 MiB 的算法），
        // 而且 20 MB(10^6) 比 20 MiB(2^20) 小，比较保险，所以文案写成 20 MB
        suffix = 'MB'
        friendlySize = Math.round(sizes[0] / 1024 / 1024)
      } else {
        throw new Error('[formatSize] unsupported unit')
      }

      return `${friendlySize} ${suffix}`
    }
  }

  /**
   * 翻译 {@link NutstoreSDK.ParasiticMedium.pickAndUpload} 抛出的错误，如果能翻译，
   * 就返回有长度的字符串，如果不需要处理（比如：
   * {@link ParasiticMedium.PickAndUpload.UserCanceledError}），就返回空字符串，如
   * 果翻译不了，就返回 `undefined`
   *
   * @param err 抛出的错误
   */
  export function pickAndUpload(err: Error): string | undefined {
    if (err instanceof PM.PickAndUpload.UserCanceledError) {
      return ''
    }

    if (err instanceof PM.PickAndUpload.CanceledOnPickedFileError) {
      return $t('ERR_TOO_BIG_ENTITY')
    }

    if (err instanceof PM.PickAndUpload.NotAllowedError) {
      return $t('PARASITIC_MEDIUM_UPLOAD_NOT_ALLOWED')
    }

    if (err instanceof PM.PickAndUpload.NotSupportedError) {
      return $t('PARASITIC_MEDIUM_UPLOAD_NOT_SUPPORTED')
    }

    if (err instanceof PM.PickAndUpload.FailedError) {
      return transParasiticMediumUploadFailedError(
        err,
        $t('PARASITIC_MEDIUM_UPLOAD_READ_FILE_FAILED'),
      )
    }

    return
  }

  /**
   * 翻译 {@link NutstoreSDK.ParasiticMedium.upload} 抛出的错误，如果能翻译，就
   * 返回有长度的字符串，如果不需要处理（比如：
   * {@link ParasiticMedium.PickAndUpload.UserCanceledError}），就返回空字符串，
   * 如果翻译不了，就返回 `undefined`
   *
   * @param err 抛出的错误
   */
  export function upload(err: Error): string | undefined {
    if (err instanceof PM.Upload.NotAllowedError) {
      return $t('PARASITIC_MEDIUM_UPLOAD_NOT_ALLOWED')
    }

    if (err instanceof PM.Upload.NotSupportedError) {
      return $t('PARASITIC_MEDIUM_UPLOAD_NOT_SUPPORTED')
    }

    if (err instanceof PM.Upload.FailedError) {
      return transParasiticMediumUploadFailedError(
        err,
        $t('PARASITIC_MEDIUM_UPLOAD_READ_FILE_FAILED'),
      )
    }

    return
  }
}

function transParasiticMediumUploadFailedError(
  err: Error & {
    edge: string
    errorCode?: string
    extra?: any
  },
  fallback = $t('ERR_UNKNOWN'),
): string {
  if (err.edge === KnownErrorEdge.nutstoreServer) {
    switch (err.errorCode) {
      case 'TooBigEntity':
        return $t('ERR_TOO_BIG_ENTITY')
      case 'UnAuthorized':
        return $t('ERR_UNAUTHORIZED')
      case 'SandboxAccessDenied':
        return $t('ERR_ACCESS_DENIED')
      case 'AccountExpired':
        return $t('ERR_ACCOUNT_EXPIRED')
      case 'TrafficRateExhausted':
        return $t('ERR_TRAFFIC_RATE_EXHAUSTED')
      case 'StorageSpaceExhausted':
        return $t('ERR_STORAGE_SPACE_EXHAUSTED')
      default: {
        const suffix =
          err.extra && err.extra.status ? `(${err.extra.status})` : ''
        return $t('ERR_REQUEST_FAILED_WITH_ERROR_CODE').replace(
          '{{errorCode}}',
          `server:${err.errorCode}${suffix}`,
        )
      }
    }
  }

  if (err.edge === KnownErrorEdge.request) {
    if (err.errorCode === RequestErrorCode.NetworkTimeout) {
      return $t('ERR_REQUEST_TIMEOUT')
    } else if (err.errorCode) {
      return $t('ERR_REQUEST_FAILED_WITH_ERROR_CODE').replace(
        '{{errorCode}}',
        `request:${err.errorCode}`,
      )
    } else {
      return $t('ERR_REQUEST_FAILED')
    }
  }

  if (err.edge === KnownErrorEdge.runtime) {
    switch (err.errorCode) {
      case 'AccountUnavailable':
        return $t('ERR_ACCOUNT_UNAVAILABLE')
      case 'SaveFileRequired':
        return $t('ERR_SAVE_FILE_REQUIRED')
    }
  }

  if (err.errorCode) {
    return $t('ERR_UNKNOWN_WITH_ERROR_CODE').replace(
      '{{errorCode}}',
      `${err.edge}:${err.errorCode}`,
    )
  } else {
    return fallback
  }
}
