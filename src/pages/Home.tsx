import { Suspense, lazy } from 'react'
import { LoadingScreen } from '@/components/hero'

// Lazy load heavy sections
const Hero = lazy(() => import('@/components/sections/Hero').then((m) => ({ default: m.Hero })))
const About = lazy(() => import('@/components/sections/About').then((m) => ({ default: m.About })))
const Experience = lazy(() =>
  import('@/components/sections/Experience').then((m) => ({ default: m.Experience }))
)
const Projects = lazy(() =>
  import('@/components/sections/Projects').then((m) => ({ default: m.Projects }))
)
const Writing = lazy(() =>
  import('@/components/sections/Writing').then((m) => ({ default: m.Writing }))
)
const Skills = lazy(() =>
  import('@/components/sections/Skills').then((m) => ({ default: m.Skills }))
)
const Contact = lazy(() =>
  import('@/components/sections/Contact').then((m) => ({ default: m.Contact }))
)

export function Home() {
  return (
    <>
      <title>Vinayak Mathur — ML Engineer | Production GenAI Systems</title>
      <meta
        name="description"
        content="ML Engineer, 4 years shipping production AI. RAG pipelines, LLM fine-tuning and MLOps at enterprise scale. Open to senior roles and architecture consulting."
      />

      <Suspense fallback={<LoadingScreen />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <About />
        <Experience />
        <Projects />
        <Writing />
        <Skills />
        <Contact />
      </Suspense>
    </>
  )
}
