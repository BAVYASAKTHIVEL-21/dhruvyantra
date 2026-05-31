"use client";

import { useSyncExternalStore } from "react";

type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
) => void;

type GetState<T> = () => T;

type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
};

type UseBoundStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
} & StoreApi<T>;

/** Minimal zustand-compatible store (drop-in when zustand npm install succeeds). */
export function create<T>(creator: StateCreator<T>): UseBoundStore<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach((listener) => listener());
  };

  state = creator(setState, getState);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = (<U>(selector?: (s: T) => U) => {
    const sliceSelector =
      selector ?? ((s: T) => s as unknown as U);
    return useSyncExternalStore(
      subscribe,
      () => sliceSelector(getState()),
      () => sliceSelector(getState()),
    );
  }) as UseBoundStore<T>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
