export function calculateEnlargedImageBase64(base64Data: string, scale: number, margin: number) {
    return new Promise((resolve) => {
        const img = new Image()
        img.src = base64Data
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = img.width * scale + margin * 2
            canvas.height = img.height * scale + margin * 2
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, margin, margin, canvas.width - margin * 2, canvas.height - margin * 2)
            const enlargedBase64 = canvas.toDataURL('image/png', 1.0)
            resolve(enlargedBase64)
        }
    })
}