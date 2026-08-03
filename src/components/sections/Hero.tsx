import { motion } from 'framer-motion'
import { Container, Section } from '@/components/common'
import { Heading, Text, Button } from '@/components/ui'
import { ArrowDown, Sparkles, Code2, Brain, Github, Linkedin } from 'lucide-react'
import { Link as ScrollLink } from 'react-scroll'
import { useState, useEffect, lazy, Suspense } from 'react'
import { TypedHeadline } from '@/components/hero/TypedHeadline'
import { StaticBackground } from '@/components/hero/StaticBackground'

// three.js + fiber + drei + postprocessing is ~950 kB — as a static import it
// blocks the hero copy from painting. Streamed in behind StaticBackground
// instead, so the text is readable immediately and the WebGL layer swaps in.
const HeroCanvas = lazy(() =>
  import('@/components/hero/HeroCanvas').then((m) => ({ default: m.HeroCanvas }))
)

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [webGLSupported, setWebGLSupported] = useState(true) 
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    // Trigger load animation
    setTimeout(() => setIsLoaded(true), 100)
    
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setWebGLSupported(!!gl)
    } catch {
      setWebGLSupported(false)
    }
  }, [])

  return (
    <Section id="home" fullHeight centered className="relative overflow-hidden">
      {/* 3D Neural Network Background */}
      {webGLSupported ? (
        <Suspense fallback={<StaticBackground />}>
          <HeroCanvas mousePosition={mousePosition} />
        </Suspense>
      ) : (
        <StaticBackground />
      )}
      
      {/* Gradient Overlay for text readability over WebGL canvas */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-radial-gradient from-[var(--paper)]/80 via-[var(--paper)]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--paper)]/60 via-transparent to-[var(--paper)]/60" />
      </div>
      
      {/* Content */}
      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--panel)]/60 backdrop-blur-sm border border-[var(--panel-border)] mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-cyan animate-pulse" />
            <Text size="sm">AI Engineer | ML Specialist | GenAI Expert</Text>
          </motion.div>

          {/* Main heading with gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Heading as="h1" size="5xl" className="mb-6">
              Hi, I'm{' '}
              <span className="relative">
                <span className="text-gradient">Vinayak Mathur</span>
                <motion.span
                  className="absolute -inset-1 bg-accent-cyan/20 blur-2xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />
              </span>
            </Heading>
          </motion.div>

          {/* Typed Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <TypedHeadline />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Text size="lg" muted className="mb-8 max-w-2xl mx-auto">
              From Machine Learning to Generative AI, I architect intelligent solutions 
              that transform businesses. Explore my journey through 21+ AI projects, 
              each demonstrating real-world impact and cutting-edge innovation.
            </Text>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--panel)]/60 rounded-full">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <Text size="sm">Available for opportunities</Text>
            </div>
            <div className="px-3 py-1 bg-[var(--panel)]/60 rounded-full">
              <Text size="sm">Cognizant • Samsung R&D • 21+ Projects</Text>
            </div>
            <div className="px-3 py-1 bg-[var(--panel)]/60 rounded-full">
              <Text size="sm">NVIDIA Certified • AWS • Azure</Text>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <ScrollLink to="projects" smooth duration={500} offset={-80}>
              <Button size="lg" icon={Code2} className="group">
                Explore Live Demos
                <motion.span
                  className="inline-block ml-1"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Button>
            </ScrollLink>
            <ScrollLink to="contact" smooth duration={500} offset={-80}>
              <Button size="lg" variant="outline" icon={Brain}>
                Let's Build Together
              </Button>
            </ScrollLink>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-4"
          >
            <a
              href="https://github.com/VnykzHub"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[var(--ink-soft)] hover:text-accent-cyan transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href="https://linkedin.com/in/vinayakmathur2000"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[var(--ink-soft)] hover:text-accent-cyan transition-colors"
            >
              <Linkedin size={20} />
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1 },
              y: { duration: 2, repeat: Infinity }
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <ScrollLink to="about" smooth duration={500} offset={-80}>
              <div className="text-[var(--ink-soft)] hover:text-accent-cyan transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Text size="xs" className="uppercase tracking-wider">Scroll</Text>
                  <ArrowDown className="w-5 h-5" />
                </div>
              </div>
            </ScrollLink>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  )
}