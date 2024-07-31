const memoize = <T>(fn: () => T) => {
  let result: T | null = null

  return () => {
    if (result !== null) return result
    return result = fn()
  }
}

// https://github.com/uupaa/UserAgent.js/blob/5d90111f44c1a90a68c804f30f949b3feac436dd/lib/UserAgent.js#L137
export const getOsName = () => {
  const ua = navigator.userAgent
  switch (true) {
    case /Android/.test(ua):            return "Android"
    case /iPhone|iPad|iPod/.test(ua):   return "iOS"
    case /Windows/.test(ua):            return "Windows"
    case /Mac OS X/.test(ua):           return "macOS"
    case /Linux/.test(ua):              return "Linux"
    case /CrOS/.test(ua):               return "Chrome OS"
    case /Firefox/.test(ua):            return "Firefox OS"
  }
  return
}
export const osName = memoize(getOsName)

// https://github.com/uupaa/UserAgent.js/blob/master/lib/UserAgent.js#L160
export const getBrowserName = () => {
  const ua = navigator.userAgent
  const android = /Android/.test(ua)
  switch (true) {
    case /CriOS/.test(ua):              return "Chrome for iOS" // https://developer.chrome.com/multidevice/user-agent
    case /Edge/.test(ua):               return "Edge"
    case android && /Silk\//.test(ua):  return "Silk" // Kidle Silk browser
    case /Chrome/.test(ua):             return "Chrome"
    case /Firefox/.test(ua):            return "Firefox"
    case android:                       return "AOSP" // AOSP stock browser
    case /MSIE|Trident/.test(ua):       return "IE"
    case /Safari\//.test(ua):           return "Safari"
    case /AppleWebKit/.test(ua):        return "WebKit"
  }
  return
}
export const browserName = memoize(getBrowserName)

const BASE_BROWSERS: { [key: string]: "Chromium" | "Firefox" | "IE" | "Edge" | "WebKit" } = {
  "Chrome":           "Chromium",
  "Firefox":          "Firefox",
  "IE":               "IE",
  "Edge":             "Edge",
  "AOSP":             "WebKit",
  "Safari":           "WebKit",
  "WebKit":           "WebKit",
  "Chrome for iOS":   "WebKit",
  "Silk":             "WebKit", // or "Chromium" if version >= 4.4
}
export const baseBrowserName = () => {
  const name = browserName()
  if (!name) return
  return BASE_BROWSERS[name]
}

export const isMobile = () => {
  return osName() === 'iOS' || osName() === 'Android'
}
