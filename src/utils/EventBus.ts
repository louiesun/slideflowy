import { __decorate } from "tslib";
import { injectable } from 'inversify';
let EventBus = class EventBus {
    listeners = {};
    emit(name, data) {
        if (this.listeners[name]) {
            this.listeners[name].forEach(h => h(data));
        }
    }
    on(name, handler) {
        this.listeners[name] = this.listeners[name] || [];
        this.listeners[name].push(handler);
        return () => this.off(name, handler);
    }
    off(name, handler) {
        if (this.listeners[name]) {
            this.listeners[name] = this.listeners[name].filter(h => h !== handler);
        }
    }
};
EventBus = __decorate([
    injectable()
], EventBus);
export { EventBus };
