import { useCallback, useEffect, useState } from 'react'
import { IProjectNode, UploadedImage } from '../../types'
import { useInject } from '../../utils/di'
import { ParasiticMedium, isLanding } from '../../utils/NutstoreSDK'
import { FileService } from '../../services/FileService'
import { ParasiticMediumModal } from './ParasiticMediumModal'
import { HttpLinkModal } from './HttpLinkModal'
import { getClipboardImageFile } from '../../services/ProjectNodeService'

const clsName = 'ProjectNodeImageUploader' as const

export interface ProjectNodeImageUploaderProps {
  node: IProjectNode
  isEditing: boolean
  modalType: UploadedImage['type']
  onInsertImage: (id: IProjectNode['id'], imageInfo: UploadedImage) => void
  onHideImageUploadModal: (node: IProjectNode) => void
}

export const ProjectNodeImageUploader = (
  props: ProjectNodeImageUploaderProps,
) => {
  const fileService = useInject(FileService)

  const [uploadingFile, setUploadingFile] = useState<null | File>(null)

  const onImageUploaded = useCallback(
    (image: ParasiticMedium.JSONObject) => {
      setUploadingFile(null)
      props.onInsertImage(props.node.id, {
        type: 'parasiticMedium',
        data: image,
      })
    },
    [props.onInsertImage, props.node],
  )

  const onHttpLinkSubmitted = useCallback(
    (link: string) => {
      props.onInsertImage(props.node.id, {
        type: 'httpLink',
        data: { link },
      })
    },
    [props.onInsertImage, props.node],
  )

  const chooseUploadMethodBasedOnMode = ()=>{
    const isAdDemo = isLanding()
    if (isAdDemo) {
      return (link: string)=>{
        setUploadingFile(null)
        onHttpLinkSubmitted(link)
      }
    } else {
      return onImageUploaded
    }
  }

  const onHideModal = useCallback(() => {
    props.onHideImageUploadModal(props.node)
  }, [props.onHideImageUploadModal, props.node])

  // 节点处于编辑状态时，按下粘贴快捷键能够上传图片
  useEffect(() => {
    if (props.isEditing) {
      document.addEventListener('paste', onPasteToInsert)
    }

    return () => {
      document.removeEventListener('paste', onPasteToInsert)
    }

    async function onPasteToInsert(event: ClipboardEvent) {
      const file = getClipboardImageFile(event)
      if (!file) return
      setUploadingFile(file)
    }
  }, [props.isEditing, props.node, props.onInsertImage, fileService])

  return (
    <div className={clsName}>
      {!uploadingFile ? null : (
        <ParasiticMediumModal
          visible={true}
          fileToUpload={uploadingFile}
          onHideModal={onHideModal}
          onImageUploaded={chooseUploadMethodBasedOnMode()}
        />
      )}
      {props.modalType !== 'parasiticMedium' ? null : (
        <ParasiticMediumModal
          visible={true}
          onHideModal={onHideModal}
          onImageUploaded={chooseUploadMethodBasedOnMode()}
        />
      )}
      {props.modalType !== 'httpLink' ? null : (
        <HttpLinkModal
          visible={true}
          onHideModal={onHideModal}
          onHttpLinkSubmitted={onHttpLinkSubmitted}
        />
      )}
    </div>
  )
}
