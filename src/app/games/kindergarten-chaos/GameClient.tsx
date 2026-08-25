'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, RotateCcw } from 'lucide-react'

interface GameResult {
  score: number
  wave: number
}

// Structural view of the untyped GameEngine JS module — only what this
// component actually calls.
interface GameEngineHandle {
  init(): Promise<void>
  start(): void
  resetGame(): void
  destroy(): void
  onGameOver?: (result: GameResult) => void
}

export default function GameClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngineHandle | null>(null)
  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [initFailed, setInitFailed] = useState(false)
  const [result, setResult] = useState<GameResult>({ score: 0, wave: 0 })

  // Init engine on mount
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!containerRef.current) return

      const containerId = 'kg-chaos-canvas'
      let canvasContainer = document.getElementById(containerId)
      if (!canvasContainer) {
        canvasContainer = document.createElement('div')
        canvasContainer.id = containerId
        canvasContainer.style.width = '800px'
        canvasContainer.style.height = '600px'
        canvasContainer.style.maxWidth = '100%'
        containerRef.current.appendChild(canvasContainer)
      }

      await new Promise(r => setTimeout(r, 100))
      if (cancelled) return

      try {
        const { default: GameEngine } = await import('@/lib/games/kindergarten-chaos/GameEngine')
        if (cancelled) return

        const engine: GameEngineHandle = new GameEngine(containerId)
        // Publish before awaiting so cleanup can tear down a half-built engine
        engineRef.current = engine
        engine.onGameOver = (r: GameResult) => {
          setGameOver(true)
          setResult(r)
          setStarted(false)
        }

        // Pixi v8 creates its renderer asynchronously; the canvas and ticker
        // do not exist until this resolves.
        await engine.init()
      } catch (err) {
        console.error('Failed to init game engine:', err)
        setInitFailed(true)
      }
    }

    init()

    return () => {
      cancelled = true
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  const startGame = useCallback(() => {
    if (!engineRef.current) return
    if (gameOver) {
      engineRef.current.resetGame()
      setGameOver(false)
      setResult({ score: 0, wave: 0 })
    }
    engineRef.current.start()
    setStarted(true)
  }, [gameOver])

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={containerRef}
        className="relative w-full max-w-[800px] surface-card overflow-hidden"
        style={{ aspectRatio: '800 / 600' }}
      >
        {!started && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--paper)]/90 backdrop-blur-sm">
            {gameOver ? (
              <>
                <h2 className="font-sans text-2xl font-bold text-[var(--heading)] mb-2">Game Over!</h2>
                <p className="font-mono text-sm text-[var(--ink-soft)] mb-1">
                  Score: <span className="text-accent-amber font-bold">{result.score.toLocaleString()}</span>
                </p>
                <p className="font-mono text-sm text-[var(--ink-soft)] mb-6">
                  Waves: <span className="text-accent-patina font-bold">{result.wave}</span>
                </p>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-patina text-[var(--paper)] font-mono text-sm font-semibold hover:brightness-110 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
              </>
            ) : initFailed ? (
              <>
                <h2 className="font-sans text-2xl font-bold text-[var(--heading)] mb-2">Couldn&apos;t start the game</h2>
                <p className="font-mono text-[11px] text-[var(--ink-faint)] text-center max-w-xs">
                  This game needs WebGL. Try a different browser, or check the console for details.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-sans text-2xl font-bold text-[var(--heading)] mb-6">Kindergarten Chaos</h2>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-patina text-[var(--paper)] font-mono text-sm font-semibold hover:brightness-110 transition-all mb-8"
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </button>
                <div className="font-mono text-[11px] text-[var(--ink-faint)] text-center space-y-1">
                  <p><span className="text-[var(--ink-soft)]">WASD / Arrows</span> — Move</p>
                  <p><span className="text-[var(--ink-soft)]">Shift</span> — Run &nbsp;|&nbsp; <span className="text-[var(--ink-soft)]">Z</span> — Push &nbsp;|&nbsp; <span className="text-[var(--ink-soft)]">X</span> — Dodge Roll</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {started && !gameOver && (
        <p className="font-mono text-[11px] text-[var(--ink-faint)] text-center">
          <span className="text-[var(--ink-soft)]">WASD</span> Move &nbsp;|&nbsp;
          <span className="text-[var(--ink-soft)]">Shift</span> Run &nbsp;|&nbsp;
          <span className="text-[var(--ink-soft)]">Z</span> Push &nbsp;|&nbsp;
          <span className="text-[var(--ink-soft)]">X</span> Dodge
        </p>
      )}
    </div>
  )
}
