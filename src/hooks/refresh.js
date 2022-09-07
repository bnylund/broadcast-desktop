import { useEffect, useState } from 'react'

// Ah yes, the almighty refreshables! Coming soon to a costco near you. or not.
export const useRefresh = (func, delay_ms, deps = undefined, skip = false) => {
  const [stop, setStop] = useState(false)
  useEffect(
    () => {
      if (!skip) func()

      let interval = setInterval(() => {
        if (!stop) func()
      }, delay_ms)

      return () => {
        clearInterval(interval)
        setStop(true)
      }
    },
    deps ? deps : [true],
  )
}
