import { mapkv } from './F'
import { projectNodeFromStoreProjectNode } from '../services/ProjectNodeService'
import { NutstoreFile } from './NutstoreSDK'
import { IProjectNode, StoreSchema } from '../types'

interface InitialData {
  nutstoreFile: NutstoreFile<string>
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  slide: StoreSchema['slide']
}

const demoFileData = {
  "nodes": {
      "/S65rttLSOyh5royrlnZ4w==": {
          "childrenIds": [],
          "completed": 0,
          "content": "选中文字，即可通过弹出的文本编辑栏调整样式。",
          "createdAt": 1668577739439,
          "expanded": 0,
          "id": "/S65rttLSOyh5royrlnZ4w==",
          "updatedAt": 1668577739439
      },
      "ATFyBPFVSgK+3AznYRthEw==": {
          "childrenIds": [],
          "completed": 0,
          "content": "您输入的链接地址将被自动识别。",
          "createdAt": 1551952453558,
          "expanded": 1,
          "id": "ATFyBPFVSgK+3AznYRthEw==",
          "updatedAt": 1551952453558
      },
      "Hi3Q2aDaTJ+p9IsKg9u7iA==": {
          "childrenIds": [],
          "completed": 0,
          "content": "For other questions, please contact the official customer service.",
          "createdAt": 1551951792734,
          "expanded": 0,
          "id": "Hi3Q2aDaTJ+p9IsKg9u7iA==",
          "updatedAt": 1551951792734
      },
      "LZXvPq/bSL+kCmWjPtL0+w==": {
          "childrenIds": [],
          "completed": 0,
          "content": "The full link will be recognized automatically.",
          "createdAt": 1551951736551,
          "expanded": 1,
          "id": "LZXvPq/bSL+kCmWjPtL0+w==",
          "updatedAt": 1551951736551
      },
      "Q7dEa2uFR5CoV9xyuKUooQ==": {
          "childrenIds": [],
          "completed": 0,
          "content": "You may drag and drop the \"●\" , or use the shortcut keys to edit the content.",
          "createdAt": 1551951288488,
          "expanded": 0,
          "id": "Q7dEa2uFR5CoV9xyuKUooQ==",
          "updatedAt": 1551951288488
      },
      "RPKaCoMfT9yESGi5gUQU7w==": {
          "childrenIds": [],
          "completed": 0,
          "content": "· 自带动画效果，无需手动排版。<br>· 提供丰富的演示背景。<br>· 支持双屏显示，可跳转到任意节点。<br>· 支持文本编辑样式。<br>· 支持插入图片。",
          "createdAt": 1668578280330,
          "expanded": 0,
          "id": "RPKaCoMfT9yESGi5gUQU7w==",
          "updatedAt": 1668578280330
      },
      "X1wcfnCIR8KTC7C/J6mesg==": {
          "childrenIds": [
              "RPKaCoMfT9yESGi5gUQU7w=="
          ],
          "completed": 0,
          "content": "点击右上角<strong><span style=\"color: rgb(247, 150, 70);\">【演示】</span></strong>按钮，即可一键生成放映级演示。",
          "createdAt": 1668577622903,
          "expanded": 1,
          "id": "X1wcfnCIR8KTC7C/J6mesg==",
          "updatedAt": 1668577622903
      },
      "Za3DgvYpRjqpEOLC6+8yPA==": {
          "childrenIds": [
              "z4foBN8aQoa8BXVnjo5ZwQ==",
              "zoqCXUoITIi3P8yHHjr7aw==",
              "Q7dEa2uFR5CoV9xyuKUooQ==",
              "gpr29LS4TSSEhlCq83bS7g==",
              "LZXvPq/bSL+kCmWjPtL0+w==",
              "Hi3Q2aDaTJ+p9IsKg9u7iA=="
          ],
          "completed": 0,
          "content": "Welcome to <strong><span style=\"color: rgb(247, 150, 70);\">Outline Notes - Automatic presentation generation</span></strong>",
          "createdAt": 1551951166326,
          "expanded": 1,
          "id": "Za3DgvYpRjqpEOLC6+8yPA==",
          "updatedAt": 1551951166326
      },
      "bxf5N5L0Q1q91odNC/hxmw==": {
          "childrenIds": [],
          "completed": 0,
          "content": "· The presentation mode comes with smooth animations and does not require manual typesetting.<br>· The presentation mode provides you with rich background images.<br>· Support a dual-screen display and can be switched to any node.<br>· Support for text styles.<br>· Support for inserting images.",
          "createdAt": 1668578280330,
          "expanded": 0,
          "id": "bxf5N5L0Q1q91odNC/hxmw==",
          "updatedAt": 1668578280330
      },
      "eKcjkasXRh2FeklXvOl2lA==": {
          "childrenIds": [],
          "completed": 0,
          "content": "您可以拖拽“●”，或使用快捷键来调整内容。",
          "createdAt": 1537329241679,
          "expanded": 1,
          "id": "eKcjkasXRh2FeklXvOl2lA==",
          "updatedAt": 1537329241679
      },
      "gpr29LS4TSSEhlCq83bS7g==": {
          "childrenIds": [],
          "completed": 0,
          "content": "Select the text, change their styles with the pop-up editor bar.",
          "createdAt": 1551951608806,
          "expanded": 0,
          "id": "gpr29LS4TSSEhlCq83bS7g==",
          "updatedAt": 1551951608806
      },
      "iNFBnY7CQbu3gYI6yK6XEA==": {
          "childrenIds": [],
          "completed": 0,
          "content": "支持导出PPT进行二次编辑。",
          "createdAt": 1668577689686,
          "expanded": 0,
          "id": "iNFBnY7CQbu3gYI6yK6XEA==",
          "updatedAt": 1668577689686
      },
      "pM8dOtgkQOCh9k6OrQtRFA==": {
          "childrenIds": [
              "X1wcfnCIR8KTC7C/J6mesg==",
              "iNFBnY7CQbu3gYI6yK6XEA==",
              "eKcjkasXRh2FeklXvOl2lA==",
              "/S65rttLSOyh5royrlnZ4w==",
              "ATFyBPFVSgK+3AznYRthEw==",
              "qL2fkV6BQ/KAhbpuoGJfhQ=="
          ],
          "completed": 0,
          "content": "欢迎使用 <strong><span style=\"color: rgb(247, 150, 70);\">大纲笔记 - 一键生成放映级演示</span></strong>",
          "createdAt": 1537320098166,
          "expanded": 1,
          "id": "pM8dOtgkQOCh9k6OrQtRFA==",
          "updatedAt": 1537320098166
      },
      "qL2fkV6BQ/KAhbpuoGJfhQ==": {
          "childrenIds": [],
          "completed": 0,
          "content": "若有其他疑问，欢迎咨询官网在线客服。",
          "createdAt": 1551946183473,
          "expanded": 0,
          "id": "qL2fkV6BQ/KAhbpuoGJfhQ==",
          "updatedAt": 1551946183473
      },
      "z4foBN8aQoa8BXVnjo5ZwQ==": {
          "childrenIds": [
              "bxf5N5L0Q1q91odNC/hxmw=="
          ],
          "completed": 0,
          "content": "Click on<strong><span style=\"color: rgb(247, 150, 70);\"> [Presentation] </span></strong>in the top right corner to automatically generate a presentation.",
          "createdAt": 1668577622903,
          "expanded": 1,
          "id": "z4foBN8aQoa8BXVnjo5ZwQ==",
          "updatedAt": 1668577622903
      },
      "zoqCXUoITIi3P8yHHjr7aw==": {
          "childrenIds": [],
          "completed": 0,
          "content": "You can export PPT for custom editing.",
          "createdAt": 1668577689686,
          "expanded": 0,
          "id": "zoqCXUoITIi3P8yHHjr7aw==",
          "updatedAt": 1668577689686
      }
  },
  "rootNodeIds": [
      "pM8dOtgkQOCh9k6OrQtRFA==",
      "Za3DgvYpRjqpEOLC6+8yPA=="
  ],
  "slide": {},
  "version": 1
}

export const generateDemoFileData = (): InitialData => {
  const share: any = async () => {
    return Promise.resolve()
  }
  const nutstoreFile: any = {
    fileName: '大纲笔记',
    isModified: false,
    isPreview: false,
    editable: true,
    shareable: false,
    async save() { },
    async close() { },
    modifiedAt() { },
    share,
    on() {
      return this
    },
    off() {
      return this
    }
  }
  return {
    nodes: mapkv(projectNodeFromStoreProjectNode, demoFileData.nodes || {}),
    rootNodeIds: demoFileData.rootNodeIds || [],
    slide: {},
    nutstoreFile,
  }
}

export const uploadedImageFileToBase64URL = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        resolve('')
      }
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsDataURL(file)
  })
}
