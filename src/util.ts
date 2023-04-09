export interface InteropObservable<T> {
  [Symbol.observable]: () => Subscribable<T>
}

export interface Subscribable<T> {
  subscribe(observer: Partial<Observer<T>>): Unsubscribable
}

export interface Observer<T> {
  next: (value: T) => void
  error: (err: any) => void
  complete: () => void
}

export interface Unsubscribable {
  unsubscribe(): void
}
