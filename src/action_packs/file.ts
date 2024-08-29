import { createStandardAction, ActionType, isOfType } from 'typesafe-actions'
import { combineEpics } from 'redux-observable'
import { produce } from 'immer'
import { basename } from 'path'
import { mapObjIndexed, fromPairs } from 'ramda'
import {
  Epic,
  StoreSchema,
  IProjectNode,
  StoreProjectNodeKeys,
  StoreProjectNode
} from '../types'
import {
  appHelper,
  NutstoreFile,
  ParasiticMedium,
  SaveFileEvent,
  nutstoreClient,
  errors,
  isLanding,
  mergeFilesInZip,
} from '../utils/NutstoreSDK'
import { State as ProjectNodeState, setDepthForAllNodes } from './project_node'
import { State as SlideState } from './slide'
import {
  uuidTryToBase64,
  projectNodeFromStoreProjectNode,
  getStoreProjectNodes,
  getParentMap,
} from '../services/ProjectNodeService'
import { $t } from '../i18n'
import { mapkv, nonNull } from '../utils/F'
import * as RX from '../utils/RX'
import {
  fromEvent as fromEvent$,
  of as of$,
  empty as empty$,
  Observable,
} from 'rxjs'
import {
  filter as filter$,
  mergeMap as mergeMap$,
  switchMap as switchMap$,
  distinctUntilChanged as distinctUntilChanged$,
  map as map$,
} from 'rxjs/operators'
import { Sentry } from '../utils/Raven'
import { ActionTypes as AppActionTypes } from './app'
import { generateDemoFileData } from '../utils/advertisingPagePreviewDemo'
import { isEqual, pick } from 'lodash'
import { uuid } from '../utils/uuid'

interface InitialData {
  fileName?: string
  nutstoreFile: NutstoreFile<string>
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in IProjectNode['id']]: IProjectNode }
  slide: StoreSchema['slide']
  fromMindMap?: boolean
}

export interface ISaveFileStatus {
  step: 'requesting' | 'saved' | 'failed'
  detail?: string
  updatedAt: number
}

class SaveFileStatus implements ISaveFileStatus {
  updatedAt: number

  constructor(public step: ISaveFileStatus['step'], public detail?: string) {
    this.updatedAt = Date.now()
  }

  updateStep(step: ISaveFileStatus['step']) {
    return new SaveFileStatus(step, this.detail)
  }
}

export const schemaVersion = 1

export type Actions = ActionType<typeof actionCreators>

export interface State {
  initialFileData?: {
    rootNodeIds: InitialData['rootNodeIds']
    fileName?: InitialData['fileName']
    nodes: InitialData['nodes']
    slide: InitialData['slide']
  }
  requestingFileInfo?: boolean
  saveFileStatus?: SaveFileStatus
  saveAndQuitFileStatus?: SaveFileStatus
  nutstoreFile?: NutstoreFile<string>
  // 主要是用来在 fileChanged action 触发的时候更新 state
  // 否则可能会出现 state 的内存引用没有变然后视图不更新的情况
  fileLastModifiedAt?: number
  fileSharing?: {
    requestStartedAt?: number
    link?: string
  }
  fromMindMap?: boolean
}

export enum ActionTypes {
  fetchFile = 'file:fetchFile',
  fetchedFile = 'file:fetchedFile',
  saveFile = 'file:saveFile',
  saveFileFinished = 'file:saveFileFinished',
  saveAndQuitFile = 'file:saveAndQuitFile',
  saveAndQuitFileFinished = 'file:saveAndQuitFileFinished',
  saveDraft = 'file:saveDraft',
  fileChanged = 'file:fileChanged',
}

export const actionCreators = {
  fetchFile: createStandardAction(ActionTypes.fetchFile)(),
  fetchedFile: createStandardAction(ActionTypes.fetchedFile)<InitialData>(),
  saveFile: createStandardAction(ActionTypes.saveFile)<
    SaveFileEvent | undefined
  >(),
  saveFileFinished: createStandardAction(ActionTypes.saveFileFinished)<{
    status?: SaveFileStatus
    newData?: InitialData
  }>(),
  saveAndQuitFile: createStandardAction(ActionTypes.saveAndQuitFile)(),
  saveAndQuitFileFinished: createStandardAction(
    ActionTypes.saveAndQuitFileFinished,
  )<SaveFileStatus>(),
  saveDraft: createStandardAction(ActionTypes.saveDraft)(),
  fileChanged: createStandardAction(ActionTypes.fileChanged)(),
}

export namespace selectors {
  export const getFileName = (state: State) => state.fromMindMap ? state.initialFileData?.fileName : (
    state.nutstoreFile && state.nutstoreFile.fileName
      ? basename(state.nutstoreFile.fileName, '.nol')
      : ''
  )

  export const fetchingFile = (state: State) => state.requestingFileInfo

  export const isFileChanged = (state: State) =>
    state.nutstoreFile && state.nutstoreFile.isModified

  export const previewingFile = (state: State) =>
    Boolean(
      state.nutstoreFile
        ? state.nutstoreFile.isPreview || !state.nutstoreFile.editable
        : true,
    )

  export const fileShareable = (state: State): boolean => {
    const { nutstoreFile } = state

    return (
      !previewingFile(state) && Boolean(nutstoreFile && nutstoreFile.shareable)
    )
  }

  export const saveFileStatus = (state: State) =>
    state.saveFileStatus || new SaveFileStatus('saved')

  export const saveAndQuitFileStatus = (state: State): ISaveFileStatus =>
    state.saveAndQuitFileStatus || { step: 'saved', updatedAt: Date.now() }
}

export const reducer = produce(
  (state: State & ProjectNodeState & SlideState, action: Actions) => {
    switch (action.type) {
      case ActionTypes.fetchFile:
        state.requestingFileInfo = true
        break
      case ActionTypes.fetchedFile:
        state.requestingFileInfo = false
        state.nutstoreFile = action.payload.nutstoreFile
        state.nodes = action.payload.nodes
        state.rootNodeIds = action.payload.rootNodeIds
        state.slide = action.payload.slide
        state.fromMindMap = action.payload.fromMindMap
        break
      case ActionTypes.fileChanged:
        state.fileLastModifiedAt = Date.now()
        break
      case ActionTypes.saveFile:
        state.saveFileStatus = new SaveFileStatus('requesting')
        break
      case ActionTypes.saveFileFinished: {
        const { status, newData } = action.payload
        state.saveFileStatus = status
        if (newData) {
          state.nutstoreFile = newData.nutstoreFile
          state.nodes = newData.nodes
          state.rootNodeIds = newData.rootNodeIds
          state.slide = newData.slide
          // reset node depth
          state.nodesParentMap = getParentMap(state)
          setDepthForAllNodes(state)
          state.prevReduceNodes = state.nodes;
        }
        break
      }
      case ActionTypes.saveAndQuitFile:
        state.saveAndQuitFileStatus = new SaveFileStatus('requesting')
        break
      case ActionTypes.saveAndQuitFileFinished:
        state.saveAndQuitFileStatus = action.payload
        break
    }

    switch (action.type) {
      case ActionTypes.fetchedFile:
        state.initialFileData = {
          fileName: action.payload.fileName,
          nodes: action.payload.nodes,
          rootNodeIds: action.payload.rootNodeIds,
          slide: action.payload.slide,
        }
        break
      case ActionTypes.saveFileFinished: {
        const { status, newData } = action.payload
        if (status && status.step === 'saved') {
          if (newData) {
            state.initialFileData = {
              nodes: newData.nodes!,
              rootNodeIds: newData.rootNodeIds!,
              slide: newData.slide!,
            }
          } else {
            state.initialFileData = {
              nodes: state.nodes!,
              rootNodeIds: state.rootNodeIds!,
              slide: state.slide!,
            }
          }
        }
        break
      }
      case ActionTypes.saveAndQuitFileFinished: {
        if (action.payload.step === 'saved') {
          state.initialFileData = {
            nodes: state.nodes!,
            rootNodeIds: state.rootNodeIds!,
            slide: state.slide!,
          }
        }
        break
      }
    }

    return state
  },
)

export const generateDemoFileDataEpic: Epic<State, Actions> = (action$) => {
  return action$.pipe(
    filter$(isOfType(AppActionTypes.init)),
    mergeMap$(
      RX.create(async (observer) => {
        appHelper.loading.show()
        observer.next(actionCreators.fetchedFile(generateDemoFileData()))
        observer.complete()
        appHelper.loading.hide()
      }),
    ),
  )
}

export const fetchFileEpic: Epic<State, Actions> = (action$, state$) => {
  return action$.pipe(
    filter$(isOfType(AppActionTypes.init)),
    mergeMap$(location.search ? fetchFileFromServer : fetchFileFromAnotherTab),
  )
}

const fetchFileFromAnotherTab = (): Observable<Actions> => {
  return new Observable((observer) => {
    observer.next(actionCreators.fetchFile())
    appHelper.loading.show()
    window.addEventListener(
      'message',
      (event: MessageEvent) => {
        if (event.origin !== location.origin) {
          return
        } else {
          const data = event.data
          if (data.type === 'file' && data.fileName && data.content) {
            const nutstoreFile = new NutstoreFile({
              ...NutstoreFile.FileCodec.SimpleZip(),
            })
            const mindMapData = data.content
            const rootId = uuid({ base64: true })
            const nodes: { [x: string]: IProjectNode } = {}
            const readNodes = (node: any, parent?: any, id?: string) => {
              id = id || uuid({ base64: true })
              parent?.childrenIds?.push(id)
              if (!nodes[id]) {
                nodes[id] = {} as IProjectNode
              }
              nodes[id].expanded = true
              nodes[id].updatedAt = new Date()
              nodes[id].createdAt = new Date()
              nodes[id].completed = false
              nodes[id].content = node.data.text.replaceAll('\n', '<br>')
              nodes[id].id = id
              nodes[id].childrenIds = []
              const nolNode: IProjectNode = nodes[id]
              if (node.data.image) {
                nolNode.images = [
                  {
                    type: 'parasiticMedium',
                    data: {
                      v: 1,
                      type: ParasiticMedium.Type.Image,
                      relativePath: node.data.image,
                    },
                    width: 200,
                  },
                ]
              }


              node.children &&
                node.children.forEach((child: any) => {
                  readNodes(child, nolNode)
                })
            }
            readNodes(mindMapData, undefined, rootId)

            const rootNodeIds = nodes[rootId].childrenIds

            const fileName = nodes[rootId].content

            delete nodes[rootId]

            observer.next(
              actionCreators.fetchedFile({
                fileName,
                nodes,
                rootNodeIds,
                slide: {},
                nutstoreFile,
                fromMindMap: true,
              }),
            )
            observer.complete()
            appHelper.loading.hide()
          }
        }
      },
      false,
    )
  })
}

const fetchFileFromServer = ((): (() => Observable<Actions>) => {
  let alertedFileError = false
  return RX.create(async (observer) => {
    observer.next(actionCreators.fetchFile())

    try {
      appHelper.loading.show()
      const nutstoreFile = new NutstoreFile({
        ...NutstoreFile.optionsFromUrl(),
        ...NutstoreFile.FileCodec.SimpleZip(),
        preSave(contents: ArrayBuffer[]) {
          return mergeFilesInZip(contents, 'arraybuffer')
        },
        // @ts-ignore
        async getParasiticMediums(content) {
          const data = cleanFileData(JSON.parse(content))
          const nodes = Object.values(data.nodes)
          return nodes
            .flatMap((n) =>
              n.images
                ?.map((img) =>
                  img.type === 'parasiticMedium' ? ParasiticMedium.fromJSON(img.data) : undefined,
                )
                .filter(nonNull),
            )
            .filter(nonNull)
        },
        async updateParasiticMediums(map, content) {
          const data = cleanFileData(JSON.parse(content))
          const nodes = { ...data.nodes }
          const keys = Object.keys(nodes)
          const pathMap = fromPairs(
            Array.from(map.entries()).map(
              (pair) =>
                [pair[0].relativePath, pair[1]] as [string, ParasiticMedium],
            ),
          )
          keys.forEach((key) => {
            if (!nodes[key].images) return
            nodes[key] = {
              ...nodes[key],
              images: nodes[key].images!.map((img) => {
                if (img.type !== 'parasiticMedium') return img
                const newMedium = pathMap[img.data.relativePath]
                const newData = newMedium ? newMedium.toJSON() : img.data
                return { ...img, data: newData }
              }),
            }
          })
          return JSON.stringify({
            ...data,
            nodes,
          })
        },
      })
      nutstoreFile.enableAutoSave()
      await nutstoreFile.open()
      observer.next(actionCreators.fetchedFile(getInitialData(nutstoreFile)))
      observer.complete()
      appHelper.loading.hide()
    } catch (err) {
      if (!alertedFileError) {
        if (err.innerError) {
          console.error(err.innerError)
        } else {
          console.error(err)
        }

        alertedFileError = true
        const message = err.message ? `: ${err.message}` : ''
        if (err instanceof errors.FileNotFoundError) {
          alert($t('NUTFLOWY_FILE_NOT_EXIST') + message)
        } else if (err instanceof errors.TokenExpiredError) {
          alert($t('NUTFLOWY_OPEN_FILE_TOKEN_EXPIRED') + message)
        } else {
          alert($t('NUTFLOWY_OPEN_FILE_FAILED') + message)
        }
      }
      nutstoreClient.eject()
      return
    }
  })
})()

export const handleBeforeunloadEpic: Epic<State, Actions> = (
  action$,
  state$,
) => {
  window.addEventListener('beforeunload', (event) => {
    const state = state$.value
    if (!state.nutstoreFile) return
    if (!state.nutstoreFile.isModified) return
    event.preventDefault()
    event.returnValue = 'o/'
  })

  return empty$()
}

export const foreignSaveFileEpic: Epic<State, Actions> = (action$, state$) =>
  state$.pipe(
    map$((state) => state.nutstoreFile),
    distinctUntilChanged$(),
    switchMap$(
      (nutstoreFile) => {
        if (!nutstoreFile) return empty$()
        return fromEvent$<SaveFileEvent>(nutstoreFile, 'saveFile')
      },
      (file, event) => ({ file, event }),
    ),
    mergeMap$(({ file, event }) => {
      if (!file) return empty$()
      return of$(actionCreators.saveFile(event))
    }),
  )

export const foreignSaveDraftEpic: Epic<State, Actions> = (action$, state$) =>
  state$.pipe(
    map$((state) => state.nutstoreFile),
    distinctUntilChanged$(),
    switchMap$((nutstoreFile) => {
      if (!nutstoreFile) return empty$()
      return fromEvent$(nutstoreFile, 'saveDraft')
    }),
    mergeMap$(() => {
      return of$(actionCreators.saveDraft())
    }),
  )

export const saveFileEpic: Epic<State & ProjectNodeState & SlideState, Actions> = (action$, state$) =>
  action$.pipe(
    filter$(isOfType(ActionTypes.saveFile)),
    mergeMap$(
      RX.create(async (observer, action) => {
        const { nutstoreFile } = state$.value
        const saveFileStatus = selectors.saveFileStatus(state$.value)
        if (!nutstoreFile) {
          observer.next(
            actionCreators.saveFileFinished({
              status: saveFileStatus.updateStep('saved'),
            }),
          )
          return
        }

        const saveInfo = {...action.payload, head: pickFileHead(state$.value)}
        const oldContent = nutstoreFile.content
        const newContent = pickFileContent(state$.value)
        try {
          await nutstoreFile.save(newContent, saveInfo)

          let initialData: InitialData | undefined
          if (oldContent !== nutstoreFile.content) {
            initialData = getInitialData(nutstoreFile)
          }
          observer.next(
            actionCreators.saveFileFinished({
              status: saveFileStatus.updateStep('saved'),
              newData: initialData,
            }),
          )
        } catch (err) {
          // 用户取消保存，清空保存状态，文件保持有改动未保存状态
          if (err.name === 'NutstoreUserCanceledSaveError') {
            observer.next(actionCreators.saveFileFinished({}))
          } else {
            Sentry.captureException(err)
            observer.next(
              actionCreators.saveFileFinished({
                status: saveFileStatus.updateStep('failed'),
              }),
            )
          }
          return
        }
      }),
    ),
  )

export const saveAndQuitFileEpic: Epic<State, Actions> = (action$, state$) =>
  action$.pipe(
    filter$(isOfType(ActionTypes.saveAndQuitFile)),
    mergeMap$(
      RX.create(async (observer, action) => {
        const { nutstoreFile, saveAndQuitFileStatus } = state$.value
        if (!saveAndQuitFileStatus) return

        if (nutstoreFile) {
          try {
            const head = pickFileHead(state$.value)
            await nutstoreFile.save(pickFileContent(state$.value), { head })
            await nutstoreFile.close()
          } catch (err) {
            Sentry.captureException(err)
            observer.next(
              actionCreators.saveAndQuitFileFinished(
                saveAndQuitFileStatus.updateStep('failed'),
              ),
            )
            return
          }
        }

        nutstoreClient.eject()

        observer.next(
          actionCreators.saveAndQuitFileFinished(
            saveAndQuitFileStatus.updateStep('saved'),
          ),
        )
      }),
    ),
  )

export const saveDraftEpic: Epic<State, Actions> = (action$, state$) =>
  action$.pipe(
    filter$(isOfType(ActionTypes.saveDraft)),
    mergeMap$(
      RX.create(async (observer, action) => {
        const { nutstoreFile } = state$.value
        if (nutstoreFile) {
          try {
            await nutstoreFile.saveDraft(pickFileContent(state$.value))
            observer.complete()
            return
          } catch (err) {
            Sentry.captureException(err)
            return
          }
        }
        observer.complete()
      }),
    ),
  )

export const observeFileChangeEpic: Epic<State & ProjectNodeState, Actions> = (
  action$,
  state$,
) =>
  action$.pipe(
    mergeMap$((action) => {
      const state = state$.value
      if (!state.nutstoreFile) return empty$()

      switch (action.type) {
        case ActionTypes.fetchedFile:
        case ActionTypes.saveFile:
        case ActionTypes.saveFileFinished:
        case ActionTypes.saveAndQuitFile:
        case ActionTypes.saveAndQuitFileFinished:
        case ActionTypes.saveDraft:
        case ActionTypes.fileChanged:
          break
        default: {
          if (
            !state.initialFileData ||
            state.nutstoreFile.isPreview ||
            !state.nutstoreFile.editable
          ) {
            break
          }
          let isFileChanged = !Object.keys(state.initialFileData).every(
            (key) => state[key] === state.initialFileData![key],
          )
          if (isFileChanged) {
            const diffKeys = Object.keys(state.initialFileData).filter(
              (key) => state[key] !== state.initialFileData![key],
            )
            if (diffKeys.length === 1 && diffKeys[0] === 'nodes') {
              if (
                isEqual(
                  Object.keys(state.nodes || {}),
                  Object.keys(state.initialFileData.nodes),
                ) &&
                state.nodes &&
                state.initialFileData.nodes
              ) {
                const isStoreProjectNodePropsSame = Object.keys(
                  state.nodes,
                ).every(key => {
                  return isEqual(
                    pick(state.nodes![key], StoreProjectNodeKeys),
                    pick(
                      state.initialFileData!.nodes[key],
                      StoreProjectNodeKeys,
                    ),
                  )
                })
                if (isStoreProjectNodePropsSame) isFileChanged = false
              }
            }
          }
          if (!isFileChanged && state.nodeEditStatus && state.nodes) {
            const { nodeEditStatus, nodes } = state
            isFileChanged = Object.keys(nodeEditStatus).some((id) => {
              const { editingContent } = nodeEditStatus[id]
              if (editingContent == null) return false
              return editingContent !== nodes[id].content
            })
          }
          if (isFileChanged) {
            state.nutstoreFile.modifiedAt()
            return of$(actionCreators.fileChanged())
          }
        }
      }

      return empty$()
    }),
  )

export const epic = combineEpics(
  isLanding() ? generateDemoFileDataEpic : fetchFileEpic,
  handleBeforeunloadEpic,
  saveFileEpic,
  saveAndQuitFileEpic,
  saveDraftEpic,
  observeFileChangeEpic,
  foreignSaveFileEpic,
  foreignSaveDraftEpic,
)

function getInitialData(nutstoreFile: NutstoreFile<string>): InitialData {
  const data = cleanFileData(JSON.parse(nutstoreFile.content || '{}'))
  return {
    nodes: mapkv(projectNodeFromStoreProjectNode, data.nodes || {}),
    rootNodeIds: data.rootNodeIds || [],
    slide: data.slide || {},
    nutstoreFile,
  }
}

function pickFileContent(state: State & ProjectNodeState & SlideState) {
  return JSON.stringify({
    version: schemaVersion,
    nodes: getStoreProjectNodes(state, { includeEditingContent: true }),
    rootNodeIds: (state.rootNodeIds || []).map(uuidTryToBase64),
    slide: state.slide,
  } as StoreSchema)
}

function pickFileHead(state: State & ProjectNodeState & SlideState) {
  const headId = state.rootNodeIds?.[0]
  const content = headId && state.nodes?.[headId].content
  let res: string = ''
  if (content) {
    const tempDom = document.createElement('div')
    tempDom.innerHTML = content
    res = tempDom.innerText
  }
  return res
}

/**
 * 旧的数据因为某些原因会出现 childrenIds/rootNodeIds 里引用的 node
 * 其实已经不存在了的情况，在这里清理一下这种情况
 */
function cleanFileData(data: Partial<StoreSchema>): StoreSchema {
  const nodes = data.nodes || {}
  const rootNodeIds = data.rootNodeIds || []
  const slide = data.slide || {}

  return {
    version: schemaVersion,
    ...data,
    rootNodeIds: rootNodeIds.filter((id) => nodes[id]),
    nodes: mapObjIndexed((node: StoreProjectNode) => {
      const filteredIds = node.childrenIds.filter((id) => nodes[id])
      if (filteredIds.length !== node.childrenIds.length) {
        return { ...node, childrenIds: filteredIds }
      } else {
        return node
      }
    }, nodes),
    slide,
  }
}
