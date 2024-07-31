// S is String

export const extractFirstLineFromHtmlText = (html: string) => {
  // HTML string 是直接从 EditorView 那边提取过来，所以有换行一定是 <br>，因此直接根据 <br> 进行拆分即可
  const index = html.indexOf('<br>')
  if (index !== -1) {
    return html.slice(0, index)
  }
  return html
}

export function endlessReplace(
  re: RegExp,
  replacer: (
    match: NonNullable<ReturnType<string['match']>> & { index: number },
    currStr: string,
  ) => string,
  str: string,
) {
  let result = str
  let lastMatch: ReturnType<string['match']>
  // tslint:disable-next-line:no-conditional-assignment
  while ((lastMatch = result.match(re))) {
    if (lastMatch.index == null) continue
    const _result = replacer(lastMatch as any, result)
    if (_result === result) break;
    result = _result
  }
  return result
}

export function replaceSubstring(
  start: number,
  length: number,
  replacement: string,
  processingString: string,
) {
  return [
    processingString.slice(0, start),
    replacement,
    processingString.slice(start + length),
  ].join('')
}
