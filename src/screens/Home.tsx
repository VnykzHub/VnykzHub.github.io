'use client'

import { Suspense, lazy } from 'react'
import { LoadingScreen } from '@/components/hero'
import { Skeleton } from '@/components/ui/Skeleton'

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
      <Suspense fallback={<LoadingScreen />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <About />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Experience />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Projects />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Writing />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Skills />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Contact />
      </Suspense>
    </>
  )
}
