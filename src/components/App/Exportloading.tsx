import { FC } from 'react'
import './style.scss'
import ExportLoading from './exportLoading.gif'
import { $t } from '../../i18n'
export const Exportloading: FC =() =>{
  return (
    <div className='ExportPPTloading'>
      <div className="loading-card">
        <img className="loading-img" src={ExportLoading} />
        <p className="loading-text">{$t('EXPORT_PPT_LOADING')}</p>
      </div>
    </div>
  )
}