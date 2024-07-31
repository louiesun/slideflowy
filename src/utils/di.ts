import { interfaces as InversifyInterfaces, Container } from 'inversify'
import { createContext, useContext } from 'react'

export const container = new Container({
  defaultScope: 'Singleton',
  autoBindInjectable: true,
})

export const DiContext = createContext(container)

export const DiProvider = DiContext.Provider

export const DiConsumer = DiContext.Consumer

export function useInject<T>(
  identifier: InversifyInterfaces.ServiceIdentifier<T>,
) {
  const container = useContext(DiContext)
  return container.get<T>(identifier)
}
