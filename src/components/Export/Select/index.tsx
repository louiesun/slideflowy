import { useEffect, useState, useRef } from 'react'
import { nutstoreClient } from '../../../utils/NutstoreSDK'
import Expand from './expand.svg'
import Collapse from './collapse.svg'
import Professional from './professional.svg'
import './style.scss'

interface SelectProps {
  defaultValue: { item: string, vip: boolean}
  items: { item: string, vip: boolean}[]
  changeCallback: (value: string) => void
}

export const Select = (props: SelectProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { defaultValue, items, changeCallback } = props
  const [value, setValue] = useState<{ item: string, vip: boolean }>(defaultValue)
  const [expand, setExpand] = useState(false)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [featureRestrictionEnabled, setFeatureRestrictionEnabled] = useState<boolean>(false)

  const handleToggleStatus = () => {
    setExpand(!expand)
  }

  const handleClick = (v: { item: string, vip: boolean }) => {
    return () => {
      setValue(v)
      setExpand(false)
      changeCallback(v.item)
    }
  }

  useEffect(() => {
    const _isClient = nutstoreClient.isElectronClient
    setIsClient(_isClient)
    if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
      void nutstoreClient.getFeatureRestrictionEnabled().then(enabled => setFeatureRestrictionEnabled(enabled))
    } else {
      setFeatureRestrictionEnabled(false)
    }
  }, [])

  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      const node = ref.current!
      const clickNode = e.target as Node
      if (node.contains(clickNode)) {
        return
      }
      setExpand(false)
    }
    window.addEventListener('click', handleWindowClick)
    return () => {
      window.removeEventListener('click', handleWindowClick)
    }
  }, [])

  return (
    <div ref={ref} className="select-container">
      <div className="select-header" onClick={handleToggleStatus}>
        <div className="select-value">
          {
            isClient && featureRestrictionEnabled && value.vip && (
              <div className='select-option-vip'>
                <Professional width={'20px'} height={'20px'}/>
              </div>
            )
          }
          <div className='select-option-text'>
            {value.item}
          </div>
        </div>
        <div className="select-toggle">
          {expand ? <Collapse /> : <Expand />}
        </div>
      </div>
      {expand && (
        <div className="select-options">
          {items.map(item => (
            <div
              key={item.item}
              className={
                'select-option' +
                (item === value ? ' select-option-selected' : '')
              }
              onClick={handleClick(item)}
            >
              {
                isClient && featureRestrictionEnabled && item.vip && (
                  <div className='select-option-vip'>
                    <Professional width={'20px'} height={'20px'}/>
                  </div>
                )
              }
              <div className='select-option-text'>
                {item.item}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
