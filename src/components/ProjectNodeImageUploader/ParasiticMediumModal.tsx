import { useState, useCallback, useEffect } from 'react'
import classNames from 'classnames'
import { $t } from '../../i18n'
import CloseIcon from '../../assets/images/icon_close.svg'
import { FileService } from '../../services/FileService'
import { useInject } from '../../utils/di'
import { ParasiticMedium, isLanding } from '../../utils/NutstoreSDK'
import { NutstoreSDK as NutstoreSDKET } from '../../utils/ErrorTranslator'
import { Modal } from '../Modal'
import { ProgressBar } from '../ProgressBar'
import UploadImageIcon from './icon_upload_image.svg'
import { getClipboardImageFile } from '../../services/ProjectNodeService'
import { uploadedImageFileToBase64URL } from '../../utils/advertisingPagePreviewDemo'
import './ParasiticMediumModal.scss'

const UPLOAD_INPUT_ACCEPT = ParasiticMedium.fileExceededLimit(
  ParasiticMedium.Type.Image,
).type.join(',')

interface ParasiticMediumModalProps {
  // 如果传了这个 props ，ParasiticMediumModal 会立刻开始上传文件
  fileToUpload?: File
  visible: boolean
  onHideModal: () => void
  onImageUploaded: (imageInfo: ParasiticMedium.JSONObject | string) => void
}

export function ParasiticMediumModal(props: ParasiticMediumModalProps) {
  const fileService = useInject(FileService)

  // 上传进度
  const [progress, setProgress] = useState(0)
  // 拖拽状态
  const [isDragOver, setDragOver] = useState(false)
  // 上传状态
  const [isUploading, setIsUploading] = useState(false)

  // 通过各个途径添加文件后统一处理图片上传
  const uploadFile = useCallback(
    async (file: File) => {
      const isAdDemo = isLanding()
      setIsUploading(true)
      let result: string | ParasiticMedium.JSONObject | undefined
      if (isAdDemo) {
        result = await uploadedImageFileToBase64URL(file)
      } else {
        // fileService.uploadImage 里已经做了错误处理了，所以这里就不需要做了
        result = await fileService
          .uploadImage(file, progressEvent => {
            setProgress(progressEvent.loaded / progressEvent.total)
          })
          .finally(() => {
            setProgress(0)
            setIsUploading(false)
          })
      }

      if (result) {
        props.onImageUploaded(result)
      }
      props.onHideModal()
    },
    [props.onImageUploaded, props.onHideModal],
  )

  // 弹窗选择图片框
  const onPickImage = useCallback(() => {
    if (isUploading) return
    pickImage(
      e => {
        const file = e.target.files?.[0]
        if (file) void uploadFile(file)
      },
      { accept: UPLOAD_INPUT_ACCEPT },
    )
  }, [isUploading])

  useEffect(() => {
    props.fileToUpload && void uploadFile(props.fileToUpload)
  }, [props.fileToUpload])

  // 剪切事件监听
  useEffect(() => {
    // 剪切板复制
    const onPasteFile = (event: ClipboardEvent) => {
      const file = getClipboardImageFile(event)
      if (file) void uploadFile(file)
    }

    document.addEventListener('paste', onPasteFile)
    return () => document.removeEventListener('paste', onPasteFile)
  }, [])

  // 拖拽结束时判断是否是图片
  const onFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)

      const entry = e.dataTransfer.items[0]
      if (entry.kind !== 'file') return
      const file = entry.getAsFile()
      if (file) void uploadFile(file)
    },
    [setDragOver, uploadFile],
  )

  // 改变拖拽框样式
  const onFileDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(true)
    },
    [setDragOver],
  )

  // 改变拖拽框样式
  const onFileDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
    },
    [setDragOver],
  )

  const MAX_SIZE_TIP = $t('NUTFLOWY_IMAGE_TIP_MAX_SIZE').replace(
    '{{size}}',
    NutstoreSDKET.ParasiticMedium.utils.formatSize(
      ParasiticMedium.fileExceededLimit(ParasiticMedium.Type.Image).size,
      'M',
    ),
  )

  return (
    <Modal
      visible={props.visible}
      onVisibleChange={visible => visible || props.onHideModal()}
    >
      <div className="ParasiticMediumModal">
        <CloseIcon onClick={props.onHideModal} className="close-icon" />
        <h3 className="title">{$t('NUTFOLWY_IMAGE_TIP_ADD')}</h3>
        <div
          onDrop={onFileDrop}
          onDragOver={onFileDragOver}
          onDragLeave={onFileDragLeave}
          className={classNames('UploadRegin', { isDragOver })}
          onClick={onPickImage}
        >
          <div className="UploadRegin-main">
            {isUploading ? (
              <>
                <UploadImageIcon className="filterGrey" />
                <div className="UploadRegin-main__uploading">
                  <p>{$t('NUTFOLWY_IMAGE_TIP_UPLOADING')}</p>
                  <div className="uploadProgress">
                    <ProgressBar height={10} percent={progress} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <UploadImageIcon />
                <div className="UploadRegin-main__init">
                  <div className="UploadRegin-main__views">
                    <p>
                      <span>{$t('NUTFOLWY_IMAGE_TIP_GRAG_OR')}</span>
                      <span className="blue">
                        {$t('NUTFOLWY_IMAGE_TIP_CLICK')}
                      </span>
                    </p>
                    <span className="tip">（{MAX_SIZE_TIP}）</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function pickImage(
  onSubmitted: (event: Event & { target: HTMLInputElement }) => any,
  options?: { accept?: string },
): void {
  const el = document.createElement('input')
  Object.assign(el, options)
  el.type = 'file'
  el.onchange = e => {
    if (!(e.target instanceof HTMLInputElement)) return
    onSubmitted(e as any)
  }
  el.click()
}
