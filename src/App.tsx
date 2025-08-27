import { Suspense, lazy } from 'react'
import { Layout } from '@/components/layout'
import { LoadingScreen } from '@/components/hero'

// Lazy load heavy sections
const Hero = lazy(() => import('@/components/sections/Hero').then(m => ({ default: m.Hero })))
const About = lazy(() => import('@/components/sections/About').then(m => ({ default: m.About })))
const Experience = lazy(() => import('@/components/sections/Experience').then(m => ({ default: m.Experience })))
const Projects = lazy(() => import('@/components/sections/Projects').then(m => ({ default: m.Projects })))
const Skills = lazy(() => import('@/components/sections/Skills').then(m => ({ default: m.Skills })))
const Contact = lazy(() => import('@/components/sections/Contact').then(m => ({ default: m.Contact })))

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </Suspense>
    </Layout>
  )
}

export default App
