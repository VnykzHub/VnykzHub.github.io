import { Layout } from '@/components/layout'
import { 
  Hero, 
  About, 
  Experience,
  Projects, 
  Skills, 
  Contact 
} from '@/components/sections'

function App() {
  return (
    <Layout>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Skills />
      <Contact />
    </Layout>
  )
}

export default App