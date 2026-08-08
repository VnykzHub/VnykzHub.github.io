// src/components/projects/DemoLoader.tsx
import { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { Project } from '@/data/projects'

interface DemoLoaderProps {
  project: Project
}

export function DemoLoader({ project }: DemoLoaderProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [project])
  
  const handleRetry = () => {
    setError(false)
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-amber mx-auto" />
          <p className="text-[var(--ink-soft)]">Loading demo...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="text-red-500 mx-auto" size={48} />
          <p className="text-[var(--ink-soft)]">Failed to load demo</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-[var(--panel2)] hover:bg-[var(--panel-border)] rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  switch (project.embedStrategy) {
    case 'iframe':
      return (
        <iframe
          src={project.demoUrl}
          className="w-full h-full"
          title={`${project.title} Demo`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      )
    
    case 'component':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-[var(--ink-soft)]">Component demo coming soon</p>
        </div>
      )
    
    case 'api':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-[var(--ink-soft)]">Interactive demo coming soon</p>
        </div>
      )
    
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-1)]/10 to-[var(--accent-2)]/10">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">🚀</div>
            <p className="text-[var(--heading)] font-semibold">{project.title}</p>
            <p className="text-[var(--ink-soft)] text-sm max-w-md">
              Demo available externally. Click "Open Full Demo" to view the live project.
            </p>
          </div>
        </div>
      )
  }
}
