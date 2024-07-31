import { createContext, FC, useEffect, useMemo } from "react"
import { Zoom } from "../../utils/zoom"

export interface ZoomContextValue {
  zoom?: Zoom
}

export const ZoomContext = createContext<ZoomContextValue>({})

export interface ZoomContextProviderProps {
  children: React.ReactNode
  container?: HTMLElement
}

export const ZoomContextProvider: FC<ZoomContextProviderProps> = (
  props,
): JSX.Element => {
  const { container } = props

  const zoomContextValue = useMemo(
    (): ZoomContextValue => ({
      zoom: new Zoom(container),
    }),
    [container],
  )

  useEffect(() => {
    return () => {
      zoomContextValue.zoom?.clearSideEffect()
    }
  }, [])

  return (
    <ZoomContext.Provider value={zoomContextValue}>
      {props.children}
    </ZoomContext.Provider>
  )
}
