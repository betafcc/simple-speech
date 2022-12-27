export interface ObservableSubscription {
  closed?: boolean
  unsubscribe(): void
}

export interface ObservableObserver<T> {
  next(value: T): void
  error(error: any): void
  complete(): void
}

export interface Observable<T> {
  subscribe(observer: ObservableObserver<T>): ObservableSubscription
}

export const observableSymbol = (): symbol | string => (Symbol as any).observable || '@@observable'
