import { useEffect, useState } from 'react'

/** 값이 delayMs 동안 변경되지 않을 때만 반영되는 디바운스된 값을 반환한다. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
