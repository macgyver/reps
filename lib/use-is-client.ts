import { useSyncExternalStore } from "react";

let subscribe = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
