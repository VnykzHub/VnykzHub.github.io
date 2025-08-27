import { Canvas } from '@react-three/fiber'
import { Preload, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { NeuralNetwork } from './NeuralNetwork'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

interface HeroCanvasProps {
  mousePosition: { x: number; y: number }
}

export function HeroCanvas({ mousePosition }: HeroCanvasProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 25], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Softer lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />
          
          {/* Neural Network with better positioning */}
          <NeuralNetwork mousePosition={mousePosition} />
          
          {/* Very subtle auto-rotation */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate
            autoRotateSpeed={0.2}
          />
          
          {/* Lighter post-processing */}
          <EffectComposer>
            <Bloom
              intensity={0.3}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              radius={0.8}
            />
          </EffectComposer>
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
