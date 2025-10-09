import { useRef } from "react";

export function useStable<T>(getInitialValue: () => T) {
  const ref = useRef<{ value: T } | null>(null)
  if (ref.current === null) {
    const value = getInitialValue()
    ref.current = { value }
  }
  return ref.current.value
}