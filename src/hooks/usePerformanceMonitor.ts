import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fps: number
  memory?: number
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ fps: 60 })
  
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setMetrics({
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
          memory: (performance as any).memory?.usedJSHeapSize
        })
        
        frameCount = 0
        lastTime = currentTime
      }
      
      rafId = requestAnimationFrame(measureFPS)
    }
    
    rafId = requestAnimationFrame(measureFPS)
    
    return () => cancelAnimationFrame(rafId)
  }, [])
  
  return metrics
}