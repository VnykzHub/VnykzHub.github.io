// src/components/sections/Projects.tsx
import { Section, Container, AnimatedSection } from '@/components/common'
import { Heading, Text } from '@/components/ui'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { ProjectService } from '@/services/projectService'

export function Projects() {
  const projects = ProjectService.getAll()
  const featuredProjects = ProjectService.getFeatured()
  
  return (
    <Section id="projects">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            AI Projects Showcase
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            21+ production-ready AI solutions demonstrating expertise across 
            Machine Learning, Deep Learning, and Generative AI
          </Text>
        </AnimatedSection>
        
        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <AnimatedSection animation="slideUp" className="mb-12">
            <Heading as="h3" size="xl" className="mb-6 text-center">
              ⭐ Featured Projects
            </Heading>
            <ProjectGrid projects={featuredProjects} />
          </AnimatedSection>
        )}
        
        {/* All Projects */}
        <AnimatedSection animation="slideUp" delay={0.2}>
          <ProjectGrid projects={projects} />
        </AnimatedSection>
      </Container>
    </Section>
  )
}
