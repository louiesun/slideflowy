import { injectable } from 'inversify'

export type Handler<D> = (data: D) => void

@injectable()
export class EventBus<D = any> {
  private listeners: { [event: string]: Handler<D>[] } = {}

  emit(name: string, data: any) {
    if (this.listeners[name]) {
      this.listeners[name].forEach(h => h(data))
    }
  }

  on(name: string, handler: Handler<D>) {
    this.listeners[name] = this.listeners[name] || []
    this.listeners[name].push(handler)
    return () => this.off(name, handler)
  }

  off(name: string, handler: Handler<D>) {
    if (this.listeners[name]) {
      this.listeners[name] = this.listeners[name].filter(h => h !== handler)
    }
  }
}
