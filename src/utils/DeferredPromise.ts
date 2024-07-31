export class DeferredPromise<T> {
	public promise: Promise<T>;

	private _resolve: (value?: (T | PromiseLike<T> | undefined)) => void;
	private _reject: (reason?: any) => void;

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	resolve(value?: any) {
		this._resolve(value);
	}

	reject(reason?: any) {
		this._reject(reason);
	}
}