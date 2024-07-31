export const calcTextWidth = (text: string, fontSize: number = 12) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  context.font = `${fontSize}px "Microsoft Yahei", "Heiti SC", Arial, sans-serif`
  return context?.measureText(text).width
}
