'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="surface-card p-6 text-center">
          <p className="text-[var(--ink-faint)] font-mono text-xs uppercase tracking-[0.14em]">
            Something went wrong rendering this section.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
