import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { IProjectNode } from '../../types'

export interface FocusContextValue {
  storeAnchor: (id: IProjectNode['id'], anchor: number) => void
  storeImgUrl: (id: IProjectNode['id'], url: string) => void
}

export const FocusContext = React.createContext<FocusContextValue>({
  storeAnchor: (id: IProjectNode['id'], anchor: number) => {},
  storeImgUrl: (id: IProjectNode['id'], url: string) => {},
})

export interface FocusContextProviderProps {
  editable: boolean
  children?: React.ReactNode
  restoreEditorAnchor: (nodeId: IProjectNode['id'], anchor: number) => void
  restoreImgFocus: (nodeId: IProjectNode['id'], imgUrl: string) => void
}

export const FocusContextProvider: FC<FocusContextProviderProps> = props => {
  const [nodeId, setNodeId] = useState<IProjectNode['id']>()
  const [anchor, setAnchor] = useState<number>()
  const [imgUrl, setImgUrl] = useState<string>()

  const onWindowFocus = useCallback(
    (event: FocusEvent) => {
      if (props.editable && event.target === window && nodeId) {
        if (anchor !== undefined) {
          props.restoreEditorAnchor(nodeId, anchor)
        } else if (imgUrl !== undefined) {
          props.restoreImgFocus(nodeId, imgUrl)
        }
      }
    },
    [nodeId, anchor, imgUrl],
  )

  useEffect(() => {
    window.addEventListener('focus', onWindowFocus)
    return () => {
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [onWindowFocus])

  const contextValue = useMemo(
    () => ({
      storeAnchor: (id: IProjectNode['id'], anchor: number) => {
        setNodeId(id)
        setAnchor(anchor)
        setImgUrl(undefined)
      },
      storeImgUrl: (id: IProjectNode['id'], url: string) => {
        setNodeId(id)
        setImgUrl(url)
        setAnchor(undefined)
      },
    }),
    [setNodeId, setAnchor, setImgUrl],
  )

  return (
    <FocusContext.Provider value={contextValue}>
      {props.children}
    </FocusContext.Provider>
  )
}
