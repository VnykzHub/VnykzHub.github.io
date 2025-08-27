import { cn } from '@utils/cn'

function App() {
  return (
    <div className={cn('min-h-screen bg-gray-950 text-gray-100')}>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-gradient text-center">
          Portfolio v2.0
        </h1>
        <p className="text-center mt-4 text-gray-400">
          AI Engineering Portfolio - Under Construction 🚧
        </p>
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-accent-cyan text-gray-950 font-semibold rounded-lg hover:glow transition-all">
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}

export default App