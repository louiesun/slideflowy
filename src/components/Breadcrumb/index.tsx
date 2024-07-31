import { useCallback } from 'react'
import { nutstoreClient } from '../../utils/NutstoreSDK'
import Right from './right.svg'
import './style.scss'

export interface BreadcrumbItemBase {
  key: string
  name: string
}

export interface BreadcrumbProps<
  T extends BreadcrumbItemBase = BreadcrumbItemBase
> {
  items: T[]
  onClickItem: (item: T) => void
}

export const Breadcrumb = <T extends BreadcrumbItemBase = BreadcrumbItemBase>({
  items,
  onClickItem,
}: BreadcrumbProps<T>) => {
  const renderBreadcrumb = useCallback(() => {
    const isMobile = nutstoreClient.isMobile
    if (items.length <= 2 || !isMobile) {
      return items.map((n, idx) => (
        <>
          <li className={["Breadcrumb__list__item", idx === items.length - 1 ? "Breadcrumb__list__last__item" : ""].join(' ')} key={n.key} onClick={() => onClickItem(n)}>
            <div className={["Breadcrumb__list__item__text", idx === 0 ? "Breadcrumb__list__item__highlight" : ""].join(' ')} dangerouslySetInnerHTML={{__html: n.name}} />
          </li>
          {
            idx !== items.length - 1 && (
              <li className="Breadcrumb__list__arrow" key={`${n.key}-arrow`}>
                <Right />
              </li>
            )
          }
        </>
      ))
    } else {
      const first = items[0]
      const last = items[items.length - 1]
      const penultimate = items[items.length - 2]
      return (
        <>
          <li className={"Breadcrumb__list__item"} key={first.key} onClick={() => onClickItem(first)}>
            <div className="Breadcrumb__list__item__text Breadcrumb__list__item__highlight" dangerouslySetInnerHTML={{__html: first.name}} />
          </li>
          <li className="Breadcrumb__list__arrow" key={`${first.key}-arrow`}>
            <Right />
          </li>
          <li className={"Breadcrumb__list__item"} key={penultimate.key} onClick={() => onClickItem(penultimate)}>
            <div className="Breadcrumb__list__item__text Breadcrumb__list__item__highlight" dangerouslySetInnerHTML={{__html: '...'}} />
          </li>
          <li className="Breadcrumb__list__arrow" key={`${penultimate.key}-arrow`}>
            <Right />
          </li>
          <li className={"Breadcrumb__list__item Breadcrumb__list__last__item"} key={last.key} onClick={() => onClickItem(last)}>
            <div className="Breadcrumb__list__item__text Breadcrumb__list__item__highlight" dangerouslySetInnerHTML={{__html: last.name}} />
          </li>
        </>
      )
    }
  }, [items, onClickItem])

  return (
    <div className={nutstoreClient.isMobile ? "Breadcrumb-mobile" : "Breadcrumb"}>
      <ul className="Breadcrumb__list">
        { renderBreadcrumb() }
      </ul>
    </div>
  )
}