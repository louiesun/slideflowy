export async function convertUrlToPngBase64(url: string) {
    const img: HTMLImageElement | null = new Image()
    const canvas: HTMLCanvasElement | null = document.createElement('canvas')
    return await new Promise((resolve) => {
        img.onload = () => {
            const ctx = canvas.getContext('2d')!
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.src = url
    })
}