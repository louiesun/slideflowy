import './ZoomContainer.scss'
import { FC, useState } from "react";
import { ZoomContextProvider } from './ZoomContext'

interface IProps {
  children?: React.ReactNode
}

export const ZoomContainer: FC<IProps> = props => {
  const [zoomEl, setZoomEl] = useState<HTMLElement>()

  return (
    <div className="zoom-container" ref={el => setZoomEl(el || undefined)}>
      {
        !zoomEl ? null : (<ZoomContextProvider container={zoomEl}>
          {props.children}
        </ZoomContextProvider>)
      }
    </div>
  )
}
