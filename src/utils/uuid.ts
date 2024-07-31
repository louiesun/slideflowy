import uuidv4 from 'uuid/v4'
import { randomHex, sample } from './F'

export const uuidLegacy = () => {
  // v4 UUID always contain "4" at third position
  // v4 UUID always contain chars [a,b,8,9] at fourth position
  // prettier-ignore
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${sample([8, 9, 'a', 'b'])}${randomHex(3)}-${randomHex(12)}`
}

/**
 * UUID的标准型式包含32个16进制数字，以连字号分为五段，形式为8-4-4-4-12的32个字符。示例：
 *
 *    550e8400-e29b-41d4-a716-446655440000
 *
 * https://zh.wikipedia.org/wiki/%E9%80%9A%E7%94%A8%E5%94%AF%E4%B8%80%E8%AF%86%E5%88%AB%E7%A0%81#%E5%AE%9A%E4%B9%89
 */
export const isTextUuid = (str: string) => {
  if (str.length !== 36) return false

  if (
    str[8] === '-' &&
    str[8 + 1 + 4] === '-' &&
    str[8 + 1 + 4 + 1 + 4] === '-' &&
    str[8 + 1 + 4 + 1 + 4 + 1 + 4] === '-'
  ) {
    return true
  }

  return false
}

export const uuid = (opts?: { base64?: boolean }) => {
  if (!opts) return uuidv4()
  const options = { base64: false, ...opts }
  if (!options.base64) return uuidv4()
  const buffer = new Array()
  uuidv4(null, buffer)
  return arrayBufferToBase64(buffer)
}

export const uuidToBase64 = (uuid: string) => {
  const buffer = new Array()
  uuidToArrayBuffer(uuid, buffer)
  return arrayBufferToBase64(buffer)
}

// 虽然说似乎是 https://gist.github.com/jonleighton/958841 的实现更快
// 但是在我的 Chrome 69.0.3497.100 上似乎是 btoa 的版本更快
function arrayBufferToBase64(buffer: number[]) {
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  let binary = ''
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// https://github.com/kelektiv/node-uuid/blob/14c42d2568977f7ddfc02399bd2a6b09e2cfbe5f/uuid.js#L62

const _byteToHex = []
const _hexToByte = {}
for (let i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1)
  _hexToByte[_byteToHex[i]] = i
}

export const uuidToArrayBuffer = (
  s: string,
  buf: number[],
  offset?: number,
) => {
  const i = (buf && offset) || 0
  let ii = 0

  buf = buf || []
  s.toLowerCase().replace(/[0-9a-f]{2}/g, oct => {
    if (ii < 16) {
      // Don't overflow!
      buf[i + ii++] = _hexToByte[oct]
    }
    return oct
  })

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0
  }

  return buf
}
